import { defineConfig, devices } from '@playwright/test';

const url = 'http://127.0.0.1:5188/release/witches-road/';
const journey = '**/journey.spec.ts';
const production = '**/production.spec.ts';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results/release',
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { baseURL: url, actionTimeout: 15_000, screenshot: 'only-on-failure', trace: { mode: 'retain-on-failure', screenshots: false } },
  projects: [
    {
      name: 'release-chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
      testMatch: [journey, production],
      grep: /packaged game|complete story route|illustration textures are missing|stale browser tab|quota failure|corrupt newest snapshot/,
    },
    {
      name: 'release-firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: journey,
      grep: /every required action is keyboard operable/,
    },
    {
      name: 'release-pixel',
      use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' },
      testMatch: production,
    },
    {
      name: 'release-webkit',
      use: { ...devices['iPhone 13'], browserName: 'webkit' },
      testMatch: '**/webkit.spec.ts',
    },
  ],
  webServer: { command: 'npm run preview -- --port 5188 --strictPort --base /release/witches-road/', url },
});
