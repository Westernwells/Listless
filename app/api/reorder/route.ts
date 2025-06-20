import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequestBody,
  getAuthenticatedUser,
  handleDatabaseError,
  withErrorHandling,
  HTTP_STATUS,
} from '@/lib/api/utils'
import { ReorderSchema } from '@/lib/api/validation'
import { performReorder } from '@/lib/api/reorder-utils'
import { recordReorderOperation } from '@/lib/api/action-history'
import { createClient } from '@/lib/supabase/server'

/**
 * PUT /api/reorder
 * 
 * Handles batch reordering operations for tasks, project lists, and areas.
 * Supports drag-and-drop reordering with cross-container moves.
 * 
 * Request body:
 * {
 *   "type": "tasks" | "project_lists" | "areas",
 *   "moves": [
 *     {
 *       "id": "uuid",
 *       "sort_order": number,
 *       "parent_id": "uuid" | null
 *     }
 *   ]
 * }
 * 
 * Features:
 * - Batch updates with database transactions
 * - Optimistic concurrency control
 * - Cross-container moves (e.g., tasks between projects)
 * - Comprehensive validation and error handling
 * - Action history recording for undo/redo
 */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  try {
    // Enhanced request validation with better error handling
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
      return createErrorResponse(
        'Invalid JSON in request body',
        HTTP_STATUS.BAD_REQUEST,
        { details: 'Request body must be valid JSON' }
      )
    }

    // Validate request body with enhanced error reporting
    const validationResult = ReorderSchema.safeParse(body)
    if (!validationResult.success) {
      const formattedErrors = validationResult.error.format()
      return createErrorResponse(
        'Validation failed',
        HTTP_STATUS.BAD_REQUEST,
        {
          validationErrors: formattedErrors,
          issues: validationResult.error.issues
        }
      )
    }

    const { type, moves } = validationResult.data

    // Get authenticated user with better error handling
    let user: any
    try {
      user = await getAuthenticatedUser()
    } catch (authError) {
      return createErrorResponse(
        'Authentication failed',
        HTTP_STATUS.UNAUTHORIZED,
        { details: 'Please log in to perform this action' }
      )
    }

    // Fetch existing data for validation and action history
    const supabase = await createClient()
    let existingData: any[] = []
    let tableName: string
    let entityType: 'task' | 'project_list' | 'area'

    switch (type) {
      case 'tasks':
        tableName = 'tasks'
        entityType = 'task'
        break
      case 'project_lists':
        tableName = 'project_lists'
        entityType = 'project_list'
        break
      case 'areas':
        tableName = 'areas'
        entityType = 'area'
        break
      default:
        return createErrorResponse(
          'Invalid entity type',
          HTTP_STATUS.BAD_REQUEST
        )
    }

    // Fetch existing entities for action history
    const { data: entities, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', user.id)
      .in('id', moves.map(m => m.id))

    if (fetchError) {
      return handleDatabaseError(fetchError)
    }

    if (!entities || entities.length === 0) {
      return createErrorResponse(
        `No ${type} found for the provided IDs`,
        HTTP_STATUS.NOT_FOUND
      )
    }

    existingData = entities

    // Perform the reordering operation
    const result = await performReorder(user.id, type, moves)

    if (!result.success) {
      return createErrorResponse(
        result.error || 'Reordering operation failed',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    // Record action history for undo/redo functionality with enhanced error handling
    const historyResult = await recordReorderOperation(
      user.id,
      entityType,
      moves,
      existingData,
      {
        affectedIds: result.affectedIds,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(), // Add request tracking
      }
    )

    // Enhanced response with action history status
    const responseData = {
      type,
      affectedIds: result.affectedIds,
      moveCount: moves.length,
      actionHistoryRecorded: historyResult.success,
      timestamp: new Date().toISOString(),
    }

    if (!historyResult.success) {
      console.warn('Failed to record reorder action history:', historyResult.error)
      // Include warning in response but don't fail the request
      responseData.actionHistoryRecorded = false
    }

    return createSuccessResponse(
      responseData,
      `Successfully reordered ${moves.length} ${type}`,
      HTTP_STATUS.OK
    )

  } catch (error: unknown) {
    // Enhanced error handling following TypeScript best practices
    if (error instanceof Error) {
      console.error('Reorder API error:', error.message, error.stack)
      return createErrorResponse(
        'Internal server error during reordering',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        {
          details: error.message,
          timestamp: new Date().toISOString()
        }
      )
    }

    console.error('Unknown reorder API error:', error)
    return createErrorResponse(
      'Unexpected error during reordering',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      {
        timestamp: new Date().toISOString()
      }
    )
  }
})

/**
 * GET /api/reorder
 * 
 * Returns information about the reorder API endpoint
 */
export const GET = withErrorHandling(async () => {
  return createSuccessResponse(
    {
      endpoint: '/api/reorder',
      method: 'PUT',
      description: 'Batch reordering API for tasks, project lists, and areas',
      supportedTypes: ['tasks', 'project_lists', 'areas'],
      features: [
        'Batch updates with database transactions',
        'Cross-container moves',
        'Optimistic concurrency control',
        'Action history recording',
        'Comprehensive validation',
      ],
      schema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['tasks', 'project_lists', 'areas'],
          },
          moves: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                sort_order: { type: 'integer', minimum: 0 },
                parent_id: { type: 'string', format: 'uuid', nullable: true },
              },
              required: ['id', 'sort_order'],
            },
            minItems: 1,
            maxItems: 100,
          },
        },
        required: ['type', 'moves'],
      },
    },
    'Reorder API endpoint information'
  )
})
