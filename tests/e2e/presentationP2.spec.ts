import { expect, test, type Page } from '@playwright/test';
import type { RunState } from '../../src/game/state';
import { CARDS, INITIAL_DECK, NODE_LABELS, towerSolution, vineSolution } from '../../src/puzzles/rules';
import { INSTRUMENTS, SPIRIT_STATEMENTS } from '../../src/world/instruments';
import { throughTrial } from '../helpers';
import { approachRoom, openRoad, reloadRoad, travelViaMap } from './support';

const world = (page: Page) => page.getByTestId('scene-stage');
const workbench = (page: Page) => page.getByTestId('instrument-stage');
const paintingProps = (page: Page) => page.getByTestId('trial-room-props');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function importRun(page: Page, run: RunState) {
  await button(page, 'Settings').click();
  await page.getByLabel('Import a saved journey').setInputFiles({
    name: 'painted-trials.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(run)),
  });
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
  await approachRoom(page);
}

test('the five painted work surfaces keep their tags, hosts and controls in reach across viewport sizes', async ({ page, isMobile }) => {
  test.setTimeout(120_000);
  await openRoad(page);
  await importRun(page, throughTrial('greenhouse'));
  await page.locator('canvas').evaluate(canvas => { canvas.dataset.presentationProof = 'same-canvas'; });
  const trials = [
    ['threshold', /The threshold/, 'Open the trapdoor'], ['kitchen', /Jen’s kitchen/, 'Select the 5-cup jug'],
    ['cabin', /Agatha’s cabin/, 'Ask the spirits to check'], ['tower', /Lilia’s tower/, 'Confirm password'],
    ['greenhouse', /Rio’s greenhouse/, 'Follow to D · Bloom'],
  ] as const;
  const sizes = isMobile ? [[390, 844], [360, 780], [844, 390]] : [[1280, 720], [1440, 900], [844, 390]];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    // Make every map selection a real room change, including the first time through.
    await travelViaMap(page, /Alice’s studio/);
    for (const [scene, destination, action] of trials) {
      await travelViaMap(page, destination);
      await expect(world(page)).toHaveAttribute('data-scene', scene);
      await expect(workbench(page)).toHaveAttribute('data-expanded', 'true');
      await expect(paintingProps(page)).toBeAttached();
      await expect(workbench(page).locator('.object-note summary')).toBeInViewport();
      const primary = button(page, action);
      await primary.scrollIntoViewIfNeeded();
      await expect(primary).toBeInViewport({ ratio: 1 });
      await expect(button(page, INSTRUMENTS[scene].close)).toBeInViewport({ ratio: 1 });
      expect(await workbench(page).evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      if (width >= 1100) {
        const clear = await page.evaluate(() => {
          const bench = document.querySelector('.workbench-stage')!.getBoundingClientRect();
          const actor = document.querySelector('.world-still > img:last-of-type')!.getBoundingClientRect();
          return actor.left - bench.right;
        });
        expect(clear).toBeGreaterThanOrEqual(23);
      }
      await button(page, INSTRUMENTS[scene].close).click();
      const tag = button(page, INSTRUMENTS[scene].approach);
      await expect(tag).toBeFocused();
      await expect(tag).toBeInViewport({ ratio: 1 });
      expect((await tag.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await tag.press('Enter');
      await expect(workbench(page)).toBeFocused();
      await expect(page.locator('canvas')).toHaveAttribute('data-presentation-proof', 'same-canvas');
    }
  }
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
  expect(await page.evaluate(() => [scrollX, scrollY])).toEqual([0, 0]);
});

test('painted props track accepted work and the opposite spread starts with backs', async ({ page }) => {
  test.setTimeout(90_000);
  await openRoad(page);
  await importRun(page, throughTrial('kitchen'));
  await button(page, 'Fill 5-cup jug').press('Enter');
  await expect(page.getByTestId('jug-5')).toHaveText('5 / 5 cups');
  await button(page, INSTRUMENTS.kitchen.close).click();
  await expect(paintingProps(page).locator('[data-vessel="5"]')).toHaveAttribute('data-volume', '5');
  await reloadRoad(page);
  await expect(page.getByTestId('jug-5')).toHaveText('5 / 5 cups');

  await importRun(page, throughTrial('cabin'));
  await expect(workbench(page).locator('.spirit-slips li > span')).toHaveText([...SPIRIT_STATEMENTS]);
  await button(page, 'Lamp B: unlit').press('Space');
  await expect(button(page, 'Lamp B: lit')).toHaveAttribute('aria-pressed', 'true');
  await button(page, INSTRUMENTS.cabin.close).click();
  await expect(paintingProps(page).locator('[data-lantern="B"]')).toHaveAttribute('data-lit', 'true');
  await expect(paintingProps(page).locator('[data-lantern="A"]')).toHaveAttribute('data-lit', 'false');

  await importRun(page, throughTrial('tower'));
  await expect(paintingProps(page).locator('.preview-card-face')).toHaveCount(5);
  const order = page.getByLabel('Current card order').locator('b');
  const deck = [...INITIAL_DECK];
  for (const action of towerSolution([...INITIAL_DECK])) {
    const tool = button(page, action.toUpperCase());
    await expect(tool).toBeEnabled();
    await tool.press('Enter');
    if (action === 'cut') deck.push(deck.shift()!);
    else [deck[0], deck[1]] = [deck[1], deck[0]];
    await expect(order).toHaveText(deck);
  }
  await expect(order).toHaveText([...CARDS]);
  await expect(button(page, 'Set the arrangement')).toBeEnabled();
  await button(page, 'Set the arrangement').press('Enter');
  await expect(page.getByTestId('tarot-table')).toHaveAttribute('data-seat', 'opposite');
  await expect(paintingProps(page).locator('.preview-card-face')).toHaveCount(0);
  await expect(paintingProps(page).locator('.preview-card-back')).toHaveCount(5);
  await expect(page.getByLabel('Permanent table nick · right edge')).toBeVisible();
  await workbench(page).getByText('Read the four appointment slips', { exact: true }).click();
  await expect(workbench(page).getByRole('list', { name: 'Four card memories' }).getByRole('listitem')).toHaveCount(4);

  await importRun(page, throughTrial('greenhouse'));
  const crossing = page.getByTestId('vine-map').locator('[data-edge="CD"]');
  await expect(crossing.locator('.vine-bridge')).toHaveCount(1);
  await expect(crossing).toHaveAttribute('data-saved', 'false');
  await button(page, 'Follow to D · Bloom').press('Space');
  await expect(crossing).toHaveAttribute('data-saved', 'true');
  await expect(crossing.locator('.vine.used')).toHaveCSS('stroke-dasharray', '5px, 4px');
  await button(page, INSTRUMENTS.greenhouse.close).click();
  await expect(paintingProps(page).locator('[data-edge="CD"]')).toHaveAttribute('data-saved', 'true');
  await button(page, INSTRUMENTS.greenhouse.approach).click();
  for (const node of vineSolution(['C', 'D'])!.slice(2)) await button(page, `Follow to ${node} · ${NODE_LABELS[node]}`).click();
  await expect(page.locator('.bed-flower')).toBeAttached();
  await expect(paintingProps(page).locator('[data-edge][data-saved="true"]')).toHaveCount(7);
  await reloadRoad(page);
  await expect(page.locator('.bed-flower')).toHaveAttribute('data-blooming', 'false');
  await expect(page.getByLabel('Rio’s red flower')).toBeVisible();
});
