import { approachRoom, openRoad, reloadRoad } from './support';
import { expect, test } from '@playwright/test';

test('illustrated cottage renders, shares accessible object controls and preserves final theft state', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await openRoad(page); const stage = page.getByTestId('scene-stage'); await expect(stage).toHaveAttribute('data-renderer', 'ready');
  await expect(stage.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Close borrowing card', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect the cottage door', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Stamp a fictional borrowing alias');
  await page.getByRole('button', { name: 'Room objects', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Scene action list' })).toBeVisible();
  await page.getByRole('button', { name: 'Inspect the cottage door', exact: true }).last().click();
  await page.getByLabel('Borrowing alias', { exact: true }).fill('Sprite Finch'); await page.getByRole('button', { name: /Stamp my card/ }).click();
  await page.getByRole('button', { name: 'Try the cottage door', exact: true }).click();
  await page.getByLabel('Attempted spell — fictional only').fill('vanishing-pearls'); await page.getByRole('button', { name: 'Show spell', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('little eye');
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 5000));
  await page.getByRole('button', { name: 'Try the door', exact: true }).click();
  const skip = page.getByRole('button', { name: 'Skip dot-theft animation' }); await expect(skip).toBeVisible(); await skip.focus(); await skip.press('Enter');
  await page.clock.resume();
  await expect(skip).not.toBeVisible(); await expect(page.getByTestId('save-status')).toContainText('saved in this browser');
  await reloadRoad(page); await expect(page.getByRole('button', { name: /Begin account recovery/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip dot-theft animation' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Inspect Agatha’s ribbon', exact: true }).click(); await expect(page.getByTestId('feedback')).toContainText('Agatha’s pocket');
  await expect(stage).toHaveAttribute('data-renderer', 'ready'); await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('cottage-scene.png'), fullPage: true });
  await expect(page.getByRole('dialog', { name: 'Your borrowing card', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open borrowing card', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /Begin account recovery/ }).click();
  await page.getByRole('button', { name: 'Approach the coven circle', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect leaf stamp' }).click(); await expect(page.getByTestId('feedback')).toContainText('leaf stamp is valid');
  expect(errors).toEqual([]);
});

test('garden caps share one coordinate definition and allow undo and optional completion', async ({ page }, testInfo) => {
  await openRoad(page); await page.getByRole('button', { name: 'Close borrowing card', exact: true }).click(); await page.getByRole('button', { name: 'Visit the Remember me garden' }).click();
  await approachRoom(page);
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  const cap = page.getByRole('button', { name: 'Cap 3: unlit', exact: true });
  await cap.focus(); await expect(page.locator('.cap-preview')).toContainText('Cap 3 changes caps 2, 3 and 4');
  const bounds = await cap.boundingBox(); expect(bounds!.width).toBeGreaterThanOrEqual(44); expect(bounds!.height).toBeGreaterThanOrEqual(44);
  await cap.click(); await expect(page.getByRole('button', { name: 'Cap 3: lit', exact: true })).toBeVisible();
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  await page.getByRole('button', { name: '↶ Undo last move' }).click(); await expect(page.getByRole('button', { name: 'Cap 3: unlit', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cap 3: unlit', exact: true }).click(); await page.getByRole('button', { name: 'Cap 7: unlit', exact: true }).click();
  await expect(page.getByText('The garden remembers.', { exact: false })).toBeVisible();
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: testInfo.outputPath('garden-scene.png'), fullPage: true });
  await page.getByRole('button', { name: 'Return to cottage', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open borrowing card', exact: true })).toBeVisible();
});

test('reduced motion reaches canvas presentation and removes theft playback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await openRoad(page);
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-motion', 'reduced');
  await page.getByLabel('Borrowing alias', { exact: true }).fill('Still Finch'); await page.getByRole('button', { name: /Stamp my card/ }).click();
  await page.getByRole('button', { name: 'Try the cottage door', exact: true }).click();
  await page.getByLabel('Attempted spell — fictional only').fill('still-spell'); await page.getByRole('button', { name: 'Try the door', exact: true }).click();
  await expect(page.getByRole('button', { name: /Begin account recovery/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip dot-theft animation' })).toHaveCount(0);
});

test('WebGL context loss switches to a usable still view', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await openRoad(page); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  await page.locator('canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'fallback');
  await expect(page.getByRole('dialog', { name: 'Your borrowing card', exact: true }).getByRole('button', { name: 'Retry illustrated scene', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close borrowing card', exact: true }).click();
  await page.getByRole('button', { name: 'Visit the Remember me garden' }).click();
  await approachRoom(page);
  await page.getByRole('button', { name: 'Cap 3: unlit', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cap 3: lit', exact: true })).toBeVisible();
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'fallback');
  await page.getByRole('button', { name: 'Retry illustrated scene', exact: true }).click();
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  await expect(page.getByRole('button', { name: 'Cap 3: lit', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('an unexpected GPU draw failure preserves the React controls and saved run', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const root = window as unknown as { failDraw: boolean }; root.failDraw = false;
    for (const Constructor of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const original = Constructor.prototype.drawElements;
      Constructor.prototype.drawElements = function (...args: Parameters<typeof original>) {
        if (root.failDraw) throw new Error('Test GPU draw failure');
        return Reflect.apply(original, this, args);
      };
    }
  });
  await openRoad(page); await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  await page.evaluate(() => { (window as unknown as { failDraw: boolean }).failDraw = true; });
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'fallback');
  await page.getByLabel('Borrowing alias', { exact: true }).fill('Resilient Finch'); await page.getByRole('button', { name: /Stamp my card/ }).click();
  await page.getByRole('button', { name: 'Try the cottage door', exact: true }).click();
  await expect(page.getByText('CARD STAMPED · Resilient Finch')).toBeVisible(); await expect(page.getByTestId('save-status')).toContainText('saved in this browser');
  await page.evaluate(() => { (window as unknown as { failDraw: boolean }).failDraw = false; });
  await page.getByRole('button', { name: 'Retry illustrated scene', exact: true }).click();
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
  await expect(page.getByText('CARD STAMPED · Resilient Finch')).toBeVisible();
  expect(errors).toEqual([]);
});
