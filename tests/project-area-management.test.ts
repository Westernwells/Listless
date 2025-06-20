import { test, expect } from '@playwright/test';
import { ListlessTestHelpers, TestUser } from './test-utils';
import { EnhancedUserStrategy } from './enhanced-user-strategy';

let testUsers: TestUser[] = [];
let helpers: ListlessTestHelpers;

test.describe('Project and Area Management', () => {
  test.beforeAll(async () => {
    // Create TaskMaster 4 users for Project/Area Management testing
    testUsers = await EnhancedUserStrategy.createTaskMasterUserBatch(4, 'Project/Area Management API', [
      'project-creation', 'area-creation', 'task-conversion', 'project-management',
      'area-management', 'project-deletion', 'area-deletion', 'organization-movement'
    ], 'debug');
    console.log('✅ Created 8 test users for Project/Area Management API validation');
  });

  test.beforeEach(async ({ page }) => {
    // Initialize helpers
    helpers = new ListlessTestHelpers(page);

    // Use the first test user for login
    const testUser = testUsers[0];
    await helpers.loginWithTestUser(testUser);
    await expect(page).toHaveURL('/dashboard');
  });

  test('Create New Project', async ({ page }) => {
    // Click the + button next to Projects
    await page.locator('[data-testid="projects-add-button"]').click();
    
    // Select "New Project" from dropdown
    await page.getByRole('menuitem', { name: 'New Project' }).click();
    
    // Enter project name
    await page.getByPlaceholder(/project name/i).fill('Test Project');
    await page.keyboard.press('Enter');
    
    // Verify project appears in sidebar
    await expect(page.getByRole('link', { name: 'Test Project' })).toBeVisible();
    
    // Click on project to open
    await page.getByRole('link', { name: 'Test Project' }).click();
    
    // Verify project view loads
    await expect(page.getByRole('heading', { name: 'Test Project' })).toBeVisible();
    await expect(page.getByPlaceholder(/add notes/i)).toBeVisible();
  });

  test('Create New Area', async ({ page }) => {
    // Click the + button next to Projects
    await page.locator('[data-testid="projects-add-button"]').click();
    
    // Select "New Area" from dropdown
    await page.getByRole('menuitem', { name: 'New Area' }).click();
    
    // Enter area name
    await page.getByPlaceholder(/area name/i).fill('Test Area');
    await page.keyboard.press('Enter');
    
    // Verify area appears in sidebar
    await expect(page.getByText('Test Area')).toBeVisible();
    
    // Verify area has expand/collapse functionality
    const areaToggle = page.locator('[data-testid="area-toggle"]').filter({ hasText: 'Test Area' });
    await expect(areaToggle).toBeVisible();
  });

  test('Convert Task to Project', async ({ page }) => {
    // Create a task first
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.getByPlaceholder(/add.*task/i).fill('Task to convert');
    await page.keyboard.press('Enter');
    
    // Right-click on task
    const taskRow = page.locator('[data-testid="task-item"]').filter({ hasText: 'Task to convert' });
    await taskRow.click({ button: 'right' });
    
    // Select "Convert to Project"
    await page.getByRole('menuitem', { name: /convert.*project/i }).click();
    
    // Verify conversion dialog
    await expect(page.getByRole('dialog', { name: /convert.*project/i })).toBeVisible();
    
    // Modify project name if desired
    await page.getByLabel(/project name/i).fill('Converted Project');
    
    // Select area (optional)
    await page.getByRole('combobox', { name: /area/i }).click();
    await page.getByRole('option', { name: 'Test Area' }).click();
    
    // Convert
    await page.getByRole('button', { name: 'Convert to Project' }).click();
    
    // Verify original task is gone
    await expect(page.getByText('Task to convert')).not.toBeVisible();
    
    // Verify project appears in sidebar under area
    await expect(page.getByRole('link', { name: 'Converted Project' })).toBeVisible();
  });

  test('Project Detail View Management', async ({ page }) => {
    // Create and navigate to project
    await page.locator('[data-testid="projects-add-button"]').click();
    await page.getByRole('menuitem', { name: 'New Project' }).click();
    await page.getByPlaceholder(/project name/i).fill('Detailed Project');
    await page.keyboard.press('Enter');
    await page.getByRole('link', { name: 'Detailed Project' }).click();
    
    // Edit project title inline
    await page.getByRole('heading', { name: 'Detailed Project' }).click();
    await page.getByDisplayValue('Detailed Project').fill('Updated Project Name');
    await page.keyboard.press('Enter');
    
    // Verify title updated
    await expect(page.getByRole('heading', { name: 'Updated Project Name' })).toBeVisible();
    
    // Add project notes
    await page.getByPlaceholder(/add notes/i).fill('This is a detailed project with comprehensive notes about the objectives and requirements.');
    await page.keyboard.press('Tab'); // Blur to save
    
    // Create tasks within project
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.getByPlaceholder(/add.*task/i).fill('Project task 1');
    await page.keyboard.press('Enter');
    
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.getByPlaceholder(/add.*task/i).fill('Project task 2');
    await page.keyboard.press('Enter');
    
    // Verify tasks appear in project view
    await expect(page.getByText('Project task 1')).toBeVisible();
    await expect(page.getByText('Project task 2')).toBeVisible();
    
    // Verify tasks are scoped to project (not in Inbox)
    await page.getByRole('link', { name: 'Inbox' }).click();
    await expect(page.getByText('Project task 1')).not.toBeVisible();
  });

  test('Area Expansion and Collapse', async ({ page }) => {
    // Create area with projects
    await page.locator('[data-testid="projects-add-button"]').click();
    await page.getByRole('menuitem', { name: 'New Area' }).click();
    await page.getByPlaceholder(/area name/i).fill('Collapsible Area');
    await page.keyboard.press('Enter');
    
    // Create project in area
    await page.locator('[data-testid="projects-add-button"]').click();
    await page.getByRole('menuitem', { name: 'New Project' }).click();
    await page.getByPlaceholder(/project name/i).fill('Area Project');
    await page.keyboard.press('Enter');
    
    // Drag project to area (if drag-drop is implemented)
    const project = page.getByRole('link', { name: 'Area Project' });
    const area = page.getByText('Collapsible Area');
    await project.dragTo(area);
    
    // Test area collapse
    const areaToggle = page.locator('[data-testid="area-toggle"]').filter({ hasText: 'Collapsible Area' });
    await areaToggle.click();
    
    // Verify project is hidden
    await expect(page.getByRole('link', { name: 'Area Project' })).not.toBeVisible();
    
    // Test area expand
    await areaToggle.click();
    
    // Verify project is visible again
    await expect(page.getByRole('link', { name: 'Area Project' })).toBeVisible();
  });

  test('Project and Area Deletion with Cascading Effects', async ({ page }) => {
    // Create area with project and tasks
    await page.locator('[data-testid="projects-add-button"]').click();
    await page.getByRole('menuitem', { name: 'New Area' }).click();
    await page.getByPlaceholder(/area name/i).fill('Area to Delete');
    await page.keyboard.press('Enter');
    
    await page.locator('[data-testid="projects-add-button"]').click();
    await page.getByRole('menuitem', { name: 'New Project' }).click();
    await page.getByPlaceholder(/project name/i).fill('Project to Delete');
    await page.keyboard.press('Enter');
    
    // Navigate to project and add tasks
    await page.getByRole('link', { name: 'Project to Delete' }).click();
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.getByPlaceholder(/add.*task/i).fill('Task in project to delete');
    await page.keyboard.press('Enter');
    
    // Delete project
    await page.getByRole('link', { name: 'Project to Delete' }).click({ button: 'right' });
    await page.getByRole('menuitem', { name: /delete/i }).click();
    
    // Confirm deletion
    await page.getByRole('button', { name: 'Delete Project' }).click();
    
    // Verify project removed from sidebar
    await expect(page.getByRole('link', { name: 'Project to Delete' })).not.toBeVisible();
    
    // Verify tasks moved to Inbox
    await page.getByRole('link', { name: 'Inbox' }).click();
    await expect(page.getByText('Task in project to delete')).toBeVisible();
    
    // Delete area
    await page.getByText('Area to Delete').click({ button: 'right' });
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await page.getByRole('button', { name: 'Delete Area' }).click();
    
    // Verify area removed
    await expect(page.getByText('Area to Delete')).not.toBeVisible();
  });

  test('Project Organization and Movement', async ({ page }) => {
    // Create multiple areas and projects
    const areas = ['Work Area', 'Personal Area'];
    const projects = ['Work Project', 'Personal Project'];
    
    for (const area of areas) {
      await page.locator('[data-testid="projects-add-button"]').click();
      await page.getByRole('menuitem', { name: 'New Area' }).click();
      await page.getByPlaceholder(/area name/i).fill(area);
      await page.keyboard.press('Enter');
    }
    
    for (const project of projects) {
      await page.locator('[data-testid="projects-add-button"]').click();
      await page.getByRole('menuitem', { name: 'New Project' }).click();
      await page.getByPlaceholder(/project name/i).fill(project);
      await page.keyboard.press('Enter');
    }
    
    // Move Work Project to Work Area
    const workProject = page.getByRole('link', { name: 'Work Project' });
    const workArea = page.getByText('Work Area');
    await workProject.dragTo(workArea);
    
    // Verify project moved to area
    await expect(workArea.locator('..').getByRole('link', { name: 'Work Project' })).toBeVisible();
    
    // Move Personal Project to Personal Area
    const personalProject = page.getByRole('link', { name: 'Personal Project' });
    const personalArea = page.getByText('Personal Area');
    await personalProject.dragTo(personalArea);
    
    // Verify organization
    await expect(personalArea.locator('..').getByRole('link', { name: 'Personal Project' })).toBeVisible();
  });

  test.afterAll(async () => {
    // Cleanup will be handled by the test environment teardown
    console.log('✅ Project/Area Management tests completed');
  });
});
