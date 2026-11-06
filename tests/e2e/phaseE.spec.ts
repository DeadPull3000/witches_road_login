import { expect, test, type Page } from '@playwright/test';
import { openRoad, reloadRoad, objectAction } from './support';
import { completedRun, move, solveCurrent, throughTrial } from '../helpers';
import { VINE_POSITIONS, type Point } from '../../src/content/vines';
import { STITCH_POINTS } from '../../src/ui/RuneStitch';
import { ROOM_PROPS } from '../../src/content/cottage';
import type { RunState } from '../../src/game/state';

const saved = (page: Page) => expect(page.getByTestId('save-status')).toContainText('saved in this browser');
async function importJourney(page: Page, run: RunState) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Import a saved journey').setInputFiles({ name: 'journey.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(run)) });
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
}
async function clientPoint(page: Page, testId: string, point: Point) {
  return page.getByTestId(testId).evaluate((svg, coordinates) => {
    const p = new DOMPoint(...coordinates).matrixTransform((svg as SVGSVGElement).getScreenCTM()!); return { x: p.x, y: p.y };
  }, [...point]);
}
async function drag(page: Page, testId: string, points: Point[]) {
  await page.getByTestId(testId).scrollIntoViewIfNeeded();
  const clients = await Promise.all(points.map(point => clientPoint(page, testId, point)));
  await page.mouse.move(clients[0].x, clients[0].y); await page.mouse.down();
  for (const point of clients.slice(1)) await page.mouse.move(point.x, point.y, { steps: 8 }); await page.mouse.up();
}
const home = () => move(solveCurrent(throughTrial('greenhouse')), { type: 'ENTER_SCENE', scene: 'cottage' });
async function screenshot(page: Page, path: string) { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path, fullPage: true }); }
async function pauseCue(page: Page) { await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 5000)); }
async function trackEffects(page: Page) {
  await page.addInitScript(() => {
    const root = window as unknown as { endingTones: number }; root.endingTones = 0;
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args: Parameters<typeof start>) { root.endingTones++; return Reflect.apply(start, this, args); };
  });
}
const toneCount = (page: Page) => page.evaluate(() => (window as unknown as { endingTones: number }).endingTones);

test('drawing crosses vines without inventing a stone; partial and alternate complete routes persist', async ({ page }, testInfo) => {
  test.setTimeout(60_000); const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await trackEffects(page);
  await openRoad(page); await importJourney(page, throughTrial('greenhouse'));
  await screenshot(page, testInfo.outputPath('greenhouse-scene.png'));
  await drag(page, 'vine-map', [VINE_POSITIONS.C, VINE_POSITIONS.D]); await expect(page.getByTestId('vine-route')).toHaveText('C Seed → D Bloom');
  await saved(page); await reloadRoad(page); await expect(page.getByTestId('vine-route')).toHaveText('C Seed → D Bloom');
  await page.getByRole('button', { name: '↶ Undo last move' }).click(); await expect(page.getByTestId('vine-route')).toHaveText('C Seed');
  await drag(page, 'vine-map', [VINE_POSITIONS.C, VINE_POSITIONS.E]); await expect(page.getByTestId('vine-route')).toHaveText('C Seed');
  await drag(page, 'vine-map', ['C','B','A','D','C','A','E','D'].map(node => VINE_POSITIONS[node as keyof typeof VINE_POSITIONS]));
  await expect(page.getByTestId('vine-route')).toHaveText('C Seed → B Breath → A Memory → D Bloom → C Seed → A Memory → E Earth → D Bloom');
  await expect(page.locator('.scene-art-caption')).toContainText('red flower'); await expect(page.getByRole('button', { name: /Return to the cottage/ })).toBeVisible();
  expect(await toneCount(page)).toBe(4);
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
  await expect(page.getByRole('button', { name: /hint|suggested route/i })).toHaveCount(0); expect(errors).toEqual([]);
});

test('touch strokes cancel safely and a concurrent button move discards an old drawing', async ({ page }) => {
  await openRoad(page); await importJourney(page, throughTrial('greenhouse')); await page.getByTestId('vine-map').scrollIntoViewIfNeeded();
  const svg = page.getByTestId('vine-map');
  const pointer = async (type: string, point: Point, buttons = 1) => { const client = await clientPoint(page, 'vine-map', point); await svg.dispatchEvent(type, { clientX: client.x, clientY: client.y, pointerId: 22, pointerType: 'touch', isPrimary: true, button: 0, buttons }); };
  await pointer('pointerdown', VINE_POSITIONS.C); await pointer('pointermove', VINE_POSITIONS.B); await pointer('pointercancel', VINE_POSITIONS.B);
  await expect(page.getByTestId('vine-route')).toHaveText('C Seed'); await expect(page.locator('.vine-map-panel .drawing-notice')).toContainText('cancelled');
  await pointer('pointerdown', VINE_POSITIONS.C); await pointer('pointermove', VINE_POSITIONS.B); await pointer('lostpointercapture', VINE_POSITIONS.B);
  await pointer('pointermove', VINE_POSITIONS.A); await pointer('pointerup', VINE_POSITIONS.A, 0); await expect(page.getByTestId('vine-route')).toHaveText('C Seed');
  await pointer('pointerdown', VINE_POSITIONS.C); await pointer('pointermove', VINE_POSITIONS.B, 0); await pointer('pointerup', VINE_POSITIONS.B, 0); await expect(page.getByTestId('vine-route')).toHaveText('C Seed');
  await pointer('pointerdown', VINE_POSITIONS.C); await pointer('pointerup', VINE_POSITIONS.D, 0); await expect(page.getByTestId('vine-route')).toHaveText('C Seed → D Bloom');
  await page.getByRole('button', { name: '↶ Undo last move' }).click(); await expect(page.getByTestId('vine-route')).toHaveText('C Seed');
  await pointer('pointerdown', VINE_POSITIONS.C); await pointer('pointermove', VINE_POSITIONS.B);
  await page.getByRole('button', { name: 'Follow to A · Memory', exact: true }).click(); await saved(page); await pointer('pointerup', VINE_POSITIONS.B);
  await expect(page.getByTestId('vine-route')).toHaveText('C Seed → A Memory');
  await saved(page); await reloadRoad(page); await expect(page.getByTestId('vine-route')).toHaveText('C Seed → A Memory');
});

test('the unchanged cottage room reveals the Road and the stitch gesture still gates sign-in', async ({ page }, testInfo) => {
  test.setTimeout(60_000); const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await trackEffects(page);
  await page.clock.install(); await openRoad(page); await page.getByRole('button', { name: 'Close borrowing card', exact: true }).click(); await page.getByRole('button', { name: 'Look inside the cottage', exact: true }).click();
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  const originalArt = await page.getByTestId('world-background').getAttribute('src');
  await objectAction(page, 'Inspect the embroidered rug'); await expect(page.getByTestId('feedback')).toContainText('thread is old');
  await screenshot(page, testInfo.outputPath('cottage-first-interior.png'));
  await importJourney(page, solveCurrent(throughTrial('greenhouse'))); await pauseCue(page);
  await page.getByRole('button', { name: /Return to the cottage/ }).click(); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-flourish', 'smoke');
  await page.getByRole('button', { name: 'Skip chimney animation', exact: true }).click(); await page.clock.resume();
  await page.getByRole('button', { name: 'Step back from the door', exact: true }).click();
  await page.getByRole('button', { name: 'Look inside the cottage', exact: true }).click(); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  await expect(page.getByTestId('world-background')).toHaveAttribute('src', originalArt!);
  await objectAction(page, 'Inspect the embroidered rug'); await expect(page.getByTestId('feedback')).toContainText('rug has not changed');
  for (const prop of ROOM_PROPS) await objectAction(page, prop.label);
  await screenshot(page, testInfo.outputPath('cottage-return-interior.png'));
  await page.getByRole('button', { name: 'Step back from the rug', exact: true }).click();
  await page.getByRole('button', { name: 'Approach the door stitch', exact: true }).click();
  await page.getByRole('button', { name: 'Use the knocker · sign in', exact: true }).click(); await expect(page.getByTestId('feedback')).toContainText('Unbind');
  await drag(page, 'rune-stitch', [STITCH_POINTS[0], STITCH_POINTS[4]]); await expect(page.getByRole('button', { name: 'Unbind the door stitch', exact: true })).toBeVisible();
  const rune = page.getByTestId('rune-stitch'); await rune.scrollIntoViewIfNeeded();
  for (const [index, point] of STITCH_POINTS.entries()) {
    const client = await clientPoint(page, 'rune-stitch', point), init = { clientX: client.x, clientY: client.y, pointerId: 31, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 };
    await rune.dispatchEvent(index === 0 ? 'pointerdown' : 'pointermove', init);
    if (index === 1) await rune.dispatchEvent('lostpointercapture', init);
  }
  await rune.dispatchEvent('pointerup', { pointerId: 31, isPrimary: true, pointerType: 'touch', button: 0, buttons: 0 });
  await expect(page.getByRole('button', { name: 'Unbind the door stitch', exact: true })).toBeVisible();
  await drag(page, 'rune-stitch', STITCH_POINTS); await expect(page.getByTestId('feedback')).toContainText('stitch loosens');
  expect(await toneCount(page)).toBe(5);
  await saved(page); await reloadRoad(page); await expect(page.getByTestId('rune-stitch')).toHaveAttribute('aria-label', /have replaced/);
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-flourish', 'none'); await expect(page.getByRole('button', { name: 'Unbind the door stitch' })).toHaveCount(0);
  await page.getByRole('button', { name: /Notebook/ }).click(); await expect(page.getByText('The embroidered Road', { exact: true })).toBeVisible(); await expect(page.getByText('They were always here', { exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.getByRole('button', { name: 'Use the knocker · sign in', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Your shelf, at last.' })).toBeVisible(); expect(errors).toEqual([]);
});

test('recognition begins after first sign-in and Forget/Remember preserve the completed journey', async ({ page }, testInfo) => {
  test.setTimeout(60_000); await openRoad(page); await importJourney(page, move(home(), { type: 'UNBIND' }));
  await page.getByRole('button', { name: 'Visit the optional garden', exact: true }).click();
  await page.getByRole('button', { name: 'Cap 3: unlit', exact: true }).click(); await page.getByRole('button', { name: 'Cap 7: unlit', exact: true }).click();
  await page.getByRole('button', { name: 'Return to cottage', exact: true }).click(); await expect(page.getByRole('button', { name: 'Continue to library', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('borrower-nameplate')).toHaveAttribute('data-recognized', 'false');
  await page.getByRole('button', { name: 'Use the knocker · sign in', exact: true }).click(); await page.getByRole('button', { name: 'Sign out to cottage', exact: true }).click();
  await expect(page.getByTestId('borrower-nameplate')).toHaveAttribute('data-recognized', 'true');
  await expect(page.locator('.scene-art-caption')).toContainText('Welcome back, Violet Finch'); await page.getByRole('button', { name: 'Visit the optional garden', exact: true }).click();
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready'); await screenshot(page, testInfo.outputPath('garden-recognition.png'));
  await page.getByRole('button', { name: 'Forget me', exact: true }).click(); await page.getByRole('button', { name: 'Return to cottage', exact: true }).click();
  await expect(page.getByTestId('borrower-nameplate')).toHaveAttribute('data-recognized', 'false');
  await expect(page.getByRole('button', { name: 'Use the knocker · sign in', exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: 'Continue to library', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Visit the optional garden', exact: true }).click(); await page.getByRole('button', { name: 'Remember this journey again', exact: true }).click();
  await page.getByRole('button', { name: 'Return to cottage', exact: true }).click();
  await expect(page.getByTestId('borrower-nameplate')).toHaveAttribute('data-recognized', 'true');
  await page.getByRole('button', { name: 'Step back from the door', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to library', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your shelf, at last.' })).toBeVisible();
});

test('renewal saves before the receipt flourish and reload keeps the complete illustrated receipt', async ({ page }, testInfo) => {
  await trackEffects(page);
  await page.clock.install(); await openRoad(page); await importJourney(page, completedRun()); await pauseCue(page);
  await page.getByRole('button', { name: 'Renew this book', exact: true }).click(); await expect(page.getByTestId('loan-receipt')).toContainText('Renewal accepted · 28 days');
  await page.getByRole('button', { name: 'Skip receipt animation', exact: true }).click(); await page.clock.resume();
  expect(await toneCount(page)).toBe(3);
  await expect(page.locator('.receipt-road [data-stop]')).toHaveText(['CUP','RECORD','LAMP','CARDS','FLOWER']);
  await saved(page); await reloadRoad(page); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready'); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-flourish', 'none');
  await page.getByRole('button', { name: 'Read the renewal receipt', exact: true }).click(); await expect(page.getByRole('button', { name: 'Skip receipt animation', exact: true })).toHaveCount(0);
  expect(await toneCount(page)).toBe(0);
  await screenshot(page, testInfo.outputPath('library-account.png')); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('an unsaved finale remains exportable and Retry persists unbinding, sign-in and renewal together', async ({ page }) => {
  test.setTimeout(60_000); await openRoad(page); await importJourney(page, home());
  await page.evaluate(() => {
    const root = window as unknown as { originalFinalePut: typeof IDBObjectStore.prototype.put }; root.originalFinalePut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () { throw new DOMException('Test final save quota', 'QuotaExceededError'); };
  });
  await page.getByRole('button', { name: 'Unbind the door stitch', exact: true }).click(); await expect(page.getByTestId('save-status')).toContainText('Unsaved');
  await page.getByRole('button', { name: 'Use the knocker · sign in', exact: true }).click(); await page.getByRole('button', { name: 'Renew this book', exact: true }).click();
  const pendingDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export journey', exact: true }).click(); const stream = await (await pendingDownload).createReadStream();
  let exported = ''; for await (const chunk of stream!) exported += chunk.toString(); const run = JSON.parse(exported);
  expect(run.milestones).toEqual({ unbindingCompleted: true, hasSignedInOnce: true, bookRenewed: true }); expect(run.currentScene).toBe('account');
  await page.evaluate(() => { IDBObjectStore.prototype.put = (window as unknown as { originalFinalePut: typeof IDBObjectStore.prototype.put }).originalFinalePut; });
  await page.getByRole('button', { name: 'Retry save', exact: true }).click(); await saved(page); await reloadRoad(page);
  await expect(page.getByRole('button', { name: 'Read the renewal receipt', exact: true })).toBeVisible(); await expect(page.getByTestId('loan-receipt')).toContainText('Borrower: Violet Finch');
});
