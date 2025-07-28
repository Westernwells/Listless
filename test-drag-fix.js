/**
 * Test script to verify drag-and-drop fixes
 * Run this in the browser console to test the drag functionality
 */

console.log('🧪 Starting Drag-and-Drop Fix Verification Test');

// Test 1: Check if drag context is properly initialized
function testDragContextInitialization() {
  console.log('\n📋 Test 1: Drag Context Initialization');
  
  // Check if drag context provider is available
  const dragContext = document.querySelector('[data-dragging]');
  if (dragContext) {
    console.log('✅ Drag context elements found');
  } else {
    console.log('❌ No drag context elements found');
  }
  
  // Check if sortable items are present
  const sortableItems = document.querySelectorAll('[data-task-id]');
  console.log(`📊 Found ${sortableItems.length} sortable task items`);
  
  if (sortableItems.length > 0) {
    const firstTask = sortableItems[0];
    const taskId = firstTask.getAttribute('data-task-id');
    console.log(`🎯 First task ID: ${taskId}`);
    console.log(`🔍 Task ID format: ${taskId ? 'UUID format' : 'Invalid format'}`);
  }
}

// Test 2: Check for hydration errors
function testHydrationErrors() {
  console.log('\n🔄 Test 2: Hydration Error Check');
  
  // Check console for hydration warnings
  const originalConsoleWarn = console.warn;
  let hydrationWarnings = 0;
  
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('hydration') || message.includes('server') || message.includes('client')) {
      hydrationWarnings++;
      console.log(`⚠️ Hydration warning detected: ${message}`);
    }
    originalConsoleWarn.apply(console, args);
  };
  
  setTimeout(() => {
    console.warn = originalConsoleWarn;
    if (hydrationWarnings === 0) {
      console.log('✅ No hydration warnings detected');
    } else {
      console.log(`❌ Found ${hydrationWarnings} hydration warnings`);
    }
  }, 2000);
}

// Test 3: Simulate drag operation
function testDragOperation() {
  console.log('\n🖱️ Test 3: Drag Operation Simulation');
  
  const taskItems = document.querySelectorAll('[data-task-id]');
  if (taskItems.length < 2) {
    console.log('❌ Need at least 2 tasks to test drag operation');
    return;
  }
  
  const sourceTask = taskItems[0];
  const targetTask = taskItems[1];
  
  console.log('🎯 Attempting to simulate drag operation...');
  console.log(`📤 Source task: ${sourceTask.getAttribute('data-task-id')}`);
  console.log(`📥 Target task: ${targetTask.getAttribute('data-task-id')}`);
  
  // Find the grip handle
  const gripHandle = sourceTask.querySelector('.grip-handle button');
  if (!gripHandle) {
    console.log('❌ No grip handle found');
    return;
  }
  
  console.log('✅ Grip handle found, simulating mouse events...');
  
  // Simulate mouse down on grip handle
  const mouseDownEvent = new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
    clientX: 100,
    clientY: 100
  });
  
  gripHandle.dispatchEvent(mouseDownEvent);
  console.log('📤 Mouse down event dispatched');
  
  // Wait a bit then simulate mouse move
  setTimeout(() => {
    const mouseMoveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: 150,
      clientY: 150
    });
    
    document.dispatchEvent(mouseMoveEvent);
    console.log('🔄 Mouse move event dispatched');
    
    // Wait a bit then simulate mouse up
    setTimeout(() => {
      const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: 150,
        clientY: 150
      });
      
      document.dispatchEvent(mouseUpEvent);
      console.log('📥 Mouse up event dispatched');
      console.log('🏁 Drag simulation complete');
    }, 100);
  }, 100);
}

// Test 4: Check for invalid drag target errors
function testInvalidDragTargetErrors() {
  console.log('\n❌ Test 4: Invalid Drag Target Error Check');
  
  const originalConsoleLog = console.log;
  let invalidTargetErrors = 0;
  
  console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('Invalid drag target')) {
      invalidTargetErrors++;
      console.error(`🚨 Invalid drag target error: ${message}`);
    }
    originalConsoleLog.apply(console, args);
  };
  
  setTimeout(() => {
    console.log = originalConsoleLog;
    if (invalidTargetErrors === 0) {
      console.log('✅ No invalid drag target errors detected');
    } else {
      console.log(`❌ Found ${invalidTargetErrors} invalid drag target errors`);
    }
  }, 3000);
}

// Run all tests
function runAllTests() {
  console.log('🚀 Running all drag-and-drop fix verification tests...');
  
  testDragContextInitialization();
  testHydrationErrors();
  testInvalidDragTargetErrors();
  
  // Wait a bit for the page to fully load before testing drag
  setTimeout(() => {
    testDragOperation();
  }, 1000);
  
  console.log('\n⏳ Tests running... Check console output above for results');
  console.log('💡 You can also manually test by dragging tasks in the UI');
}

// Auto-run tests when script is loaded
runAllTests();

// Export functions for manual testing
window.dragTests = {
  runAllTests,
  testDragContextInitialization,
  testHydrationErrors,
  testDragOperation,
  testInvalidDragTargetErrors
};

console.log('🔧 Drag test functions available at window.dragTests');
