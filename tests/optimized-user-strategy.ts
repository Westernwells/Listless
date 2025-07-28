import { test as setup, expect } from '@playwright/test';
import { TestUser } from './test-utils';

/**
 * Optimized User Strategy for Listless Playwright Tests
 * Combines performance optimization with complete test isolation
 */

export interface TestSuiteConfig {
  userCount: number;
  parallel: boolean;
  cleanup: boolean;
}

export const TEST_SUITE_CONFIGS = {
  auth: { userCount: 6, parallel: false, cleanup: true },      // Sequential auth tests
  tasks: { userCount: 8, parallel: true, cleanup: true },      // Parallel task tests  
  projects: { userCount: 7, parallel: true, cleanup: true },   // Parallel project tests
  integration: { userCount: 3, parallel: false, cleanup: true } // Cross-feature tests
} as const;

/**
 * Batch User Manager - Optimized for performance and reliability
 */
export class BatchUserManager {
  private static userPools = new Map<string, TestUser[]>();
  private static createdUserIds = new Set<string>();

  /**
   * Create a batch of test users for a test suite
   */
  static async createUserBatch(suiteId: string, count: number): Promise<TestUser[]> {
    console.log(`🏭 Creating batch of ${count} users for suite: ${suiteId}`);
    
    const startTime = Date.now();
    
    // Create users in parallel for better performance
    const userPromises = Array(count).fill(null).map(async (_, index) => {
      const user = TestUser.generate();
      user.email = `${suiteId}-test-${index}-${Date.now()}@example.com`;
      
      // Create user via Supabase Admin API
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
            name: user.name,
            test_suite: suiteId,
            created_at: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create user ${index} for suite ${suiteId}: ${response.statusText}`);
      }

      const result = await response.json();
      user.id = result.user.id;
      
      // Track created user for cleanup
      this.createdUserIds.add(user.id);
      
      return user;
    });

    const users = await Promise.all(userPromises);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Created ${users.length} users for ${suiteId} in ${duration}ms`);
    
    // Store in pool for access
    this.userPools.set(suiteId, users);
    
    return users;
  }

  /**
   * Get a dedicated user for a specific test
   */
  static getDedicatedUser(suiteId: string, testIndex: number): TestUser {
    const users = this.userPools.get(suiteId);
    if (!users) {
      throw new Error(`No user pool found for suite: ${suiteId}`);
    }
    
    const user = users[testIndex % users.length];
    if (!user) {
      throw new Error(`No user available at index ${testIndex} for suite: ${suiteId}`);
    }
    
    return user;
  }

  /**
   * Delete a batch of test users
   */
  static async deleteUserBatch(suiteId: string): Promise<void> {
    const users = this.userPools.get(suiteId);
    if (!users) {
      console.warn(`No users to delete for suite: ${suiteId}`);
      return;
    }

    console.log(`🧹 Deleting ${users.length} users for suite: ${suiteId}`);
    
    const startTime = Date.now();
    
    // Delete users in parallel
    const deletePromises = users.map(async (user) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
          }
        });

        if (!response.ok) {
          console.warn(`Failed to delete user ${user.email}: ${response.statusText}`);
        } else {
          this.createdUserIds.delete(user.id);
        }
      } catch (error) {
        console.warn(`Error deleting user ${user.email}:`, error);
      }
    });

    await Promise.all(deletePromises);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Deleted users for ${suiteId} in ${duration}ms`);
    
    // Remove from pool
    this.userPools.delete(suiteId);
  }

  /**
   * Emergency cleanup - delete all created test users
   */
  static async emergencyCleanup(): Promise<void> {
    console.log('🚨 Emergency cleanup: deleting all test users...');
    
    const suiteIds = Array.from(this.userPools.keys());
    const cleanupPromises = suiteIds.map(suiteId => this.deleteUserBatch(suiteId));
    
    await Promise.all(cleanupPromises);
    
    console.log('✅ Emergency cleanup completed');
  }

  /**
   * Get statistics about created users
   */
  static getStats() {
    const totalUsers = Array.from(this.userPools.values()).reduce((sum, users) => sum + users.length, 0);
    const suiteCount = this.userPools.size;
    
    return {
      totalUsers,
      suiteCount,
      suites: Array.from(this.userPools.keys()),
      createdUserIds: Array.from(this.createdUserIds)
    };
  }
}

/**
 * Test Suite Helper - Manages users for a specific test suite
 */
export class TestSuiteHelper {
  private suiteId: string;
  private config: TestSuiteConfig;
  private users: TestUser[] = [];

  constructor(suiteId: string, config: TestSuiteConfig) {
    this.suiteId = suiteId;
    this.config = config;
  }

  /**
   * Setup users for the test suite
   */
  async setup(): Promise<void> {
    this.users = await BatchUserManager.createUserBatch(this.suiteId, this.config.userCount);
  }

  /**
   * Get a dedicated user for a test
   */
  getUserForTest(testIndex: number): TestUser {
    return BatchUserManager.getDedicatedUser(this.suiteId, testIndex);
  }

  /**
   * Cleanup users after test suite
   */
  async cleanup(): Promise<void> {
    if (this.config.cleanup) {
      await BatchUserManager.deleteUserBatch(this.suiteId);
    }
  }

  /**
   * Verify user isolation (for debugging)
   */
  async verifyIsolation(page: any, testIndex: number): Promise<void> {
    const user = this.getUserForTest(testIndex);
    
    // Login as the test user
    await page.goto('/auth/login');
    await page.getByLabel('Email address').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Verify clean slate
    await page.goto('/dashboard');
    
    const taskCount = await page.locator('[data-testid="task-item"]').count();
    const projectCount = await page.locator('[data-testid="project-item"]').count();
    
    expect(taskCount).toBe(0);
    expect(projectCount).toBe(0);
    
    console.log(`✅ User isolation verified for ${user.email}`);
  }
}

/**
 * Global test setup with optimized user management
 */
setup('optimized user setup', async () => {
  console.log('🚀 Starting optimized Playwright test setup...');
  
  // Verify environment
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
  await BatchUserManager.emergencyCleanup();
  
  console.log('✅ Optimized test setup completed');
});

/**
 * Global test teardown
 */
setup('optimized user teardown', async () => {
  console.log('🧹 Starting optimized test teardown...');
  
  // Final cleanup
  await BatchUserManager.emergencyCleanup();
  
  const stats = BatchUserManager.getStats();
  console.log('📊 Final stats:', stats);
  
  console.log('✅ Optimized test teardown completed');
});

/**
 * Usage example for test files
 */
export function createSuiteHelper(suiteId: keyof typeof TEST_SUITE_CONFIGS) {
  const config = TEST_SUITE_CONFIGS[suiteId];
  return new TestSuiteHelper(suiteId, config);
}

// Export for use in test files
export { TestUser } from './test-utils';
