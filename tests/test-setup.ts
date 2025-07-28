import { test as setup, expect } from '@playwright/test';
import { TestUser, ListlessTestHelpers } from './test-utils';

/**
 * Test setup utilities for Listless application
 * Handles test user creation, email verification bypass, and data isolation
 */

export class TestSetup {
  /**
   * Create a verified test user using Supabase Admin API
   * This bypasses email verification for testing purposes
   */
  static async createVerifiedTestUser(): Promise<TestUser> {
    const user = TestUser.generate();
    
    // Use Supabase Admin API to create and verify user
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        email_confirm: true, // Skip email verification
        user_metadata: {
          name: user.name
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create test user: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Created verified test user: ${user.email}`);
    
    return user;
  }

  /**
   * Delete test user using Supabase Admin API
   */
  static async deleteTestUser(userId: string): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
      }
    });

    if (!response.ok) {
      console.warn(`Failed to delete test user ${userId}: ${response.statusText}`);
    } else {
      console.log(`✅ Deleted test user: ${userId}`);
    }
  }

  /**
   * Clean up all test users (for maintenance)
   */
  static async cleanupAllTestUsers(): Promise<void> {
    try {
      // Get all users with test email pattern
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const { users } = await response.json();
      const testUsers = users.filter((user: any) => 
        user.email?.includes('playwright-test-') || 
        user.email?.includes('@listless-testing.local')
      );

      console.log(`🧹 Cleaning up ${testUsers.length} test users...`);

      for (const user of testUsers) {
        await this.deleteTestUser(user.id);
      }

      console.log('✅ Test user cleanup completed');
    } catch (error) {
      console.warn('Test user cleanup failed:', error);
    }
  }
}

/**
 * Global test setup - runs before all tests
 */
setup('global setup', async () => {
  console.log('🚀 Starting Playwright test setup for Listless...');
  
  // Verify environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Clean up any existing test users
  await TestSetup.cleanupAllTestUsers();
  
  console.log('✅ Global test setup completed');
});

/**
 * Global test teardown - runs after all tests
 */
setup('global teardown', async () => {
  console.log('🧹 Starting Playwright test teardown...');
  
  // Clean up test users
  await TestSetup.cleanupAllTestUsers();
  
  console.log('✅ Global test teardown completed');
});

/**
 * Test isolation utilities
 */
export class TestIsolation {
  /**
   * Create isolated test environment for a single test
   */
  static async createIsolatedTest() {
    const user = await TestSetup.createVerifiedTestUser();
    
    return {
      user,
      cleanup: async () => {
        // User will be cleaned up in global teardown
        console.log(`Test completed for user: ${user.email}`);
      }
    };
  }

  /**
   * Verify test data isolation
   */
  static async verifyDataIsolation(page: any, user: TestUser) {
    const helpers = new ListlessTestHelpers(page);
    
    // Login as test user
    await helpers.loginWithTestUser(user);
    
    // Verify empty state (no data from other tests/users)
    await page.goto('/dashboard');
    
    // Should see empty inbox
    const taskCount = await page.locator('[data-testid="task-item"]').count();
    expect(taskCount).toBe(0);
    
    // Should see no projects
    const projectCount = await page.locator('[data-testid="project-item"]').count();
    expect(projectCount).toBe(0);
    
    console.log(`✅ Data isolation verified for user: ${user.email}`);
  }
}

/**
 * Email verification bypass for testing
 */
export class EmailVerificationBypass {
  /**
   * Simulate email verification click for testing
   * In a real test environment, this would use the verification token
   */
  static async simulateEmailVerification(email: string): Promise<void> {
    // This is handled by creating users with email_confirm: true
    // in the TestSetup.createVerifiedTestUser method
    console.log(`📧 Email verification bypassed for: ${email}`);
  }

  /**
   * Handle password reset email for testing
   */
  static async simulatePasswordResetClick(email: string): Promise<string> {
    // In a real test environment, you would:
    // 1. Use a test email service like MailHog or Ethereal
    // 2. Extract the reset link from the email
    // 3. Return the reset URL for the test to navigate to
    
    console.log(`🔑 Password reset simulation for: ${email}`);
    return '/auth/update-password?token=test-token';
  }
}

/**
 * Test data generators with isolation
 */
export class IsolatedTestData {
  /**
   * Generate test data that won't conflict with other tests
   */
  static generateUniqueTestData(testName: string) {
    const timestamp = Date.now();
    const testId = `${testName}-${timestamp}`;
    
    return {
      tasks: [
        `Task 1 for ${testId}`,
        `Task 2 for ${testId}`,
        `Task 3 for ${testId}`
      ],
      projects: [
        `Project A for ${testId}`,
        `Project B for ${testId}`
      ],
      areas: [
        `Area X for ${testId}`,
        `Area Y for ${testId}`
      ],
      tags: [
        `tag-${testId}-1`,
        `tag-${testId}-2`
      ]
    };
  }
}
