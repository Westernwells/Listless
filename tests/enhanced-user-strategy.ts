import { TestUser, TestUserMetadata } from './test-utils';

/**
 * Enhanced User Management Strategy with Retention Policies
 * Optimizes debugging capabilities while maintaining database cleanliness
 */

export interface RetentionConfig {
  immediate: number;    // 0 hours - delete immediately
  debug: number;        // 24 hours - keep for debugging
  audit: number;        // 168 hours (1 week) - keep for audit trail
  maxUsers: number;     // Maximum users to retain per policy
}

export const DEFAULT_RETENTION_CONFIG: RetentionConfig = {
  immediate: 0,
  debug: 24,
  audit: 168,
  maxUsers: 100
};

/**
 * Enhanced Batch User Manager with Retention Policies
 */
export class EnhancedUserManager {
  private static retentionConfig: RetentionConfig = DEFAULT_RETENTION_CONFIG;
  private static userRegistry = new Map<string, TestUser[]>();

  /**
   * Create a batch of descriptive test users for TaskMaster AI task validation
   */
  static async createTaskMasterUserBatch(
    taskNumber: number,
    taskName: string,
    testScenarios: string[],
    testSuite: string,
    retentionPolicy: 'immediate' | 'debug' | 'audit' = 'debug'
  ): Promise<TestUser[]> {
    console.log(`🏭 Creating TaskMaster ${taskNumber} user batch: ${taskName}`);
    console.log(`   Test scenarios: ${testScenarios.join(', ')}`);
    console.log(`   Retention policy: ${retentionPolicy}`);
    
    const startTime = Date.now();
    const users: TestUser[] = [];

    // Create users for each test scenario
    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      const user = TestUser.generateForTaskMaster(
        taskNumber,
        taskName,
        scenario,
        testSuite,
        i,
        retentionPolicy
      );

      // Create user via Supabase Admin API with enhanced metadata
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
          email_confirm: true,
          user_metadata: {
            name: user.name,
            // Enhanced metadata for tracking and debugging
            taskmaster_task: user.metadata.taskMasterTask,
            test_scenario: user.metadata.testScenario,
            test_suite: user.metadata.testSuite,
            test_run_id: user.metadata.testRunId,
            created_at: user.metadata.createdAt,
            retention_policy: user.metadata.retentionPolicy,
            debug_info: user.metadata.debugInfo,
            // Additional tracking fields
            test_purpose: `Validate ${taskName} - ${scenario}`,
            auto_cleanup: retentionPolicy === 'immediate',
            expires_at: this.calculateExpirationTime(retentionPolicy)
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to create user for ${scenario}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to create user for ${scenario}: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      // Handle different response structures from Supabase Admin API
      if (result.id) {
        // Direct user object response
        user.id = result.id;
      } else if (result.user && result.user.id) {
        // Nested user object response
        user.id = result.user.id;
      } else {
        console.error('Unexpected API response structure:', result);
        throw new Error(`Unexpected API response structure for ${scenario}. Expected user ID but got: ${JSON.stringify(result)}`);
      }
      users.push(user);

      console.log(`✅ Created: ${user.getDescription()}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Created ${users.length} TaskMaster ${taskNumber} users in ${duration}ms`);

    // Register users for tracking
    this.userRegistry.set(`taskmaster-${taskNumber}-${testSuite}`, users);

    return users;
  }

  /**
   * Create users for specific TaskMaster AI tasks
   */
  static async createAuthTestUsers(): Promise<TestUser[]> {
    const scenarios = [
      'user-registration',
      'user-login',
      'password-reset',
      'logout-functionality',
      'session-persistence',
      'form-validation'
    ];

    return this.createTaskMasterUserBatch(
      2,
      'Authentication System',
      scenarios,
      'auth-tests',
      'debug'
    );
  }

  static async createTaskManagementUsers(): Promise<TestUser[]> {
    const scenarios = [
      'task-creation-button',
      'task-creation-keyboard',
      'task-inline-editing',
      'task-completion-toggle',
      'task-expanded-view',
      'task-context-menu',
      'task-drag-drop',
      'task-multi-selection'
    ];

    return this.createTaskMasterUserBatch(
      3,
      'Task Management API',
      scenarios,
      'task-tests',
      'debug'
    );
  }

  static async createProjectManagementUsers(): Promise<TestUser[]> {
    const scenarios = [
      'project-creation',
      'area-creation',
      'task-to-project-conversion',
      'project-detail-view',
      'area-expansion-collapse',
      'project-deletion-cascade',
      'project-organization'
    ];

    return this.createTaskMasterUserBatch(
      4,
      'Project Area Management API',
      scenarios,
      'project-tests',
      'debug'
    );
  }

  static async createIntegrationTestUsers(): Promise<TestUser[]> {
    const scenarios = [
      'database-persistence',
      'cross-feature-integration',
      'data-consistency'
    ];

    return this.createTaskMasterUserBatch(
      1,
      'Database Setup Integration',
      scenarios,
      'integration-tests',
      'audit'
    );
  }

  /**
   * Smart cleanup based on retention policies
   */
  static async performSmartCleanup(): Promise<{
    deleted: number;
    retained: number;
    retentionBreakdown: Record<string, number>;
  }> {
    console.log('🧹 Performing smart cleanup with retention policies...');

    // Get all test users
    const allUsers = await this.getAllTestUsers();
    
    let deletedCount = 0;
    let retainedCount = 0;
    const retentionBreakdown: Record<string, number> = {
      immediate: 0,
      debug: 0,
      audit: 0
    };

    for (const user of allUsers) {
      const shouldRetain = this.shouldRetainUser(user);
      
      if (shouldRetain) {
        retainedCount++;
        retentionBreakdown[user.user_metadata?.retention_policy || 'debug']++;
        console.log(`📌 Retaining: ${user.email} (${user.user_metadata?.retention_policy})`);
      } else {
        try {
          await this.deleteUser(user.id);
          deletedCount++;
          console.log(`🗑️ Deleted: ${user.email}`);
        } catch (error) {
          console.warn(`Failed to delete ${user.email}:`, error);
        }
      }
    }

    // Enforce maximum user limits per policy
    await this.enforceUserLimits();

    const result = {
      deleted: deletedCount,
      retained: retainedCount,
      retentionBreakdown
    };

    console.log('📊 Smart cleanup results:', result);
    return result;
  }

  /**
   * Get all test users with metadata
   */
  private static async getAllTestUsers(): Promise<any[]> {
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
    
    // Filter for test users
    return users.filter((user: any) => {
      const email = user.email?.toLowerCase() || '';
      return (
        email.includes('@example.com') ||
        email.includes('tm1-') || email.includes('tm2-') || 
        email.includes('tm3-') || email.includes('tm4-') ||
        user.user_metadata?.taskmaster_task
      );
    });
  }

  /**
   * Determine if user should be retained based on policy and age
   */
  private static shouldRetainUser(user: any): boolean {
    const metadata = user.user_metadata;
    if (!metadata) return false;

    const retentionPolicy = metadata.retention_policy || 'immediate';
    const createdAt = new Date(metadata.created_at || user.created_at);
    const now = new Date();
    const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    const retentionHours = this.retentionConfig[retentionPolicy as keyof RetentionConfig];
    
    return ageHours < retentionHours;
  }

  /**
   * Delete a specific user
   */
  private static async deleteUser(userId: string): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user ${userId}: ${response.statusText}`);
    }
  }

  /**
   * Enforce maximum user limits per retention policy
   */
  private static async enforceUserLimits(): Promise<void> {
    const allUsers = await this.getAllTestUsers();
    
    // Group users by retention policy
    const usersByPolicy: Record<string, any[]> = {
      immediate: [],
      debug: [],
      audit: []
    };

    allUsers.forEach(user => {
      const policy = user.user_metadata?.retention_policy || 'debug';
      if (usersByPolicy[policy]) {
        usersByPolicy[policy].push(user);
      }
    });

    // Enforce limits (delete oldest users if over limit)
    for (const [policy, users] of Object.entries(usersByPolicy)) {
      if (users.length > this.retentionConfig.maxUsers) {
        // Sort by creation date (oldest first)
        users.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        const usersToDelete = users.slice(0, users.length - this.retentionConfig.maxUsers);
        
        for (const user of usersToDelete) {
          try {
            await this.deleteUser(user.id);
            console.log(`🗑️ Deleted (limit enforcement): ${user.email}`);
          } catch (error) {
            console.warn(`Failed to delete ${user.email}:`, error);
          }
        }
      }
    }
  }

  /**
   * Calculate expiration time for retention policy
   */
  private static calculateExpirationTime(retentionPolicy: string): string {
    const now = new Date();
    const hours = this.retentionConfig[retentionPolicy as keyof RetentionConfig] || 0;
    const expirationTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    return expirationTime.toISOString();
  }

  /**
   * Generate test user report for debugging
   */
  static async generateUserReport(): Promise<{
    totalUsers: number;
    byTask: Record<string, number>;
    byRetentionPolicy: Record<string, number>;
    byAge: Record<string, number>;
    oldestUser: string;
    newestUser: string;
  }> {
    const allUsers = await this.getAllTestUsers();
    
    const report = {
      totalUsers: allUsers.length,
      byTask: {} as Record<string, number>,
      byRetentionPolicy: {} as Record<string, number>,
      byAge: {} as Record<string, number>,
      oldestUser: '',
      newestUser: ''
    };

    // Analyze users
    let oldestDate = new Date();
    let newestDate = new Date(0);

    allUsers.forEach(user => {
      const metadata = user.user_metadata;
      const createdAt = new Date(user.created_at);
      
      // Track by task
      const task = metadata?.taskmaster_task || 'Unknown';
      report.byTask[task] = (report.byTask[task] || 0) + 1;
      
      // Track by retention policy
      const policy = metadata?.retention_policy || 'unknown';
      report.byRetentionPolicy[policy] = (report.byRetentionPolicy[policy] || 0) + 1;
      
      // Track by age
      const ageHours = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      const ageCategory = ageHours < 1 ? '<1h' : ageHours < 24 ? '<24h' : ageHours < 168 ? '<1w' : '>1w';
      report.byAge[ageCategory] = (report.byAge[ageCategory] || 0) + 1;
      
      // Track oldest/newest
      if (createdAt < oldestDate) {
        oldestDate = createdAt;
        report.oldestUser = user.email;
      }
      if (createdAt > newestDate) {
        newestDate = createdAt;
        report.newestUser = user.email;
      }
    });

    console.log('📊 Test User Report:', report);
    return report;
  }
}
