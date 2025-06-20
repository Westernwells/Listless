import { test, expect } from '@playwright/test';
import { TestUser, ListlessTestHelpers } from './test-utils';
import { TestIsolation, IsolatedTestData } from './test-setup';

// Test will use automatically generated test users

test.describe('Authentication Flow', () => {
  let testUser: TestUser;
  let helpers: ListlessTestHelpers;

  test.beforeEach(async ({ page }) => {
    // Create isolated test environment
    const testEnv = await TestIsolation.createIsolatedTest();
    testUser = testEnv.user;
    helpers = new ListlessTestHelpers(page);

    // Navigate to the application
    await page.goto('/');
  });

  test('User Registration Flow', async ({ page }) => {
    // Generate a new user for this specific test
    const newUser = TestUser.generate();

    // Navigate to signup page
    await page.goto('/auth/signup');

    // Verify signup page loads
    await expect(page).toHaveTitle(/Sign up/i);
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible();

    // Fill registration form
    await page.getByLabel('Full name').fill(newUser.name);
    await page.getByLabel('Email address').fill(newUser.email);
    await page.getByLabel('Password', { exact: true }).fill(newUser.password);
    await page.getByLabel('Confirm password').fill(newUser.password);
    
    // Verify password requirements are met (green checkmarks)
    await expect(page.locator('[data-testid="password-requirement-length"]')).toHaveClass(/text-green/);
    await expect(page.locator('[data-testid="password-requirement-uppercase"]')).toHaveClass(/text-green/);
    
    // Submit form
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Verify redirect to email verification page
    await expect(page).toHaveURL(/\/auth\/verify-email/);
    await expect(page.getByText(/verification email sent/i)).toBeVisible();
  });

  test('User Login Flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');
    
    // Verify login page loads
    await expect(page).toHaveTitle(/Sign in/i);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    
    // Fill login form
    await page.getByLabel('Email address').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);
    
    // Test password visibility toggle
    const passwordInput = page.getByLabel('Password');
    const toggleButton = page.getByRole('button', { name: /show password/i });
    
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Submit login form
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Verify successful login and redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByText(testUser.name)).toBeVisible();
  });

  test('Password Reset Flow', async ({ page }) => {
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

  test('Logout Functionality', async ({ page }) => {
    // First login (assuming user exists)
    await page.goto('/auth/login');
    await page.getByLabel('Email address').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
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

  test('Session Persistence', async ({ page, context }) => {
    // Login
    await page.goto('/auth/login');
    await page.getByLabel('Email address').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Verify dashboard access
    await expect(page).toHaveURL('/dashboard');
    
    // Refresh page
    await page.reload();
    await expect(page).toHaveURL('/dashboard');
    
    // Open new tab and verify session persists
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');
    await expect(newPage).toHaveURL('/dashboard');
    await expect(newPage.getByText(testUser.name)).toBeVisible();
  });

  test('Form Validation', async ({ page }) => {
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
  });
});
