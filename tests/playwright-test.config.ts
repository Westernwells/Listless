import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: '.env.test' });

/**
 * Playwright configuration for Listless application testing
 * WITH PROPER TEST ENVIRONMENT ISOLATION
 * @see https://playwright.dev/docs/test-configuration
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
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
    ['./test-environment-reporter.ts'] // Custom reporter for environment verification
  ],
  
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 10000,
    
    /* Global timeout for navigation */
    navigationTimeout: 30000,
    
    /* Pass test environment indicator to browser */
    extraHTTPHeaders: {
      'X-Test-Environment': 'true',
      'X-Test-Database': process.env.NEXT_PUBLIC_SUPABASE_URL || 'unknown'
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.ts/,
      dependencies: ['chromium', 'firefox', 'webkit'],
    }
  ],

  /* Global setup and teardown with environment verification */
  globalSetup: require.resolve('./test-environment-setup.ts'),
  globalTeardown: require.resolve('./test-environment-teardown.ts'),

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
    env: {
      // Force test environment variables
      NODE_ENV: 'test',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000'
    }
  },

  /* Test timeout */
  timeout: 30 * 1000, // 30 seconds

  /* Expect timeout */
  expect: {
    timeout: 5 * 1000, // 5 seconds
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/',
});

/**
 * Environment validation function
 */
export function validateTestEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const productionUrl = 'https://kdaiyodzdnphkiufagdu.supabase.co';
  const testUrl = 'https://rxdwcvzxgzwuapdxxbnt.supabase.co';

  const isProduction = supabaseUrl === productionUrl;
  const isLocal = supabaseUrl?.includes('localhost');
  const isTest = supabaseUrl === testUrl;

  if (isProduction) {
    throw new Error(`
🚨 CRITICAL SAFETY ERROR: Tests are configured to use PRODUCTION database!

Current Supabase URL: ${supabaseUrl}

This would create test users and data in your production database!

REQUIRED ACTIONS:
1. Create a separate test Supabase project, OR
2. Set up local Supabase instance
3. Update .env.test with test environment credentials
4. Ensure NEXT_PUBLIC_SUPABASE_URL points to test environment

DO NOT PROCEED until test environment is properly isolated!
    `);
  }

  if (!isTest && !isLocal) {
    throw new Error(`
🚨 CRITICAL: Unknown test environment configuration!

Current Supabase URL: ${supabaseUrl}
Expected test URL: ${testUrl}
Expected local URL: localhost

Please verify test environment configuration.
    `);
  }

  console.log(`✅ Test environment validated: ${isLocal ? 'Local' : 'Test'} Supabase instance`);
  console.log(`   Database URL: ${supabaseUrl}`);

  return {
    isLocal,
    isTest,
    isProduction: false,
    supabaseUrl
  };
}
