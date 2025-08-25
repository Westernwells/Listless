import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  validateParams,
  getAuthenticatedUser,
  handleDatabaseError,
  withErrorHandling,
  HTTP_STATUS,
} from '@/lib/api/utils'
import { TagIdSchema } from '@/lib/api/validation'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/tags/[id]/usage-count - Get the number of tasks using a specific tag
 */
export const GET = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  // Authenticate user
  const authResult = await getAuthenticatedUser()
  if (!authResult.success || !authResult.user) {
    return authResult.error
  }
  const { user } = authResult

  // Await params since it's a Promise in Next.js App Router
  const resolvedParams = await params

  // Validate parameters
  const paramValidation = validateParams(resolvedParams, TagIdSchema)
  if (!paramValidation.success) {
    return paramValidation.error
  }
  const { id } = paramValidation.data

  const supabase = await createClient()

  try {
    // First, check if the tag exists and belongs to the user
    const { data: existingTag, error: fetchError } = await supabase
      .from('tags')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse(
          'Tag not found',
          HTTP_STATUS.NOT_FOUND,
          undefined,
          'TAG_NOT_FOUND'
        )
      }
      return handleDatabaseError(fetchError)
    }

    // Count the number of tasks using this tag
    // We need to join with tasks to ensure we only count tasks that belong to the user
    const { count, error: countError } = await supabase
      .from('task_tags')
      .select('task_id', { count: 'exact' })
      .eq('tag_id', id)
      .inner('tasks', 'task_id', 'id')
      .eq('tasks.user_id', user.id)
      .eq('tasks.is_deleted', false) // Only count non-deleted tasks

    if (countError) {
      return handleDatabaseError(countError)
    }

    return createSuccessResponse(
      {
        tag_id: id,
        tag_name: existingTag.name,
        usage_count: count || 0
      },
      'Tag usage count retrieved successfully',
      HTTP_STATUS.OK
    )
  } catch (error) {
    console.error('Error fetching tag usage count:', error)
    return createErrorResponse(
      'Failed to fetch tag usage count',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
})
