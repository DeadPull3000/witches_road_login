import { expect, test, type Page } from '@playwright/test';
import type { RunState } from '../../src/game/state';
import { STITCH_POINTS } from '../../src/ui/RuneStitch';
import { completedRun, move, solveCurrent, throughTrial } from '../helpers';
import { openRoad, reloadRoad, returnToRoom } from './support';

function cottageReturn(): RunState {
  return move(solveCurrent(throughTrial('greenhouse')), { type: 'ENTER_SCENE', scene: 'cottage' });
}

async function importJourney(page: Page, run: RunState) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Import a saved journey').setInputFiles({
    name: 'finale.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(run)),
  });
  await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
}

test('the rug keeps its place and embroidery across both visits and returns focus to the room', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await openRoad(page);
  await page.getByRole('button', { name: 'Close borrowing card', exact: true }).click();
  await page.getByRole('button', { name: 'Look inside the cottage', exact: true }).click();
  const world = page.getByTestId('scene-stage');
  await expect(world).toHaveAttribute('data-cottage-view', 'inside');
  await expect(world).toHaveAttribute('data-renderer', 'ready');
  const art = await page.getByTestId('world-background').getAttribute('src');
  const approach = page.getByRole('button', { name: 'Inspect the embroidered rug', exact: true });
  const position = await approach.boundingBox();
  expect(position).not.toBeNull();
  await page.screenshot({ path: testInfo.outputPath('cottage-idle.png') });
  await approach.press('Enter');
  const rug = page.getByRole('dialog', { name: 'The embroidered rug', exact: true });
  await expect(rug).toBeFocused();
  await expect(rug).toContainText('Five old motifs');
  const embroidery = await rug.locator('svg').first().evaluate(svg => svg.outerHTML);
  await page.screenshot({ path: testInfo.outputPath('rug-first.png') });

  await page.getByRole('button', { name: 'Room objects', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Return to the rug', exact: true })).toBeVisible();
  await returnToRoom(page);
  await expect(rug).toBeFocused();
  await rug.press('Escape');
  await expect(page.getByRole('button', { name: 'Room objects', exact: true })).toBeFocused();

  await importJourney(page, move(cottageReturn(), { type: 'SET_COTTAGE_VIEW', view: 'inside' }));
  await page.getByRole('button', { name: 'Step back from the door', exact: true }).click();
  await expect(page.getByTestId('world-background')).toHaveAttribute('src', art!);
  expect(await approach.boundingBox()).toEqual(position);
  await approach.press('Enter');
  await expect(rug).toContainText('Five familiar turns');
  await expect(page.getByTestId('feedback')).toContainText('The rug has not changed');
  expect(await rug.locator('svg').first().evaluate(svg => svg.outerHTML)).toBe(embroidery);
  await page.screenshot({ path: testInfo.outputPath('rug-return.png') });
  await rug.press('Escape');
  await expect(approach).toBeFocused();
  await page.getByRole('button', { name: 'Notebook', exact: true }).click();
  await expect(page.getByText('The embroidered Road', { exact: true })).toBeVisible();
});

test('resize, menus and closing discard a stitch draft, and release can finish the last stitch', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await openRoad(page);
  await importJourney(page, cottageReturn());
  const rune = page.getByTestId('rune-stitch');
  const unbind = page.getByRole('button', { name: 'Unbind the door stitch', exact: true });

  async function draft() {
    await rune.scrollIntoViewIfNeeded();
    await rune.evaluate((element, stitches) => {
      const svg = element as unknown as SVGSVGElement;
      const transform = svg.getScreenCTM()!;
      stitches.slice(0, 4).forEach(([x, y], index) => {
        const client = new DOMPoint(x, y).matrixTransform(transform);
        svg.dispatchEvent(new PointerEvent(index ? 'pointermove' : 'pointerdown', {
          bubbles: true, pointerId: 37, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1,
          clientX: client.x, clientY: client.y,
        }));
      });
    }, STITCH_POINTS);
    await expect(rune).toHaveAttribute('data-draft-stitches', '4');
  }

  async function release() {
    await rune.evaluate((element, [x, y]) => {
      const svg = element as unknown as SVGSVGElement;
      const client = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM()!);
      svg.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true, pointerId: 37, pointerType: 'touch', isPrimary: true, button: 0, buttons: 0,
        clientX: client.x, clientY: client.y,
      }));
    }, STITCH_POINTS[4]);
  }

  await rune.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('door-bound.png') });
  await draft();
  const size = page.viewportSize()!;
  await page.setViewportSize({ width: size.width - 12, height: size.height - 12 });
  await expect(rune).toHaveAttribute('data-draft-stitches', '0');
  await release();
  await expect(unbind).toBeVisible();

  await draft();
  await page.getByRole('button', { name: 'Notebook', exact: true }).click();
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await release();
  await expect(unbind).toBeVisible();

  await draft();
  await rune.evaluate(svg => svg.setAttribute('style', 'transform: translateX(4px)'));
  await release();
  await expect(unbind).toBeVisible();
  await rune.evaluate(svg => svg.removeAttribute('style'));

  await draft();
  await page.getByRole('button', { name: 'Step back from the door', exact: true }).click();
  const approach = page.getByRole('button', { name: 'Approach the door stitch', exact: true });
  await expect(approach).toBeFocused();
  await approach.click();
  await release();
  await expect(unbind).toBeVisible();

  await draft();
  await release();
  await expect(rune).toHaveAttribute('aria-label', /have replaced/);
  await expect(unbind).toHaveCount(0);
  await expect(page.getByTestId('save-status')).toContainText('saved in this browser');
  await page.screenshot({ path: testInfo.outputPath('door-ready.png') });
  await reloadRoad(page);
  await expect(rune).toHaveAttribute('aria-label', /have replaced/);
  await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-flourish', 'none');
});

type HeldWrites = Window & { holdFinaleSave: boolean; finaleCompletions: (() => void)[] };

test('accepted saves unlock the knocker and receipt, and the receipt can be read after reopening the desk', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const root = window as unknown as HeldWrites;
    root.holdFinaleSave = false;
    root.finaleCompletions = [];
    const prototype = IDBTransaction.prototype as EventTarget;
    const original = prototype.addEventListener;
    prototype.addEventListener = function (type, listener, options) {
      if (type !== 'complete' || !listener) return original.call(this, type, listener, options);
      const transaction = this as IDBTransaction;
      const deliver: EventListener = event => {
        const invoke = () => {
          if (typeof listener === 'function') listener.call(transaction, event);
          else listener.handleEvent(event);
        };
        if (root.holdFinaleSave && transaction.mode === 'readwrite') root.finaleCompletions.push(invoke);
        else invoke();
      };
      return original.call(this, type, deliver, options);
    };
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openRoad(page);
  await importJourney(page, cottageReturn());
  const rune = page.getByTestId('rune-stitch');
  const save = page.getByTestId('save-status');
  const world = page.getByTestId('scene-stage');

  async function hold() {
    await page.evaluate(() => { (window as unknown as HeldWrites).holdFinaleSave = true; });
  }
  async function resume() {
    await page.evaluate(() => {
      const root = window as unknown as HeldWrites;
      root.holdFinaleSave = false;
      root.finaleCompletions.splice(0).forEach(invoke => invoke());
    });
  }

  await hold();
  try {
    await page.getByRole('button', { name: 'Unbind the door stitch', exact: true }).press('Enter');
    await expect(save).toContainText('Saving your place');
    await expect(rune).toHaveAttribute('aria-label', /Five marked stitches/);
    await expect(page.locator('.cottage-door-planks')).toHaveAttribute('data-ready', 'false');
  } finally { await resume(); }
  await expect(rune).toHaveAttribute('aria-label', /have replaced/);
  await page.getByRole('button', { name: 'Use the knocker · sign in', exact: true }).press('Enter');
  await expect(world).toHaveAttribute('data-scene', 'account');
  await expect(world).toHaveAttribute('data-renderer', 'ready');
  const desk = page.getByRole('dialog', { name: 'The borrowing desk', exact: true });
  const stamp = desk.getByRole('button', { name: 'Renew this book', exact: true });
  await stamp.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('desk-working.png') });
  await hold();
  try {
    await stamp.press('Enter');
    await expect(save).toContainText('Saving your place');
    await expect(stamp).toBeDisabled();
    await expect(page.getByTestId('loan-receipt')).toHaveCount(0);
    await expect(desk.getByText('Ready to renew', { exact: true })).toBeVisible();
    await desk.getByRole('button', { name: 'Step back from the borrowing desk', exact: true }).click();
    await expect(desk).toHaveCount(0);
  } finally { await resume(); }
  await expect(save).toContainText('saved in this browser');
  await page.screenshot({ path: testInfo.outputPath('library-idle.png') });
  const ledger = page.getByRole('button', { name: 'Inspect your borrowing ledger', exact: true });
  await ledger.press('Enter');
  const read = desk.getByRole('button', { name: 'Read the renewal receipt', exact: true });
  await read.press('Enter');
  const paper = desk.getByRole('region', { name: 'Renewal receipt', exact: true });
  await expect(paper).toBeFocused();
  await expect(paper).toContainText('Renewal accepted · 28 days');
  await expect(paper.getByText('WESTVIEW PUBLIC LIBRARY', { exact: true })).toBeInViewport();
  await expect(world).toHaveAttribute('data-flourish', 'none');
  await page.screenshot({ path: testInfo.outputPath('receipt.png') });
  await paper.press('Escape');
  await expect(ledger).toBeFocused();
  await page.getByRole('button', { name: 'Take the door: Sign out to the cottage', exact: true }).press('Enter');
  await expect(world).toHaveAttribute('data-scene', 'cottage');
  await page.getByRole('button', { name: 'Use the knocker · sign in', exact: true }).press('Enter');
  await expect(desk.getByRole('button', { name: 'Read the renewal receipt', exact: true })).toBeVisible();
});

test('cropped prop markers and the large-text desk work with missing textures', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.route('**/assets/**', route => route.abort());
  await openRoad(page);
  const run = move(move(completedRun(), { type: 'SIGN_OUT' }), { type: 'SET_COTTAGE_VIEW', view: 'inside' });
  await importJourney(page, run);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('combobox', { name: 'Text size', exact: true }).selectOption('large');
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  const world = page.getByTestId('scene-stage');
  await expect(world).toHaveAttribute('data-renderer', 'fallback');
  await expect(world.locator('.cottage-details')).toBeVisible();
  const sizes = testInfo.project.name === 'chromium' ? [[1280, 800], [844, 390]] : [[390, 844], [360, 640]];

  async function expectReachable(button: ReturnType<Page['getByRole']>) {
    await expect(button).toBeInViewport({ ratio: 1 });
    const box = (await button.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.getByRole('button', { name: 'Step back from the door', exact: true }).click();
    const rug = page.getByRole('button', { name: 'Inspect the embroidered rug', exact: true });
    const knocker = page.getByRole('button', { name: 'Use the knocker · sign in', exact: true });
    await page.getByRole('button', { name: 'Retry illustrated scene', exact: true }).click({ trial: true, timeout: 8000 });
    await expectReachable(rug);
    await expectReachable(knocker);
    await rug.click();
    await expect(page.getByRole('dialog', { name: 'The embroidered rug', exact: true })).toContainText('Five familiar turns');
    await page.getByRole('button', { name: 'Step back from the rug', exact: true }).click();
    await expect(rug).toBeFocused();
    await knocker.click({ timeout: 8000 });
    await expect(page.getByTestId('finale-stage')).toHaveAttribute('data-kind', 'desk');
    if (await page.getByRole('button', { name: 'Renew this book', exact: true }).count()) {
      await page.getByRole('button', { name: 'Renew this book', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Read the renewal receipt', exact: true }).press('Enter');
    await expect(page.getByRole('region', { name: 'Renewal receipt', exact: true })).toBeFocused();
    expect(await page.getByTestId('finale-stage').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => ({ x: scrollX, y: scrollY, overflow: document.documentElement.scrollWidth > innerWidth }))).toEqual({ x: 0, y: 0, overflow: false });
    await page.getByRole('button', { name: 'Step back from the borrowing desk', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Inspect your borrowing ledger', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Take the door: Sign out to the cottage', exact: true }).click({ timeout: 8000 });
    // Sign-out returns to the clearing. Reopen the inside view for the next profile.
    if (width === sizes[0][0]) {
      await page.getByRole('button', { name: 'Step back from the door', exact: true }).click();
      await page.getByRole('button', { name: 'Look inside the cottage', exact: true }).click();
      await page.getByRole('button', { name: 'Room objects', exact: true }).click();
      await page.getByRole('button', { name: 'Inspect the cottage door', exact: true }).click();
    }
  }
  await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
});
