import { validateTestEnvironment } from './playwright-test.config';

/**
 * Global test setup with comprehensive environment verification
 * Ensures tests never run against production database
 */
async function globalSetup() {
  console.log('🚀 Starting Playwright test environment setup...');
  
  // CRITICAL: Validate test environment before any operations
  const environment = validateTestEnvironment();
  
  // Verify required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingVars.length > 0) {
    throw new Error(`
❌ Missing required environment variables: ${missingVars.join(', ')}

Please ensure .env.test file exists with proper test environment credentials.
    `);
  }

  // Test database connectivity
  await testDatabaseConnectivity();
  
  // Clean up any existing test data
  await cleanupExistingTestData();
  
  // Verify clean state
  await verifyCleanTestEnvironment();
  
  console.log('✅ Test environment setup completed successfully');
  console.log(`   Environment: ${environment.isLocal ? 'Local Supabase' : 'Test Supabase Project'}`);
  console.log(`   Database: ${environment.supabaseUrl}`);
}

/**
 * Test database connectivity
 */
async function testDatabaseConnectivity() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
      }
    });

    if (!response.ok) {
      throw new Error(`Database connectivity test failed: ${response.status} ${response.statusText}`);
    }

    console.log('✅ Database connectivity verified');
  } catch (error) {
    throw new Error(`
❌ Failed to connect to test database: ${error}

Please verify:
1. Test Supabase instance is running
2. Environment variables are correct
3. Network connectivity is available
    `);
  }
}

/**
 * Clean up any existing test data from previous runs
 */
async function cleanupExistingTestData() {
  console.log('🧹 Cleaning up existing test data...');
  
  try {
    // Clean up test users
    await cleanupTestUsers();
    
    // Clean up test application data
    await cleanupTestApplicationData();
    
    console.log('✅ Existing test data cleaned up');
  } catch (error) {
    console.warn('⚠️ Test data cleanup failed (this may be normal for first run):', error);
  }
}

/**
 * Clean up test users from previous runs
 */
async function cleanupTestUsers() {
  try {
    // Get all users with test email patterns
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
      user.email?.includes('@listless-testing.local') ||
      user.email?.includes('test-') ||
      user.email?.includes('@test.local')
    );

    console.log(`🔍 Found ${testUsers.length} existing test users to clean up`);

    // Delete test users in parallel
    const deletePromises = testUsers.map(async (user: any) => {
      try {
        const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
          }
        });

        if (!deleteResponse.ok) {
          console.warn(`Failed to delete test user ${user.email}: ${deleteResponse.statusText}`);
        } else {
          console.log(`🗑️ Deleted test user: ${user.email}`);
        }
      } catch (error) {
        console.warn(`Error deleting test user ${user.email}:`, error);
      }
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.warn('Test user cleanup failed:', error);
  }
}

/**
 * Clean up test application data
 */
async function cleanupTestApplicationData() {
  // Note: This assumes test users have been deleted first
  // which should cascade delete their associated data due to foreign key constraints
  
  try {
    // Additional cleanup for any orphaned test data
    const cleanupQueries = [
      "DELETE FROM tasks WHERE title LIKE '%test%' OR title LIKE '%Test%' OR title LIKE '%playwright%'",
      "DELETE FROM projects WHERE name LIKE '%test%' OR name LIKE '%Test%' OR name LIKE '%playwright%'",
      "DELETE FROM areas WHERE name LIKE '%test%' OR name LIKE '%Test%' OR name LIKE '%playwright%'"
    ];

    for (const query of cleanupQueries) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query })
        });

        if (!response.ok) {
          console.warn(`Cleanup query failed: ${query}`);
        }
      } catch (error) {
        console.warn(`Error executing cleanup query: ${query}`, error);
      }
    }
  } catch (error) {
    console.warn('Application data cleanup failed:', error);
  }
}

/**
 * Verify test environment is in clean state
 */
async function verifyCleanTestEnvironment() {
  try {
    // Verify no test users exist
    const usersResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
      }
    });

    if (usersResponse.ok) {
      const { users } = await usersResponse.json();
      const testUsers = users.filter((user: any) => 
        user.email?.includes('test') || user.email?.includes('playwright')
      );

      if (testUsers.length > 0) {
        console.warn(`⚠️ Warning: ${testUsers.length} test users still exist in database`);
        testUsers.forEach((user: any) => console.warn(`   - ${user.email}`));
      } else {
        console.log('✅ Test environment verified clean - no test users found');
      }
    }

    // Verify database schema exists
    const schemaResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tasks?limit=0`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
      }
    });

    if (!schemaResponse.ok) {
      throw new Error(`
❌ Test database schema verification failed: ${schemaResponse.status}

This suggests the test database may not have the required schema.
Please ensure:
1. Test database has been set up with proper migrations
2. All required tables exist (tasks, projects, areas, etc.)
3. RLS policies are configured
      `);
    }

    console.log('✅ Test database schema verified');

  } catch (error) {
    console.warn('Test environment verification failed:', error);
  }
}

export default globalSetup;
