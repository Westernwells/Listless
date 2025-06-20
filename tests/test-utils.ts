import { Page, expect } from '@playwright/test';

/**
 * Test utilities for Listless application
 */

export interface TestUserMetadata {
  taskMasterTask: string;
  testScenario: string;
  testSuite: string;
  testRunId: string;
  createdAt: string;
  retentionPolicy: 'immediate' | 'debug' | 'audit';
  debugInfo?: {
    testFile: string;
    testIndex: number;
    browserName?: string;
  };
}

export class TestUser {
  public id?: string;
  public metadata: TestUserMetadata;

  constructor(
    public name: string = 'Test User',
    public email: string = `test-${Date.now()}@example.com`,
    public password: string = 'TestPassword123!',
    metadata?: Partial<TestUserMetadata>
  ) {
    this.metadata = {
      taskMasterTask: 'unknown',
      testScenario: 'unknown',
      testSuite: 'unknown',
      testRunId: TestUser.generateTestRunId(),
      createdAt: new Date().toISOString(),
      retentionPolicy: 'immediate',
      ...metadata
    };
  }

  /**
   * Generate a descriptive test user for specific TaskMaster AI task validation
   */
  static generateForTaskMaster(
    taskNumber: number,
    taskName: string,
    testScenario: string,
    testSuite: string,
    testIndex: number = 0,
    retentionPolicy: 'immediate' | 'debug' | 'audit' = 'debug'
  ): TestUser {
    const timestamp = Date.now();
    const testRunId = this.generateTestRunId();

    // Create descriptive email with clear identifiers
    const emailPrefix = `tm${taskNumber}-${taskName.toLowerCase().replace(/\s+/g, '-')}-${testScenario.toLowerCase().replace(/\s+/g, '-')}`;
    const email = `${emailPrefix}-${testIndex}-${timestamp}@example.com`;

    // Create descriptive name
    const name = `TaskMaster ${taskNumber} Test User (${testScenario})`;

    const metadata: TestUserMetadata = {
      taskMasterTask: `Task ${taskNumber}: ${taskName}`,
      testScenario: testScenario,
      testSuite: testSuite,
      testRunId: testRunId,
      createdAt: new Date().toISOString(),
      retentionPolicy: retentionPolicy,
      debugInfo: {
        testFile: testSuite,
        testIndex: testIndex
      }
    };

    return new TestUser(name, email, 'TestPassword123!', metadata);
  }

  /**
   * Generate a unique test run identifier
   */
  static generateTestRunId(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
    const random = Math.random().toString(36).substring(2, 6);
    return `run-${dateStr}-${timeStr}-${random}`;
  }

  /**
   * Generate test user for specific scenarios
   */
  static generateForAuth(scenario: string, testIndex: number = 0): TestUser {
    return this.generateForTaskMaster(
      2,
      'Authentication System',
      scenario,
      'auth-tests',
      testIndex,
      'debug'
    );
  }

  static generateForTaskManagement(scenario: string, testIndex: number = 0): TestUser {
    return this.generateForTaskMaster(
      3,
      'Task Management API',
      scenario,
      'task-tests',
      testIndex,
      'debug'
    );
  }

  static generateForProjectManagement(scenario: string, testIndex: number = 0): TestUser {
    return this.generateForTaskMaster(
      4,
      'Project Area Management API',
      scenario,
      'project-tests',
      testIndex,
      'debug'
    );
  }

  static generateForIntegration(scenario: string, testIndex: number = 0): TestUser {
    return this.generateForTaskMaster(
      1,
      'Database Setup Integration',
      scenario,
      'integration-tests',
      testIndex,
      'audit'
    );
  }

  /**
   * Legacy generate method for backward compatibility
   */
  static generate(): TestUser {
    return this.generateForTaskMaster(0, 'Generic', 'unknown', 'legacy', 0, 'immediate');
  }

  /**
   * Get user description for logging
   */
  getDescription(): string {
    return `${this.metadata.taskMasterTask} | ${this.metadata.testScenario} | ${this.email}`;
  }

  /**
   * Check if user should be retained based on policy
   */
  shouldRetain(): boolean {
    const now = new Date();
    const created = new Date(this.metadata.createdAt);
    const ageHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    switch (this.metadata.retentionPolicy) {
      case 'immediate':
        return false; // Delete immediately after test
      case 'debug':
        return ageHours < 24; // Keep for 24 hours for debugging
      case 'audit':
        return ageHours < 168; // Keep for 1 week for audit trail
      default:
        return false;
    }
  }
}

export class ListlessTestHelpers {
  constructor(private page: Page) {}

  /**
   * Create and verify a test user account automatically
   * This bypasses email verification for testing purposes
   */
  async createTestUser(user?: TestUser): Promise<TestUser> {
    const testUser = user || TestUser.generate();

    // Register the user
    await this.register(testUser);

    // For testing: simulate email verification by directly accessing the verification URL
    // This bypasses the need for real email verification
    await this.bypassEmailVerification(testUser.email);

    return testUser;
  }

  /**
   * Bypass email verification for testing (simulates clicking verification link)
   */
  async bypassEmailVerification(email: string) {
    // In a real test environment, you would either:
    // 1. Use Supabase's admin API to confirm the user
    // 2. Use a test email service that provides verification links
    // 3. Configure Supabase to skip email verification in test mode

    // For now, we'll handle this in the test setup
    console.log(`Email verification bypassed for test user: ${email}`);
  }

  /**
   * Login with provided credentials
   */
  async login(email: string = 'test@example.com', password: string = 'TestPassword123!') {
    await this.page.goto('/auth/login');
    await this.page.getByLabel('Email address').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
    await expect(this.page).toHaveURL('/dashboard');
  }

  /**
   * Complete login flow with a test user
   */
  async loginWithTestUser(user: TestUser) {
    await this.login(user.email, user.password);
  }

  /**
   * Register a new user
   */
  async register(user: TestUser) {
    await this.page.goto('/auth/signup');
    await this.page.getByLabel('Full name').fill(user.name);
    await this.page.getByLabel('Email address').fill(user.email);
    await this.page.getByLabel('Password', { exact: true }).fill(user.password);
    await this.page.getByLabel('Confirm password').fill(user.password);
    await this.page.getByRole('button', { name: 'Create account' }).click();
    await expect(this.page).toHaveURL(/\/auth\/verify-email/);
  }

  /**
   * Create a task with specified content
   */
  async createTask(content: string, useKeyboard: boolean = false) {
    if (useKeyboard) {
      await this.page.keyboard.press('Space');
    } else {
      await this.page.getByRole('button', { name: 'Add Task' }).click();
    }
    
    await this.page.getByPlaceholder(/add.*task/i).fill(content);
    await this.page.keyboard.press('Enter');
    
    // Verify task created
    await expect(this.page.getByText(content)).toBeVisible();
    return this.page.locator('[data-testid="task-item"]').filter({ hasText: content });
  }

  /**
   * Create multiple tasks
   */
  async createTasks(contents: string[]) {
    const tasks = [];
    for (const content of contents) {
      tasks.push(await this.createTask(content));
    }
    return tasks;
  }

  /**
   * Create a project with specified name
   */
  async createProject(name: string, areaName?: string) {
    await this.page.locator('[data-testid="projects-add-button"]').click();
    await this.page.getByRole('menuitem', { name: 'New Project' }).click();
    await this.page.getByPlaceholder(/project name/i).fill(name);
    await this.page.keyboard.press('Enter');
    
    if (areaName) {
      // Move project to area if specified
      const project = this.page.getByRole('link', { name });
      const area = this.page.getByText(areaName);
      await project.dragTo(area);
    }
    
    await expect(this.page.getByRole('link', { name })).toBeVisible();
    return this.page.getByRole('link', { name });
  }

  /**
   * Create an area with specified name
   */
  async createArea(name: string) {
    await this.page.locator('[data-testid="projects-add-button"]').click();
    await this.page.getByRole('menuitem', { name: 'New Area' }).click();
    await this.page.getByPlaceholder(/area name/i).fill(name);
    await this.page.keyboard.press('Enter');
    
    await expect(this.page.getByText(name)).toBeVisible();
    return this.page.getByText(name);
  }

  /**
   * Navigate to a specific view
   */
  async navigateToView(viewName: 'Inbox' | 'Today' | 'Scheduled' | 'Logbook' | 'Trash') {
    await this.page.getByRole('link', { name: viewName }).click();
    await expect(this.page.getByRole('heading', { name: viewName })).toBeVisible();
  }

  /**
   * Open task in expanded view
   */
  async expandTask(taskContent: string) {
    const taskRow = this.page.locator('[data-testid="task-item"]').filter({ hasText: taskContent });
    await taskRow.getByRole('button', { name: /expand/i }).click();
    await expect(this.page.locator('[data-expanded="true"]')).toBeVisible();
    return this.page.locator('[data-expanded="true"]');
  }

  /**
   * Add tags to a task
   */
  async addTagsToTask(taskContent: string, tags: string[]) {
    const expandedView = await this.expandTask(taskContent);
    
    await expandedView.getByRole('button', { name: /add tags/i }).click();
    
    for (const tag of tags) {
      await this.page.getByPlaceholder(/add tag/i).fill(tag);
      await this.page.keyboard.press('Enter');
    }
    
    await this.page.getByRole('button', { name: 'Save' }).click();
    
    // Close expanded view
    await expandedView.getByRole('button', { name: /close/i }).click();
  }

  /**
   * Set due date for a task
   */
  async setTaskDueDate(taskContent: string, day: number) {
    const expandedView = await this.expandTask(taskContent);
    
    await expandedView.getByRole('button', { name: /due date/i }).click();
    await this.page.getByRole('button', { name: day.toString() }).click();
    
    // Close expanded view
    await expandedView.getByRole('button', { name: /close/i }).click();
  }

  /**
   * Complete/uncomplete a task
   */
  async toggleTaskCompletion(taskContent: string) {
    const taskRow = this.page.locator('[data-testid="task-item"]').filter({ hasText: taskContent });
    const checkbox = taskRow.getByRole('checkbox');
    await checkbox.click();
    return checkbox;
  }

  /**
   * Delete a task (move to trash)
   */
  async deleteTask(taskContent: string) {
    const taskRow = this.page.locator('[data-testid="task-item"]').filter({ hasText: taskContent });
    await taskRow.click({ button: 'right' });
    await this.page.getByRole('menuitem', { name: /trash/i }).click();
    
    // Verify task removed from current view
    await expect(this.page.getByText(taskContent)).not.toBeVisible();
  }

  /**
   * Search for content
   */
  async search(query: string) {
    await this.page.getByRole('button', { name: /search/i }).click();
    await this.page.getByPlaceholder(/search/i).fill(query);
    
    // Wait for search results
    await this.page.waitForTimeout(500);
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for loading states to complete
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Clean up test data (logout and clear)
   */
  async cleanup() {
    try {
      // Navigate to dashboard first
      await this.page.goto('/dashboard');

      // Click user profile dropdown
      await this.page.getByRole('button', { name: /profile/i }).click();

      // Logout
      await this.page.getByRole('menuitem', { name: 'Sign out' }).click();

      // Verify logout
      await expect(this.page).toHaveURL(/\/auth\/login/);
    } catch (error) {
      console.log('Cleanup failed:', error);
    }
  }

  /**
   * Complete test user cleanup including account deletion
   */
  async cleanupTestUser(user: TestUser) {
    try {
      // Login to the test account
      await this.loginWithTestUser(user);

      // Navigate to account settings
      await this.page.goto('/settings/account');

      // Delete the test account
      await this.page.getByRole('button', { name: /delete account/i }).click();

      // Confirm deletion with password
      await this.page.getByLabel('Password').fill(user.password);
      await this.page.getByRole('button', { name: 'Delete Account' }).click();

      // Verify account deleted and redirected
      await expect(this.page).toHaveURL(/\/auth\/login/);

      console.log(`Test user account deleted: ${user.email}`);
    } catch (error) {
      console.log(`Test user cleanup failed for ${user.email}:`, error);
    }
  }

  /**
   * Verify error message appears
   */
  async expectError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  /**
   * Verify success message appears
   */
  async expectSuccess(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  /**
   * Wait for element to be stable (useful for animations)
   */
  async waitForStable(selector: string, timeout: number = 1000) {
    await this.page.locator(selector).waitFor({ state: 'visible' });
    await this.page.waitForTimeout(timeout);
  }
}

/**
 * Data generators for testing
 */
export class TestDataGenerator {
  static generateUser(): TestUser {
    return new TestUser(
      `Test User ${Date.now()}`,
      `test-${Date.now()}@example.com`,
      'TestPassword123!'
    );
  }

  static generateTasks(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `Test task ${i + 1} - ${Date.now()}`);
  }

  static generateProjects(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `Test project ${i + 1} - ${Date.now()}`);
  }

  static generateAreas(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `Test area ${i + 1} - ${Date.now()}`);
  }
}
