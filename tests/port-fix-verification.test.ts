import { test, expect } from '@playwright/test';

test.describe('Port Fix Verification', () => {
  test('✅ Confirms browser windows show actual application (not about:blank)', async ({ page }) => {
    console.log('🎯 Testing port fix - browser should show real application');
    
    // Navigate to the application
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // ✅ CRITICAL: Verify we're NOT on about:blank
    expect(currentUrl).not.toBe('about:blank');
    expect(currentUrl).toContain('localhost:3000');
    
    // ✅ CRITICAL: Verify we get actual HTML content (not empty page)
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100); // Should have substantial content
    
    // ✅ CRITICAL: Verify we see actual application content (not blank page)
    // Check for any of these indicators that the real app is loading:
    const hasReactApp = await page.locator('#__next, [data-reactroot]').count() > 0;
    const hasNextApp = currentUrl.includes('/auth/login') || currentUrl.includes('/dashboard');
    const hasAppTitle = await page.locator('title').textContent();

    // Should see indicators of real app loading
    const isRealApp = hasReactApp || hasNextApp || (hasAppTitle && hasAppTitle.includes('AI Task Management'));
    expect(isRealApp).toBe(true);
    
    console.log('✅ SUCCESS: Browser windows now show actual Listless application!');
    console.log('✅ SUCCESS: Port configuration fix is working correctly!');
    
    // Take screenshot for verification
    await page.screenshot({ 
      path: 'test-results-simple/port-fix-success.png',
      fullPage: true 
    });
  });
});
