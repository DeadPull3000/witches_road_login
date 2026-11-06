import { expect, test, type Locator, type Page } from '@playwright/test';
import { throughTrial } from '../helpers';
import { enterRoad, openRoad, travelViaMap } from './support';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function expectScroll(surface: Locator) {
  await expect(surface).toBeVisible();
  await expect(surface).toHaveCSS('border-image-source', /^url\(/);
  expect(await surface.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
}

test('welcome, borrowing and settings scrolls keep their controls reachable', async ({ page, isMobile }, info) => {
  test.setTimeout(60_000);
  await page.setViewportSize(isMobile ? { width: 360, height: 600 } : { width: 1280, height: 720 });
  await page.goto('./');
  const welcome = page.getByTestId('audio-entrance').locator('.entrance-card');
  await expectScroll(welcome);
  await expect(button(page, 'Enter the Road with sound')).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: info.outputPath('welcome-scroll.png'), scale: 'css' });
  await enterRoad(page, true);

  const borrower = page.getByRole('dialog', { name: 'Your borrowing card' });
  const alias = borrower.getByLabel('Borrowing alias');
  await expectScroll(borrower);
  await alias.fill('Violet on the Road');
  await page.screenshot({ path: info.outputPath('borrowing-scroll.png'), scale: 'css' });

  const settingsButton = button(page, 'Settings');
  await settingsButton.press('Enter');
  const settings = page.getByRole('dialog', { name: 'Make yourself comfortable' });
  await settings.getByRole('combobox', { name: 'Text size' }).selectOption('large');
  await page.setViewportSize({ width: 844, height: 390 });
  await expectScroll(settings);
  const importer = settings.getByLabel('Import a saved journey');
  await importer.scrollIntoViewIfNeeded();
  await expect(importer).toBeInViewport({ ratio: 1 });
  const close = settings.getByRole('button', { name: 'Close panel' });
  await expect(close).toBeInViewport({ ratio: 1 });
  const body = settings.locator('.parchment-body');
  expect(await body.evaluate(element => element.scrollTop > 0 && element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  const [header, content] = await Promise.all([settings.locator('header').boundingBox(), body.boundingBox()]);
  expect(content!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
  await page.screenshot({ path: info.outputPath('settings-scroll-short.png'), scale: 'css' });

  await page.emulateMedia({ forcedColors: 'active' });
  await expect(settings).toHaveCSS('border-image-source', 'none');
  await expect(settings.getByRole('heading')).toBeVisible();
  await close.press('Escape');
  await expect(settingsButton).toBeFocused();
  await expect(alias).toHaveValue('Violet on the Road');
  expect(await page.evaluate(() => [scrollX, scrollY])).toEqual([0, 0]);
});

test('trial directions, clue slips, feedback and character dialogue use readable scrolls', async ({ page }, info) => {
  test.setTimeout(60_000);
  await openRoad(page);
  await button(page, 'Settings').click();
  await page.getByLabel('Import a saved journey').setInputFiles({
    name: 'parchment-journey.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(throughTrial('cabin'))),
  });
  const bench = page.getByRole('dialog', { name: 'Agatha’s spirit table' });
  await expectScroll(bench.locator('.instrument-intro'));
  const slips = bench.getByRole('list', { name: 'Four spirit statements' }).getByRole('listitem');
  await expect(slips).toHaveCount(4);
  for (const slip of await slips.all()) await expectScroll(slip);
  await page.screenshot({ path: info.outputPath('spirit-scrolls.png'), scale: 'css' });

  await button(page, 'Ask the spirits to check').press('Enter');
  const feedback = page.getByTestId('feedback');
  await expect(feedback).toContainText('The spirits disagree');
  await expectScroll(feedback);
  await button(page, 'Step back from the table').press('Enter');
  await expectScroll(feedback);
  await expect(feedback).toBeInViewport();
  await page.screenshot({ path: info.outputPath('room-feedback-scroll.png'), scale: 'css' });

  await button(page, 'Room objects').click();
  const notes = page.getByRole('dialog', { name: 'Room objects' });
  await expectScroll(notes);
  await expect(notes.getByRole('heading', { name: 'Agree with the spirits.' })).toBeVisible();
  await button(page, 'Close room objects').press('Enter');

  await travelViaMap(page, /Alice’s studio/);
  await expectScroll(page.getByTestId('alice-comment'));
  await expectScroll(page.getByTestId('instrument-stage').locator('.instrument-intro'));
  await page.screenshot({ path: info.outputPath('studio-scrolls.png'), scale: 'css' });
});
