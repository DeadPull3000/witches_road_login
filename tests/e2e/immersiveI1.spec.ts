import { expect, test } from '@playwright/test';
import { approachRoom, openRoad } from './support';
import { cottageLayout, project } from '../../src/world/layout';
import { move, solveCurrent, throughTrial } from '../helpers';

test('the cottage fills every aspect ratio and reframes one live renderer without losing a typed card', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await openRoad(page); const stage = page.getByTestId('scene-stage'); await expect(stage).toHaveAttribute('data-renderer', 'ready');
  await page.getByLabel('Borrowing alias', { exact: true }).fill('Unstamped moon');
  await stage.locator('canvas').evaluate(canvas => canvas.setAttribute('data-lifecycle', 'original'));
  const sizes = testInfo.project.name === 'chromium' ? [[1280, 800], [2560, 1080], [768, 1024], [390, 844]] : [[390, 844], [360, 640], [844, 390], [768, 1024]];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await expect(stage).toHaveCSS('width', `${width}px`); await expect(stage).toHaveCSS('height', `${height}px`);
    await expect(page.getByLabel('Borrowing alias', { exact: true })).toHaveValue('Unstamped moon');
    await page.getByRole('button', { name: 'Close borrowing card', exact: true }).click();
    const expected = cottageLayout(width, height);
    await expect(stage).toHaveAttribute('data-profile', expected.profile);
    const canvas = stage.locator('canvas'); await expect(canvas).toHaveAttribute('data-lifecycle', 'original'); await expect(page.locator('canvas')).toHaveCount(1);
    expect(await canvas.boundingBox()).toEqual({ x: 0, y: 0, width, height });
    expect(await canvas.evaluate(element => { const output = element as HTMLCanvasElement; return output.width * output.height; })).toBeLessThanOrEqual(2_005_000);
    const door = page.locator('.world-hotspots [data-prop-id="cottage.door"]'), bounds = (await door.boundingBox())!;
    const ring = project(expected.profile === 'portrait' ? { x: 576, y: 954 } : { x: 645, y: 545 }, expected.camera);
    expect(bounds.x + bounds.width / 2).toBeCloseTo(ring.x, 1); expect(bounds.y + bounds.height / 2).toBeCloseTo(ring.y, 1);
    for (const selector of ['.world-hotspots [data-prop-id="cottage.door"]', '.world-hotspots [data-prop-id="cottage.agatha"]', '.world-hotspots [data-prop-id="cottage.card"]']) {
      const rect = (await page.locator(selector).boundingBox())!;
      expect(rect.width).toBeGreaterThanOrEqual(44); expect(rect.height).toBeGreaterThanOrEqual(44);
      expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.y).toBeGreaterThanOrEqual(0); expect(rect.x + rect.width).toBeLessThanOrEqual(width + 1); expect(rect.y + rect.height).toBeLessThanOrEqual(height + 1);
    }
    const response = (await page.getByTestId('feedback').boundingBox())!;
    const garden = (await page.getByRole('button', { name: 'Visit the Remember me garden', exact: true }).boundingBox())!;
    expect(response.y + response.height).toBeLessThanOrEqual(garden.y);
    expect(await page.evaluate(() => ({ horizontal: document.documentElement.scrollWidth > innerWidth, vertical: document.documentElement.scrollHeight > innerHeight, scrollY }))).toEqual({ horizontal: false, vertical: false, scrollY: 0 });
    await expect(page.locator('.topbar,.road-ledger,.room-footer,.scene-controls')).toHaveCount(0);
    if (width === 1280 && height === 800 || width === 390 && height === 844) await page.screenshot({ path: testInfo.outputPath(`world-${width}x${height}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Open borrowing card', exact: true }).click();
  }
  await expect(page.getByLabel('Borrowing alias', { exact: true })).toHaveValue('Unstamped moon');
  await page.screenshot({ path: testInfo.outputPath('borrowing-card.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('menus, motion preferences and resizing retain the entered spell and the same audio context', async ({ page }) => {
  await page.addInitScript(() => {
    const Original = window.AudioContext, root = window as unknown as { contexts: number }; root.contexts = 0;
    window.AudioContext = class extends Original { constructor(options?: AudioContextOptions) { super(options); root.contexts++; } };
  });
  await openRoad(page); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  await page.getByLabel('Borrowing alias', { exact: true }).fill('Sounding moon'); await page.getByRole('button', { name: /Stamp my card/ }).click();
  await page.getByRole('button', { name: 'Try the cottage door', exact: true }).click();
  await page.getByLabel('Attempted spell — fictional only').fill('only-in-this-card');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('combobox', { name: 'Motion', exact: true }).selectOption('reduced');
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeFocused();
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-motion', 'reduced');
  const host = page.getByTestId('world-renderer'), frames = await host.getAttribute('data-frames');
  await page.waitForTimeout(150); expect(await host.getAttribute('data-frames')).toBe(frames);
  await page.setViewportSize({ width: 430, height: 780 });
  await expect(page.getByLabel('Attempted spell — fictional only')).toHaveValue('only-in-this-card');
  await page.getByRole('button', { name: 'Close borrowing card', exact: true }).click();
  await page.getByRole('button', { name: 'Notebook', exact: true }).click(); await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Notebook', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Try the cottage door', exact: true }).click();
  await expect(page.getByLabel('Attempted spell — fictional only')).toHaveValue('only-in-this-card');
  await page.getByRole('button', { name: 'Try the door', exact: true }).click();
  await expect(page.getByRole('button', { name: /Begin account recovery/ })).toBeVisible();
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
  expect(await page.evaluate(() => (window as unknown as { contexts: number }).contexts)).toBe(1);
});

test('a keyboard-sized visual viewport keeps the focused card usable without scrolling the world', async ({ page }) => {
  await openRoad(page); const input = page.getByLabel('Borrowing alias', { exact: true }); await input.fill('Keyboard moon'); await input.focus();
  await page.evaluate(() => {
    const viewport = visualViewport!;
    Object.defineProperty(viewport, 'height', { configurable: true, get: () => 320 });
    viewport.dispatchEvent(new Event('resize'));
  });
  await expect(page.getByTestId('scene-stage')).toHaveCSS('height', '320px'); await expect(input).toBeFocused(); await expect(input).toHaveValue('Keyboard moon');
  await input.scrollIntoViewIfNeeded(); await expect(input).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Close borrowing card', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Open borrowing card', exact: true })).toBeFocused();
});

test('the knocker restores focus and starts recovery after skipping the theft', async ({ page }) => {
  await page.clock.install(); await openRoad(page);
  await page.getByRole('button', { name: 'Close borrowing card', exact: true }).click();
  const door = page.getByRole('button', { name: 'Inspect the cottage door', exact: true }); await door.focus(); await door.press('Enter');
  await expect(page.getByLabel('Borrowing alias', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close borrowing card', exact: true }).click(); await expect(door).toBeFocused();
  await door.press('Enter'); await page.getByLabel('Borrowing alias', { exact: true }).fill('Skipping moon'); await page.getByRole('button', { name: /Stamp my card/ }).click();
  await page.getByRole('button', { name: 'Try the cottage door', exact: true }).click();
  await page.getByLabel('Attempted spell — fictional only').fill('six-vanishing-dots');
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 5000));
  await page.getByRole('button', { name: 'Try the door', exact: true }).click();
  const skip = page.getByRole('button', { name: 'Skip dot-theft animation', exact: true }); await skip.focus(); await skip.press('Enter');
  await expect(page.getByRole('button', { name: /Begin account recovery/ })).toBeVisible();
  await page.clock.fastForward(2000);
  await expect(page.getByRole('dialog', { name: 'Your borrowing card', exact: true })).not.toBeVisible();
  await expect(skip).not.toBeVisible(); await expect(page.getByTestId('feedback')).toContainText('pockets');
  await page.clock.resume();
});

test('keyboard card actions stay focusable and queue in order during a slow save', async ({ page }) => {
  await page.addInitScript(() => {
    const prototype = IDBTransaction.prototype as EventTarget, original = prototype.addEventListener;
    prototype.addEventListener = function (type, listener, options) {
      if (type !== 'complete' || !listener) return original.call(this, type, listener, options);
      const delayed: EventListener = event => setTimeout(() => { if (typeof listener === 'function') listener.call(this, event); else listener.handleEvent(event); }, 250);
      return original.call(this, type, delayed, options);
    };
  });
  await openRoad(page); await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const home = move(solveCurrent(throughTrial('greenhouse')), { type: 'ENTER_SCENE', scene: 'cottage' });
  await page.getByLabel('Import a saved journey').setInputFiles({ name: 'return.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(home)) });
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
  await approachRoom(page, true);
  const unbind = page.getByRole('button', { name: 'Unbind the door stitch', exact: true }), knocker = page.getByRole('button', { name: 'Use the knocker · sign in', exact: true });
  await unbind.focus(); await unbind.press('Enter');
  await knocker.focus(); await expect(knocker).toBeFocused(); await knocker.press('Enter');
  await expect(page.getByRole('button', { name: 'Inspect your borrowing ledger', exact: true })).toBeVisible();
  await expect(page.getByTestId('save-status')).toContainText('saved in this browser');
});
