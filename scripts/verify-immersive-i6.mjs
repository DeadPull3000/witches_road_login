import { mkdtemp, mkdir, rmdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit, expect } from '@playwright/test';

const home = 'http://127.0.0.1:5187/';
const output = new URL('../docs/evidence/', import.meta.url);
const desktop = { width: 1280, height: 800 };
const pageTimeout = 15_000;
await mkdir(output, { recursive: true });

const stage = page => page.getByTestId('scene-stage');
const host = page => page.getByTestId('world-renderer');
const button = (page, name) => page.getByRole('button', { name, exact: typeof name === 'string' });
const shot = (page, label) => page.screenshot({ path: fileURLToPath(new URL(`i6-${label}.png`, output)), scale: 'css' });
async function world(page, status = /^(ready|fallback)$/) {
  await expect(stage(page)).toHaveAttribute('data-renderer', status, { timeout: pageTimeout });
  const read = () => stage(page).evaluate(el => {
    const rect = el.getBoundingClientRect(), viewport = visualViewport;
    return { world: [rect.width, rect.height], viewport: [Math.round(viewport.width), Math.round(viewport.height)],
      scroll: [scrollX, scrollY], overflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight };
  });
  await expect.poll(async () => {
    const { world, viewport } = await read();
    return world[0] === viewport[0] && world[1] === viewport[1];
  }).toBe(true);
  const geometry = await read();
  expect(geometry.world).toEqual(geometry.viewport);
  expect(geometry.scroll).toEqual([0, 0]);
  expect(geometry.overflow).toBe(false);
  return geometry.world;
}
async function enter(page) {
  page.setDefaultTimeout(pageTimeout);
  if (page.url() !== home) await page.goto(home);
  await button(page, 'Enter the Road with sound').click();
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing', { timeout: pageTimeout });
  await world(page);
}
async function loadCompleted(page) {
  const run = await page.evaluate(async () => (await import('/tests/helpers.ts')).completedRun());
  await button(page, 'Settings').click();
  await page.getByLabel('Import a saved journey').setInputFiles({
    name: 'presentation-check.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(run)),
  });
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot', { timeout: pageTimeout });
  await world(page);
}
async function watchAudio(page) {
  await page.addInitScript(() => {
    if (typeof window.AudioContext !== 'function') return;
    const NativeAudioContext = window.AudioContext, connect = AudioNode.prototype.connect;
    window.roadAudio = { contexts: 0, analyser: null };
    window.AudioContext = class extends NativeAudioContext {
      constructor(...args) { super(...args); window.roadAudio.contexts++; }
    };
    AudioNode.prototype.connect = function (destination, ...args) {
      const result = connect.call(this, destination, ...args);
      if (destination === this.context.destination && this instanceof GainNode) {
        const analyser = this.context.createAnalyser();
        connect.call(this, analyser);
        window.roadAudio.analyser = analyser;
      }
      return result;
    };
  });
}
async function amplitude(page) {
  return page.evaluate(() => {
    const analyser = window.roadAudio.analyser;
    if (!analyser) return 0;
    const samples = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(samples);
    return Math.max(...samples.map(Math.abs));
  });
}
async function checkEngine(name, engine) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: desktop });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await watchAudio(page);
    await page.goto(home);
    const audioContext = await page.evaluate(() => typeof window.AudioContext);
    if (audioContext !== 'function') {
      await button(page, 'Enter the Road with sound').click();
      await expect(button(page, 'Retry audio and enter')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Traveller’s kit' })).toHaveCount(0);
      const download = page.waitForEvent('download');
      await button(page, 'Export saved journey').click();
      const exported = await download;
      expect(exported.suggestedFilename()).toMatch(/\.json$/);
      expect(await exported.failure()).toBeNull();
      await button(page, 'Retry audio and enter').click();
      await expect(button(page, 'Retry audio and enter')).toBeEnabled();
      await world(page);
      expect(errors).toEqual([]);
      await shot(page, `${name}-required-audio-recovery`);
      return { engine: name, version: browser.version(), viewport: desktop, audioContext, audioRequired: true, retryVisible: true, exportDownloaded: true };
    }
    await enter(page);
    await expect.poll(() => amplitude(page), { timeout: pageTimeout }).toBeGreaterThan(.00001);
    const entryRenderer = await stage(page).getAttribute('data-renderer');
    if (entryRenderer === 'fallback') await expect(button(page, 'Retry illustrated scene')).toBeVisible();
    const alias = page.getByLabel('Borrowing alias', { exact: true });
    await alias.fill('Amber Finch');
    await alias.press('Enter');
    await expect(page.getByTestId('feedback')).toContainText('Borrowing card stamped for Amber Finch');
    await loadCompleted(page);
    await button(page, 'Renew this book').click();
    await expect(page.getByTestId('feedback')).toContainText('Renewed for another 28 fictional days');
    await expect.poll(() => amplitude(page), { timeout: pageTimeout }).toBeGreaterThan(.00001);
    const contexts = await page.evaluate(() => window.roadAudio.contexts);
    expect(contexts).toBe(1);
    expect(errors).toEqual([]);
    await page.locator('.road-receipt').scrollIntoViewIfNeeded();
    await shot(page, `${name}-library`);
    return { engine: name, version: browser.version(), viewport: desktop, entryRenderer, libraryRenderer: await stage(page).getAttribute('data-renderer'), audioContexts: contexts, signalAfterRenewal: await amplitude(page), renewed: true };
  } finally { await browser.close(); }
}

async function measure(page, label) {
  await world(page, 'ready');
  return host(page).evaluate(async (el, label) => {
    const canvas = el.querySelector('canvas'), gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    const debug = gl?.getExtension('WEBGL_debug_renderer_info');
    const start = performance.now(), first = Number(el.dataset.frames);
    const intervals = [];
    let previousFrame = first, previousTime = start;
    await new Promise(resolve => {
      function sample(time) {
        const frames = Number(el.dataset.frames);
        if (frames !== previousFrame) {
          intervals.push((time - previousTime) / (frames - previousFrame));
          previousTime = time;
          previousFrame = frames;
        }
        if (time - start >= 2500) resolve();
        else requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    const frameCount = Number(el.dataset.frames) - first;
    intervals.sort((a, b) => a - b);
    const p95 = intervals[Math.floor((intervals.length - 1) * .95)];
    return { label, fps: +(frameCount * 1000 / (performance.now() - start)).toFixed(1), p95DrawIntervalMs: p95 === undefined ? null : +p95.toFixed(1),
      framebuffer: [canvas.width, canvas.height], cssPixels: [canvas.clientWidth, canvas.clientHeight],
      density: devicePixelRatio, activeImages: Number(el.dataset.activeImages), rgbaEstimateBytes: Number(el.dataset.rgbaBytes),
      webglRenderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER) };
  }, label);
}
async function checkRendering() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: desktop });
    await enter(page);
    const samples = [await measure(page, 'desktop borrowing card')];
    await button(page, 'Close borrowing card').click();
    samples.push(await measure(page, 'desktop idle'));
    await button(page, 'Settings').click();
    samples.push(await measure(page, 'desktop settings'));
    await button(page, 'Close panel').click();
    for (const [width, height] of [[1024, 768], [2560, 1440], [2560, 1080], [844, 390]]) {
      await page.setViewportSize({ width, height });
      samples.push(await measure(page, `${width} × ${height}`));
    }
    await page.setViewportSize(desktop);
    await loadCompleted(page);
    await page.locator('canvas').evaluate(canvas => { canvas.dataset.original = 'true'; });
    const travel = [];
    const destinations = [
      ['threshold', /The threshold/], ['kitchen', /Jen’s kitchen/], ['studio', /Alice’s studio/], ['cabin', /Agatha’s cabin/],
      ['tower', /Lilia’s tower/], ['greenhouse', /Rio’s greenhouse/], ['garden', /Remember me garden/], ['cottage', 'The cottage'],
    ];
    for (let visit = 0; visit < 2; visit++) {
      for (const [scene, name] of destinations) {
        await button(page, 'Road map').click();
        const map = page.getByRole('dialog', { name: 'Your folded Road map', exact: true });
        await button(map, name).click();
        await expect(map).not.toBeVisible();
        await expect(stage(page)).toHaveAttribute('data-scene', scene);
        await world(page, 'ready');
        const source = await page.getByTestId('world-background').getAttribute('src');
        await expect(host(page)).toHaveAttribute('data-active-asset', source);
        await expect(host(page)).toHaveAttribute('data-retiring-images', '0');
        const metrics = await host(page).evaluate(el => ({ asset: el.dataset.activeAsset, active: +el.dataset.activeImages, leased: +el.dataset.leasedImages, rgbaEstimateBytes: +el.dataset.rgbaBytes }));
        expect(metrics.active).toBeGreaterThanOrEqual(1);
        expect(metrics.leased).toBe(metrics.active);
        expect(metrics.leased).toBeLessThanOrEqual(2);
        await expect(page.locator('canvas')).toHaveAttribute('data-original', 'true');
        travel.push({ scene, ...metrics });
      }
    }
    await button(page, 'Settings').click();
    await page.getByRole('combobox', { name: 'Motion', exact: true }).selectOption('reduced');
    await button(page, 'Close panel').click();
    samples.push(await measure(page, 'reduced motion'));
    await page.close();
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await enter(phone);
    await button(phone, 'Close borrowing card').click();
    samples.push(await measure(phone, '390 × 844 phone idle'));
    await button(phone, 'Look inside the cottage').click();
    samples.push(await measure(phone, '390 × 844 cottage interior'));
    await shot(phone, 'cottage-portrait');
    await phone.setViewportSize({ width: 360, height: 640 });
    samples.push(await measure(phone, '360 × 640 cottage interior'));
    await phone.setViewportSize({ width: 390, height: 844 });
    await loadCompleted(phone);
    await button(phone, 'Renew this book').click();
    await expect(phone.getByTestId('feedback')).toContainText('Renewed for another 28 fictional days');
    await phone.locator('.road-receipt').scrollIntoViewIfNeeded();
    await shot(phone, 'phone-library-receipt');
    expect(samples.find(sample => sample.label === 'reduced motion').fps).toBe(0);
    expect(samples.filter(sample => sample.label !== 'reduced motion').every(sample => sample.fps > 0)).toBe(true);
    expect(samples.every(({ framebuffer: [width, height] }) => width * height <= 501_500)).toBe(true);
    return { version: browser.version(), samples, travel };
  } finally { await browser.close(); }
}

async function checkZoom() {
  // Native Chromium page zoom in a disposable browser profile. This exercises layout reflow and DPR.
  const extension = await mkdtemp(join(tmpdir(), 'witches-road-zoom-'));
  const manifest = join(extension, 'manifest.json'), worker = join(extension, 'zoom.js');
  let context;
  try {
    await writeFile(manifest, JSON.stringify({ manifest_version: 3, name: 'Local preview zoom check', version: '1.0', host_permissions: ['http://127.0.0.1/*'], background: { service_worker: 'zoom.js' } }));
    await writeFile(worker, '// This worker only enables native tab zoom for the local Playwright check.\n');
    context = await chromium.launchPersistentContext('', {
      channel: 'chromium', viewport: desktop,
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    });
    const serviceWorker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const page = context.pages()[0] ?? await context.newPage();
    await enter(page);
    const input = page.getByLabel('Borrowing alias', { exact: true });
    await input.fill('WWWWWWWWWWWWWWWWWWWWWWWW');
    const before = { viewport: await world(page), density: await page.evaluate(() => devicePixelRatio) };
    const zoom = await serviceWorker.evaluate(async url => {
      const tab = (await chrome.tabs.query({})).find(tab => tab.url === url);
      if (!tab) throw new Error('Local test tab unavailable');
      await chrome.tabs.setZoom(tab.id, 2);
      return chrome.tabs.getZoom(tab.id);
    }, home);
    expect(zoom).toBe(2);
    await expect.poll(() => page.evaluate(() => devicePixelRatio)).toBe(before.density * 2);
    await expect(stage(page)).toHaveAttribute('data-short', 'true');
    const after = { viewport: await world(page), density: await page.evaluate(() => devicePixelRatio) };
    expect(after.viewport).toEqual(before.viewport.map(value => value / 2));
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('WWWWWWWWWWWWWWWWWWWWWWWW');
    await shot(page, 'native-200-percent-zoom');
    await input.press('Enter');
    await expect(page.getByTestId('feedback')).toContainText('Borrowing card stamped for WWWWWWWWWWWWWWWWWWWWWWWW');
    return { zoom, before, after, aliasAccepted: true };
  } finally {
    await context?.close();
    await unlink(manifest).catch(() => {});
    await unlink(worker).catch(() => {});
    await rmdir(extension);
  }
}

const checks = {
  chromium: () => checkEngine('chromium', chromium),
  firefox: () => checkEngine('firefox', firefox),
  webkit: () => checkEngine('webkit', webkit),
  zoom: checkZoom,
  rendering: checkRendering,
};
const selection = process.argv.slice(2);
let failures = 0;
for (const name of selection.length ? selection : Object.keys(checks)) {
  try {
    const result = await checks[name]();
    await writeFile(new URL(`i6-${name}-validation.json`, output), JSON.stringify(result, null, 2) + '\n');
    console.log(`Passed ${name}`, name === 'rendering' ? result.samples.map(sample => [sample.label, sample.fps]) : result);
  } catch (error) {
    failures++;
    console.error(`Failed ${name}`, error);
  }
}
if (failures) process.exitCode = 1;
