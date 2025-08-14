import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Verify we're using test environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const productionUrl = 'https://kdaiyodzdnphkiufagdu.supabase.co';
const testUrl = 'https://rxdwcvzxgzwuapdxxbnt.supabase.co';

// Check if we're using production database (CRITICAL SAFETY CHECK)
if (supabaseUrl === productionUrl) {
  console.error('🚨 CRITICAL: Playwright is configured to use PRODUCTION database!');
  console.error(`Current Supabase URL: ${supabaseUrl}`);
  console.error('This would create test users and data in your production database!');
  console.error('Please ensure .env.test is loaded with test environment credentials.');
  process.exit(1);
}

// Verify we're using the correct test environment
if (supabaseUrl !== testUrl && !supabaseUrl?.includes('localhost')) {
  console.error('🚨 CRITICAL: Playwright is not configured for test environment!');
  console.error(`Current Supabase URL: ${supabaseUrl}`);
  console.error(`Expected test URL: ${testUrl} or localhost`);
  console.error('Please update .env.test with proper test environment credentials.');
  process.exit(1);
}

console.log('✅ Test environment verified:', supabaseUrl);

/**
 * Playwright Configuration for Listless TaskMaster AI Testing
 * 
 * This configuration ensures complete isolation from production data
 * by using a separate test Supabase project.
 */
export default defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Test timeout */
    actionTimeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000'),
    
    /* Pass test environment to browser context */
    extraHTTPHeaders: {
      'X-Test-Environment': 'true',
      'X-Test-Project': process.env.TEST_PROJECT_NAME || 'listless-testing'
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/test-environment-setup.ts'),
  globalTeardown: require.resolve('./tests/test-environment-teardown.ts'),

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Force test environment for the web server
      ...process.env,
      NODE_ENV: 'test'
    }
  },
  
  /* Test output directories */
  outputDir: 'test-results/',
  
  /* Global test timeout */
  timeout: 60 * 1000,
  
  /* Expect timeout */
  expect: {
    timeout: 10 * 1000
  }
});
