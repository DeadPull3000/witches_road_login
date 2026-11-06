import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { enterRoad } from '../e2e/support';

test('the WebKit build enforces sound entry and offers recovery when the browser has no audio context', async ({ browser, page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  const world = page.getByTestId('scene-stage');
  await expect(world).toHaveAttribute('data-renderer', /^(ready|fallback)$/, { timeout: 15_000 });
  const audioContext = await page.evaluate(() => typeof window.AudioContext);
  let outcome: string;
  if (audioContext === 'function') {
    await enterRoad(page);
    const alias = page.getByLabel('Borrowing alias', { exact: true });
    await alias.fill('WebKit Finch');
    await alias.press('Enter');
    await expect(page.getByTestId('feedback')).toContainText('Borrowing card stamped for WebKit Finch');
    outcome = 'sound entry and alias accepted';
  } else {
    await page.getByRole('button', { name: 'Enter the Road with sound', exact: true }).tap();
    const retry = page.getByRole('button', { name: 'Retry audio and enter', exact: true });
    await expect(retry).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Traveller’s kit' })).toHaveCount(0);
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export saved journey', exact: true }).tap();
    const download = await downloading;
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe('witches-road-save.json');
    await retry.tap();
    await expect(retry).toBeEnabled();
    outcome = 'audio unavailable, retry and save export verified';
  }
  expect(errors).toEqual([]);
  const result = { browser: browser.version(), audioContext, outcome, renderer: await world.getAttribute('data-renderer') };
  await writeFile(info.outputPath('webkit-result.json'), JSON.stringify(result, null, 2) + '\n');
  await page.screenshot({ path: info.outputPath('webkit.png'), scale: 'css' });
  console.log(JSON.stringify(result));
});
