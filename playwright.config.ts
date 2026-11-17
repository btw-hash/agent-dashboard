import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3737',
    trace: 'on-first-retry',
    // OFFICE_CHROME points at a Chromium that is already on the machine, so nothing has to be downloaded
    launchOptions: process.env.OFFICE_CHROME ? { executablePath: process.env.OFFICE_CHROME } : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3737',
    reuseExistingServer: !process.env.CI,
  },
});
