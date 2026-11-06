import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, devices, expect } from '@playwright/test';

// Supplement the regression screenshots with a flower detail and the initial working ring.
// Isolated browser contexts import fixtures through the same native journey UI as the tests.
const output = new URL('../docs/evidence/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [profile, options] of [['desktop', { viewport: { width: 1280, height: 800 } }], ['phone', devices['Pixel 7']]]) {
    const context = await browser.newContext(options);
    try {
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:5187/');
      await page.getByRole('button', { name: 'Enter the Road with sound', exact: true }).click();
      await expect(page.getByTestId('audio-controls')).toHaveAttribute('data-audio-state', 'playing');
      const fixtures = await page.evaluate(async () => {
        const { throughTrial, solveCurrent, move } = await import('/tests/helpers.ts');
        return {
          flower: solveCurrent(throughTrial('greenhouse')),
          ring: move(throughTrial('greenhouse'), { type: 'ENTER_SCENE', scene: 'garden' }),
        };
      });
      for (const [name, run, selector] of [['flower-detail', fixtures.flower, '.rio-bloom'], ['garden-working', fixtures.ring, '.remembering-ring']]) {
        await page.getByRole('button', { name: 'Settings', exact: true }).click();
        await page.getByLabel('Import a saved journey').setInputFiles({ name: 'i4-detail.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(run)) });
        await expect(page.getByTestId('feedback')).toContainText('Imported as a new slot');
        await expect(page.getByTestId('scene-stage')).toHaveAttribute('data-renderer', 'ready');
        const detail = page.locator(selector);
        await detail.evaluate(el => {
          const stage = el.closest('.instrument-stage');
          stage.scrollTop += el.getBoundingClientRect().top - stage.getBoundingClientRect().top - 90;
        });
        await expect(detail).toBeInViewport();
        if (name === 'garden-working') await expect(page.getByRole('button', { name: 'Cap 3: unlit', exact: true })).toBeEnabled();
        else await expect(page.getByRole('button', { name: 'Return to the cottage', exact: true })).toBeEnabled();
        const path = fileURLToPath(new URL(`i4-${name}-${profile}.png`, output));
        await page.screenshot({ path, fullPage: true });
        console.log(path);
      }
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
