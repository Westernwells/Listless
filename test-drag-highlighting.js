const { chromium } = require('playwright-core');

async function testDragHighlighting() {
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
    // Navigate to the dashboard
    await page.goto('http://localhost:3002/dashboard');
    await page.waitForLoadState('networkidle');

    console.log('🔍 Starting drag-and-drop highlighting test...');

    // Wait for tasks to load - try multiple selectors
    let taskSelector = null;
    const selectors = [
      '[data-testid="task-item"]',
      '.task-item',
      '[role="listitem"]',
      '.task-container'
    ];

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        taskSelector = selector;
        console.log(`✅ Found tasks using selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`❌ Selector ${selector} not found`);
      }
    }

    if (!taskSelector) {
      console.log('❌ No task items found with any selector');
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-no-tasks.png' });

      // Check what's actually on the page
      const title = await page.title();
      const url = page.url();
      console.log(`Page title: ${title}`);
      console.log(`Page URL: ${url}`);

      // Check if we're on a login page
      const loginElements = await page.locator('input[type="email"], input[type="password"], button[type="submit"]').count();
      if (loginElements > 0) {
        console.log('🔐 Appears to be on a login page - authentication required');
      }

      // Get page content for debugging
      const bodyText = await page.locator('body').textContent();
      console.log(`Page content preview: ${bodyText.substring(0, 200)}...`);

      return;
    }

    // Get all task items using the working selector
    const taskItems = await page.locator(taskSelector).all();
    console.log(`Found ${taskItems.length} task items`);

    if (taskItems.length < 2) {
      console.log('❌ Need at least 2 tasks to test drag and drop');
      return;
    }

    // Get the first two tasks for testing
    const sourceTask = taskItems[0];
    const targetTask = taskItems[1];

    // Get task IDs and titles for tracking
    const sourceId = await sourceTask.getAttribute('data-task-id') || 'unknown';
    const targetId = await targetTask.getAttribute('data-task-id') || 'unknown';

    // Try multiple selectors for task title
    let sourceTitle = 'unknown';
    let targetTitle = 'unknown';

    try {
      sourceTitle = await sourceTask.locator('[data-testid="task-title"]').textContent() ||
                   await sourceTask.locator('.task-title').textContent() ||
                   await sourceTask.textContent() || 'unknown';
    } catch (e) {
      console.log('Could not get source title');
    }

    try {
      targetTitle = await targetTask.locator('[data-testid="task-title"]').textContent() ||
                   await targetTask.locator('.task-title').textContent() ||
                   await targetTask.textContent() || 'unknown';
    } catch (e) {
      console.log('Could not get target title');
    }

    console.log(`📋 Source task: "${sourceTitle}" (ID: ${sourceId})`);
    console.log(`📋 Target task: "${targetTitle}" (ID: ${targetId})`);

    // Check initial selection state
    const initialSourceSelected = await sourceTask.getAttribute('data-selected');
    const initialTargetSelected = await targetTask.getAttribute('data-selected');
    console.log(`🎯 Initial selection - Source: ${initialSourceSelected}, Target: ${initialTargetSelected}`);

    // Perform drag and drop
    console.log('🚀 Starting drag operation...');
    await sourceTask.dragTo(targetTask);
    console.log('✅ Drag operation completed');

    // Wait a moment for the drop to settle
    await page.waitForTimeout(500);

    // Check immediate post-drop state
    const postDropSourceSelected = await sourceTask.getAttribute('data-selected');
    const postDropTargetSelected = await targetTask.getAttribute('data-selected');
    console.log(`🎯 Post-drop selection - Source: ${postDropSourceSelected}, Target: ${postDropTargetSelected}`);

    // Check task positions in DOM
    const postDropTasks = await page.locator(taskSelector).all();
    const postDropOrder = [];
    for (const task of postDropTasks) {
      const id = await task.getAttribute('data-task-id') || 'unknown';
      let title = 'unknown';
      try {
        title = await task.locator('[data-testid="task-title"]').textContent() ||
               await task.locator('.task-title').textContent() ||
               await task.textContent() || 'unknown';
      } catch (e) {
        // Ignore title extraction errors
      }
      postDropOrder.push({ id, title: title.substring(0, 50) }); // Truncate for readability
    }
    console.log('📋 Post-drop task order:', postDropOrder);

    // Wait for the 2-second delay mentioned in the issue
    console.log('⏳ Waiting 3 seconds to observe delayed behavior...');
    await page.waitForTimeout(3000);

    // Check selection state after delay
    const delayedSourceSelected = await sourceTask.getAttribute('data-selected');
    const delayedTargetSelected = await targetTask.getAttribute('data-selected');
    console.log(`🎯 After delay selection - Source: ${delayedSourceSelected}, Target: ${delayedTargetSelected}`);

    // Check if task positions changed
    const delayedTasks = await page.locator(taskSelector).all();
    const delayedOrder = [];
    for (const task of delayedTasks) {
      const id = await task.getAttribute('data-task-id') || 'unknown';
      let title = 'unknown';
      try {
        title = await task.locator('[data-testid="task-title"]').textContent() ||
               await task.locator('.task-title').textContent() ||
               await task.textContent() || 'unknown';
      } catch (e) {
        // Ignore title extraction errors
      }
      delayedOrder.push({ id, title: title.substring(0, 50) }); // Truncate for readability
    }
    console.log('📋 After delay task order:', delayedOrder);

    // Compare orders to detect position changes
    const positionsChanged = JSON.stringify(postDropOrder) !== JSON.stringify(delayedOrder);
    console.log(`🔄 Task positions changed after delay: ${positionsChanged}`);

    // Check for visual highlighting classes
    const sourceClasses = await sourceTask.getAttribute('class');
    const targetClasses = await targetTask.getAttribute('class');
    console.log(`🎨 Source task classes: ${sourceClasses}`);
    console.log(`🎨 Target task classes: ${targetClasses}`);

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`- Positions changed: ${positionsChanged}`);
    console.log(`- Selection changed: ${initialSourceSelected !== delayedSourceSelected || initialTargetSelected !== delayedTargetSelected}`);
    
    if (positionsChanged) {
      console.log('🔍 DIAGNOSIS: This appears to be a DATA BUG (Option B) - task positions are reverting');
    } else if (initialSourceSelected !== delayedSourceSelected || initialTargetSelected !== delayedTargetSelected) {
      console.log('🔍 DIAGNOSIS: This appears to be a VISUAL BUG (Option A) - only selection state is changing');
    } else {
      console.log('🔍 DIAGNOSIS: No issues detected in this test');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will remain open for manual inspection. Press Ctrl+C to close.');
    // await browser.close();
  }
}

testDragHighlighting();
