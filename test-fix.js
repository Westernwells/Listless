const { chromium } = require('playwright-core');

async function testFix() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
    }
  });

  try {
    console.log('🔍 Testing drag-and-drop highlighting fix...');
    
    // Navigate to the dashboard
    await page.goto('http://localhost:3002/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if we're on login page
    const url = page.url();
    if (url.includes('/auth/login')) {
      console.log('🔐 On login page - please manually log in and then perform drag-and-drop test');
      console.log('👀 Watch the console for these key messages:');
      console.log('   - "🎯 Single task reorder failed - clearing selection state"');
      console.log('   - "🎯 Selected tasks no longer in view - clearing selection state"');
      console.log('   - Any selection state changes');
      console.log('');
      console.log('📋 Test procedure:');
      console.log('   1. Log in to the dashboard');
      console.log('   2. Drag a task to a new position');
      console.log('   3. Watch for API errors (500) and selection state clearing');
      console.log('   4. Verify that task highlighting is cleared after ~2 seconds');
      console.log('');
      console.log('✅ If you see the clearing messages, the fix is working!');
    } else {
      console.log('✅ Already logged in - you can test drag-and-drop now');
    }

    // Keep browser open for manual testing
    console.log('🔍 Browser will remain open for manual testing. Press Ctrl+C to close.');
    
    // Wait indefinitely
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Test setup failed:', error);
  }
}

testFix();
