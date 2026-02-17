import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/tests',

  // Run tests in parallel (limited to avoid rate limiting)
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // Limit workers to avoid rate limiting on login
  workers: 1,

  // Reporter
  reporter: [['html', { open: 'never' }], ['list']],

  // Global setup
  globalSetup: './e2e/global-setup.ts',

  use: {
    // Base URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Projects
  projects: [
    // Tests for unauthenticated users (includes login tests)
    {
      name: 'unauthenticated',
      testMatch: ['unregistered-user.spec.ts', 'user-registration.spec.ts', 'race-results.spec.ts', 'authentication.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    // Tests that require authentication - use saved auth state
    {
      name: 'authenticated',
      testMatch: ['registered-user.spec.ts', 'my-registrations.spec.ts', 'race-registration.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: './e2e/.auth/user.json',
      },
    },
  ],

  // Output directory for test artifacts
  outputDir: 'test-results/',

  // Expect timeout
  expect: {
    timeout: 10000,
  },
})
