import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { completedRun } from '../helpers';
import { travelViaMap } from '../e2e/support';

type AudioProbe = { contexts: number; chantStarts: number; chantGain?: GainNode; analyser?: AnalyserNode };
type MeasuredWindow = Window & { releaseAudio?: AudioProbe };
const renderer = (page: Page) => page.getByTestId('world-renderer');
const world = (page: Page) => page.getByTestId('scene-stage');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const waitForAudio = (page: Page) => expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
const rooms = [
  ['threshold', /The threshold/], ['kitchen', /Jen’s kitchen/], ['studio', /Alice’s studio/],
  ['cabin', /Agatha’s cabin/], ['tower', /Lilia’s tower/], ['greenhouse', /Rio’s greenhouse/],
  ['garden', /Remember me garden/], ['cottage', 'The cottage'],
] as const;

async function installMeter(page: Page) {
  await page.addInitScript(() => {
    const meter: AudioProbe = (window as MeasuredWindow).releaseAudio = { contexts: 0, chantStarts: 0 };
    const gains = new WeakMap<AudioBufferSourceNode, GainNode>();
    const Context = window.AudioContext, connect = AudioNode.prototype.connect;
    window.AudioContext = class extends Context {
      constructor(options?: AudioContextOptions) { super(options); meter.contexts++; }
    };
    AudioNode.prototype.connect = function (this: AudioNode, ...args: unknown[]) {
      const result = Reflect.apply(connect, this, args);
      if (this instanceof AudioBufferSourceNode && args[0] instanceof GainNode) gains.set(this, args[0]);
      if (this instanceof GainNode && args[0] === this.context.destination) {
        const analyser = this.context.createAnalyser();
        Reflect.apply(connect, this, [analyser]);
        meter.analyser = analyser;
      }
      return result;
    } as typeof connect;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args: Parameters<typeof start>) {
      if (this.loop && this.buffer && this.buffer.duration > 70) {
        meter.chantStarts++;
        meter.chantGain = gains.get(this);
      }
      return Reflect.apply(start, this, args);
    };
  });
}

const chantStarts = (page: Page) => page.evaluate(() => (window as MeasuredWindow).releaseAudio?.chantStarts ?? 0);
const chantLevel = (page: Page) => page.evaluate(() => (window as MeasuredWindow).releaseAudio?.chantGain?.gain.value ?? 0);

async function peak(page: Page) {
  return page.evaluate(() => {
    const analyser = (window as MeasuredWindow).releaseAudio?.analyser;
    if (!analyser) return 0;
    const samples = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(samples);
    return samples.reduce((highest, value) => Math.max(highest, Math.abs(value)), 0);
  });
}

async function ready(page: Page, scene: string) {
  await expect(world(page)).toHaveAttribute('data-scene', scene);
  await expect(world(page)).toHaveAttribute('data-renderer', 'ready', { timeout: 15_000 });
  const image = page.getByTestId('world-background');
  await expect(image).toHaveAttribute('src', /\/release\/witches-road\/assets\/[^/]+-[\w-]{8}\.webp$/);
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  const painting = await image.evaluate((img: HTMLImageElement) => new URL(img.src).pathname.split('/').pop()!.replace(/-[\w-]{8}\.webp$/, '.webp'));
  await expect.poll(async () => (await renderer(page).getAttribute('data-active-asset'))?.split('/').pop()).toBe(painting);
  await expect(renderer(page)).toHaveAttribute('data-retiring-images', '0');
  return renderer(page).evaluate(host => {
    const canvas = host.querySelector('canvas')!;
    return {
      framebuffer: [canvas.width, canvas.height], activeImages: Number(host.dataset.activeImages),
      leasedImages: Number(host.dataset.leasedImages), rgbaBytes: Number(host.dataset.rgbaBytes),
    };
  });
}

async function network(page: Page, opening = false) {
  return page.evaluate(includeNavigation => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const entries = includeNavigation ? [...performance.getEntriesByType('navigation') as PerformanceNavigationTiming[], ...resources] : resources;
    return entries.filter(entry => entry.name.startsWith(location.origin + '/')).map(entry => ({
      file: new URL(entry.name).pathname.split('/').pop()!,
      transferBytes: entry.transferSize, encodedBytes: entry.encodedBodySize,
    }));
  }, opening);
}

async function sampleDraws(page: Page) {
  return renderer(page).evaluate(async host => {
    const canvas = host.querySelector('canvas')!;
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    const debug = gl?.getExtension('WEBGL_debug_renderer_info');
    const first = Number(host.dataset.frames), start = performance.now();
    const intervals: number[] = [];
    let previousFrame = first, previousTime = start;
    await new Promise<void>(resolve => {
      const sample = (time: number) => {
        const frames = Number(host.dataset.frames);
        if (frames !== previousFrame) {
          intervals.push((time - previousTime) / (frames - previousFrame));
          previousTime = time; previousFrame = frames;
        }
        if (time - start >= 2300) resolve();
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    intervals.sort((a, b) => a - b);
    return {
      fps: Number(((Number(host.dataset.frames) - first) * 1000 / (performance.now() - start)).toFixed(1)),
      p95DrawIntervalMs: intervals.length ? Number(intervals[Math.floor((intervals.length - 1) * .95)].toFixed(1)) : null,
      viewport: [innerWidth, innerHeight], density: devicePixelRatio,
      webglRenderer: debug ? gl!.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER),
    };
  });
}

test('the packaged game loads only versioned runtime art, keeps room leases bounded and plays sound', async ({ browser, page, isMobile }, info) => {
  test.setTimeout(150_000);
  const files = await readdir('dist/assets');
  expect((await readdir('dist')).sort()).toEqual(['assets', 'index.html']);
  expect(files.filter(file => file.endsWith('.webp'))).toHaveLength(22);
  expect(files.filter(file => /^witches-road-chant-[\w-]{8}\.mp3$/.test(file))).toHaveLength(1);
  expect(files.every(file => /-[\w-]{8}\.(?:webp|js|css|mp3)$/.test(file))).toBe(true);
  const index = await readFile('dist/index.html', 'utf8');
  expect(index).toMatch(/src="\.\/assets\//);
  expect(index).toMatch(/href="\.\/assets\//);
  const distBytes = Buffer.byteLength(index) + (await Promise.all(files.map(async file => (await stat('dist/assets/' + file)).size))).reduce((total, bytes) => total + bytes, 0);
  const failures: string[] = [], requests: string[] = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('requestfailed', request => failures.push(request.url() + ' ' + request.failure()?.errorText));
  page.on('response', response => { if (response.status() >= 400) failures.push(response.url() + ' ' + response.status()); });
  page.on('request', request => { if (request.url().startsWith('http')) requests.push(new URL(request.url()).pathname); });
  await installMeter(page);
  await page.goto('./');
  expect(await page.evaluate(() => (window as MeasuredWindow).releaseAudio?.contexts)).toBe(0);
  expect(requests.some(path => path.endsWith('.mp3'))).toBe(false);
  const start = performance.now();
  const enter = button(page, 'Enter the Road with sound');
  if (isMobile) await enter.tap(); else await enter.click();
  await waitForAudio(page);
  const entryMs = Math.round(performance.now() - start);
  const entryArt = await ready(page, 'cottage');
  await expect.poll(() => chantStarts(page)).toBe(1);
  await expect.poll(() => chantLevel(page)).toBeGreaterThan(.2);
  await expect.poll(() => peak(page)).toBeGreaterThan(.00001);
  const entryPeak = await peak(page);
  const opening = await network(page, true);
  const openingBytes = opening.reduce((total, item) => total + item.transferBytes, 0);
  expect(openingBytes).toBeLessThan(5_000_000);
  const openingArt = opening.filter(item => item.file.endsWith('.webp') && item.transferBytes > 0);
  expect(opening.filter(item => item.file.endsWith('.mp3') && item.encodedBytes > 0)).toHaveLength(1);
  expect(openingArt).toHaveLength(2);
  expect(openingArt.some(item => item.file.startsWith(isMobile ? 'cottage-dusk-portrait-' : 'cottage-dusk-'))).toBe(true);
  const openingDraws = await sampleDraws(page);
  expect(openingDraws.fps).toBeGreaterThan(0);
  await button(page, 'Mute sound').click();
  await expect.poll(() => peak(page)).toBe(0);
  await button(page, 'Enable sound').click();
  await waitForAudio(page);
  await expect.poll(() => peak(page)).toBeGreaterThan(.00001);

  await button(page, 'Settings').click();
  await page.getByLabel('Import a saved journey').setInputFiles({
    name: 'release-journey.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(completedRun())),
  });
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
  await ready(page, 'account');
  await page.locator('canvas').evaluate(canvas => { canvas.dataset.releaseCanvas = 'original'; });
  const cdp = await page.context().newCDPSession(page);
  const memory = [];
  const sampleMemory = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    return { ...await cdp.send('Runtime.getHeapUsage'), ...await cdp.send('Memory.getDOMCounters') };
  };
  memory.push(await sampleMemory());
  const visits = [];
  for (let circuit = 1; circuit <= 3; circuit++) {
    for (const [scene, name] of rooms) {
      await page.evaluate(() => performance.clearResourceTimings());
      const travelStart = performance.now();
      await travelViaMap(page, name);
      const art = await ready(page, scene);
      if (circuit === 1) {
        if (scene === 'threshold') await expect.poll(() => chantLevel(page)).toBeGreaterThan(.55);
        if (scene === 'studio') await expect.poll(() => chantLevel(page)).toBeLessThan(.005);
        if (scene === 'greenhouse') await expect.poll(() => chantLevel(page)).toBeGreaterThan(.3);
      }
      expect(art.activeImages).toBeGreaterThan(0);
      expect(art.leasedImages).toBe(art.activeImages);
      expect(art.leasedImages).toBeLessThanOrEqual(2);
      expect(art.framebuffer[0] * art.framebuffer[1]).toBeLessThanOrEqual(501_500);
      await expect(page.locator('canvas')).toHaveAttribute('data-release-canvas', 'original');
      visits.push({ circuit, scene, readyMs: Math.round(performance.now() - travelStart), ...art, resources: await network(page) });
    }
    memory.push(await sampleMemory());
  }
  const { detachedNodes } = await cdp.send('DOM.getDetachedDomNodes');
  const detachedPreloads = detachedNodes.filter(({ treeNode }) => treeNode.nodeName === 'IMG' && !treeNode.attributes?.includes('src'));
  expect(detachedPreloads).toHaveLength(0);

  await button(page, 'Step back from the door').click();
  await button(page, 'Look inside the cottage').click();
  await ready(page, 'cottage');
  await button(page, 'Approach the television').click();
  await button(page, 'Diagnostic channel').click();
  await button(page, 'Enter Vision’s annex').click();
  const annexArt = await ready(page, 'vision');
  const annexDraws = await sampleDraws(page);
  expect(annexDraws.fps).toBeGreaterThan(0);
  await expect.poll(() => peak(page)).toBeGreaterThan(.00001);
  const annexPeak = await peak(page);
  expect(Math.max(entryPeak, annexPeak)).toBeLessThan(1);
  await expect(page.locator('canvas')).toHaveAttribute('data-release-canvas', 'original');
  await page.screenshot({ path: info.outputPath('annex.png'), scale: 'css' });
  await button(page, 'Take the door: Return to the cottage television').click();
  await button(page, 'Close the cottage television').click();
  await button(page, 'Use the knocker · sign in').click();
  await ready(page, 'account');
  const renewStart = performance.now();
  await button(page, 'Renew this book').click();
  await expect(page.getByTestId('feedback')).toContainText('Renewed for another 28 fictional days');
  const renewMs = Math.round(performance.now() - renewStart);
  await page.locator('.road-receipt').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('receipt.png'), scale: 'css' });
  expect(await page.evaluate(() => (window as MeasuredWindow).releaseAudio?.contexts)).toBe(1);
  expect(await chantStarts(page)).toBe(1);
  expect(requests.filter(path => path.endsWith('.mp3'))).toHaveLength(1);
  expect(requests.every(path => path.startsWith('/release/witches-road/'))).toBe(true);
  expect(failures).toEqual([]);
  const results = {
    browser: browser.version(), isMobile, distBytes, openingBytes, opening, entryMs, entryArt, entryPeak,
    openingDraws, annexArt, annexDraws, annexPeak, renewMs, visits, memory, detachedPreloads: detachedPreloads.length,
  };
  await writeFile(info.outputPath('production-metrics.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify({ browser: results.browser, isMobile, openingBytes, entryMs, renewMs, openingDraws, annexDraws, heapBytes: memory.map(value => value.usedSize) }));
});
