import { openRoad, reloadRoad, objectAction, travelViaMap, returnToRoom, jugAction } from './support';
import { expect, test, type Page } from '@playwright/test';
import { throughTrial } from '../helpers';
import type { RunState } from '../../src/game/state';

async function importJourney(page: Page, run: RunState) {
  await openRoad(page); await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Import a saved journey').setInputFiles({ name: 'journey.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(run)) });
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
}
const noHints = async (page: Page) => {
  await expect(page.getByRole('button', { name: /hint|suggested move/i })).toHaveCount(0);
  await expect(page.locator('.hint-box')).toHaveCount(0);
};

test('kitchen art, accepted pours, active timer and character reactions preserve progress', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await importJourney(page, throughTrial('kitchen')); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  await page.getByRole('button', { name: 'Fill 5-cup jug', exact: true }).click(); await page.getByRole('button', { name: 'Pour 5-cup into 3-cup', exact: true }).click();
  await expect(page.getByTestId('jug-5')).toHaveText('2 / 5 cups'); await noHints(page);
  await page.clock.install(); await page.clock.fastForward(41_000);
  await expect(page.getByTestId('feedback')).toContainText('oven mitt switches it off');
  await expect(page.getByTestId('jug-3')).toHaveText('3 / 3 cups'); await expect(page.getByTestId('jug-5')).toHaveText('2 / 5 cups');
  await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: testInfo.outputPath('kitchen-scene.png'), fullPage: true });
  await expect(page.getByTestId('save-status')).toContainText('saved in this browser'); await reloadRoad(page);
  await expect(page.getByRole('timer', { name: 'Oven timer' })).toContainText('oven mitt has silenced');
  for (const name of ['Empty 3-cup jug', 'Pour 5-cup into 3-cup', 'Fill 5-cup jug', 'Pour 5-cup into 3-cup']) await jugAction(page, name);
  await expect(page.getByTestId('jug-5')).toHaveText('4 / 5 cups'); await expect(page.locator('.scene-art-caption')).toContainText('Precisely');
  expect(errors).toEqual([]);
});

test('studio stems start together; controls persist without revealing a solution', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const root = window as unknown as { scoreStarts: number[][] }; root.scoreStarts = [];
    const original = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args: Parameters<typeof original>) {
      if (this.loop && this.loopEnd === 6) root.scoreStarts.push([args[0] ?? 0, args[1] ?? 0]);
      return Reflect.apply(original, this, args);
    };
  });
  await importJourney(page, throughTrial('studio')); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
  for (let i = 1; i <= 3; i++) await page.getByRole('button', { name: new RegExp(`CHANNEL ${i}`) }).click();
  let starts = await page.evaluate(() => (window as unknown as { scoreStarts: number[][] }).scoreStarts);
  expect(starts).toHaveLength(6); expect(starts.slice(-3).every(start => start[0] === starts[3][0] && start[1] === starts[3][1])).toBe(true);
  await objectAction(page, 'Play the record backwards');
  await expect(page.locator('.playback-state')).toContainText('backwards');
  starts = await page.evaluate(() => (window as unknown as { scoreStarts: number[][] }).scoreStarts);
  expect(starts).toHaveLength(9); expect(starts.slice(-3).every(start => start[0] === starts[6][0] && start[1] === starts[6][1])).toBe(true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'paused');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
  expect(await page.evaluate(() => (window as unknown as { scoreStarts: number[][] }).scoreStarts.length)).toBe(9);
  await objectAction(page, 'Close the speaker doors');
  await noHints(page); await expect(page.getByText('Candidate number board', { exact: true })).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: testInfo.outputPath('studio-scene.png'), fullPage: true });
  await page.getByRole('button', { name: 'Mute sound', exact: true }).click();
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'off'); await expect(page.getByTestId('save-status')).toContainText('saved in this browser'); await reloadRoad(page);
  await page.getByRole('button', { name: 'Room objects', exact: true }).click(); await expect(page.getByRole('button', { name: 'Open the speaker doors', exact: true })).toBeVisible(); await returnToRoom(page);
  for (let i = 1; i <= 3; i++) await expect(page.getByRole('button', { name: new RegExp(`CHANNEL ${i}`) })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const volume = page.getByRole('slider', { name: 'Music volume', exact: true }); await volume.focus(); await volume.press('Home'); await volume.press('ArrowRight');
  await expect(volume).toHaveValue('0.05'); await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await reloadRoad(page); await page.getByRole('button', { name: 'Settings', exact: true }).click(); await expect(page.getByRole('slider', { name: 'Music volume', exact: true })).toHaveValue('0.05');
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.getByLabel('Two-digit recording number').fill('23'); await page.getByRole('button', { name: 'Dial the number', exact: true }).click();
  await expect(page.locator('.scene-art-caption')).toContainText('coming home');
});

test('audio must start before play; a failed device can be retried without losing a journey', async ({ page }) => {
  await page.addInitScript(() => {
    const Original = window.AudioContext, root = window as unknown as { denyAudio: boolean }; root.denyAudio = true;
    window.AudioContext = class { constructor() { if (root.denyAudio) throw new DOMException('Test audio restriction', 'NotAllowedError'); return new Original(); } } as unknown as typeof AudioContext;
  });
  await page.goto('/'); await expect(page.getByLabel('Borrowing alias', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Enter the Road with sound' }).click();
  await expect(page.getByTestId('audio-entrance')).toHaveAttribute('data-audio-state', 'unavailable');
  await expect(page.getByRole('button', { name: 'Retry audio and enter' })).toBeVisible();
  await expect(page.getByRole('button', { name: /skip|without sound|silent/i })).toHaveCount(0);
  await page.evaluate(() => { (window as unknown as { denyAudio: boolean }).denyAudio = false; });
  await page.getByRole('button', { name: 'Retry audio and enter' }).click();
  await page.getByLabel('Borrowing alias', { exact: true }).fill('Sound Finch'); await page.getByRole('button', { name: /Stamp my card/ }).click();
  await expect(page.getByTestId('save-status')).toContainText('saved in this browser'); await page.reload();
  await page.getByRole('button', { name: 'Enter the Road with sound' }).click();
  await expect(page.getByTestId('audio-entrance')).toHaveAttribute('data-audio-state', 'unavailable');
  const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export saved journey', exact: true }).click();
  const stream = await (await downloadPromise).createReadStream(); let exported = ''; for await (const chunk of stream!) exported += chunk.toString();
  expect(JSON.parse(exported).alias).toBe('Sound Finch');
  await page.evaluate(() => { (window as unknown as { denyAudio: boolean }).denyAudio = false; });
  await page.getByRole('button', { name: 'Retry audio and enter' }).click();
  await expect(page.getByText('CARD STAMPED · Sound Finch')).toBeVisible();
});

test('legacy showcase saves have no hints or automatic answers in any required level', async ({ page }) => {
  test.setTimeout(60_000);
  for (const scene of ['kitchen', 'studio', 'cabin', 'tower', 'greenhouse'] as const) {
    const run = throughTrial(scene); run.mode = 'showcase'; run.hints = { [scene]: 3 }; run.journalEntries.push(`Hint · ${scene}: injected answer`);
    await importJourney(page, run); await noHints(page);
    await page.getByRole('button', { name: /Notebook/ }).click(); await expect(page.getByText(/injected answer/)).toHaveCount(0);
    await page.getByRole('button', { name: 'Close panel', exact: true }).click();
    if (scene === 'cabin') await expect(page.getByText('Holds', { exact: true })).toHaveCount(0);
  }
});

test('repeated room changes keep one live scene and load the right art', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await importJourney(page, throughTrial('studio'));
  for (let i = 0; i < 3; i++) {
    await travelViaMap(page, /Jen’s kitchen RECOVER/); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
    await expect(page.getByTestId('world-background')).toHaveAttribute('src', '/assets/kitchen/kitchen-tide.webp'); await expect(page.locator('canvas')).toHaveCount(1);
    await travelViaMap(page, /Alice’s studio VERIFY/); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
    await expect(page.getByTestId('world-background')).toHaveAttribute('src', '/assets/studio/studio-amber.webp'); await expect(page.locator('canvas')).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});
