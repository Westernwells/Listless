/**
 * Database setup validation and testing utilities
 * Run this after setting up the database to ensure everything works correctly
 */

import { createClient } from './client'
import { createServiceClient } from './server'

export interface DatabaseTestResult {
  test: string
  passed: boolean
  error?: string
  details?: any
}

export class DatabaseTester {
  private client = createClient()
  private serviceClient = createServiceClient()

  async runAllTests(): Promise<DatabaseTestResult[]> {
    const results: DatabaseTestResult[] = []

    // Test database connection
    results.push(await this.testConnection())

    // Test pgvector extension
    results.push(await this.testPgVectorExtension())

    // Test table creation
    results.push(await this.testTablesExist())

    // Test RLS policies
    results.push(await this.testRLSPolicies())

    // Test functions
    results.push(await this.testDatabaseFunctions())

    // Test indexes
    results.push(await this.testIndexes())

    // Test triggers
    results.push(await this.testTriggers())

    return results
  }

  private async testConnection(): Promise<DatabaseTestResult> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('count')
        .limit(1)

      if (error) {
        return {
          test: 'Database Connection',
          passed: false,
          error: error.message
        }
      }

      return {
        test: 'Database Connection',
        passed: true,
        details: 'Successfully connected to database'
      }
    } catch (error) {
      return {
        test: 'Database Connection',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async testPgVectorExtension(): Promise<DatabaseTestResult> {
    try {
      const { data, error } = await this.serviceClient
        .rpc('sql', {
          query: "SELECT extname FROM pg_extension WHERE extname = 'vector'"
        })

      if (error) {
        return {
          test: 'pgvector Extension',
          passed: false,
          error: error.message
        }
      }

      const hasVector = data && data.length > 0
      return {
        test: 'pgvector Extension',
        passed: hasVector,
        error: hasVector ? undefined : 'pgvector extension not found',
        details: hasVector ? 'pgvector extension is installed' : undefined
      }
    } catch (error) {
      return {
        test: 'pgvector Extension',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async testTablesExist(): Promise<DatabaseTestResult> {
    const requiredTables = [
      'users',
      'user_settings',
      'areas',
      'project_lists',
      'tasks',
      'tags',
      'task_tags',
      'action_history',
      'subscriptions',
      'billing_details',
      'connected_accounts'
    ]

    try {
      const { data, error } = await this.serviceClient
        .rpc('sql', {
          query: `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
          `
        })

      if (error) {
        return {
          test: 'Required Tables',
          passed: false,
          error: error.message
        }
      }

      const existingTables = data.map((row: any) => row.table_name)
      const missingTables = requiredTables.filter(table => !existingTables.includes(table))

      return {
        test: 'Required Tables',
        passed: missingTables.length === 0,
        error: missingTables.length > 0 ? `Missing tables: ${missingTables.join(', ')}` : undefined,
        details: {
          required: requiredTables.length,
          found: existingTables.length,
          missing: missingTables
        }
      }
    } catch (error) {
      return {
        test: 'Required Tables',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async testRLSPolicies(): Promise<DatabaseTestResult> {
    try {
      const { data, error } = await this.serviceClient
        .rpc('sql', {
          query: `
            SELECT schemaname, tablename, policyname 
            FROM pg_policies 
            WHERE schemaname = 'public'
          `
        })

      if (error) {
        return {
          test: 'RLS Policies',
          passed: false,
          error: error.message
        }
      }

      const policyCount = data.length
      const hasPolicies = policyCount > 0

      return {
        test: 'RLS Policies',
        passed: hasPolicies,
        error: hasPolicies ? undefined : 'No RLS policies found',
        details: {
          policyCount,
          tables: [...new Set(data.map((row: any) => row.tablename))]
        }
      }
    } catch (error) {
      return {
        test: 'RLS Policies',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async testDatabaseFunctions(): Promise<DatabaseTestResult> {
    const requiredFunctions = [
      'match_tasks',
      'suggest_tags_for_task',
      'update_task_embedding',
      'batch_update_embeddings',
      'record_action',
      'get_action_history',
      'get_task_statistics',
      'setup_new_user_defaults'
    ]

    try {
      const { data, error } = await this.serviceClient
        .rpc('sql', {
          query: `
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_type = 'FUNCTION'
          `
        })

      if (error) {
        return {
          test: 'Database Functions',
          passed: false,
          error: error.message
        }
      }

      const existingFunctions = data.map((row: any) => row.routine_name)
      const missingFunctions = requiredFunctions.filter(func => !existingFunctions.includes(func))

      return {
        test: 'Database Functions',
        passed: missingFunctions.length === 0,
        error: missingFunctions.length > 0 ? `Missing functions: ${missingFunctions.join(', ')}` : undefined,
        details: {
          required: requiredFunctions.length,
          found: existingFunctions.length,
          missing: missingFunctions
        }
      }
    } catch (error) {
      return {
        test: 'Database Functions',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async testIndexes(): Promise<DatabaseTestResult> {
    try {
      const { data, error } = await this.serviceClient
        .rpc('sql', {
          query: `
            SELECT tablename, indexname, indexdef
            FROM pg_indexes 
            WHERE schemaname = 'public'
            AND indexname LIKE 'idx_%'
          `
        })

      if (error) {
        return {
          test: 'Database Indexes',
          passed: false,
          error: error.message
        }
      }

      const indexCount = data.length
      const vectorIndexes = data.filter((row: any) => 
        row.indexdef.includes('hnsw') || row.indexdef.includes('ivfflat')
      )

      return {
        test: 'Database Indexes',
        passed: indexCount > 0 && vectorIndexes.length > 0,
        details: {
          totalIndexes: indexCount,
          vectorIndexes: vectorIndexes.length,
          tables: [...new Set(data.map((row: any) => row.tablename))]
        }
      }
    } catch (error) {
      return {
        test: 'Database Indexes',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async testTriggers(): Promise<DatabaseTestResult> {
    try {
      const { data, error } = await this.serviceClient
        .rpc('sql', {
          query: `
            SELECT event_object_table, trigger_name 
            FROM information_schema.triggers 
            WHERE trigger_schema = 'public'
          `
        })

      if (error) {
        return {
          test: 'Database Triggers',
          passed: false,
          error: error.message
        }
      }

      const triggerCount = data.length
      const hasTriggers = triggerCount > 0

      return {
        test: 'Database Triggers',
        passed: hasTriggers,
        error: hasTriggers ? undefined : 'No triggers found',
        details: {
          triggerCount,
          tables: [...new Set(data.map((row: any) => row.event_object_table))]
        }
      }
    } catch (error) {
      return {
        test: 'Database Triggers',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async testVectorOperations(): Promise<DatabaseTestResult> {
    try {
      // Test vector operations with a sample embedding
      const sampleEmbedding = Array(1536).fill(0).map(() => Math.random())
      
      const { data, error } = await this.client
        .rpc('match_tasks', {
          query_embedding: sampleEmbedding,
          match_threshold: 0.5,
          match_count: 5
        })

      if (error) {
        return {
          test: 'Vector Operations',
          passed: false,
          error: error.message
        }
      }

      return {
        test: 'Vector Operations',
        passed: true,
        details: 'Vector similarity search is working'
      }
    } catch (error) {
      return {
        test: 'Vector Operations',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async generateReport(): Promise<string> {
    const results = await this.runAllTests()
    const vectorTest = await this.testVectorOperations()
    results.push(vectorTest)

    const passedTests = results.filter(r => r.passed).length
    const totalTests = results.length

    let report = `# Database Setup Validation Report\n\n`
    report += `**Overall Status**: ${passedTests}/${totalTests} tests passed\n\n`

    if (passedTests === totalTests) {
      report += `✅ **All tests passed!** Your database is properly configured.\n\n`
    } else {
      report += `❌ **Some tests failed.** Please review the issues below.\n\n`
    }

    report += `## Test Results\n\n`

    for (const result of results) {
      const status = result.passed ? '✅' : '❌'
      report += `${status} **${result.test}**\n`
      
      if (result.error) {
        report += `   - Error: ${result.error}\n`
      }
      
      if (result.details) {
        report += `   - Details: ${JSON.stringify(result.details, null, 2)}\n`
      }
      
      report += `\n`
    }

    return report
  }
}

// Export convenience function
export async function validateDatabaseSetup(): Promise<string> {
  const tester = new DatabaseTester()
  return await tester.generateReport()
}
