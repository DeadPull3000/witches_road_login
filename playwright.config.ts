import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  // Each worker owns WebGL and Web Audio. Serial runs avoid host saturation on this Windows preview machine.
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  // A continuous filmstrip of the full-screen WebGL world competes with the two-tab checks.
  // Keep action/network/DOM traces, explicit visual evidence, and failure screenshots.
  use: { baseURL: 'http://127.0.0.1:5187', trace: { mode: 'retain-on-failure', screenshots: false, snapshots: true, sources: true }, screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' } },
  ],
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5187', reuseExistingServer: !process.env.CI },
});
