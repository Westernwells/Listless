# Row Level Security (RLS) Policies Guide

This document provides comprehensive examples and best practices for implementing Row Level Security (RLS) policies in your Supabase database to prevent 403 Forbidden errors and ensure proper data isolation.

## Overview

Row Level Security (RLS) is a PostgreSQL feature that allows you to control access to rows in a table based on the characteristics of the user executing a query. In Supabase, this is essential for multi-tenant applications where users should only access their own data.

## Common 403 Forbidden Error Causes

1. **Missing RLS Policies**: Tables have RLS enabled but no policies defined
2. **Incorrect Policy Logic**: Policies don't properly check user ownership
3. **Authentication Issues**: User not properly authenticated when making requests
4. **Policy Conflicts**: Multiple policies with conflicting conditions

## Example RLS Policies for Tasks Table

### Basic Task Policies

```sql
-- Enable RLS on the tasks table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own tasks
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own tasks
CREATE POLICY "Users can insert their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own tasks
CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own tasks
CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);
```

### Advanced Task Policies with Soft Delete

```sql
-- Policy for viewing non-deleted tasks only
CREATE POLICY "Users can view their own non-deleted tasks"
  ON public.tasks FOR SELECT
  USING (
    auth.uid() = user_id 
    AND is_deleted = false
  );

-- Policy for soft delete operations
CREATE POLICY "Users can soft delete their own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND (is_deleted IS NULL OR is_deleted IN (true, false))
  );
```

### Task Tags Junction Table Policies

```sql
-- Enable RLS on task_tags table
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;

-- Users can view task tags for their own tasks
CREATE POLICY "Users can view task tags for their tasks"
  ON public.task_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_tags.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Users can manage task tags for their own tasks
CREATE POLICY "Users can manage task tags for their tasks"
  ON public.task_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_tags.task_id
      AND tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_tags.task_id
      AND tasks.user_id = auth.uid()
    )
  );
```

## Best Practices

### 1. Always Use auth.uid()

```sql
-- ✅ CORRECT: Use auth.uid() to get current user
USING (auth.uid() = user_id)

-- ❌ WRONG: Never hardcode user IDs
USING (user_id = '123e4567-e89b-12d3-a456-426614174000')
```

### 2. Use USING and WITH CHECK Clauses

```sql
-- For UPDATE and DELETE operations
CREATE POLICY "policy_name"
  ON table_name FOR UPDATE
  USING (auth.uid() = user_id)      -- Check existing rows
  WITH CHECK (auth.uid() = user_id); -- Check new/updated values
```

### 3. Handle NULL Values

```sql
-- Account for potential NULL values
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
)
```

### 4. Use EXISTS for Complex Relationships

```sql
-- For junction tables or complex relationships
USING (
  EXISTS (
    SELECT 1 FROM parent_table
    WHERE parent_table.id = child_table.parent_id
    AND parent_table.user_id = auth.uid()
  )
)
```

## Testing RLS Policies

### 1. Test with Different Users

```sql
-- Create test users and verify isolation
SELECT auth.uid(); -- Check current user
SELECT * FROM tasks; -- Should only return current user's tasks
```

### 2. Test All Operations

```sql
-- Test SELECT
SELECT * FROM tasks WHERE user_id = auth.uid();

-- Test INSERT
INSERT INTO tasks (user_id, title) VALUES (auth.uid(), 'Test Task');

-- Test UPDATE
UPDATE tasks SET title = 'Updated' WHERE id = 'task-id' AND user_id = auth.uid();

-- Test DELETE
DELETE FROM tasks WHERE id = 'task-id' AND user_id = auth.uid();
```

## Debugging RLS Issues

### 1. Check if RLS is Enabled

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tasks';
```

### 2. List All Policies

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'tasks';
```

### 3. Test Policy Logic

```sql
-- Test the policy condition directly
SELECT auth.uid() = user_id FROM tasks WHERE id = 'specific-task-id';
```

## Error Handling in Application Code

### Client-Side Error Handling

```typescript
try {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
  
  if (error) {
    if (error.code === 'PGRST301' || error.status === 403) {
      throw new Error('You do not have permission to access this data')
    }
    throw error
  }
  
  return data
} catch (error) {
  console.error('Database error:', error)
  throw error
}
```

### Server-Side Error Handling

```typescript
export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      success: false,
      error: createErrorResponse(
        'Authentication required',
        HTTP_STATUS.UNAUTHORIZED
      )
    }
  }

  return { success: true, user }
}
```

## Security Checklist

- [ ] RLS is enabled on all user data tables
- [ ] All policies use `auth.uid()` for user identification
- [ ] Policies cover all operations (SELECT, INSERT, UPDATE, DELETE)
- [ ] Junction tables have proper relationship-based policies
- [ ] Policies handle NULL values appropriately
- [ ] Application code handles 403 errors gracefully
- [ ] Authentication is verified server-side using `getUser()`
- [ ] Test users cannot access each other's data

## Common Policy Patterns

### 1. Simple Ownership

```sql
USING (auth.uid() = user_id)
```

### 2. Hierarchical Ownership

```sql
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = tasks.project_id 
    AND projects.user_id = auth.uid()
  )
)
```

### 3. Shared Access

```sql
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM shared_access 
    WHERE shared_access.resource_id = tasks.id 
    AND shared_access.user_id = auth.uid()
  )
)
```

This guide should help you implement secure, properly isolated data access in your Supabase application while avoiding common RLS pitfalls.
