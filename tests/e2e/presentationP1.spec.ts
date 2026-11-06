import { expect, test, type Page } from '@playwright/test';
import { STUDIO_CLUES } from '../../src/puzzles/rules';
import type { RunState } from '../../src/game/state';
import { completedRun, throughTrial } from '../helpers';
import { openRoad, reloadRoad, travelViaMap } from './support';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const world = (page: Page) => page.getByTestId('scene-stage');
const renderer = (page: Page) => page.getByTestId('world-renderer');
const desk = (page: Page) => page.getByRole('dialog', { name: 'Alice’s recording desk', exact: true });
const actor = (page: Page) => page.getByTestId('studio-actor');
const comment = (page: Page) => page.getByTestId('alice-comment');

async function importRun(page: Page, run: RunState) {
  await button(page, 'Settings').click();
  await page.getByLabel('Import a saved journey').setInputFiles({
    name: 'presentation-proof.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(run)),
  });
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
}

test('the studio shares one sprite between the room and the desk, with a reachable phone through reframing', async ({ page, isMobile }, info) => {
  test.setTimeout(90_000);
  await openRoad(page);
  await importRun(page, throughTrial('studio'));
  await expect(world(page)).toHaveAttribute('data-renderer', 'ready');
  const close = button(page, 'Step back from the desk'), approach = button(page, 'Approach the recording desk');
  const code = page.getByLabel('Two-digit recording number');
  await actor(page).evaluate(node => { node.dataset.original = 'alice'; });
  await page.locator('canvas').evaluate(node => { node.dataset.original = 'world'; });
  await code.fill('17');
  await code.press('Escape');
  await expect(approach).toBeFocused();
  await expect(actor(page)).toHaveAttribute('data-position', 'room');
  await expect(page.locator('.studio-room-gear')).toBeVisible();
  await approach.press('Enter');
  await expect(desk(page)).toBeFocused();
  await expect(code).toHaveValue('17');
  await close.click();
  await approach.press('Enter');
  await expect(code).toHaveValue('17');

  const sizes = isMobile ? [[390, 844, 'sheet'], [360, 780, 'sheet'], [844, 390, 'compact']] as const
    : [[1280, 720, 'side'], [1440, 900, 'side'], [844, 390, 'compact'], [640, 360, 'sheet']] as const;
  for (const [width, height, dock] of sizes) {
    await page.setViewportSize({ width, height });
    await expect(desk(page)).toHaveAttribute('data-dock', dock);
    await expect(actor(page)).toHaveAttribute('data-position', dock);
    await expect(actor(page)).toHaveAttribute('data-original', 'alice');
    const scroll = desk(page).locator('.studio-scroll');
    const channels = desk(page).getByRole('group', { name: 'Recording channels' }).getByRole('button');
    await expect(channels).toHaveCount(3);
    for (const [index, clue] of STUDIO_CLUES.entries()) {
      await expect(channels.nth(index)).toContainText(`Divide by ${clue.divisor}`);
      await expect(channels.nth(index)).toContainText(`remainder ${clue.remainder}`);
    }
    if (dock === 'side') {
      const work = (await desk(page).locator('.studio-bench').boundingBox())!;
      const host = (await actor(page).boundingBox())!;
      expect(host.x).toBeGreaterThan(work.x + work.width + 23);
      expect(host.y + host.height).toBeLessThan(height);
      for (const channel of await channels.all()) await expect(channel).toBeInViewport({ ratio: 1 });
    }
    await code.scrollIntoViewIfNeeded();
    await expect(code).toHaveValue('17');
    await expect(button(page, 'Dial the number')).toBeInViewport({ ratio: 1 });
    await expect(close).toBeInViewport({ ratio: 1 });
    expect(await scroll.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => [scrollX, scrollY])).toEqual([0, 0]);
    if (width === 1280 || width === 390) await page.screenshot({ path: info.outputPath(`studio-${width}-desk.png`), scale: 'css' });
  }
  await button(page, 'Settings').click();
  await page.getByRole('combobox', { name: 'Text size', exact: true }).selectOption('large');
  await button(page, 'Close panel').click();
  await expect(desk(page)).toHaveAttribute('data-dock', 'sheet');
  await expect(code).toHaveValue('17');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(world(page)).toHaveAttribute('data-motion', 'reduced');
  await expect.poll(() => actor(page).evaluate(node => getComputedStyle(node).transitionDuration)).toBe('0s');
  await code.press('Escape');
  await expect(approach).toBeFocused();
  await expect(actor(page)).toHaveAttribute('data-position', 'room');
  await expect(page.locator('canvas')).toHaveAttribute('data-original', 'world');
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
});

test('Alice’s reaction follows the accepted save and clears on reload and travel', async ({ page }, info) => {
  test.setTimeout(80_000);
  await page.addInitScript(() => {
    const root = window as unknown as { holdDial: boolean; dialCompletions: (() => void)[] };
    root.holdDial = false;
    root.dialCompletions = [];
    const prototype = IDBTransaction.prototype as EventTarget, listen = prototype.addEventListener;
    prototype.addEventListener = function(type, listener, options) {
      if (type !== 'complete' || !listener) return listen.call(this, type, listener, options);
      const transaction = this as IDBTransaction;
      const complete: EventListener = event => {
        const invoke = () => { if (typeof listener === 'function') listener.call(transaction, event); else listener.handleEvent(event); };
        if (root.holdDial && transaction.mode === 'readwrite') root.dialCompletions.push(invoke);
        else invoke();
      };
      return listen.call(this, type, complete, options);
    };
  });
  await openRoad(page);
  await importRun(page, throughTrial('studio'));
  await expect(comment(page)).toHaveAttribute('data-reaction', 'listening');
  await button(page, 'Dismiss Alice’s comment').press('Enter');
  await expect(comment(page)).toHaveCount(0);
  await button(page, 'Speak with Alice').press('Enter');
  await expect(comment(page)).toHaveAttribute('data-reaction', 'speaking');
  const code = page.getByLabel('Two-digit recording number');
  await code.fill('22');
  await page.evaluate(() => { (window as unknown as { holdDial: boolean }).holdDial = true; });
  try {
    await code.press('Enter');
    await expect(page.getByTestId('save-status')).toContainText('Saving your place');
    await expect(page.locator('[data-testid="alice-comment"][data-reaction="missed"]')).toHaveCount(0);
    await expect(button(page, 'Dial the number')).toBeDisabled();
  } finally {
    await page.evaluate(() => {
      const root = window as unknown as { holdDial: boolean; dialCompletions: (() => void)[] };
      root.holdDial = false;
      root.dialCompletions.splice(0).forEach(invoke => invoke());
    });
  }
  await expect(comment(page)).toHaveAttribute('data-reaction', 'missed');
  await expect(page.getByTestId('feedback')).toContainText('misses a rhythm');
  await expect(page.getByTestId('feedback')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Continue to Agatha/ })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('studio-reaction.png'), scale: 'css' });
  await reloadRoad(page);
  await expect(code).toHaveValue('22');
  await expect(comment(page)).toHaveAttribute('data-reaction', 'listening');
  await code.fill('23');
  await code.press('Enter');
  await expect(comment(page)).toHaveAttribute('data-reaction', 'accepted');
  await expect(page.getByTestId('feedback')).toContainText('Verification seal earned');
  await page.getByRole('button', { name: /Continue to Agatha/ }).click();
  await expect(world(page)).toHaveAttribute('data-scene', 'cabin');
  await expect(comment(page)).toHaveCount(0);
  await travelViaMap(page, /Alice’s studio/);
  await expect(comment(page)).toHaveAttribute('data-reaction', 'listening');
  await expect(code).toBeDisabled();
});

test('every room changes atmosphere on the same renderer, with still reduced motion and hidden-tab pause', async ({ page }) => {
  test.setTimeout(120_000);
  await openRoad(page);
  await expect(world(page)).toHaveAttribute('data-renderer', 'ready');
  await page.locator('canvas').evaluate(node => { node.dataset.original = 'atmosphere'; });
  const check = async (name: string) => {
    await expect(renderer(page)).toHaveAttribute('data-atmosphere', name);
    await expect(world(page)).toHaveAttribute('data-renderer', 'ready');
    const count = Number(await renderer(page).getAttribute('data-ambient-particles'));
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(40);
    await expect(page.locator('canvas')).toHaveAttribute('data-original', 'atmosphere');
  };
  await check('cottage-clearing');
  await button(page, 'Close borrowing card').click();
  await button(page, 'Look inside the cottage').click();
  await check('cottage-interior');
  await importRun(page, completedRun());
  await check('account');
  for (const [scene, label] of [
    ['threshold', /The threshold/], ['kitchen', /Jen’s kitchen/], ['studio', /Alice’s studio/],
    ['cabin', /Agatha’s cabin/], ['tower', /Lilia’s tower/], ['greenhouse', /Rio’s greenhouse/],
    ['garden', /Remember me garden/], ['cottage-clearing', 'The cottage'],
  ] as const) {
    await travelViaMap(page, label);
    await check(scene);
  }
  await button(page, 'Step back from the door').click();
  await button(page, 'Look inside the cottage').click();
  await button(page, 'Approach the television').click();
  await button(page, 'Diagnostic channel').click();
  await button(page, 'Enter Vision’s annex').click();
  await check('vision');
  const frames = async () => Number(await renderer(page).getAttribute('data-frames'));
  const before = await frames();
  await expect.poll(frames).toBeGreaterThan(before + 2);
  const eightFrames = () => page.evaluate(() => new Promise<void>(resolve => {
    let count = 0;
    function tick() { if (++count === 8) resolve(); else requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(world(page)).toHaveAttribute('data-motion', 'reduced');
  await eightFrames();
  const still = await frames();
  await eightFrames();
  expect(await frames()).toBe(still);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(frames).toBeGreaterThan(still);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(world(page)).toHaveAttribute('data-paused', 'true');
  const paused = await frames();
  await eightFrames();
  expect(await frames()).toBe(paused);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(frames).toBeGreaterThan(paused);
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
});

test('the studio desk, portrait, and sound remain usable in the still-art fallback', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
    if (typeof OffscreenCanvas !== 'undefined') OffscreenCanvas.prototype.getContext = () => null;
  });
  await openRoad(page);
  await importRun(page, throughTrial('studio'));
  await expect(world(page)).toHaveAttribute('data-renderer', 'fallback');
  await expect(actor(page).locator('img')).toBeVisible();
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
  const code = page.getByLabel('Two-digit recording number');
  await code.fill('23');
  await code.press('Enter');
  await expect(page.getByRole('button', { name: /Continue to Agatha/ })).toBeVisible();
});
