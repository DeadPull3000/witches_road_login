import { expect, test, type Page } from '@playwright/test';
import type { RunState } from '../../src/game/state';
import { annexRun, completedRun, cottageInterior } from '../helpers';
import { openRoad, reloadRoad, travelViaMap } from './support';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const world = (page: Page) => page.getByTestId('scene-stage');
const tv = (page: Page) => page.getByRole('dialog', { name: 'The cottage television', exact: true });
const readers = (page: Page) => page.getByRole('dialog', { name: 'The four diagnostic readers', exact: true });
async function importRun(page: Page, run: RunState) {
  await button(page, 'Settings').click();
  await page.getByLabel('Import a saved journey').setInputFiles({
    name: 'phase-f-journey.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(run)),
  });
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
}
async function stepIntoCottage(page: Page) {
  await expect(world(page)).toHaveAttribute('data-scene', 'cottage');
  const workClose = page.getByRole('button', { name: /^(Close borrowing card|Step back from the door)$/ });
  if (await workClose.isVisible()) await workClose.click();
  if (await world(page).getAttribute('data-cottage-view') !== 'inside') await button(page, 'Look inside the cottage').click();
  await expect(world(page)).toHaveAttribute('data-cottage-view', 'inside');
}
async function inspectNotes(page: Page, label: string) {
  await button(page, 'Room objects').click();
  const notes = page.getByRole('dialog', { name: 'Room objects', exact: true });
  await notes.getByRole('button', { name: label, exact: true }).click();
}

test('Vision opens through diagnostics, preserves a wrong selection, and awards the optional flower after acceptance', async ({ page, isMobile }, info) => {
  test.setTimeout(95_000);
  await page.addInitScript(() => {
    const Audio = window.AudioContext;
    const state = window as Window & { phaseFContexts?: number };
    state.phaseFContexts = 0;
    window.AudioContext = class extends Audio {
      constructor(options?: AudioContextOptions) { super(options); state.phaseFContexts!++; }
    };
  });
  await openRoad(page);
  await stepIntoCottage(page);
  await button(page, 'Approach the television').click();
  await expect(tv(page).getByRole('button', { name: 'Diagnostic channel', exact: true })).toBeDisabled();
  await expect(tv(page).getByRole('button', { name: 'Enter Vision’s annex', exact: true })).toHaveCount(0);
  await importRun(page, cottageInterior(completedRun()));
  await stepIntoCottage(page);
  await expect(world(page)).toHaveAttribute('data-renderer', 'ready');
  await page.locator('canvas').evaluate(canvas => { canvas.dataset.phaseFInstance = 'original'; });
  await button(page, 'Approach the television').click();
  await button(page, 'Diagnostic channel').click();
  await button(page, 'Enter Vision’s annex').click();
  await expect(world(page)).toHaveAttribute('data-scene', 'vision');
  await expect(world(page)).toHaveAttribute('data-renderer', 'ready');
  await expect(page.getByTestId('world-renderer')).toHaveAttribute('data-active-asset', isMobile ? '/assets/vision/vision-annex-portrait.webp' : '/assets/vision/vision-annex-wide.webp');
  await expect(page.locator('canvas')).toHaveAttribute('data-phase-f-instance', 'original');
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
  expect(await page.evaluate(() => (window as Window & { phaseFContexts?: number }).phaseFContexts)).toBe(1);
  await button(page, 'Inspect the annex intercom').click({ trial: true });
  await page.mouse.move(2, 3);
  await page.screenshot({ path: info.outputPath('vision-annex.png'), scale: 'css' });

  await button(page, 'Approach the four readers').press('Enter');
  await expect(readers(page).getByRole('table', { name: /Installation inventory/ })).toBeVisible();
  await expect(readers(page).getByRole('region', { name: 'Original borrowing receipt' })).toContainText('original numbered memory module');
  await expect(readers(page).getByText('Read the completed transfer table')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('vision-records.png'), scale: 'css' });
  await button(page, 'South reader').press('Enter');
  await expect(button(page, 'South reader')).toBeFocused();
  await expect(button(page, 'South reader')).toHaveAttribute('aria-pressed', 'true');
  if (isMobile) {
    const portrait = page.viewportSize()!;
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(world(page)).toHaveAttribute('data-framing', 'landscape');
    await expect(button(page, 'South reader')).toHaveAttribute('aria-pressed', 'true');
    await button(page, 'Return to the cottage television').click({ trial: true });
    await page.setViewportSize(portrait);
    await expect(world(page)).toHaveAttribute('data-framing', 'portrait');
  }
  await button(page, 'File the borrowing receipt').click();
  await expect(page.getByTestId('feedback')).toContainText('cannot recognize that reader');
  await expect(readers(page).getByRole('region', { name: 'Verified original reader' })).toHaveCount(0);
  await reloadRoad(page);
  await expect(world(page)).toHaveAttribute('data-scene', 'vision');
  await button(page, 'Approach the four readers').click();
  await expect(button(page, 'South reader')).toHaveAttribute('aria-pressed', 'true');

  await button(page, 'Inspect the annex intercom').click();
  const intercom = page.getByRole('region', { name: 'Intercom transcript', exact: true });
  for (const voice of ['JARVIS', 'FRIDAY', 'EDITH', 'Ultron']) await expect(intercom.getByText(voice, { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('vision-intercom.png'), scale: 'css' });
  await button(page, 'Close the annex intercom').click();
  await button(page, 'Approach the four readers').click();
  await button(page, 'Return to the cottage television').click();
  await expect(tv(page)).toBeVisible();
  await button(page, 'Enter Vision’s annex').click();
  await button(page, 'Approach the four readers').click();
  await button(page, 'West reader').click();
  await button(page, 'File the borrowing receipt').click();
  const verified = readers(page).getByRole('region', { name: 'Verified original reader' });
  await expect(verified).toContainText('At least one of us is a robot');
  await verified.getByText('Read the completed transfer table').click();
  const table = verified.getByRole('table', { name: 'Verified reader inventory' });
  await expect(table.getByRole('row', { name: 'West Ebony M1' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('vision-solved.png'), scale: 'css' });
  await button(page, 'Return to the cottage television').click();
  await button(page, 'Close the cottage television').click();
  await button(page, 'Use the knocker · sign in').click();
  await expect(world(page)).toHaveAttribute('data-scene', 'account');
  const flower = page.getByRole('figure', { name: 'Vision’s mechanical flower' });
  await expect(flower).toBeVisible();
  await flower.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('vision-reward.png'), scale: 'css' });
  await reloadRoad(page);
  await expect(page.getByRole('figure', { name: 'Vision’s mechanical flower' })).toBeVisible();
});

test('the rabbit chain, seven visitors, case drawer, portrait and sigil feed the collection across slots', async ({ page }, info) => {
  test.setTimeout(105_000);
  await openRoad(page);
  await button(page, 'Notebook').click();
  const notebook = page.getByRole('dialog', { name: 'Your borrowing notebook', exact: true });
  await expect(notebook.getByRole('img', { name: '34 unrecorded discoveries' })).toBeVisible();
  await expect(notebook.getByText('The clerk’s glasses', { exact: true })).toHaveCount(0);
  await button(page, 'Close panel').click();
  await importRun(page, cottageInterior(completedRun()));
  await travelViaMap(page, /Remember me garden/);
  await button(page, 'Step back from the ring').click();
  await button(page, 'Look behind the mossy stone').click();
  await expect(page.getByRole('img', { name: 'Señor Scratchy', exact: true })).toBeVisible();
  await travelViaMap(page, /Jen’s kitchen/);
  await inspectNotes(page, 'Inspect the kitchen cupboard');
  await expect(page.getByRole('img', { name: 'A muddy rabbit paw print' })).toBeVisible();
  await travelViaMap(page, /Alice’s studio/);
  await button(page, 'Close the speaker doors').click();
  await button(page, 'Room objects').click();
  await expect(page.getByRole('dialog', { name: 'Room objects', exact: true }).getByRole('button', { name: 'Look behind the studio speaker' })).toHaveCount(0);
  await button(page, 'Return to the recording desk').click();
  await button(page, 'Open the speaker doors').click();
  await inspectNotes(page, 'Look behind the studio speaker');
  await expect(page.getByRole('img', { name: 'Señor Scratchy', exact: true })).toBeVisible();
  await travelViaMap(page, /Agatha’s cabin/);
  await inspectNotes(page, 'Inspect the cabin window');
  const window = page.getByRole('dialog', { name: 'The cabin window', exact: true });
  await expect(window.locator('[data-visitor]')).toHaveCount(7);
  await page.screenshot({ path: info.outputPath('cabin-visitors.png'), scale: 'css' });
  await travelViaMap(page, 'The cottage');
  await stepIntoCottage(page);
  await inspectNotes(page, 'Forgot username');
  await expect(page.getByRole('dialog', { name: 'Agnes’s case drawer', exact: true }).getByText('Violet Finch', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('agnes-case.png'), scale: 'css' });
  await inspectNotes(page, 'Inspect the covered borrowing card');
  await expect(page.getByRole('dialog', { name: 'The covered borrowing card', exact: true }).getByText('Violet Finch', { exact: true })).toBeVisible();
  await inspectNotes(page, 'Inspect the framed portrait');
  await expect(page.getByRole('img', { name: 'Agatha in the original portrait' })).toBeVisible();
  await button(page, 'Close the framed portrait').click();
  await inspectNotes(page, 'Inspect the framed portrait');
  await expect(page.getByRole('img', { name: 'A new clerk in the portrait' })).toBeVisible();
  await button(page, 'Journeys').click();
  await button(page, 'New story journey').click();
  await stepIntoCottage(page);
  await inspectNotes(page, 'Inspect the rabbit portrait');
  await expect(page.getByRole('img', { name: 'Señor Scratchy in round spectacles' })).toBeVisible();
  await button(page, 'Notebook').click();
  for (const id of ['rabbit.first', 'rabbit.second', 'rabbit.third', 'rabbit.clerkGlasses', 'agnes.caseDrawer', 'teen.sigil', 'salem.windowVisitors', 'wanda.recast']) {
    await expect(notebook.locator(`[data-discovery-id="${id}"]`)).toHaveCount(1);
  }
  await notebook.locator('[data-discovery-id="rabbit.clerkGlasses"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('discovery-notebook.png'), scale: 'css' });
});

test('the TV caption dial respects large text, and expiry and the final stamp preserve renewal', async ({ page }, info) => {
  test.setTimeout(95_000);
  await openRoad(page);
  await importRun(page, completedRun());
  await expect(page.getByRole('figure', { name: 'Vision’s mechanical flower' })).toHaveCount(0);
  await button(page, 'Inspect the return-date stamp').click();
  await expect(page.getByRole('dialog', { name: 'The return-date stamp' }).getByText('1693', { exact: true })).toBeVisible();
  await button(page, 'Close the return-date stamp').click();
  await button(page, 'Inspect your borrowing ledger').click();
  await button(page, 'Renew this book').click();
  await expect(page.getByTestId('feedback')).toContainText('Renewed for another 28 fictional days');
  await button(page, 'Expire session').click();
  await expect(page.getByRole('img', { name: 'Rio’s red session flower' })).toBeVisible();
  await reloadRoad(page);
  await expect(page.getByRole('img', { name: 'Rio’s red session flower' })).toBeVisible();
  await button(page, 'Resume library session').click();
  await expect(world(page)).toHaveAttribute('data-scene', 'account');
  await expect(button(page, 'Read the renewal receipt')).toBeVisible();
  await button(page, 'Sign out to cottage').click();
  await stepIntoCottage(page);
  await button(page, 'Approach the television').click();
  await button(page, 'Westview local').click();
  await button(page, 'Sponsor channel').click();
  await expect(world(page)).toHaveAttribute('data-flourish', 'standBy');
  await button(page, 'Skip test card').press('Enter');
  await expect(world(page)).toHaveAttribute('data-flourish', 'none');
  await expect(tv(page).getByText('Two-factor toast', { exact: true })).toBeVisible();
  const caption = tv(page).locator('.tv-caption');
  const font = () => caption.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  const initial = await font();
  await button(page, 'Turn the TV volume dial').click();
  await expect.poll(font).toBeGreaterThan(initial);
  await button(page, 'Settings').click();
  await expect(page.getByRole('slider', { name: 'Master volume' })).toHaveValue('0.65');
  await page.getByRole('combobox', { name: 'Text size', exact: true }).selectOption('large');
  await button(page, 'Close panel').click();
  const large = await font();
  await button(page, 'Turn the TV volume dial').click();
  await expect(tv(page).locator('.cottage-tv')).toHaveAttribute('data-large-captions', 'false');
  expect(await font()).toBe(large);
  await button(page, 'Sponsor channel').click();
  await expect(tv(page).getByText('Two-factor toast', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('sponsor-channel.png'), scale: 'css' });
  await button(page, 'Turn off the television').click();
  await expect(tv(page).getByText('RETURN BROADCAST COMPLETE')).toBeVisible();
  await page.screenshot({ path: info.outputPath('final-tv-stamp.png'), scale: 'css' });
  await reloadRoad(page);
  await stepIntoCottage(page);
  await button(page, 'Approach the television').click();
  await expect(tv(page).getByText('RETURN BROADCAST COMPLETE')).toBeVisible();
  await expect(world(page)).toHaveAttribute('data-flourish', 'none');
});

test('Vision’s native console works with its artwork unavailable and reduced motion', async ({ page }, info) => {
  test.setTimeout(65_000);
  await page.route('**/assets/vision/**', route => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openRoad(page);
  await importRun(page, annexRun());
  await expect(world(page)).toHaveAttribute('data-renderer', 'fallback');
  await button(page, 'Approach the four readers').click();
  await button(page, 'Room objects').click();
  const notes = page.getByRole('dialog', { name: 'Room objects', exact: true });
  await expect(notes.getByRole('table', { name: /Installation inventory/ })).toBeVisible();
  await notes.getByRole('button', { name: 'Return to the readers', exact: true }).click();
  await button(page, 'West reader').press('Enter');
  await button(page, 'File the borrowing receipt').press('Enter');
  await expect(readers(page).getByRole('region', { name: 'Verified original reader' })).toBeVisible();
  await expect(world(page)).toHaveAttribute('data-flourish', 'none');
  await page.screenshot({ path: info.outputPath('vision-fallback.png'), scale: 'css' });
  await button(page, 'Return to the cottage television').click();
  await expect(tv(page)).toBeVisible();
});
