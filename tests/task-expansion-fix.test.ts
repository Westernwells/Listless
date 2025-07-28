import { test, expect } from '@playwright/test'

test.describe('Task Expansion Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('http://localhost:3000/dashboard')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('should not show React hooks violation error when double-clicking tasks', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Wait for tasks to load
    await page.waitForSelector('[data-testid="task-item"], .task-item', { timeout: 10000 })

    // Find the first task item
    const taskItem = page.locator('[data-testid="task-item"], .task-item').first()
    
    if (await taskItem.count() > 0) {
      // Double-click the task to expand it
      await taskItem.dblclick()
      
      // Wait a moment for any errors to appear
      await page.waitForTimeout(1000)
      
      // Check that no React hooks violation errors occurred
      const hooksErrors = consoleErrors.filter(error => 
        error.includes('Rendered fewer hooks than expected') ||
        error.includes('hooks violation') ||
        error.includes('Hook call')
      )
      
      expect(hooksErrors).toHaveLength(0)
      
      // Verify that the expanded view appears (if tasks exist)
      const expandedView = page.locator('[data-expanded="true"], .expanded-task-item')
      if (await expandedView.count() > 0) {
        await expect(expandedView).toBeVisible()
      }
    }
  })

  test('should allow task expansion and closing without errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Wait for tasks to load
    await page.waitForSelector('[data-testid="task-item"], .task-item', { timeout: 10000 })

    const taskItems = page.locator('[data-testid="task-item"], .task-item')
    const taskCount = await taskItems.count()
    
    if (taskCount > 0) {
      // Test expanding and closing the first task
      const firstTask = taskItems.first()
      
      // Double-click to expand
      await firstTask.dblclick()
      await page.waitForTimeout(500)
      
      // Look for close button or click outside to close
      const closeButton = page.locator('button:has-text("Close"), [aria-label*="close"], .close-button')
      if (await closeButton.count() > 0) {
        await closeButton.first().click()
      } else {
        // Click outside the expanded area
        await page.click('body', { position: { x: 10, y: 10 } })
      }
      
      await page.waitForTimeout(500)
      
      // Check for any React errors
      const reactErrors = consoleErrors.filter(error => 
        error.includes('React') ||
        error.includes('hooks') ||
        error.includes('component')
      )
      
      expect(reactErrors).toHaveLength(0)
    }
  })

  test('should maintain drag and drop functionality', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Wait for tasks to load
    await page.waitForSelector('[data-testid="task-item"], .task-item', { timeout: 10000 })

    const taskItems = page.locator('[data-testid="task-item"], .task-item')
    const taskCount = await taskItems.count()
    
    if (taskCount >= 2) {
      // Test drag and drop between first two tasks
      const firstTask = taskItems.first()
      const secondTask = taskItems.nth(1)
      
      // Get the drag handle or the task itself
      const dragHandle = firstTask.locator('.grip-handle, [data-testid="drag-handle"]').first()
      const dragTarget = await dragHandle.count() > 0 ? dragHandle : firstTask
      
      // Perform drag and drop
      await dragTarget.hover()
      await page.mouse.down()
      await secondTask.hover()
      await page.mouse.up()
      
      await page.waitForTimeout(500)
      
      // Check that no errors occurred during drag and drop
      const dragErrors = consoleErrors.filter(error => 
        error.includes('drag') ||
        error.includes('drop') ||
        error.includes('sortable') ||
        error.includes('hooks')
      )
      
      expect(dragErrors).toHaveLength(0)
    }
  })
})
