import { openRoad, reloadRoad, jugAction } from './support';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { COVEN } from '../../src/content/scenes';
import { CARDS, INITIAL_DECK, JUG_LABELS, towerSolution } from '../../src/puzzles/rules';

const saved = (page: Page) => expect(page.getByTestId('save-status')).toContainText('saved in this browser');
async function activate(locator: Locator, keyboard = false) {
  if (keyboard) { await locator.focus(); await locator.press('Enter'); } else await locator.click();
}
async function button(page: Page, name: string | RegExp, keyboard = false) { await activate(page.getByRole('button', { name, exact: typeof name === 'string' }), keyboard); }

async function opening(page: Page, keyboard = false) {
  await openRoad(page, keyboard); await expect(page.getByRole('heading', { name: 'A name for the journey.' })).toBeVisible();
  await page.getByLabel('Borrowing alias', { exact: true }).fill('Violet Finch'); await button(page, /Stamp my card/, keyboard);
  await page.getByLabel('Attempted spell — fictional only').fill('discard-this-spell'); await button(page, 'Try the door', keyboard);
  await expect(page.getByTestId('feedback')).toContainText('pockets'); await button(page, /Begin account recovery/, keyboard);
  for (const token of COVEN) { await button(page, `${token.name} · ${token.affinity} token`, keyboard); await button(page, `${token.affinity} seat`, keyboard); }
  await button(page, 'Open the trapdoor', keyboard); await button(page, /Enter Jen’s kitchen/, keyboard);
}
async function fullJourney(page: Page, keyboard = false) {
  // Physical token placement and source-vessel selection add real player actions to the full route.
  test.setTimeout(90_000);
  await opening(page, keyboard);
  for (const move of ['fill-large', 'pour-large', 'empty-small', 'pour-large', 'fill-large', 'pour-large'] as const) await jugAction(page, JUG_LABELS[move], keyboard);
  await expect(page.getByTestId('jug-5')).toHaveText('4 / 5 cups'); await button(page, /Continue to Alice/, keyboard);
  await page.getByLabel('Two-digit recording number').fill('22'); await button(page, 'Dial the number', keyboard);
  await expect(page.getByTestId('feedback')).toContainText('misses a rhythm');
  await page.getByLabel('Two-digit recording number').fill('23'); await button(page, 'Dial the number', keyboard); await button(page, /Continue to Agatha/, keyboard);
  for (const lamp of ['A', 'C', 'D']) await button(page, `Lamp ${lamp}: unlit`, keyboard);
  await button(page, 'Ask the spirits to check', keyboard); await button(page, /Continue to Lilia/, keyboard);
  for (const move of towerSolution([...INITIAL_DECK])) await button(page, move.toUpperCase(), keyboard);
  await button(page, 'Set the arrangement', keyboard); await saved(page); await reloadRoad(page, keyboard);
  await expect(page.getByRole('heading', { name: 'Now, from the other seat.' })).toBeVisible();
  for (const card of [...CARDS].reverse()) await button(page, card, keyboard);
  await button(page, 'Confirm password', keyboard); await button(page, /Continue to Rio/, keyboard);
  for (const node of ['B', 'A', 'C', 'D', 'E', 'A', 'D']) await button(page, new RegExp(`Follow to ${node} ·`), keyboard);
  await expect(page.getByTestId('vine-route')).toHaveText('C Seed → B Breath → A Memory → C Seed → D Bloom → E Earth → A Memory → D Bloom');
  await button(page, /Return to the cottage/, keyboard);
  await button(page, 'Use the knocker · sign in', keyboard); await expect(page.getByTestId('feedback')).toContainText('Unbind');
  await button(page, 'Unbind the door stitch', keyboard); await button(page, 'Use the knocker · sign in', keyboard);
  await expect(page.getByRole('heading', { name: 'Your shelf, at last.' })).toBeVisible();
  await button(page, 'Renew this book', keyboard); await expect(page.getByRole('button', { name: 'Read the renewal receipt', exact: true })).toBeVisible();
  await saved(page); await reloadRoad(page, keyboard); await expect(page.getByText('Renewal accepted · 28 days')).toBeVisible();
}

test('complete story route, interrupted confirmation, renewal and optional remembered return', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await fullJourney(page);
  await button(page, 'Sign out to cottage'); await button(page, 'Visit the optional garden');
  await button(page, 'Cap 3: unlit'); await button(page, 'Cap 7: unlit'); await button(page, 'Return to cottage');
  await button(page, 'Continue to library'); await expect(page.getByRole('button', { name: 'Read the renewal receipt', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('completed-account.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('every required action is keyboard operable with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await fullJourney(page, true);
  await button(page, /Settings/, true); const settings = page.getByRole('dialog', { name: 'Make yourself comfortable', exact: true }); await expect(settings).toBeVisible();
  await page.keyboard.press('Escape'); await expect(settings).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeFocused();
});

test('the entire required route works when canvas rendering is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
    if (typeof OffscreenCanvas !== 'undefined') OffscreenCanvas.prototype.getContext = () => null;
  });
  await openRoad(page); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'fallback');
  await fullJourney(page, true);
});

test('the entire required route works when illustration textures are missing', async ({ page }) => {
  await page.route(/\/assets\/.*\.(png|webp)$/, route => route.abort());
  await openRoad(page); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'fallback');
  await fullJourney(page);
});

test('accepted jug move survives refresh; undo, reset and preferences stay scoped', async ({ page }) => {
  await opening(page); await button(page, 'Fill 5-cup jug'); await saved(page); await reloadRoad(page);
  await expect(page.getByTestId('jug-5')).toHaveText('5 / 5 cups'); await button(page, '↶ Undo last move');
  await expect(page.getByTestId('jug-5')).toHaveText('0 / 5 cups');
  await button(page, 'Fill 5-cup jug'); await button(page, 'Reset this puzzle'); await expect(page.getByTestId('jug-5')).toHaveText('0 / 5 cups');
  await button(page, /Settings/); await page.getByRole('combobox', { name: 'Motion', exact: true }).selectOption('reduced'); await page.getByRole('combobox', { name: 'Text size', exact: true }).selectOption('large');
  await button(page, 'Close panel'); await reloadRoad(page); await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced'); await expect(page.locator('html')).toHaveAttribute('data-text', 'large');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('stale browser tab loads the winner and does not replay its alias action', async ({ page, context }) => {
  await openRoad(page); await expect(page.getByLabel('Borrowing alias', { exact: true })).toBeVisible(); await saved(page);
  const other = await context.newPage(); await openRoad(other); await expect(other.getByLabel('Borrowing alias', { exact: true })).toBeVisible();
  await page.getByLabel('Borrowing alias', { exact: true }).fill('First tab'); await button(page, /Stamp my card/); await saved(page);
  await other.getByLabel('Borrowing alias', { exact: true }).fill('Stale tab'); await button(other, /Stamp my card/);
  await expect(other.getByTestId('feedback')).toContainText('Another tab'); await expect(other.getByText('CARD STAMPED · First tab')).toBeVisible();
  await reloadRoad(other); await expect(other.getByText('CARD STAMPED · First tab')).toBeVisible(); await other.close();
});

test('quota failure stays playable and exports the current unsaved journey', async ({ page }) => {
  await page.addInitScript(() => { IDBObjectStore.prototype.put = function () { throw new DOMException('Test quota failure', 'QuotaExceededError'); }; });
  await openRoad(page); await expect(page.getByTestId('save-status')).toContainText('Unsaved');
  await page.getByLabel('Borrowing alias', { exact: true }).fill('Unsaved Finch'); await button(page, /Stamp my card/);
  await expect(page.getByText('CARD STAMPED · Unsaved Finch')).toBeVisible();
  await page.getByLabel('Attempted spell — fictional only').fill('never-store-this'); await button(page, 'Try the door');
  await expect(page.getByRole('button', { name: /Begin account recovery/ })).toBeVisible();
  const downloadPromise = page.waitForEvent('download'); await button(page, 'Export journey'); const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('witches-road-save.json');
  const stream = await download.createReadStream(); let text = ''; for await (const chunk of stream!) text += chunk.toString();
  expect(JSON.parse(text).alias).toBe('Unsaved Finch');
  expect(JSON.parse(text).arrival.theftRecorded).toBe(true); expect(text).not.toContain('never-store-this');
});

test('corrupt newest snapshot restores checkpoint without discarding original', async ({ page }) => {
  await openRoad(page); await page.getByLabel('Borrowing alias', { exact: true }).fill('Checkpoint Finch'); await button(page, /Stamp my card/);
  await page.getByLabel('Attempted spell — fictional only').fill('transient-only'); await button(page, 'Try the door'); await saved(page);
  const rawBefore = await page.evaluate(async () => new Promise<string>((resolve, reject) => {
    const request = indexedDB.open('witches-road'); request.onerror = () => reject(request.error);
    request.onsuccess = () => { const db = request.result; const tx = db.transaction('runs', 'readwrite'); const store = tx.objectStore('runs'); const get = store.getAll();
      get.onsuccess = () => { const record = get.result[0]; const serialized = JSON.stringify(record); const id = record.current.runId; record.current = { broken: true }; store.put(record, id); tx.oncomplete = () => { db.close(); resolve(serialized); }; }; tx.onerror = () => reject(tx.error); };
  }));
  expect(rawBefore).not.toContain('transient-only');
  await reloadRoad(page); await expect(page.getByTestId('feedback')).toContainText('Recovered the previous checkpoint');
  await expect(page.getByText('CARD STAMPED · Checkpoint Finch')).toBeVisible();
  await button(page, /Settings/); await expect(page.getByRole('button', { name: 'Export retained recovery data' })).toBeVisible();
});

test('import rejects unsupported files and keeps slots and new modes separate', async ({ page }) => {
  await openRoad(page); await page.getByLabel('Borrowing alias', { exact: true }).fill('Original Finch'); await button(page, /Stamp my card/); await saved(page);
  await button(page, /Settings/); await page.getByLabel('Import a saved journey').setInputFiles({ name: 'future.json', mimeType: 'application/json', buffer: Buffer.from('{"schemaVersion":999}') });
  await expect(page.getByTestId('feedback')).toContainText('Unsupported or invalid'); await expect(page.getByText('CARD STAMPED · Original Finch')).toBeVisible();
  await button(page, 'Journeys'); await button(page, 'New showcase journey'); await expect(page.getByRole('heading', { name: 'A name for the journey.' })).toBeVisible();
  await expect(page.getByTestId('journey-mode')).toContainText('SHOWCASE JOURNEY'); await button(page, 'Journeys'); await button(page, 'Resume Original Finch');
  await expect(page.getByText('CARD STAMPED · Original Finch')).toBeVisible();
});
