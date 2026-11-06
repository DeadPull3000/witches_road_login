import { expect, type Page } from '@playwright/test';

/** Use the same explicit sound gesture as a player, including after refresh. */
export async function enterRoad(page: Page, keyboard = false) {
  const button = page.getByRole('button', { name: 'Enter the Road with sound' });
  await expect(button).toBeVisible();
  if (keyboard) { await button.focus(); await button.press('Enter'); } else await button.click();
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
}
export async function openRoad(page: Page, keyboard = false) { await page.goto('./'); await enterRoad(page, keyboard); }
export async function reloadRoad(page: Page, keyboard = false) { await page.reload(); await enterRoad(page, keyboard); }

/** Follow the same folded-map workflow used by the player. */
export async function travelViaMap(page: Page, name: string | RegExp) {
  await page.getByRole('button', { name: 'Road map', exact: true }).click();
  const map = page.getByRole('dialog', { name: 'Your folded Road map', exact: true });
  await map.getByRole('button', { name, exact: typeof name === 'string' }).click();
  await expect(map).not.toBeVisible();
}
export async function objectAction(page: Page, name: string | RegExp) {
  await page.getByRole('button', { name: 'Room objects', exact: true }).click();
  const objects = page.getByRole('dialog', { name: 'Room objects', exact: true });
  await objects.getByRole('button', { name, exact: typeof name === 'string' }).click();
  if (await objects.isVisible()) await returnToRoom(page);
}
export async function returnToRoom(page: Page) {
  await page.getByRole('dialog', { name: 'Room objects', exact: true }).getByRole('button', { name: /^Return to / }).click();
}
/** A jug operation starts by selecting its source vessel, just as it does for a player. */
export async function jugAction(page: Page, name: string, keyboard = false) {
  const capacity = /^(?:Fill|Empty|Pour) (3|5)-cup/.exec(name)?.[1];
  if (!capacity) throw new Error('Unknown jug action: ' + name);
  const vessel = page.getByRole('button', { name: `Select the ${capacity}-cup jug`, exact: true });
  if (await vessel.getAttribute('aria-pressed') !== 'true') { if (keyboard) { await vessel.focus(); await vessel.press('Enter'); } else await vessel.click(); }
  const action = page.getByRole('button', { name, exact: true });
  if (keyboard) { await action.focus(); await action.press('Enter'); } else await action.click();
}
