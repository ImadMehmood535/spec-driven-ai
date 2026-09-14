import { defineConfig, devices } from '@playwright/test';

const UI_URL = process.env.E2E_UI_URL ?? 'http://localhost:3100';

/**
 * These specs run against BOTH projects: this UI and a running API with an
 * applied schema and seeds. The API is not started here — it belongs to the
 * other project, and starting it from this one would couple them.
 */
export default defineConfig({
  testDir: './e2e',
  // Serial: the specs share one database and one seeded administrator.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: UI_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run start',
    url: UI_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
