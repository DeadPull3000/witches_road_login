import { expect, test, type Locator, type Page } from '@playwright/test';
import type { RunState } from '../../src/game/state';
import { SPIRIT_STATEMENTS } from '../../src/world/instruments';
import { completedRun, move, throughTrial } from '../helpers';
import { openRoad, returnToRoom } from './support';

async function importRun(page: Page, run: RunState) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Import a saved journey').setInputFiles({
    name: 'i6-journey.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(run)),
  });
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
}

async function expectDirectTarget(target: Locator) {
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await target.click({ trial: true });
}

test('field notes put printed rules before live actions and return focus to the room', async ({ page }, info) => {
  test.setTimeout(60_000);
  await openRoad(page);
  await importRun(page, throughTrial('cabin'));
  expect(await page.locator('.spirit-slips li>span').allTextContents()).toEqual([...SPIRIT_STATEMENTS]);
  const kit = page.getByRole('button', { name: 'Room objects', exact: true });
  await kit.focus();
  await kit.press('Enter');
  const notes = page.getByRole('dialog', { name: 'Room objects', exact: true });
  await expect(notes).toBeFocused();
  await expect(notes.getByRole('heading', { name: 'Agree with the spirits.' })).toBeVisible();
  await expect(notes.getByText('Lit means 1.', { exact: false })).toBeVisible();
  expect(await notes.getByRole('list', { name: 'Four spirit statements' }).getByRole('listitem').allTextContents()).toEqual([...SPIRIT_STATEMENTS]);
  expect(await notes.locator('.room-rule-page + fieldset').count()).toBe(1);
  await expect(notes.getByRole('button', { name: /hint|suggested move|show answer/i })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('cabin-field-notes.png'), scale: 'css' });
  const lamp = notes.getByRole('button', { name: 'Toggle scene lamp A: unlit', exact: true });
  await lamp.focus(); await lamp.press('Enter');
  await expect(notes.getByRole('button', { name: 'Toggle scene lamp A: lit', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(kit).toBeFocused();
  await kit.press('Enter');
  await returnToRoom(page);
  await expect(page.getByRole('button', { name: 'Lamp A: lit', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('tall cottage and library anchor their close-ups to reachable painted objects', async ({ page }, info) => {
  test.setTimeout(75_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await openRoad(page);
  const stage = page.getByTestId('scene-stage'), renderer = page.getByTestId('world-renderer');
  await page.getByRole('button', { name: 'Close borrowing card', exact: true }).click();
  await page.getByRole('button', { name: 'Look inside the cottage', exact: true }).click();
  await expect(stage).toHaveAttribute('data-framing', 'portrait');
  await expect(renderer).toHaveAttribute('data-active-asset', '/assets/cottage/cottage-room-portrait.webp');
  const desk = stage.getByRole('button', { name: 'Inspect the writing desk', exact: true });
  const rug = stage.getByRole('button', { name: 'Inspect the embroidered rug', exact: true });
  await expectDirectTarget(desk); await expectDirectTarget(rug);
  await expectDirectTarget(stage.getByRole('button', { name: 'Open borrowing card', exact: true }));
  await page.mouse.move(2, 3);
  await page.screenshot({ path: info.outputPath('cottage-portrait.png'), scale: 'css' });
  await desk.click();
  const notes = page.getByRole('dialog', { name: 'Room objects', exact: true });
  await notes.getByRole('button', { name: 'Inspect the red flower', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('A red flower stands in a tiny glass vase');
  await notes.getByRole('button', { name: 'Close room objects', exact: true }).click();
  await expect(desk).toBeFocused();
  await rug.click();
  await expect(page.getByRole('dialog', { name: 'The embroidered rug', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Step back from the rug', exact: true }).click();
  const returning = move(move(completedRun(), { type: 'SIGN_OUT' }), { type: 'SET_COTTAGE_VIEW', view: 'inside' });
  const alias = 'WWWWWWWWWWWWWWWWWWWWWWWW';
  await importRun(page, { ...returning, alias });
  await expect(renderer).toHaveAttribute('data-active-asset', '/assets/cottage/cottage-room-portrait.webp');
  await page.getByRole('button', { name: 'Step back from the door', exact: true }).click();
  const knocker = stage.getByRole('button', { name: 'Use the knocker · sign in', exact: true });
  await expectDirectTarget(knocker); await knocker.click();
  await expect(stage).toHaveAttribute('data-scene', 'account');
  await expect(renderer).toHaveAttribute('data-active-asset', '/assets/library/library-afterhours-portrait.webp');
  await expect(page.locator('.desk-ledger')).toContainText(alias);
  expect(await page.locator('.desk-ledger').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(await page.locator('.desk-ledger').evaluate(el => el.clientWidth));
  await page.getByRole('button', { name: 'Step back from the borrowing desk', exact: true }).click();
  const slot = stage.getByRole('button', { name: 'Inspect the return slot', exact: true });
  await expectDirectTarget(stage.getByRole('button', { name: 'Inspect your borrowing ledger', exact: true }));
  await expectDirectTarget(slot);
  await page.mouse.move(2, 3);
  await page.screenshot({ path: info.outputPath('library-portrait.png'), scale: 'css' });
  await slot.click();
  await expect(page.getByRole('dialog', { name: 'The borrowing desk', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Renew this book', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Renewed for another 28 fictional days');
});

test('a visual-only viewport change keeps the input and canvas, and hidden tabs pause audio and draws', async ({ page }, info) => {
  test.setTimeout(65_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await openRoad(page, true);
  const stage = page.getByTestId('scene-stage'), host = page.getByTestId('world-renderer');
  await expect(stage).toHaveAttribute('data-renderer', 'ready');
  await page.locator('canvas').evaluate(canvas => { canvas.dataset.i6Canvas = 'original'; });
  const input = page.getByLabel('Borrowing alias', { exact: true });
  await input.focus();
  await page.keyboard.insertText('WWWWWWWWWWWWWWWWWWWWWWWW');
  await page.evaluate(() => {
    Object.defineProperty(window.visualViewport, 'height', { configurable: true, value: 300 });
    window.visualViewport!.dispatchEvent(new Event('resize'));
  });
  await expect(stage).toHaveAttribute('data-short', 'true');
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('WWWWWWWWWWWWWWWWWWWWWWWW');
  expect(await input.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return rect.bottom <= window.visualViewport!.height && document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === el;
  })).toBe(true);
  await page.screenshot({ path: info.outputPath('short-visual-viewport.png'), clip: { x: 0, y: 0, width: 390, height: 300 }, scale: 'css' });
  await page.evaluate(() => {
    Reflect.deleteProperty(window.visualViewport!, 'height');
    window.visualViewport!.dispatchEvent(new Event('resize'));
  });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(stage).toHaveAttribute('data-framing', 'landscape');
  await expect(input).toBeFocused();
  await input.press('Enter');
  await expect(page.getByTestId('feedback')).toContainText('Borrowing card stamped for WWWWWWWWWWWWWWWWWWWWWWWW');
  const sound = page.getByTestId('audio-controls');
  await expect(sound).toHaveAttribute('data-audio-state', 'playing');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(sound).toHaveAttribute('data-audio-state', 'paused');
  await expect(stage).toHaveAttribute('data-paused', 'true');
  const frames = await host.getAttribute('data-frames');
  await page.waitForTimeout(300);
  expect(await host.getAttribute('data-frames')).toBe(frames);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(sound).toHaveAttribute('data-audio-state', 'playing');
  await expect.poll(async () => Number(await host.getAttribute('data-frames'))).toBeGreaterThan(Number(frames));
  await expect(page.locator('canvas')).toHaveAttribute('data-i6-canvas', 'original');
  await expect(page.getByLabel('Attempted spell — fictional only')).toBeVisible();
});
