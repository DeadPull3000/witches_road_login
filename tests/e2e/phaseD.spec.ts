import { expect, test, type Page } from '@playwright/test';
import { throughTrial } from '../helpers';
import { MEMORIES } from '../../src/content/memories';
import { CARDS, INITIAL_DECK, towerSolution } from '../../src/puzzles/rules';
import { approachRoom, openRoad, reloadRoad, objectAction, travelViaMap, returnToRoom } from './support';

async function importRoom(page: Page, scene: 'cabin' | 'tower') {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Import a saved journey').setInputFiles({ name: 'journey.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(throughTrial(scene))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
  await approachRoom(page);
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
}
const saved = (page: Page) => expect(page.getByTestId('save-status')).toContainText('saved in this browser');
async function arrange(page: Page) { for (const move of towerSolution([...INITIAL_DECK])) await page.getByRole('button', { name: move.toUpperCase(), exact: true }).click(); }

test('a real audio signal starts on entry, follows the rooms and respects immediate mute', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const root = window as unknown as { roadAnalyser?: AnalyserNode; roadOscillators: number }; root.roadOscillators = 0;
    const connect = AudioNode.prototype.connect, start = OscillatorNode.prototype.start;
    AudioNode.prototype.connect = function (this: AudioNode, ...args: unknown[]) {
      const result = Reflect.apply(connect, this, args);
      if (this instanceof GainNode && args[0] instanceof AudioDestinationNode) {
        const analyser = this.context.createAnalyser(); analyser.fftSize = 2048;
        Reflect.apply(connect, this, [analyser]); root.roadAnalyser = analyser;
      }
      return result;
    } as typeof connect;
    OscillatorNode.prototype.start = function (...args: Parameters<typeof start>) { root.roadOscillators++; return Reflect.apply(start, this, args); };
  });
  await page.goto('/'); await expect(page.getByTestId('audio-entrance')).toBeVisible();
  expect(await page.evaluate(() => !!(window as unknown as { roadAnalyser?: AnalyserNode }).roadAnalyser)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('sound-entrance.png'), fullPage: true });
  await page.getByRole('button', { name: 'Enter the Road with sound' }).click();
  const signal = () => page.evaluate(() => {
    const analyser = (window as unknown as { roadAnalyser: AnalyserNode }).roadAnalyser;
    const data = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(data);
    return data.reduce((peak, sample) => Math.max(peak, Math.abs(sample)), 0);
  });
  await expect.poll(signal).toBeGreaterThan(.00001);
  for (const scene of ['cabin', 'tower'] as const) { await importRoom(page, scene); await expect.poll(signal).toBeGreaterThan(.00001); }
  await page.getByRole('button', { name: 'Mute sound', exact: true }).click(); await expect.poll(signal).toBe(0);
  await page.getByRole('button', { name: 'Enable sound', exact: true }).click(); await expect.poll(signal).toBeGreaterThan(.00001);
  await saved(page); await reloadRoad(page); expect(await page.evaluate(() => (window as unknown as { roadOscillators: number }).roadOscillators)).toBe(0);
  await objectAction(page, /Speak with Lilia/); await expect(page.getByTestId('feedback')).toContainText('out of order');
});

test('cabin lamps share scene and text controls; the shadow never removes progress', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await openRoad(page); await importRoom(page, 'cabin');
  await objectAction(page, 'Toggle scene lamp B: unlit');
  await expect(page.getByRole('button', { name: 'Lamp B: lit', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 5000));
  await page.getByRole('button', { name: 'Ask the spirits to check' }).click(); await expect(page.getByTestId('feedback')).toContainText('shadow lifts its hand');
  await page.getByRole('button', { name: 'Skip shadow animation' }).click();
  await page.clock.resume();
  await page.getByRole('button', { name: '↶ Undo last move' }).click(); await expect(page.getByRole('button', { name: 'Lamp B: unlit', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lamp A: unlit', exact: true }).click(); await saved(page); await reloadRoad(page);
  await expect(page.getByRole('button', { name: 'Lamp A: lit', exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: 'Skip shadow animation' })).toHaveCount(0);
  for (const lamp of ['C', 'D']) await objectAction(page, `Toggle scene lamp ${lamp}: unlit`);
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  await page.getByRole('button', { name: 'Ask the spirits to check' }).click(); await expect(page.locator('.scene-art-caption')).toContainText('Apparently human');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Room objects', exact: true }).click();
  for (const lamp of ['A', 'B', 'C', 'D']) await expect(page.getByRole('button', { name: new RegExp(`Toggle scene lamp ${lamp}:`) })).toBeDisabled();
  await returnToRoom(page);
  await expect(page.getByText('Holds', { exact: true })).toHaveCount(0); await expect(page.getByRole('button', { name: /hint|suggested/i })).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: testInfo.outputPath('cabin-scene.png'), fullPage: true });
  await page.getByRole('button', { name: /Continue to Lilia/ }).click(); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  expect(errors).toEqual([]);
});

test('tarot memories, table nick and opposite-seat confirmation survive reload without answers', async ({ page }, testInfo) => {
  test.setTimeout(60_000); const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await openRoad(page); await importRoom(page, 'tower');
  await objectAction(page, 'Inspect the appointment envelope'); await expect(page.getByTestId('feedback')).toContainText('already asked');
  await page.locator('.memory-album summary').click();
  for (const memory of MEMORIES.slice(0, 2)) await page.getByRole('button', { name: new RegExp(memory.title) }).click();
  await page.getByRole('button', { name: 'CUT', exact: true }).click(); await page.getByRole('button', { name: '↶ Undo last move' }).click();
  await saved(page); await reloadRoad(page); await page.locator('.memory-album summary').click();
  for (const memory of MEMORIES.slice(0, 2)) await expect(page.getByRole('button', { name: new RegExp(memory.title) })).toHaveAttribute('aria-expanded', 'true');
  for (const memory of MEMORIES.slice(2)) await page.getByRole('button', { name: new RegExp(memory.title) }).click();
  await expect(page.locator('.memory-album summary')).toContainText('4 / 4');
  await expect(page.getByTestId('tarot-table')).toHaveAttribute('data-seat', 'first');
  await expect(page.getByLabel('Permanent table nick · left edge')).toBeVisible();
  await arrange(page); await expect(page.getByLabel('Current card order').locator('b')).toHaveText([...CARDS]);
  await page.locator('.memory-album summary').click(); await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: testInfo.outputPath('tower-first-seat.png'), fullPage: true });
  await page.getByRole('button', { name: 'Set the arrangement', exact: true }).click();
  await expect(page.getByTestId('tarot-table')).toHaveAttribute('data-seat', 'opposite'); await expect(page.getByLabel('Permanent table nick · right edge')).toBeVisible();
  await expect(page.locator('.card-back')).toHaveCount(5); await expect(page.getByLabel('Current card order')).toHaveCount(0);
  await page.getByRole('button', { name: 'Door', exact: true }).click(); await saved(page); await reloadRoad(page);
  await expect(page.getByRole('button', { name: 'Door', exact: true })).toBeDisabled(); await expect(page.locator('.card-back')).toHaveCount(4);
  await page.getByRole('button', { name: 'Clear confirmation', exact: true }).click();
  for (const card of CARDS) await page.getByRole('button', { name: card, exact: true }).click();
  await page.getByRole('button', { name: 'Confirm password', exact: true }).click(); await expect(page.getByTestId('feedback')).toContainText('not the order from the opposite seat');
  await page.getByRole('button', { name: 'Clear confirmation', exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: testInfo.outputPath('tower-opposite-seat.png'), fullPage: true });
  for (const card of [...CARDS].reverse()) await page.getByRole('button', { name: card, exact: true }).click();
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 5000));
  await page.getByRole('button', { name: 'Confirm password', exact: true }).click(); await expect(page.getByRole('button', { name: /Continue to Rio/ })).toBeVisible();
  await page.getByRole('button', { name: 'Skip tower animation' }).click(); await page.clock.resume(); await saved(page); await reloadRoad(page);
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-flourish', 'none'); await expect(page.getByRole('button', { name: /Continue to Rio/ })).toBeVisible();
  await page.getByRole('button', { name: /Notebook/ }).click(); await expect(page.getByText('A future appointment', { exact: true })).toBeVisible(); await expect(page.getByText('The tower turns', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('changing the motion preference cancels an active shadow without replaying it', async ({ page }) => {
  await page.clock.install(); await openRoad(page); await importRoom(page, 'cabin');
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 5000));
  await page.getByRole('button', { name: 'Ask the spirits to check' }).click();
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-flourish', 'shadow');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-flourish', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-flourish', 'none');
  await page.clock.resume(); await page.getByRole('button', { name: 'Ask the spirits to check' }).click();
  await expect(page.getByRole('button', { name: 'Skip shadow animation' })).toHaveCount(0); await expect(page.getByRole('button', { name: 'Lamp A: unlit', exact: true })).toBeVisible();
});

test('reduced motion preserves both tower perspectives and skips the inversion', async ({ page }) => {
  test.setTimeout(60_000); await page.emulateMedia({ reducedMotion: 'reduce' }); await openRoad(page, true); await importRoom(page, 'tower');
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-motion', 'reduced'); await arrange(page);
  await page.getByRole('button', { name: 'Set the arrangement', exact: true }).click(); await expect(page.getByTestId('tarot-table')).toHaveAttribute('data-seat', 'opposite');
  expect(await page.locator('.tarot').first().evaluate(card => getComputedStyle(card).transitionDuration)).toBe('0s');
  for (const card of [...CARDS].reverse()) { const button = page.getByRole('button', { name: card, exact: true }); await button.focus(); await button.press('Enter'); }
  await page.getByRole('button', { name: 'Confirm password', exact: true }).click(); await expect(page.getByRole('button', { name: /Continue to Rio/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip tower animation' })).toHaveCount(0); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-flourish', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('repeated studio, cabin and tower visits retain a single renderer with live audio', async ({ page }) => {
  test.setTimeout(60_000); const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); await openRoad(page); await importRoom(page, 'tower');
  for (let round = 0; round < 3; round++) for (const [name, source] of [
    [/Alice’s studio VERIFY/, '/assets/studio/studio-amber.webp'], [/Agatha’s cabin PROVE/, '/assets/cabin/cabin-violet.webp'], [/Lilia’s tower REMEMBER/, '/assets/tower/tower-divination.webp'],
  ] as const) {
    await travelViaMap(page, name); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
    await expect(page.getByTestId('world-background')).toHaveAttribute('src', source); await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
  }
  expect(errors).toEqual([]);
});
