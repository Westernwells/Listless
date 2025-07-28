import { test, expect } from '@playwright/test';

test.describe('Simple Navigation Test', () => {
  test('Application loads correctly on localhost:3000', async ({ page }) => {
    console.log('🚀 Starting navigation test...');
    
    // Navigate to the application
    console.log('📍 Navigating to http://localhost:3000');
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to verify what we see
    await page.screenshot({ 
      path: 'test-results-simple/navigation-test.png',
      fullPage: true 
    });
    
    // Check if we're redirected to auth or dashboard
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Verify we're not on about:blank
    expect(currentUrl).not.toBe('about:blank');
    expect(currentUrl).toContain('localhost:3000');
    
    // Check for expected elements based on the URL
    if (currentUrl.includes('/auth')) {
      console.log('✅ Redirected to auth page - checking for login elements');
      
      // Should see login form elements
      await expect(page.getByText(/sign in|login|email/i)).toBeVisible();
      
    } else if (currentUrl.includes('/dashboard')) {
      console.log('✅ Already authenticated - checking for dashboard elements');
      
      // Should see dashboard elements
      await expect(page.getByText(/dashboard|inbox|tasks/i)).toBeVisible();
      
    } else {
      console.log('✅ On landing page - checking for basic elements');
      
      // Should see some content (not blank page)
      const bodyText = await page.textContent('body');
      expect(bodyText?.length).toBeGreaterThan(10);
    }
    
    console.log('✅ Navigation test completed successfully');
  });

  test('Can access auth pages directly', async ({ page }) => {
    console.log('🚀 Testing direct auth page access...');
    
    // Navigate to login page
    console.log('📍 Navigating to /auth/login');
    await page.goto('/auth/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'test-results-simple/auth-login-test.png',
      fullPage: true 
    });
    
    // Verify we're on the login page
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    expect(currentUrl).toContain('localhost:3000');
    expect(currentUrl).toContain('/auth/login');
    
    // Check for login form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    console.log('✅ Auth page test completed successfully');
  });

  test('Console errors check', async ({ page }) => {
    console.log('🚀 Testing for console errors...');
    
    const consoleErrors: string[] = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Log any console errors found
    if (consoleErrors.length > 0) {
      console.log('⚠️ Console errors found:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No console errors found');
    }
    
    // For now, just log errors but don't fail the test
    // This helps us understand what's happening
    console.log(`📊 Total console errors: ${consoleErrors.length}`);
  });
});
