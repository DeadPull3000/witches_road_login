import { expect, test, type Locator, type Page } from '@playwright/test';
import type { RunState } from '../../src/game/state';
import { project, worldLayout, type Point } from '../../src/world/layout';
import { completedRun, move, throughTrial } from '../helpers';
import { enterRoad } from './support';

const scene = (page: Page) => page.getByTestId('scene-stage');
const object = (page: Page, id: string) => page.locator(`.world-hotspots [data-prop-id="${id}"]`);
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function enterRoom(page: Page, run: RunState) {
  await page.goto('./');
  await enterRoad(page);
  await importRoom(page, run);
}

async function importRoom(page: Page, run: RunState) {
  await button(page, 'Settings').click();
  await page.getByLabel('Import a saved journey').setInputFiles({
    name: 'room.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(run)),
  });
  await expect(scene(page)).toHaveAttribute('data-scene', run.currentScene);
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
}

async function useIllustration(page: Page, art: Locator, touch: boolean) {
  await art.scrollIntoViewIfNeeded();
  const { x, y, width, height } = (await art.boundingBox())!;
  if (touch) await page.touchscreen.tap(x + width / 2, y + height / 2);
  else await page.mouse.click(x + width / 2, y + height / 2);
}

async function usePaintedObject(page: Page, run: RunState, paintedPoint: Point, id: string, touch: boolean) {
  const { width, height } = page.viewportSize()!;
  const point = project(paintedPoint, worldLayout(run, width, height).camera);
  await expect(object(page, id)).toHaveAttribute('data-object-art', 'painted');
  expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.dataset.propId, point)).toBe(id);
  if (touch) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}

test('the spirit scroll, painted lamps and planchette work on the same trial', async ({ page, isMobile }, info) => {
  const run = throughTrial('cabin');
  await enterRoom(page, run);
  const table = page.getByRole('dialog', { name: 'Agatha’s spirit table' });
  const scroll = object(page, 'cabin.work');
  await expect(scroll.locator('svg')).toBeVisible();
  await expect(scroll).toBeInViewport({ ratio: 1 });
  await expect(table).toBeHidden();
  await page.screenshot({ path: info.outputPath('painted-spirit-table.png'), scale: 'css' });
  await scroll.press('Enter');
  await expect(table).toBeFocused();
  await table.press('Escape');
  await expect(scroll).toBeFocused();
  const lamp = object(page, 'cabin.lamp.2');
  await usePaintedObject(page, run, { x: 611, y: 578 }, 'cabin.lamp.2', isMobile);
  await expect(lamp).toHaveAttribute('aria-pressed', 'true');
  await object(page, 'cabin.check').press('Enter');
  await expect(page.getByTestId('feedback')).toContainText('The spirits disagree');
  await expect(table).toBeHidden();

  await button(page, 'Room objects').press('Enter');
  const list = page.getByRole('dialog', { name: 'Room objects' });
  await expect(list.getByRole('button', { name: 'Toggle scene lamp C: lit' })).toBeVisible();
  await list.getByRole('button', { name: 'Approach the spirit table' }).press('Enter');
  await expect(table).toBeVisible();
  const note = table.locator('summary', { hasText: 'Read the spirit-table inscription' });
  const directions = table.getByRole('heading', { name: 'Agree with the spirits.' });
  await expect(directions).toBeHidden();
  await note.press('Enter');
  await expect(directions).toBeVisible();
  await note.press('Enter');
  await expect(directions).toBeHidden();
  await expect(table.getByRole('button', { name: 'Lamp C: lit' })).toBeVisible();
  for (const letter of ['A', 'D']) await table.getByRole('button', { name: `Lamp ${letter}: unlit` }).click();
  await table.press('Escape');
  await expect(button(page, 'Room objects')).toBeFocused();
  await usePaintedObject(page, run, { x: 610, y: 664 }, 'cabin.check', isMobile);
  await expect(page.getByTestId('feedback')).toContainText('All four statements hold');
  await page.locator('.world-hotspots [data-room-exit]').click();
  await expect(scene(page)).toHaveAttribute('data-scene', 'tower');
  await expect(object(page, 'tower.work')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Lilia’s card table' })).toBeHidden();
});

test('the painted library slot and drawn ledger and stamp are the controls at each aspect ratio', async ({ page, isMobile }, info) => {
  const run = completedRun();
  await enterRoom(page, run);
  const desk = page.getByRole('dialog', { name: 'The borrowing desk' });
  const ledger = object(page, 'account.ledger');
  const stamp = object(page, 'account.renew');

  for (const [width, height] of [[1280, 720], [390, 844], [360, 640], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await expect(scene(page)).toHaveCSS('width', `${width}px`);
    await expect(desk).toBeHidden();
    await expect(ledger.locator('svg')).toBeVisible();
    await expect(stamp.locator('svg')).toBeVisible();
    await usePaintedObject(page, run, width / height < .82 ? { x: 687, y: 939 } : { x: 1170, y: 469 }, 'account.slot', isMobile);
    const feedback = page.getByTestId('feedback');
    await expect(feedback).toContainText('A brass slot for returns');
    const objects = page.locator('.world-hotspots .world-object');
    const rectangles = await objects.evaluateAll(elements => elements.map(element => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    }));
    expect(rectangles).toHaveLength(5);
    for (const [index, rect] of rectangles.entries()) {
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(width);
      expect(rect.y + rect.height).toBeLessThanOrEqual(height);
      for (const other of rectangles.slice(index + 1)) {
        expect(rect.x + rect.width <= other.x || other.x + other.width <= rect.x ||
          rect.y + rect.height <= other.y || other.y + other.height <= rect.y).toBe(true);
      }
    }
    await page.mouse.move(2, 2);
    await expect(object(page, 'account.slot').locator('.object-caption')).toHaveCSS('opacity', '0');
    await page.screenshot({ path: info.outputPath(`library-objects-${width}x${height}.png`), scale: 'css' });
  }
  await expect(desk).toBeHidden();
  await stamp.press('Enter');
  await expect(desk).toBeVisible();
  await expect(desk.getByText('Renewal accepted · 28 days')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(ledger).toBeFocused();
  await expect(stamp).toHaveCount(0);
});

test('the music box and the telephone perform their actions when the art is tapped', async ({ page, isMobile }, info) => {
  await page.goto('./');
  const musicBox = button(page, 'Enter the Road with sound');
  await expect(musicBox.locator('[data-prop-kind="musicBox"]')).toBeVisible();
  await useIllustration(page, musicBox.locator('svg'), isMobile);
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');

  const run = throughTrial('studio');
  await importRoom(page, run);
  await usePaintedObject(page, run, { x: 373, y: 426 }, 'studio.work', isMobile);
  const handset = button(page, 'Dial the number');
  await expect(handset.locator('.studio-phone-art')).toBeVisible();
  await page.getByLabel('Two-digit recording number').fill('23');
  await handset.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('working-telephone.png'), scale: 'css' });
  await useIllustration(page, handset.locator('.studio-phone-art'), isMobile);
  await expect(page.getByTestId('feedback')).toContainText('Verification seal earned');
});

test('the painted knocker and door stitch remain reachable beside Agatha at every aspect ratio', async ({ page, isMobile }, info) => {
  const home = move(move(completedRun(), { type: 'SIGN_OUT' }), { type: 'SET_COTTAGE_VIEW', view: 'inside' });
  await enterRoom(page, home);
  for (const [width, height] of [[1280, 720], [390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await button(page, 'Inspect the unbound door stitch').click();
    const door = page.getByRole('dialog', { name: 'The cottage door' });
    await expect(door).toBeVisible();
    await door.press('Escape');
    await page.mouse.move(2, 2);
    await page.screenshot({ path: info.outputPath(`cottage-objects-${width}x${height}.png`), scale: 'css' });
    await usePaintedObject(page, home, width / height < .82 ? { x: 750, y: 787 } : { x: 1268, y: 445 }, 'cottage.door', isMobile);
    await expect(scene(page)).toHaveAttribute('data-scene', 'account');
    await page.locator('.world-hotspots [data-room-exit]').click();
    await button(page, 'Look inside the cottage').click();
    await expect(scene(page)).toHaveAttribute('data-cottage-view', 'inside');
  }
});
