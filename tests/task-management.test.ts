import { test, expect } from '@playwright/test';
import { EnhancedUserManager } from './enhanced-user-strategy';
import { ListlessTestHelpers } from './test-utils';

// Test data
const testTask = {
  content: 'Test task for automation',
  notes: 'This is a test task created by Playwright automation',
  tags: ['automation', 'testing']
};

test.describe('Task Management', () => {
  let helpers: ListlessTestHelpers;
  let testUsers: any[];

  test.beforeAll(async () => {
    // Create dedicated test users for task management tests
    testUsers = await EnhancedUserManager.createTaskManagementUsers();
    console.log(`✅ Created ${testUsers.length} test users for Task Management API validation`);
  });

  test.beforeEach(async ({ page }) => {
    // Initialize helpers
    helpers = new ListlessTestHelpers(page);

    // Use the first test user for login
    const testUser = testUsers[0];
    await helpers.loginWithTestUser(testUser);
    await expect(page).toHaveURL('/dashboard');
  });

  test.afterAll(async () => {
    // Cleanup will be handled by the test environment teardown
    console.log('✅ Task Management tests completed');
  });

  test('Create Task with Add Button', async ({ page }) => {
    // Click Add Task button
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Wait for new task to be created and appear in the list
    await expect(page.getByText('New Task')).toBeVisible();

    // Click on the task to expand it (which will enable editing)
    await page.getByText('New Task').click();

    // Wait for the expanded task view to appear
    await expect(page.locator('.expanded-task-item')).toBeVisible();

    // Now the input field should be visible for editing (use the first one)
    await expect(page.locator('input[value="New Task"]').first()).toBeVisible();

    // Fill task content (replace the default "New Task" content)
    await page.locator('input[value="New Task"]').first().fill(testTask.content);

    // Submit task
    await page.keyboard.press('Enter');

    // Wait a moment for the task to be saved
    await page.waitForTimeout(500);

    // Close the expanded view to see the updated task in the list
    await page.getByRole('button', { name: /close/i }).click();

    // Verify task appears in list with new content
    await expect(page.getByText(testTask.content)).toBeVisible();
  });

  test('Create Task with Keyboard Shortcut', async ({ page }) => {
    // Use spacebar shortcut
    await page.keyboard.press('Space');

    // Wait for new task to be created and enter editing mode
    await expect(page.locator('input[value="New Task"]')).toBeVisible();

    // Fill and submit task
    await page.locator('input[value="New Task"]').fill('Keyboard shortcut task');
    await page.keyboard.press('Enter');

    // Verify task created
    await expect(page.getByText('Keyboard shortcut task')).toBeVisible();
  });

  test('Edit Task Inline', async ({ page }) => {
    // Create a task first
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.locator('input[value="New Task"]').fill('Task to edit');
    await page.keyboard.press('Enter');

    // Double-click to edit (need to expand first, then click to edit)
    const taskItem = page.getByText('Task to edit');
    await taskItem.click(); // First click to expand
    await taskItem.click(); // Second click to enter edit mode

    // Verify edit mode
    await expect(page.locator('input[value="Task to edit"]')).toBeVisible();

    // Edit content
    await page.locator('input[value="Task to edit"]').fill('Edited task content');
    await page.keyboard.press('Enter');

    // Verify changes saved
    await expect(page.getByText('Edited task content')).toBeVisible();
    await expect(page.getByText('Task to edit')).not.toBeVisible();
  });

  test('Task Completion Toggle', async ({ page }) => {
    // Create a task
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.locator('input[value="New Task"]').fill('Task to complete');
    await page.keyboard.press('Enter');

    // Find task checkbox
    const taskRow = page.locator('[data-testid="task-item"]').filter({ hasText: 'Task to complete' });
    const checkbox = taskRow.getByRole('checkbox');

    // Verify initially unchecked
    await expect(checkbox).not.toBeChecked();

    // Check task
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // Verify visual changes (strikethrough, opacity)
    await expect(taskRow).toHaveClass(/opacity-70/);

    // Uncheck task
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
    await expect(taskRow).not.toHaveClass(/opacity-70/);
  });

  test('Expanded Task View', async ({ page }) => {
    // Create a task
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.locator('input[value="New Task"]').fill(testTask.content);
    await page.keyboard.press('Enter');

    // Click on task to expand it
    const taskRow = page.locator('[data-testid="task-item"]').filter({ hasText: testTask.content });
    await taskRow.click();

    // Verify expanded view opens
    await expect(page.locator('[data-expanded="true"]')).toBeVisible();

    // Add notes
    await page.getByPlaceholder(/add notes/i).fill(testTask.notes);
    await page.keyboard.press('Tab'); // Blur to save

    // Add tags
    await page.getByRole('button', { name: /add tags/i }).click();
    for (const tag of testTask.tags) {
      await page.getByPlaceholder(/add tag/i).fill(tag);
      await page.keyboard.press('Enter');
    }
    await page.getByRole('button', { name: 'Save' }).click();

    // Set due date
    await page.getByRole('button', { name: /due date/i }).click();
    await page.getByRole('button', { name: '15' }).click(); // Select 15th of current month

    // Close expanded view
    await page.getByRole('button', { name: /close/i }).click();

    // Verify task shows tags and due date
    await expect(taskRow.getByText(testTask.tags[0])).toBeVisible();
    await expect(taskRow.locator('[data-testid="due-date"]')).toBeVisible();
  });

  test('Task Context Menu Actions', async ({ page }) => {
    // Create a task
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.locator('input[value="New Task"]').fill('Context menu task');
    await page.keyboard.press('Enter');

    // Right-click on task
    const taskRow = page.locator('[data-testid="task-item"]').filter({ hasText: 'Context menu task' });
    await taskRow.click({ button: 'right' });

    // Verify context menu appears
    await expect(page.getByRole('menu')).toBeVisible();

    // Test duplicate action
    await page.getByRole('menuitem', { name: /duplicate/i }).click();
    await expect(page.getByText('Context menu task').nth(1)).toBeVisible();

    // Test move to trash
    await taskRow.click({ button: 'right' });
    await page.getByRole('menuitem', { name: /trash/i }).click();

    // Verify task removed from main view
    await expect(page.getByText('Context menu task')).not.toBeVisible();

    // Check trash view
    await page.getByRole('link', { name: 'Trash' }).click();
    await expect(page.getByText('Context menu task')).toBeVisible();
  });

  test('Drag and Drop Reordering', async ({ page }) => {
    // Create multiple tasks
    const tasks = ['First task', 'Second task', 'Third task'];
    for (const task of tasks) {
      await page.getByRole('button', { name: 'Add Task' }).click();
      await page.locator('input[value="New Task"]').fill(task);
      await page.keyboard.press('Enter');
    }

    // Get task elements
    const firstTask = page.locator('[data-testid="task-item"]').filter({ hasText: 'First task' });
    const thirdTask = page.locator('[data-testid="task-item"]').filter({ hasText: 'Third task' });

    // Drag first task to third position
    await firstTask.dragTo(thirdTask);

    // Verify new order
    const taskItems = page.locator('[data-testid="task-item"]');
    await expect(taskItems.nth(0)).toContainText('Second task');
    await expect(taskItems.nth(1)).toContainText('Third task');
    await expect(taskItems.nth(2)).toContainText('First task');
  });

  test('Multi-Task Selection', async ({ page }) => {
    // Create multiple tasks
    const tasks = ['Task 1', 'Task 2', 'Task 3'];
    for (const task of tasks) {
      await page.getByRole('button', { name: 'Add Task' }).click();
      await page.locator('input[value="New Task"]').fill(task);
      await page.keyboard.press('Enter');
    }

    // Select multiple tasks with Cmd/Ctrl+click
    const task1 = page.locator('[data-testid="task-item"]').filter({ hasText: 'Task 1' });
    const task3 = page.locator('[data-testid="task-item"]').filter({ hasText: 'Task 3' });

    await task1.click();
    await task3.click({ modifiers: ['ControlOrMeta'] });

    // Verify both tasks selected
    await expect(task1).toHaveClass(/task-selected/);
    await expect(task3).toHaveClass(/task-selected/);

    // Right-click for bulk actions
    await task1.click({ button: 'right' });
    await expect(page.getByRole('menuitem', { name: /2 tasks selected/i })).toBeVisible();
  });

  test('Task Search Functionality', async ({ page }) => {
    // Create tasks with different content
    const searchTasks = ['Important meeting', 'Buy groceries', 'Important project review'];
    for (const task of searchTasks) {
      await page.getByRole('button', { name: 'Add Task' }).click();
      await page.locator('input[value="New Task"]').fill(task);
      await page.keyboard.press('Enter');
    }

    // Open search dialog
    await page.getByRole('button', { name: /search/i }).click();

    // Search for "important"
    await page.getByPlaceholder(/search/i).fill('important');

    // Verify search results
    await expect(page.getByText('Important meeting')).toBeVisible();
    await expect(page.getByText('Important project review')).toBeVisible();
    await expect(page.getByText('Buy groceries')).not.toBeVisible();

    // Click on search result
    await page.getByText('Important meeting').click();

    // Verify navigation to task
    await expect(page.getByText('Important meeting')).toBeVisible();
  });
});
