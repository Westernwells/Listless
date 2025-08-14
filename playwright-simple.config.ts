import { defineConfig, devices } from '@playwright/test';

/**
 * Simple Playwright configuration for testing port fix
 * Bypasses complex test environment setup
 */
export default defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: false,
  
  /* Retry on CI only */
  retries: 0,
  
  /* Opt out of parallel tests */
  workers: 1,
  
  /* Reporter to use */
  reporter: [['list']],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Test timeout */
    actionTimeout: 10000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Skip global setup and teardown for simple test */
  // globalSetup: undefined,
  // globalTeardown: undefined,

  /* Assume dev server is already running */
  // webServer: undefined,
  
  /* Test timeout */
  timeout: 30 * 1000, // 30 seconds

  /* Expect timeout */
  expect: {
    timeout: 5 * 1000, // 5 seconds
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results-simple/',
});
