import { test, expect } from '@playwright/test';
import { ListlessTestHelpers, TestUser } from './test-utils';
import { EnhancedUserManager } from './enhanced-user-strategy';
import { createSuiteHelper } from './optimized-user-strategy';

/**
 * Optimized Authentication Tests for Listless
 * Uses dedicated users per test with batch creation for performance
 */

test.describe('Authentication Flow - TaskMaster Task 2', () => {
  let authUsers: TestUser[];
  let helpers: ListlessTestHelpers;

  // Setup: Create descriptive users for TaskMaster Task 2 validation
  test.beforeAll(async () => {
    authUsers = await EnhancedUserManager.createAuthTestUsers();
    console.log('✅ TaskMaster Task 2 (Authentication) users created');
    console.log(`   Created ${authUsers.length} users with debug retention policy`);
  });

  // Smart cleanup: Retain users for debugging based on retention policy
  test.afterAll(async () => {
    const cleanupResult = await EnhancedUserManager.performSmartCleanup();
    console.log('✅ TaskMaster Task 2 smart cleanup completed');
    console.log(`   Deleted: ${cleanupResult.deleted}, Retained: ${cleanupResult.retained}`);
  });

  test.beforeEach(async ({ page }) => {
    helpers = new ListlessTestHelpers(page);
    await page.goto('http://localhost:3000');
  });

  test('User Registration Flow', async ({ page }, testInfo) => {
    // Get dedicated user for user-registration scenario (index 0)
    const testUser = authUsers[0]; // tm2-authentication-system-user-registration-0-{timestamp}@listless-testing.local
    console.log(`🧪 Testing with: ${testUser.getDescription()}`);
    
    // Navigate to signup page
    await page.goto('/auth/signup');
    
    // Verify signup page loads
    await expect(page).toHaveTitle(/Sign up/i);
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible();
    
    // Fill registration form with dedicated user data
    await page.getByLabel('Full name').fill(testUser.name);
    await page.getByLabel('Email address').fill(testUser.email);
    await page.getByLabel('Password', { exact: true }).fill(testUser.password);
    await page.getByLabel('Confirm password').fill(testUser.password);
    
    // Verify password requirements are met
    await expect(page.locator('[data-testid="password-requirement-length"]')).toHaveClass(/text-green/);
    await expect(page.locator('[data-testid="password-requirement-uppercase"]')).toHaveClass(/text-green/);
    
    // Submit form
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Since user is pre-verified, should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(testUser.name)).toBeVisible();
  });

  test('User Login Flow', async ({ page }, testInfo) => {
    // Get dedicated user for this test (index 1)
    const testUser = authUsers[1]; // tm2-authentication-system-user-login-1-{timestamp}@listless-testing.local
    
    // Navigate to login page
    await page.goto('/auth/login');
    
    // Verify login page loads
    await expect(page).toHaveTitle(/Sign in/i);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    
    // Test password visibility toggle
    const passwordInput = page.getByLabel('Password');
    const toggleButton = page.getByRole('button', { name: /show password/i });
    
    await passwordInput.fill(testUser.password);
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Fill login form
    await page.getByLabel('Email address').fill(testUser.email);
    
    // Submit login form
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Verify successful login and redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByText(testUser.name)).toBeVisible();
  });

  test('Password Reset Flow', async ({ page }, testInfo) => {
    // Get dedicated user for this test (index 2)
    const testUser = authUsers[2]; // tm2-authentication-system-password-reset-2-{timestamp}@listless-testing.local
    
    // Navigate to password reset page
    await page.goto('/auth/reset-password');
    
    // Fill email field
    await page.getByLabel('Email address').fill(testUser.email);
    
    // Submit reset request
    await page.getByRole('button', { name: 'Send reset link' }).click();
    
    // Verify success message
    await expect(page.getByText(/reset link sent/i)).toBeVisible();
    
    // Test back to login navigation
    await page.getByRole('link', { name: /back to sign in/i }).click();
    await expect(page).toHaveURL('/auth/login');
  });

  test('Logout Functionality', async ({ page }, testInfo) => {
    // Get dedicated user for this test (index 3)
    const testUser = authUsers[3]; // tm2-authentication-system-logout-functionality-3-{timestamp}@listless-testing.local
    
    // First login
    await helpers.loginWithTestUser(testUser);
    
    // Verify dashboard loads
    await expect(page).toHaveURL('/dashboard');
    
    // Click user profile dropdown
    await page.getByRole('button', { name: testUser.name }).click();
    
    // Click logout
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    
    // Verify redirect to login page
    await expect(page).toHaveURL('/auth/login');
    
    // Verify cannot access dashboard without authentication
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('Session Persistence', async ({ page, context }, testInfo) => {
    // Get dedicated user for this test (index 4)
    const testUser = authUsers[4]; // tm2-authentication-system-session-persistence-4-{timestamp}@listless-testing.local
    
    // Login
    await helpers.loginWithTestUser(testUser);
    
    // Verify dashboard access
    await expect(page).toHaveURL('/dashboard');
    
    // Refresh page
    await page.reload();
    await expect(page).toHaveURL('/dashboard');
    
    // Open new tab and verify session persists
    const newPage = await context.newPage();
    await newPage.goto('http://localhost:3000/dashboard');
    await expect(newPage).toHaveURL('/dashboard');
    await expect(newPage.getByText(testUser.name)).toBeVisible();
  });

  test('Form Validation', async ({ page }, testInfo) => {
    // Get dedicated user for this test (index 5)
    const testUser = authUsers[5]; // tm2-authentication-system-form-validation-5-{timestamp}@listless-testing.local
    
    await page.goto('/auth/signup');
    
    // Test empty form submission
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText(/required/i).first()).toBeVisible();
    
    // Test invalid email format
    await page.getByLabel('Email address').fill('invalid-email');
    await page.getByLabel('Full name').click(); // Trigger validation
    await expect(page.getByText(/valid email/i)).toBeVisible();
    
    // Test password requirements
    await page.getByLabel('Password', { exact: true }).fill('weak');
    await expect(page.locator('[data-testid="password-requirement-length"]')).toHaveClass(/text-red/);
    
    // Test password mismatch
    await page.getByLabel('Password', { exact: true }).fill('StrongPassword123!');
    await page.getByLabel('Confirm password').fill('DifferentPassword123!');
    await expect(page.getByText(/passwords.*match/i)).toBeVisible();
    
    // Test successful validation
    await page.getByLabel('Full name').fill(testUser.name);
    await page.getByLabel('Email address').fill(testUser.email);
    await page.getByLabel('Password', { exact: true }).fill(testUser.password);
    await page.getByLabel('Confirm password').fill(testUser.password);
    
    // All requirements should be green
    await expect(page.locator('[data-testid="password-requirement-length"]')).toHaveClass(/text-green/);
    await expect(page.locator('[data-testid="password-requirement-uppercase"]')).toHaveClass(/text-green/);
    await expect(page.locator('[data-testid="password-requirement-lowercase"]')).toHaveClass(/text-green/);
    await expect(page.locator('[data-testid="password-requirement-number"]')).toHaveClass(/text-green/);
    await expect(page.locator('[data-testid="password-requirement-special"]')).toHaveClass(/text-green/);
  });

  // Optional: Verify user isolation for debugging
  test('Verify User Isolation', async ({ page }, testInfo) => {
    // This test verifies that each user has a clean slate
    for (let i = 0; i < authUsers.length; i++) {
      const testUser = authUsers[i];
      console.log(`🔍 Verifying isolation for: ${testUser.getDescription()}`);

      // Login as test user
      await helpers.loginWithTestUser(testUser);

      // Verify empty state (no data from other tests/users)
      await page.goto('/dashboard');

      // Should see empty inbox
      const taskCount = await page.locator('[data-testid="task-item"]').count();
      expect(taskCount).toBe(0);

      console.log(`✅ Data isolation verified for user: ${testUser.email}`);
    }
  });
});

/**
 * Performance Test: Measure user creation overhead
 */
test.describe('Performance Validation', () => {
  test('Measure User Creation Performance', async () => {
    const startTime = Date.now();
    
    // Create a small batch to measure performance
    const testSuite = createSuiteHelper('auth');
    await testSuite.setup();
    
    const creationTime = Date.now() - startTime;
    console.log(`⏱️ Created 6 users in ${creationTime}ms (${creationTime/6}ms per user)`);
    
    // Cleanup
    await testSuite.cleanup();
    
    const totalTime = Date.now() - startTime;
    console.log(`⏱️ Total time including cleanup: ${totalTime}ms`);
    
    // Performance assertion: should be under 5 seconds for 6 users
    expect(totalTime).toBeLessThan(5000);
  });
});
