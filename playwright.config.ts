import { defineConfig, devices } from '@playwright/test'

/**
 * Squad Planner E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1,
  reporter: 'html',
  timeout: 60000,

  use: {
    baseURL: process.env.BASE_URL || 'https://squadplanner.fr',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer needed - tests run against production deployment

  // Cleanup orphan E2E test data after all tests
  globalTeardown: './e2e/global-teardown.ts',
})
