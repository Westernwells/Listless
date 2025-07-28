import { test, expect } from '@playwright/test'

/**
 * Test suite for console error fixes
 * Verifies that the specific console errors mentioned have been resolved
 */

test.describe('Console Error Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('should not have uncaught promise rejections', async ({ page }) => {
    const consoleErrors: string[] = []
    const promiseRejections: string[] = []

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Listen for unhandled promise rejections
    page.on('pageerror', (error) => {
      promiseRejections.push(error.message)
    })

    // Interact with the application to trigger potential promise rejections
    await page.getByRole('button', { name: 'Add Task' }).click()
    await page.waitForTimeout(1000)

    // Navigate between views
    await page.getByRole('link', { name: 'Today' }).click()
    await page.waitForTimeout(500)
    await page.getByRole('link', { name: 'Inbox' }).click()
    await page.waitForTimeout(500)

    // Check for uncaught promise rejections
    const uncaughtRejections = promiseRejections.filter(error => 
      error.includes('Uncaught') && 
      !error.includes('chrome-extension') &&
      !error.includes('Extension context')
    )

    expect(uncaughtRejections).toHaveLength(0)
  })

  test('should handle message channel errors gracefully', async ({ page }) => {
    const messageChannelErrors: string[] = []

    // Listen for console messages
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('message channel') || text.includes('Extension context')) {
        messageChannelErrors.push(text)
      }
    })

    // Interact with the application
    await page.getByRole('button', { name: 'Add Task' }).click()
    await page.waitForTimeout(1000)

    // Check that message channel errors are handled (suppressed or logged as warnings)
    const unhandledMessageChannelErrors = messageChannelErrors.filter(error => 
      !error.includes('suppressed') && 
      !error.includes('[HANDLED]') &&
      !error.includes('warn')
    )

    expect(unhandledMessageChannelErrors).toHaveLength(0)
  })

  test('should not have CSS import errors', async ({ page }) => {
    const cssErrors: string[] = []

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (text.includes('@import') || text.includes('CSS')) {
          cssErrors.push(text)
        }
      }
    })

    // Wait for all resources to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check for CSS import errors
    const cssImportErrors = cssErrors.filter(error => 
      error.includes('@import rules are not allowed here') ||
      error.includes('CSS import')
    )

    expect(cssImportErrors).toHaveLength(0)
  })

  test('should not have performance violations in click handlers', async ({ page }) => {
    const performanceViolations: string[] = []

    // Listen for console warnings about performance
    page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        const text = msg.text()
        if (text.includes('Performance Monitor') || text.includes('violation')) {
          performanceViolations.push(text)
        }
      }
    })

    // Perform rapid clicks to test performance
    const addTaskButton = page.getByRole('button', { name: 'Add Task' })
    
    // Measure click performance
    const startTime = Date.now()
    for (let i = 0; i < 5; i++) {
      await addTaskButton.click()
      await page.waitForTimeout(100)
    }
    const endTime = Date.now()
    const totalTime = endTime - startTime

    // Each click should be reasonably fast
    const averageClickTime = totalTime / 5
    expect(averageClickTime).toBeLessThan(200) // 200ms per click should be reasonable

    // Check for performance violation warnings
    const clickPerformanceViolations = performanceViolations.filter(warning => 
      warning.includes('click-handler') && 
      warning.includes('150ms')
    )

    // Allow some violations but not excessive ones
    expect(clickPerformanceViolations.length).toBeLessThan(3)
  })

  test('should have error monitoring system active', async ({ page }) => {
    // Check that error monitoring is initialized
    const errorMonitorActive = await page.evaluate(() => {
      return typeof (window as any).__errorMonitor !== 'undefined' ||
             typeof (window as any).__errorHandlingActive !== 'undefined'
    })

    expect(errorMonitorActive).toBe(true)
  })

  test('should handle rapid task creation without errors', async ({ page }) => {
    const errors: string[] = []

    // Listen for any errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // Rapidly create multiple tasks
    const addTaskButton = page.getByRole('button', { name: 'Add Task' })
    
    for (let i = 0; i < 10; i++) {
      await addTaskButton.click()
      // Small delay to allow for async operations
      await page.waitForTimeout(50)
    }

    // Wait for all operations to complete
    await page.waitForTimeout(2000)

    // Filter out browser extension errors
    const applicationErrors = errors.filter(error => 
      !error.includes('chrome-extension') &&
      !error.includes('Extension context') &&
      !error.includes('message channel') &&
      !error.includes('[HANDLED]')
    )

    expect(applicationErrors).toHaveLength(0)
  })

  test('should maintain good performance during navigation', async ({ page }) => {
    const navigationTimes: number[] = []

    // Test navigation performance between different views
    const views = ['Today', 'Scheduled', 'Completed', 'Inbox']

    for (const view of views) {
      const startTime = Date.now()
      await page.getByRole('link', { name: view }).click()
      await page.waitForLoadState('networkidle')
      const endTime = Date.now()
      
      navigationTimes.push(endTime - startTime)
    }

    // All navigation should be reasonably fast
    const averageNavigationTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length
    expect(averageNavigationTime).toBeLessThan(1000) // 1 second average

    // No single navigation should be extremely slow
    const maxNavigationTime = Math.max(...navigationTimes)
    expect(maxNavigationTime).toBeLessThan(3000) // 3 seconds max
  })
})
