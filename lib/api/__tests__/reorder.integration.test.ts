/**
 * Integration tests for the reordering API
 * Tests the complete API endpoint with real database operations
 * Follows Supabase testing best practices for RLS and authentication
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Test configuration
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SERVICE_ROLE_KEY!

const testOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
}

describe('Reorder API Integration Tests', () => {
  // Generate unique IDs for this test suite to avoid conflicts
  const USER_1_ID = crypto.randomUUID()
  const USER_2_ID = crypto.randomUUID()
  const AREA_1_ID = crypto.randomUUID()
  const AREA_2_ID = crypto.randomUUID()
  const PROJECT_1_ID = crypto.randomUUID()
  const PROJECT_2_ID = crypto.randomUUID()
  const TASK_1_ID = crypto.randomUUID()
  const TASK_2_ID = crypto.randomUUID()
  const TASK_3_ID = crypto.randomUUID()

  const supabase = createClient(supabaseUrl, supabaseAnonKey, testOptions)
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, testOptions)

  beforeAll(async () => {
    // Setup test users
    await adminSupabase.auth.admin.createUser({
      id: USER_1_ID,
      email: `user1-${USER_1_ID}@test.com`,
      password: 'password123',
      email_confirm: true,
    })

    await adminSupabase.auth.admin.createUser({
      id: USER_2_ID,
      email: `user2-${USER_2_ID}@test.com`,
      password: 'password123',
      email_confirm: true,
    })

    // Setup test data structure
    // Areas
    await adminSupabase.from('areas').insert([
      {
        id: AREA_1_ID,
        name: 'Test Area 1',
        user_id: USER_1_ID,
        sort_order: 0,
      },
      {
        id: AREA_2_ID,
        name: 'Test Area 2',
        user_id: USER_1_ID,
        sort_order: 1,
      },
    ])

    // Project Lists
    await adminSupabase.from('project_lists').insert([
      {
        id: PROJECT_1_ID,
        name: 'Test Project 1',
        user_id: USER_1_ID,
        area_id: AREA_1_ID,
        sort_order: 0,
      },
      {
        id: PROJECT_2_ID,
        name: 'Test Project 2',
        user_id: USER_1_ID,
        area_id: AREA_1_ID,
        sort_order: 1,
      },
    ])

    // Tasks
    await adminSupabase.from('tasks').insert([
      {
        id: TASK_1_ID,
        title: 'Test Task 1',
        user_id: USER_1_ID,
        project_list_id: PROJECT_1_ID,
        sort_order: 0,
      },
      {
        id: TASK_2_ID,
        title: 'Test Task 2',
        user_id: USER_1_ID,
        project_list_id: PROJECT_1_ID,
        sort_order: 1,
      },
      {
        id: TASK_3_ID,
        title: 'Test Task 3',
        user_id: USER_1_ID,
        project_list_id: PROJECT_2_ID,
        sort_order: 0,
      },
    ])
  })

  afterAll(async () => {
    // Cleanup test data
    await adminSupabase.from('tasks').delete().in('id', [TASK_1_ID, TASK_2_ID, TASK_3_ID])
    await adminSupabase.from('project_lists').delete().in('id', [PROJECT_1_ID, PROJECT_2_ID])
    await adminSupabase.from('areas').delete().in('id', [AREA_1_ID, AREA_2_ID])
    
    // Cleanup test users
    await adminSupabase.auth.admin.deleteUser(USER_1_ID)
    await adminSupabase.auth.admin.deleteUser(USER_2_ID)
  })

  beforeEach(async () => {
    // Sign out before each test to ensure clean state
    await supabase.auth.signOut()
  })

  describe('Task Reordering', () => {
    it('should reorder tasks within the same project', async () => {
      // Sign in as User 1
      await supabase.auth.signInWithPassword({
        email: `user1-${USER_1_ID}@test.com`,
        password: 'password123',
      })

      // Test reordering tasks within PROJECT_1_ID
      const reorderPayload = {
        type: 'tasks',
        moves: [
          {
            id: TASK_1_ID,
            sort_order: 1,
            parent_id: PROJECT_1_ID,
          },
          {
            id: TASK_2_ID,
            sort_order: 0,
            parent_id: PROJECT_1_ID,
          },
        ],
      }

      const response = await fetch('/api/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(reorderPayload),
      })

      expect(response.status).toBe(200)
      const result = await response.json()
      expect(result.data.affectedIds).toEqual([TASK_1_ID, TASK_2_ID])
      expect(result.data.moveCount).toBe(2)

      // Verify the reordering in the database
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, sort_order')
        .in('id', [TASK_1_ID, TASK_2_ID])
        .order('sort_order')

      expect(tasks).toEqual([
        { id: TASK_2_ID, sort_order: 0 },
        { id: TASK_1_ID, sort_order: 1 },
      ])
    })

    it('should move tasks between projects', async () => {
      await supabase.auth.signInWithPassword({
        email: `user1-${USER_1_ID}@test.com`,
        password: 'password123',
      })

      // Move TASK_3_ID from PROJECT_2_ID to PROJECT_1_ID
      const reorderPayload = {
        type: 'tasks',
        moves: [
          {
            id: TASK_3_ID,
            sort_order: 2,
            parent_id: PROJECT_1_ID,
          },
        ],
      }

      const response = await fetch('/api/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(reorderPayload),
      })

      expect(response.status).toBe(200)

      // Verify the task moved to the new project
      const { data: task } = await supabase
        .from('tasks')
        .select('project_list_id, sort_order')
        .eq('id', TASK_3_ID)
        .single()

      expect(task.project_list_id).toBe(PROJECT_1_ID)
      expect(task.sort_order).toBe(2)
    })

    it('should move tasks to inbox (no project)', async () => {
      await supabase.auth.signInWithPassword({
        email: `user1-${USER_1_ID}@test.com`,
        password: 'password123',
      })

      const reorderPayload = {
        type: 'tasks',
        moves: [
          {
            id: TASK_1_ID,
            sort_order: 0,
            parent_id: null,
          },
        ],
      }

      const response = await fetch('/api/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(reorderPayload),
      })

      expect(response.status).toBe(200)

      // Verify the task is now in inbox
      const { data: task } = await supabase
        .from('tasks')
        .select('project_list_id')
        .eq('id', TASK_1_ID)
        .single()

      expect(task.project_list_id).toBeNull()
    })
  })

  describe('Project List Reordering', () => {
    it('should reorder project lists within the same area', async () => {
      await supabase.auth.signInWithPassword({
        email: `user1-${USER_1_ID}@test.com`,
        password: 'password123',
      })

      const reorderPayload = {
        type: 'project_lists',
        moves: [
          {
            id: PROJECT_1_ID,
            sort_order: 1,
            parent_id: AREA_1_ID,
          },
          {
            id: PROJECT_2_ID,
            sort_order: 0,
            parent_id: AREA_1_ID,
          },
        ],
      }

      const response = await fetch('/api/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(reorderPayload),
      })

      expect(response.status).toBe(200)

      // Verify the reordering
      const { data: projects } = await supabase
        .from('project_lists')
        .select('id, sort_order')
        .in('id', [PROJECT_1_ID, PROJECT_2_ID])
        .order('sort_order')

      expect(projects).toEqual([
        { id: PROJECT_2_ID, sort_order: 0 },
        { id: PROJECT_1_ID, sort_order: 1 },
      ])
    })
  })

  describe('Area Reordering', () => {
    it('should reorder areas', async () => {
      await supabase.auth.signInWithPassword({
        email: `user1-${USER_1_ID}@test.com`,
        password: 'password123',
      })

      const reorderPayload = {
        type: 'areas',
        moves: [
          {
            id: AREA_1_ID,
            sort_order: 1,
            parent_id: null,
          },
          {
            id: AREA_2_ID,
            sort_order: 0,
            parent_id: null,
          },
        ],
      }

      const response = await fetch('/api/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(reorderPayload),
      })

      expect(response.status).toBe(200)

      // Verify the reordering
      const { data: areas } = await supabase
        .from('areas')
        .select('id, sort_order')
        .in('id', [AREA_1_ID, AREA_2_ID])
        .order('sort_order')

      expect(areas).toEqual([
        { id: AREA_2_ID, sort_order: 0 },
        { id: AREA_1_ID, sort_order: 1 },
      ])
    })
  })

  describe('Security and RLS', () => {
    it('should prevent users from reordering other users data', async () => {
      // Sign in as User 2 (who doesn't own the test data)
      await supabase.auth.signInWithPassword({
        email: `user2-${USER_2_ID}@test.com`,
        password: 'password123',
      })

      const reorderPayload = {
        type: 'tasks',
        moves: [
          {
            id: TASK_1_ID, // This belongs to USER_1_ID
            sort_order: 0,
            parent_id: null,
          },
        ],
      }

      const response = await fetch('/api/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(reorderPayload),
      })

      // Should return 404 or 400 because User 2 can't see User 1's tasks
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should require authentication', async () => {
      const reorderPayload = {
        type: 'tasks',
        moves: [
          {
            id: TASK_1_ID,
            sort_order: 0,
            parent_id: null,
          },
        ],
      }

      const response = await fetch('/api/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reorderPayload),
      })

      expect(response.status).toBe(401)
    })
  })
})
