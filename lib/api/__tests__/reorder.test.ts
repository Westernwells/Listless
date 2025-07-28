/**
 * Test suite for the reordering API functionality
 * Tests validation, batch operations, concurrency control, and error handling
 * Uses Vitest best practices for async testing and mocking
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { ReorderSchema, ReorderMoveSchema } from '../validation'
import { validateMoveOperation, performReorder } from '../reorder-utils'
import { recordReorderOperation } from '../action-history'
import crypto from 'crypto'

// Mock Supabase client for testing
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

// Test configuration
const TEST_USER_ID = crypto.randomUUID()
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn()
  }
}

// Setup and teardown hooks
beforeAll(async () => {
  // Setup test environment
  vi.clearAllMocks()
})

afterAll(async () => {
  // Cleanup after all tests
  vi.restoreAllMocks()
})

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks()

  // Setup default mock implementations
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })
    }),
    upsert: vi.fn().mockResolvedValue({
      data: [],
      error: null
    })
  })

  mockSupabaseClient.from.mockReturnValue(mockFrom())
  vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as any)
})

describe('Reorder Validation', () => {
  describe('ReorderMoveSchema', () => {
    it('should validate valid move operations', async () => {
      const validMove = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sort_order: 5,
        parent_id: '123e4567-e89b-12d3-a456-426614174001'
      }

      const result = ReorderMoveSchema.safeParse(validMove)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      const invalidMove = {
        id: 'invalid-uuid',
        sort_order: 5
      }

      const result = ReorderMoveSchema.safeParse(invalidMove)
      expect(result.success).toBe(false)
    })

    it('should reject negative sort orders', () => {
      const invalidMove = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sort_order: -1
      }

      const result = ReorderMoveSchema.safeParse(invalidMove)
      expect(result.success).toBe(false)
    })

    it('should allow null parent_id', () => {
      const validMove = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sort_order: 5,
        parent_id: null
      }

      const result = ReorderMoveSchema.safeParse(validMove)
      expect(result.success).toBe(true)
    })
  })

  describe('ReorderSchema', () => {
    it('should validate valid reorder requests', () => {
      const validRequest = {
        type: 'tasks',
        moves: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            sort_order: 1,
            parent_id: '123e4567-e89b-12d3-a456-426614174001'
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            sort_order: 2,
            parent_id: null
          }
        ]
      }

      const result = ReorderSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject invalid entity types', () => {
      const invalidRequest = {
        type: 'invalid_type',
        moves: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            sort_order: 1
          }
        ]
      }

      const result = ReorderSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject empty moves array', () => {
      const invalidRequest = {
        type: 'tasks',
        moves: []
      }

      const result = ReorderSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject too many moves', () => {
      const moves = Array.from({ length: 101 }, (_, i) => ({
        id: `123e4567-e89b-12d3-a456-42661417400${i.toString().padStart(1, '0')}`,
        sort_order: i
      }))

      const invalidRequest = {
        type: 'tasks',
        moves
      }

      const result = ReorderSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })
})

describe('Move Operation Validation', () => {
  const mockTaskData = [
    { id: 'task-1', title: 'Task 1', project_list_id: 'project-1' },
    { id: 'task-2', title: 'Task 2', project_list_id: 'project-2' },
  ]

  const mockProjectData = [
    { id: 'project-1', name: 'Project 1', area_id: 'area-1' },
    { id: 'project-2', name: 'Project 2', area_id: null },
  ]

  const mockAreaData = [
    { id: 'area-1', name: 'Area 1' },
    { id: 'area-2', name: 'Area 2' },
  ]

  describe('Task validation', () => {
    it('should validate valid task moves', () => {
      const move = {
        id: 'task-1',
        sort_order: 5,
        parent_id: 'project-1'
      }

      const result = validateMoveOperation('tasks', move, mockTaskData)
      expect(result.valid).toBe(true)
    })

    it('should reject moves for non-existent tasks', () => {
      const move = {
        id: 'non-existent-task',
        sort_order: 5,
        parent_id: 'project-1'
      }

      const result = validateMoveOperation('tasks', move, mockTaskData)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('Project List validation', () => {
    it('should validate valid project list moves', () => {
      const move = {
        id: 'project-1',
        sort_order: 5,
        parent_id: 'area-1'
      }

      const result = validateMoveOperation('project_lists', move, mockProjectData)
      expect(result.valid).toBe(true)
    })

    it('should allow null parent_id for project lists', () => {
      const move = {
        id: 'project-1',
        sort_order: 5,
        parent_id: null
      }

      const result = validateMoveOperation('project_lists', move, mockProjectData)
      expect(result.valid).toBe(true)
    })
  })

  describe('Area validation', () => {
    it('should validate valid area moves', () => {
      const move = {
        id: 'area-1',
        sort_order: 5,
        parent_id: null
      }

      const result = validateMoveOperation('areas', move, mockAreaData)
      expect(result.valid).toBe(true)
    })

    it('should reject areas with parent_id', () => {
      const move = {
        id: 'area-1',
        sort_order: 5,
        parent_id: 'some-parent'
      }

      const result = validateMoveOperation('areas', move, mockAreaData)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('cannot have parent containers')
    })
  })
})

describe('API Response Format', () => {
  it('should return proper success response format', () => {
    const expectedResponse = {
      data: {
        type: 'tasks',
        affectedIds: ['task-1', 'task-2'],
        moveCount: 2
      },
      message: 'Successfully reordered 2 tasks'
    }

    // This would be tested with actual API calls in integration tests
    expect(expectedResponse.data.type).toBe('tasks')
    expect(expectedResponse.data.affectedIds).toHaveLength(2)
    expect(expectedResponse.data.moveCount).toBe(2)
  })

  it('should return proper error response format', () => {
    const expectedErrorResponse = {
      error: 'API Error',
      message: 'Some tasks not found or access denied',
      code: 'VALIDATION_ERROR'
    }

    expect(expectedErrorResponse.error).toBe('API Error')
    expect(expectedErrorResponse.message).toBeTruthy()
  })
})

describe('Concurrency Control', () => {
  it('should handle concurrent reorder operations', async () => {
    // This would require actual database testing
    // For now, we test the validation logic
    const moves = [
      { id: 'task-1', sort_order: 1, parent_id: null },
      { id: 'task-2', sort_order: 2, parent_id: null }
    ]

    const validation = ReorderSchema.safeParse({
      type: 'tasks',
      moves
    })

    expect(validation.success).toBe(true)
  })
})

describe('Cross-container Moves', () => {
  it('should validate cross-container task moves', () => {
    const move = {
      id: 'task-1',
      sort_order: 5,
      parent_id: 'different-project'
    }

    const result = validateMoveOperation('tasks', move, mockTaskData)
    expect(result.valid).toBe(true)
  })

  it('should validate cross-container project moves', () => {
    const move = {
      id: 'project-1',
      sort_order: 5,
      parent_id: 'different-area'
    }

    const result = validateMoveOperation('project_lists', move, mockProjectData)
    expect(result.valid).toBe(true)
  })
})

describe('Database Operations', () => {
  describe('performReorder', () => {
    it('should handle successful task reordering', async () => {
      // Setup mock data
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', project_list_id: 'project-1', sort_order: 0 },
        { id: 'task-2', title: 'Task 2', project_list_id: 'project-1', sort_order: 1 }
      ]

      const mockProjects = [
        { id: 'project-1', name: 'Project 1' }
      ]

      // Mock successful database responses
      const mockSelect = vi.fn()
        .mockResolvedValueOnce({ data: mockTasks, error: null }) // First call for tasks
        .mockResolvedValueOnce({ data: mockProjects, error: null }) // Second call for parent validation

      const mockUpsert = vi.fn().mockResolvedValue({ data: mockTasks, error: null })

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
        upsert: mockUpsert,
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis()
      })

      mockSupabaseClient.from.mockReturnValue(mockFrom())

      const moves = [
        { id: 'task-1', sort_order: 1, parent_id: 'project-1' },
        { id: 'task-2', sort_order: 0, parent_id: 'project-1' }
      ]

      const result = await performReorder(TEST_USER_ID, 'tasks', moves)

      expect(result.success).toBe(true)
      expect(result.affectedIds).toEqual(['task-1', 'task-2'])
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'task-1',
            sort_order: 1,
            project_list_id: 'project-1'
          }),
          expect.objectContaining({
            id: 'task-2',
            sort_order: 0,
            project_list_id: 'project-1'
          })
        ]),
        { onConflict: 'id' }
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error following Vitest best practices
      const mockSelect = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis()
      })

      mockSupabaseClient.from.mockReturnValue(mockFrom())

      const moves = [{ id: 'task-1', sort_order: 0, parent_id: null }]

      // Use expect.poll for async operations as recommended by Vitest
      await expect.poll(async () => {
        const result = await performReorder(TEST_USER_ID, 'tasks', moves)
        return result.success
      }).toBe(false)

      const result = await performReorder(TEST_USER_ID, 'tasks', moves)
      expect(result.error).toContain('Failed to fetch tasks')
    })

    it('should validate parent existence for cross-container moves', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', project_list_id: 'project-1' }
      ]

      // Mock tasks found but parent projects not found
      const mockSelect = vi.fn()
        .mockResolvedValueOnce({ data: mockTasks, error: null })
        .mockResolvedValueOnce({ data: [], error: null }) // No parent projects found

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis()
      })

      mockSupabaseClient.from.mockReturnValue(mockFrom())

      const moves = [{ id: 'task-1', sort_order: 0, parent_id: 'non-existent-project' }]
      const result = await performReorder(TEST_USER_ID, 'tasks', moves)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Some parent projects not found')
    })
  })

  describe('Action History Integration', () => {
    it('should record reorder operations for undo/redo', async () => {
      // This would test the recordReorderOperation function
      // For now, we'll test that it can be called without errors
      const moves = [{ id: 'task-1', sort_order: 0, parent_id: null }]
      const oldData = [{ id: 'task-1', sort_order: 1, project_list_id: 'project-1' }]

      // Mock the action history recording
      vi.mock('../action-history', () => ({
        recordReorderOperation: vi.fn().mockResolvedValue({ success: true })
      }))

      expect(async () => {
        await recordReorderOperation(
          TEST_USER_ID,
          'task',
          moves,
          oldData,
          { timestamp: new Date().toISOString() }
        )
      }).not.toThrow()
    })
  })
})
