# Testing Guide for Listless Reorder API

## Overview

This guide covers the comprehensive testing strategy for the Listless reorder API, including unit tests, integration tests, and database tests. The testing approach follows industry best practices using Vitest, Supabase testing patterns, and pgTAP for database testing.

## Test Structure

### 1. Unit Tests (`lib/api/__tests__/reorder.test.ts`)

**Purpose**: Test individual functions and validation logic in isolation

**Coverage**:
- Zod schema validation (ReorderSchema, ReorderMoveSchema)
- Business logic validation (validateMoveOperation)
- Mock database operations
- Error handling scenarios
- Edge cases and boundary conditions

**Key Features**:
- Uses Vitest mocking for Supabase client
- Tests async operations with proper error handling
- Validates input/output contracts
- Tests concurrent execution scenarios

### 2. Integration Tests (`lib/api/__tests__/reorder.integration.test.ts`)

**Purpose**: Test the complete API endpoint with real database operations

**Coverage**:
- End-to-end API functionality
- Real database transactions
- Authentication and authorization (RLS)
- Cross-container moves
- Data persistence verification

**Key Features**:
- Uses real Supabase client with test database
- Creates isolated test data with unique UUIDs
- Tests Row Level Security (RLS) policies
- Verifies actual database state changes

### 3. Database Tests (pgTAP)

**Purpose**: Test database schema, policies, and functions

**Location**: `supabase/tests/database/`

**Coverage**:
- Table structure validation
- RLS policy testing
- Index performance verification
- Database function testing
- Constraint validation

## Running Tests

### Prerequisites

1. **Environment Setup**:
   ```bash
   # Copy environment variables
   cp .env.example .env.local
   
   # Set required variables
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Local Supabase Instance**:
   ```bash
   # Start local Supabase
   supabase start
   
   # Apply migrations
   supabase db reset
   ```

### Running Unit Tests

```bash
# Run all unit tests
npm run test

# Run specific test file
npm run test reorder.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Running Integration Tests

```bash
# Run integration tests (requires local Supabase)
npm run test:integration

# Run specific integration test
npm run test reorder.integration.test.ts

# Run with verbose output
npm run test:integration --reporter=verbose
```

### Running Database Tests

```bash
# Run all database tests
supabase test db

# Run specific test file
supabase test db --file reorder_policies.test.sql

# Create new test file
supabase test new reorder_validation
```

## Test Data Management

### Isolation Strategy

1. **Unique Test IDs**: Each test suite generates unique UUIDs to prevent conflicts
2. **Cleanup Hooks**: `beforeAll`/`afterAll` hooks manage test data lifecycle
3. **Transaction Rollback**: Database tests use transactions that rollback automatically

### Test Data Structure

```typescript
// Example test data setup
const TEST_USER_ID = crypto.randomUUID()
const TEST_AREA_ID = crypto.randomUUID()
const TEST_PROJECT_ID = crypto.randomUUID()
const TEST_TASK_ID = crypto.randomUUID()

// Setup in beforeAll
await adminSupabase.from('areas').insert({
  id: TEST_AREA_ID,
  name: 'Test Area',
  user_id: TEST_USER_ID,
  sort_order: 0
})
```

## Mocking Strategy

### Unit Test Mocks

```typescript
// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

// Setup mock responses
const mockFrom = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      in: vi.fn().mockResolvedValue({
        data: mockData,
        error: null
      })
    })
  })
})
```

### Integration Test Setup

```typescript
// Use real Supabase client with test configuration
const testOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, testOptions)
```

## Test Scenarios

### Critical Test Cases

1. **Validation Tests**:
   - Valid/invalid UUID formats
   - Sort order constraints
   - Parent-child relationship validation
   - Batch size limits (1-100 items)

2. **Business Logic Tests**:
   - Cross-container moves
   - Circular reference prevention
   - Entity ownership validation
   - Concurrent operation handling

3. **Database Tests**:
   - Transaction atomicity
   - RLS policy enforcement
   - Index performance
   - Data consistency

4. **Security Tests**:
   - Authentication requirements
   - Authorization boundaries
   - RLS policy effectiveness
   - Input sanitization

### Performance Tests

```typescript
// Example performance test
it('should handle large batch operations efficiently', async () => {
  const moves = Array.from({ length: 100 }, (_, i) => ({
    id: `task-${i}`,
    sort_order: i,
    parent_id: 'project-1'
  }))

  const startTime = performance.now()
  const result = await performReorder(userId, 'tasks', moves)
  const endTime = performance.now()

  expect(result.success).toBe(true)
  expect(endTime - startTime).toBeLessThan(1000) // Should complete in < 1s
})
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Start Supabase
        run: supabase start
        
      - name: Run unit tests
        run: npm run test
        
      - name: Run integration tests
        run: npm run test:integration
        
      - name: Run database tests
        run: supabase test db
```

## Debugging Tests

### Common Issues

1. **Test Isolation Failures**:
   - Ensure unique test data IDs
   - Verify cleanup in `afterAll` hooks
   - Check for shared state between tests

2. **Async Test Issues**:
   - Always `await` async operations
   - Use proper error handling
   - Set appropriate timeouts

3. **Mock Configuration**:
   - Clear mocks between tests
   - Verify mock implementations
   - Check mock call expectations

### Debugging Tools

```typescript
// Enable verbose logging
process.env.DEBUG = 'supabase:*'

// Add test debugging
console.log('Test data:', { userId, taskId, projectId })

// Verify mock calls
expect(mockFunction).toHaveBeenCalledWith(expectedArgs)
expect(mockFunction).toHaveBeenCalledTimes(1)
```

## Best Practices

### Test Organization

1. **Descriptive Test Names**: Use clear, specific test descriptions
2. **Logical Grouping**: Group related tests in `describe` blocks
3. **Setup/Teardown**: Use appropriate hooks for test lifecycle
4. **Assertion Clarity**: Make assertions specific and meaningful

### Performance Considerations

1. **Parallel Execution**: Use `test.concurrent` for independent tests
2. **Resource Cleanup**: Always clean up test resources
3. **Mock Efficiency**: Use mocks for external dependencies
4. **Database Optimization**: Use transactions for database tests

### Maintenance

1. **Regular Updates**: Keep tests updated with API changes
2. **Coverage Monitoring**: Maintain high test coverage
3. **Performance Monitoring**: Track test execution times
4. **Documentation**: Keep test documentation current

## Troubleshooting

### Common Test Failures

1. **Database Connection Issues**:
   - Verify Supabase is running locally
   - Check environment variables
   - Confirm database migrations are applied

2. **Authentication Failures**:
   - Verify test user creation
   - Check JWT token validity
   - Confirm RLS policies are correct

3. **Timing Issues**:
   - Add appropriate `await` statements
   - Increase test timeouts if needed
   - Use `vi.waitFor` for async conditions

### Getting Help

- Check Vitest documentation for testing patterns
- Review Supabase testing guides for database tests
- Use GitHub Issues for project-specific problems
- Consult team documentation for project conventions
