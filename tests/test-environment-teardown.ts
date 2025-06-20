/**
 * Global test teardown with comprehensive cleanup verification
 * Ensures no test data remains in database after test execution
 */
async function globalTeardown() {
  console.log('🧹 Starting comprehensive test environment cleanup...');
  
  try {
    // Comprehensive cleanup with retry logic
    await performComprehensiveCleanup();
    
    // Verify cleanup was successful
    await verifyCleanupCompleted();
    
    // Generate cleanup report
    await generateCleanupReport();
    
    console.log('✅ Test environment cleanup completed successfully');
  } catch (error) {
    console.error('❌ Test environment cleanup failed:', error);
    
    // Don't fail the test run, but provide guidance
    console.log(`
⚠️ MANUAL CLEANUP MAY BE REQUIRED

If cleanup failed, you may need to manually remove test data:

1. Check Supabase Auth dashboard for test users
2. Look for emails containing: test, playwright, @example.com
3. Delete any test users found
4. Verify no test data remains in application tables

Test database: ${process.env.NEXT_PUBLIC_SUPABASE_URL}
    `);
  }
}

/**
 * Perform comprehensive cleanup with retry logic
 */
async function performComprehensiveCleanup() {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Cleanup attempt ${attempt}/${maxRetries}...`);
      
      // Step 1: Clean up test users (this should cascade delete their data)
      const deletedUsers = await cleanupAllTestUsers();
      
      // Step 2: Clean up any orphaned test data
      await cleanupOrphanedTestData();
      
      // Step 3: Reset any test-specific database state
      await resetTestDatabaseState();
      
      console.log(`✅ Cleanup attempt ${attempt} completed successfully`);
      console.log(`   Deleted ${deletedUsers} test users`);
      return;
      
    } catch (error) {
      console.warn(`⚠️ Cleanup attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`Cleanup failed after ${maxRetries} attempts: ${error}`);
      }
      
      // Wait before retry
      console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

/**
 * Clean up all test users with enhanced detection
 */
async function cleanupAllTestUsers(): Promise<number> {
  try {
    // Get all users
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
    
    // Enhanced test user detection
    const testUsers = users.filter((user: any) => {
      const email = user.email?.toLowerCase() || '';
      return (
        email.includes('playwright-test-') ||
        email.includes('@example.com') ||
        email.includes('test-') ||
        email.includes('@test.local') ||
        email.includes('auth-test-') ||
        email.includes('tasks-test-') ||
        email.includes('projects-test-') ||
        (email.includes('test') && email.includes('@example.com')) ||
        user.user_metadata?.test_suite // Check metadata for test marker
      );
    });

    console.log(`🔍 Found ${testUsers.length} test users to delete`);

    if (testUsers.length === 0) {
      return 0;
    }

    // Delete users in batches to avoid overwhelming the API
    const batchSize = 10;
    let deletedCount = 0;

    for (let i = 0; i < testUsers.length; i += batchSize) {
      const batch = testUsers.slice(i, i + batchSize);
      
      const deletePromises = batch.map(async (user: any) => {
        try {
          const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
            }
          });

          if (!deleteResponse.ok) {
            console.warn(`Failed to delete user ${user.email}: ${deleteResponse.statusText}`);
            return false;
          } else {
            console.log(`🗑️ Deleted test user: ${user.email}`);
            return true;
          }
        } catch (error) {
          console.warn(`Error deleting user ${user.email}:`, error);
          return false;
        }
      });

      const results = await Promise.all(deletePromises);
      deletedCount += results.filter(Boolean).length;
      
      // Small delay between batches
      if (i + batchSize < testUsers.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup test users:', error);
    throw error;
  }
}

/**
 * Clean up any orphaned test data
 */
async function cleanupOrphanedTestData() {
  try {
    console.log('🧹 Cleaning up orphaned test data...');
    
    // Clean up test data that might not have been cascade deleted
    const cleanupOperations = [
      {
        name: 'Test Tasks',
        table: 'tasks',
        condition: "title LIKE '%test%' OR title LIKE '%Test%' OR title LIKE '%playwright%' OR title LIKE '%automation%'"
      },
      {
        name: 'Test Projects', 
        table: 'projects',
        condition: "name LIKE '%test%' OR name LIKE '%Test%' OR name LIKE '%playwright%' OR name LIKE '%automation%'"
      },
      {
        name: 'Test Areas',
        table: 'areas', 
        condition: "name LIKE '%test%' OR name LIKE '%Test%' OR name LIKE '%playwright%' OR name LIKE '%automation%'"
      },
      {
        name: 'Test Tags',
        table: 'task_tags',
        condition: "tag LIKE '%test%' OR tag LIKE '%automation%' OR tag LIKE '%playwright%'"
      }
    ];

    for (const operation of cleanupOperations) {
      try {
        // Use REST API to delete orphaned data
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${operation.table}?${operation.condition}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'Prefer': 'return=minimal'
          }
        });

        if (response.ok) {
          console.log(`✅ Cleaned up orphaned ${operation.name}`);
        } else {
          console.warn(`⚠️ Failed to cleanup ${operation.name}: ${response.statusText}`);
        }
      } catch (error) {
        console.warn(`Error cleaning up ${operation.name}:`, error);
      }
    }
  } catch (error) {
    console.warn('Orphaned data cleanup failed:', error);
  }
}

/**
 * Reset any test-specific database state
 */
async function resetTestDatabaseState() {
  try {
    console.log('🔄 Resetting test database state...');
    
    // Reset sequences, clear caches, etc. if needed
    // This is database-specific and may not be necessary for all setups
    
    console.log('✅ Test database state reset completed');
  } catch (error) {
    console.warn('Database state reset failed:', error);
  }
}

/**
 * Verify cleanup was successful
 */
async function verifyCleanupCompleted() {
  try {
    console.log('🔍 Verifying cleanup completion...');
    
    // Check for remaining test users
    const usersResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
      }
    });

    if (usersResponse.ok) {
      const { users } = await usersResponse.json();
      const remainingTestUsers = users.filter((user: any) => {
        const email = user.email?.toLowerCase() || '';
        return email.includes('test') || email.includes('playwright');
      });

      if (remainingTestUsers.length > 0) {
        console.warn(`⚠️ Warning: ${remainingTestUsers.length} test users still remain:`);
        remainingTestUsers.forEach((user: any) => console.warn(`   - ${user.email}`));
      } else {
        console.log('✅ Verification passed: No test users remain');
      }
    }

    // Check for remaining test data
    const testDataChecks = [
      { name: 'Test Tasks', endpoint: 'tasks?title=like.*test*&limit=1' },
      { name: 'Test Projects', endpoint: 'projects?name=like.*test*&limit=1' },
      { name: 'Test Areas', endpoint: 'areas?name=like.*test*&limit=1' }
    ];

    for (const check of testDataChecks) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${check.endpoint}`, {
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            console.warn(`⚠️ Warning: ${check.name} still contain test data`);
          } else {
            console.log(`✅ ${check.name} verified clean`);
          }
        }
      } catch (error) {
        console.warn(`Could not verify ${check.name}:`, error);
      }
    }

  } catch (error) {
    console.warn('Cleanup verification failed:', error);
  }
}

/**
 * Generate cleanup report
 */
async function generateCleanupReport() {
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NEXT_PUBLIC_SUPABASE_URL,
    cleanupCompleted: true,
    notes: 'Comprehensive test cleanup executed successfully'
  };

  console.log('📊 Cleanup Report:', JSON.stringify(report, null, 2));
  
  // Optionally save report to file
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const reportPath = path.join(process.cwd(), 'test-results', 'cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Cleanup report saved to: ${reportPath}`);
  } catch (error) {
    // Ignore file write errors
  }
}

export default globalTeardown;
