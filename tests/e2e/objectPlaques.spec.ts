import { expect, test, type Page } from '@playwright/test';
import type { RunState } from '../../src/game/state';
import { completedRun, throughTrial } from '../helpers';
import { enterRoad } from './support';

const scene = (page: Page) => page.getByTestId('scene-stage');
const object = (page: Page, id: string) => page.locator(`.world-hotspots [data-prop-id="${id}"]`);
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function enterRoom(page: Page, run: RunState) {
  await page.goto('./');
  await enterRoad(page);
  await button(page, 'Settings').click();
  await page.getByLabel('Import a saved journey').setInputFiles({
    name: 'room.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(run)),
  });
  await expect(scene(page)).toHaveAttribute('data-scene', run.currentScene);
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
}

test('the spirit-table plaque, note, lamps, planchette and exit all act on the same trial', async ({ page }) => {
  await enterRoom(page, throughTrial('cabin'));
  const table = page.getByRole('dialog', { name: 'Agatha’s spirit table' });
  const plaque = object(page, 'cabin.work');
  await expect(plaque).toBeInViewport({ ratio: 1 });
  await expect(table).toBeHidden();
  await plaque.press('Enter');
  await expect(table).toBeFocused();
  await table.press('Escape');
  await expect(plaque).toBeFocused();
  const lamp = object(page, 'cabin.lamp.2');
  await lamp.click();
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
  await object(page, 'cabin.check').click();
  await expect(page.getByTestId('feedback')).toContainText('All four statements hold');
  await page.locator('.world-hotspots [data-room-exit]').click();
  await expect(scene(page)).toHaveAttribute('data-scene', 'tower');
  await expect(object(page, 'tower.work')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Lilia’s card table' })).toBeHidden();
});

test('library plaques stay clickable as the room reframes and perform their own actions', async ({ page }, info) => {
  await enterRoom(page, completedRun());
  const desk = page.getByRole('dialog', { name: 'The borrowing desk' });
  const ledger = object(page, 'account.ledger');
  const slot = object(page, 'account.slot');
  const stamp = object(page, 'account.renew');

  for (const [width, height] of [[1280, 720], [390, 844], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await expect(scene(page)).toHaveCSS('width', `${width}px`);
    await expect(desk).toBeHidden();
    await slot.click();
    const feedback = page.getByTestId('feedback');
    await expect(feedback).toContainText('A brass slot for returns');
    const response = (await feedback.boundingBox())!;
    const plaques = page.locator('.world-hotspots .object-plaque');
    const rectangles = await plaques.evaluateAll(elements => elements.map(element => {
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
      for (const other of [response, ...rectangles.slice(index + 1)]) {
        expect(rect.x + rect.width <= other.x || other.x + other.width <= rect.x ||
          rect.y + rect.height <= other.y || other.y + other.height <= rect.y).toBe(true);
      }
    }
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
