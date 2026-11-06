import { expect, test, type Locator, type Page } from '@playwright/test';
import { SCENE_INFO, TRIALS } from '../../src/content/scenes';
import type { RunState } from '../../src/game/state';
import { throughTrial } from '../helpers';
import { approachRoom, enterRoad, openRoad, reloadRoad } from './support';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const room = (page: Page) => page.getByTestId('scene-stage');
const approaches = {
  kitchen: ['Step back from the counter', 'Approach the kitchen counter'],
  studio: ['Step back from the desk', 'Approach the recording desk'],
  cabin: ['Step back from the table', 'Approach the spirit table'],
  tower: ['Step back from the card table', 'Approach the card table'],
  greenhouse: ['Step back from the vine bed', 'Approach the vine bed'],
} as const;

async function importTrial(page: Page, run: RunState) {
  await button(page, 'Settings').click();
  await page.getByLabel('Import a saved journey').setInputFiles({
    name: 'timed-journey.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(run)),
  });
  await expect(room(page)).toHaveAttribute('data-scene', run.currentScene);
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
  await approachRoom(page);
}

async function passDeadline(page: Page, deadline: number) {
  const remaining = deadline - await page.evaluate(() => Date.now());
  expect(remaining).toBeGreaterThan(0);
  await page.clock.fastForward(remaining + 1000);
}

test('a deadline survives reload and sends the player to the cottage from an open menu', async ({ page }) => {
  await page.clock.install();
  await openRoad(page);
  const run = throughTrial('studio');
  await importTrial(page, run);
  await page.clock.fastForward(120_000);
  await reloadRoad(page);
  await expect(room(page)).toHaveAttribute('data-scene', 'studio');

  await button(page, 'Settings').click();
  const settings = page.getByRole('dialog', { name: 'Make yourself comfortable' });
  await expect(settings).toBeVisible();
  const clock = settings.getByRole('timer', { name: 'Alice’s trial time remaining' });
  await expect(clock).toHaveText(/^[23]:\d{2}$/);
  const untilWarning = run.trialClock!.endsAt - await page.evaluate(() => Date.now()) - 29_000;
  expect(untilWarning).toBeGreaterThan(0);
  await page.clock.fastForward(untilWarning);
  await expect(settings.locator('[data-clock-face="studio"]')).toHaveAttribute('data-urgent', 'true');
  await expect(settings.getByRole('status')).toHaveText('Thirty seconds or less remain in this trial.');
  await passDeadline(page, run.trialClock!.endsAt);
  await expect(settings).not.toBeVisible();
  await expect(room(page)).toHaveAttribute('data-scene', 'cottage');
  await expect(page.getByTestId('feedback')).toContainText('Alice’s trial ran out of time');
  await approachRoom(page);
  await expect(page.getByLabel('Attempted spell — fictional only')).toBeVisible();
  await expect(page.getByTestId('save-status')).toContainText('Journey saved');

  await button(page, 'Road map').click();
  await expect(page.getByLabel('0 of 5 seals collected')).toBeVisible();
  await expect(button(page, 'The threshold')).toBeDisabled();
  await reloadRoad(page);
  await expect(room(page)).toHaveAttribute('data-scene', 'cottage');
  await expect(page.getByLabel('Attempted spell — fictional only')).toBeVisible();
});

test('a deadline can expire behind the sound entrance without another player action', async ({ page }) => {
  await page.clock.install();
  await openRoad(page);
  const run = throughTrial('cabin');
  await importTrial(page, run);
  await page.reload();
  await expect(page.getByTestId('audio-entrance')).toBeVisible();
  await passDeadline(page, run.trialClock!.endsAt);
  await expect(room(page)).toHaveAttribute('data-scene', 'cottage');
  await enterRoad(page);
  await expect(page.getByTestId('feedback')).toContainText('Agatha’s trial ran out of time');
});

async function expectClockBesideClose(page: Page, face: Locator, close: Locator) {
  const [dial, button] = await Promise.all([face.boundingBox(), close.boundingBox()]);
  expect(dial).not.toBeNull();
  expect(button).not.toBeNull();
  expect(dial!.x + dial!.width).toBeLessThanOrEqual(button!.x + 1);
  expect(button!.x + button!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(dial!.y).toBeGreaterThanOrEqual(0);
  expect(dial!.y + dial!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
}

test('each required trial has one themed clock that fits the room and workbench', async ({ page }, info) => {
  test.setTimeout(100_000);
  await openRoad(page);
  for (const trial of TRIALS) {
    const run = throughTrial(trial);
    if (trial === 'studio') Reflect.deleteProperty(run, 'trialClock');
    await importTrial(page, run);
    const clock = page.getByRole('timer', { name: `${SCENE_INFO[trial].character}’s trial time remaining` });
    await expect(clock).toHaveText(/^(5:00|4:5\d)$/);
    await expect(page.getByRole('timer')).toHaveCount(1);
    const [back, approach] = approaches[trial];
    const face = page.locator(`[data-clock-face="${trial}"]`);
    await expectClockBesideClose(page, face, button(page, back));
    await page.screenshot({ path: info.outputPath(`${trial}-clock.png`), scale: 'css' });
    await button(page, back).click();
    await expect(page.locator('.world-trial-clock').getByRole('timer')).toBeVisible();
    await expect(button(page, approach)).toBeVisible();
    await button(page, approach).click();
    await expect(clock).toBeVisible();
    if (trial === 'studio') {
      const normal = page.viewportSize()!;
      await page.setViewportSize({ width: 320, height: 470 });
      await expectClockBesideClose(page, face, button(page, back));
      await page.screenshot({ path: info.outputPath('studio-clock-short.png'), scale: 'css' });
      await page.setViewportSize(normal);
    }
  }
});
