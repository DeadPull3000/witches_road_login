import { expect, test, type Page } from '@playwright/test';
import { openRoad, travelViaMap, returnToRoom } from './support';
import { completedRun, throughTrial } from '../helpers';
import { createRun, type RunState } from '../../src/game/state';

async function trackContext(page: Page) {
  await page.addInitScript(() => {
    const Original = window.AudioContext, root = window as unknown as { contexts: number }; root.contexts = 0;
    window.AudioContext = class extends Original { constructor(options?: AudioContextOptions) { super(options); root.contexts++; } };
  });
}
async function importRun(page: Page, run: RunState) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Import a saved journey').setInputFiles({ name: 'journey.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(run)) });
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
}
async function markCanvas(page: Page) {
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  await page.locator('canvas').evaluate(canvas => canvas.setAttribute('data-i2-instance', 'original'));
}
async function sameWorld(page: Page) {
  await expect(page.locator('canvas')).toHaveCount(1); await expect(page.locator('canvas')).toHaveAttribute('data-i2-instance', 'original');
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
  expect(await page.evaluate(() => (window as unknown as { contexts: number }).contexts)).toBe(1);
}

test('the folded map gates rooms, traps focus and preserves the card through map and notebook visits', async ({ page }, testInfo) => {
  await trackContext(page); await openRoad(page); await markCanvas(page);
  await page.getByLabel('Borrowing alias', { exact: true }).fill('Map Finch'); await page.getByRole('button', { name: /Stamp my card/ }).click();
  await page.getByLabel('Attempted spell — fictional only').fill('kept-on-the-paper');
  const mapButton = page.getByRole('button', { name: 'Road map', exact: true }); await mapButton.focus(); await mapButton.press('Enter');
  const map = page.getByRole('dialog', { name: 'Your folded Road map', exact: true });
  await expect(map.getByRole('button', { name: /Jen’s kitchen/ })).toBeDisabled(); await expect(map.getByRole('button', { name: 'The borrowing desk', exact: true })).toBeDisabled();
  await expect(map.getByRole('button', { name: 'The cottage', exact: true })).toHaveAttribute('aria-current', 'location');
  await expect(map.getByLabel('0 of 5 seals collected', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('folded-map.png'), fullPage: true });
  const available = map.locator('button:enabled'); await available.last().focus(); await page.keyboard.press('Tab'); await expect(available.first()).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(available.last()).toBeFocused();
  await page.keyboard.press('Escape'); await expect(mapButton).toBeFocused(); await expect(page.getByLabel('Attempted spell — fictional only')).toHaveValue('kept-on-the-paper');
  await page.getByRole('button', { name: 'Notebook', exact: true }).click(); await expect(page.getByRole('dialog', { name: 'Your borrowing notebook', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('borrowing-notebook.png'), fullPage: true }); await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Notebook', exact: true })).toBeFocused(); await expect(page.getByLabel('Attempted spell — fictional only')).toHaveValue('kept-on-the-paper');
  await travelViaMap(page, /Remember me garden/); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-scene', 'garden');
  await expect(page.getByRole('button', { name: 'Cap 3: unlit', exact: true })).toBeVisible();
  await sameWorld(page);
});

test('the saved-card folio preserves progress and preferences through new and resumed journeys', async ({ page }, testInfo) => {
  test.setTimeout(60_000); await trackContext(page); await openRoad(page); await markCanvas(page); await importRun(page, throughTrial('studio'));
  await page.getByRole('button', { name: /CHANNEL 1/ }).click(); await page.getByLabel('Two-digit recording number').fill('22'); await page.getByRole('button', { name: 'Dial the number', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('misses a rhythm');
  await page.getByRole('button', { name: 'Settings', exact: true }).click(); await page.getByRole('combobox', { name: 'Motion', exact: true }).selectOption('reduced');
  await page.getByRole('combobox', { name: 'Text size', exact: true }).selectOption('large'); await page.getByLabel('Open the room object page on arrival', { exact: true }).check();
  await page.screenshot({ path: testInfo.outputPath('settings-surface.png'), fullPage: true });
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.getByRole('button', { name: 'Journeys', exact: true }).click(); await page.getByRole('button', { name: 'New showcase journey', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Room objects', exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Return to room notes', exact: true }).click();
  await expect(page.getByLabel('Borrowing alias', { exact: true })).toHaveValue(''); await expect(page.getByTestId('journey-mode')).toContainText('SHOWCASE');
  await page.getByRole('button', { name: 'Journeys', exact: true }).click(); await expect(page.getByRole('button', { name: 'Resume Violet Finch', exact: true })).toBeVisible(); await page.screenshot({ path: testInfo.outputPath('saved-card-folio.png'), fullPage: true }); await page.getByRole('button', { name: 'Resume Violet Finch', exact: true }).click();
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-scene', 'studio'); await returnToRoom(page);
  await expect(page.getByLabel('Two-digit recording number')).toHaveValue('22'); await expect(page.getByRole('button', { name: /CHANNEL 1/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced'); await expect(page.locator('html')).toHaveAttribute('data-text', 'large');
  await expect(page.getByRole('button', { name: /hint|suggested move/i })).toHaveCount(0); await sameWorld(page);
});

test('every location uses one world canvas, with the library reached through its guarded doorway', async ({ page, isMobile }, testInfo) => {
  test.setTimeout(90_000); const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await trackContext(page); await openRoad(page); await markCanvas(page); await importRun(page, completedRun());
  for (const [name, scene, image] of [
    [/The threshold/, 'threshold', '/assets/threshold/coven-cellar.webp'], [/Jen’s kitchen/, 'kitchen', '/assets/kitchen/kitchen-tide.webp'],
    [/Alice’s studio/, 'studio', '/assets/studio/studio-amber.webp'], [/Agatha’s cabin/, 'cabin', '/assets/cabin/cabin-violet.webp'],
    [/Lilia’s tower/, 'tower', '/assets/tower/tower-divination.webp'], [/Rio’s greenhouse/, 'greenhouse', '/assets/greenhouse/greenhouse-earth.webp'],
    [/Remember me garden/, 'garden', /\/assets\/garden\/garden-moonrise-(wide|tall)\.webp/], [/The cottage/, 'cottage', /\/assets\/world\/cottage-dusk/],
  ] as const) {
    await travelViaMap(page, name); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-scene', scene); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
    await expect(page.getByTestId('world-renderer')).toHaveAttribute('data-active-asset', image); await sameWorld(page);
    await expect(page.locator('.topbar,.road-ledger,.room-footer,.scene-controls')).toHaveCount(0);
    expect(await page.evaluate(() => ({ x: scrollX, y: scrollY, overflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight }))).toEqual({ x: 0, y: 0, overflow: false });
    if (scene === 'kitchen') { await page.getByRole('button', { name: 'Step back from the counter', exact: true }).click(); await page.screenshot({ path: testInfo.outputPath('kitchen-world.png'), fullPage: true }); }
  }
  await page.getByRole('button', { name: 'Step back from the door', exact: true }).click(); await page.getByRole('button', { name: 'Look inside the cottage', exact: true }).click();
  await expect(page.getByTestId('world-renderer')).toHaveAttribute('data-active-asset', isMobile ? '/assets/cottage/cottage-room-portrait.webp' : '/assets/cottage/cottage-room.webp'); await sameWorld(page);
  await page.getByRole('button', { name: 'Use the knocker · sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your shelf, at last.', exact: true })).toBeVisible(); await sameWorld(page); expect(errors).toEqual([]);
});

test('a slow obsolete room finishes without replacing the newer destination or its renderer', async ({ page }) => {
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/kitchen/kitchen-tide.webp', async route => { await gate; await route.continue().catch(() => {}); });
  try {
  await trackContext(page); await openRoad(page); await markCanvas(page); await importRun(page, throughTrial('tower'));
  await travelViaMap(page, /Jen’s kitchen/); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-scene', 'kitchen'); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'loading');
  await travelViaMap(page, /Alice’s studio/); const host = page.getByTestId('world-renderer'); await expect(host).toHaveAttribute('data-active-asset', '/assets/studio/studio-amber.webp');
  const discarded = Number(await host.getAttribute('data-discarded-loads')); release();
  await expect.poll(async () => Number(await host.getAttribute('data-discarded-loads'))).toBeGreaterThan(discarded);
  await expect(host).toHaveAttribute('data-active-asset', '/assets/studio/studio-amber.webp'); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready'); await sameWorld(page);
  } finally { release(); }
});

test('the active-play timer waits for required sound and pauses inside the shared menus', async ({ page }) => {
  await page.clock.install(); await openRoad(page); await importRun(page, throughTrial('kitchen')); await page.reload();
  await expect(page.getByTestId('audio-entrance')).toBeVisible(); await page.clock.fastForward(50_000);
  await page.getByRole('button', { name: 'Enter the Road with sound', exact: true }).click(); await expect(page.getByRole('timer', { name: 'Oven timer' })).toContainText('00:40');
  await page.clock.fastForward(20_000); await expect(page.getByRole('timer', { name: 'Oven timer' })).toContainText('00:20');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const settings = page.getByRole('dialog', { name: 'Make yourself comfortable', exact: true }); await expect(settings).toBeVisible();
  // Clicking the kit is active play. Freeze the value at the actual menu entry, then test its pause.
  const paused = await page.locator('.kitchen-clock').textContent(); expect(paused).toMatch(/Oven timer · 00:\d{2}/);
  await page.clock.fastForward(80_000); await expect(page.locator('.kitchen-clock')).toHaveText(paused!);
  await page.getByRole('button', { name: 'Close panel', exact: true }).click(); await expect(settings).not.toBeVisible(); await expect(page.getByRole('timer', { name: 'Oven timer' })).toBeVisible(); await page.clock.fastForward(21_000);
  await expect(page.getByTestId('feedback')).toContainText('oven mitt switches it off'); await expect(page.getByRole('timer', { name: 'Oven timer' })).toContainText('silenced');
});

test('saved-card and file-read failures can be retried without losing the active journey', async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const root = window as unknown as { denyList: boolean; denyFile: boolean }; root.denyList = false; root.denyFile = false;
    const getAll = IDBObjectStore.prototype.getAll, text = File.prototype.text;
    IDBObjectStore.prototype.getAll = function (...args: Parameters<typeof getAll>) { if (root.denyList && this.name === 'runs') throw new DOMException('List unavailable', 'InvalidStateError'); return Reflect.apply(getAll, this, args); };
    File.prototype.text = function () { return root.denyFile ? Promise.reject(new Error('File read unavailable')) : text.call(this); };
  });
  await openRoad(page); await page.getByLabel('Borrowing alias', { exact: true }).fill('Archive Finch'); await page.getByRole('button', { name: /Stamp my card/ }).click();
  await page.evaluate(() => { (window as unknown as { denyList: boolean }).denyList = true; });
  await page.getByRole('button', { name: 'Journeys', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('Saved cards are unavailable');
  await page.evaluate(() => { (window as unknown as { denyList: boolean }).denyList = false; }); await page.getByRole('button', { name: 'Retry saved journeys', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume Archive Finch', exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click(); const input = page.getByLabel('Import a saved journey');
  await input.setInputFiles({ name: 'large.json', mimeType: 'application/json', buffer: Buffer.alloc(1_000_001, 32) }); await expect(page.getByRole('alert')).toContainText('Maximum save size');
  await page.evaluate(() => { (window as unknown as { denyFile: boolean }).denyFile = true; });
  const file = { name: 'retry.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(createRun())) };
  await input.setInputFiles(file); await expect(page.getByRole('alert')).toContainText('could not be read');
  await page.evaluate(() => { (window as unknown as { denyFile: boolean }).denyFile = false; }); await input.setInputFiles(file);
  await expect(page.getByLabel('Borrowing alias', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Journeys', exact: true }).click(); await expect(page.getByRole('button', { name: 'Resume Archive Finch', exact: true })).toBeVisible();
});
