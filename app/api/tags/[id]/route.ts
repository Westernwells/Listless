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
import { recordTagDeletion } from '@/lib/api/action-history'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/tags/[id] - Delete a tag
 */
export const DELETE = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
      .select('id, name, is_system')
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

    // Prevent deletion of system tags
    if (existingTag.is_system) {
      return createErrorResponse(
        'System tags cannot be deleted',
        HTTP_STATUS.FORBIDDEN,
        undefined,
        'SYSTEM_TAG_DELETION'
      )
    }

    // Delete the tag (this will cascade delete task_tags relationships)
    const { error: deleteError } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return handleDatabaseError(deleteError)
    }

    // Record action for undo/redo functionality
    await recordTagDeletion(user.id, id, existingTag)

    return createSuccessResponse(
      { id, name: existingTag.name },
      'Tag deleted successfully',
      HTTP_STATUS.OK
    )
  } catch (error) {
    console.error('Error deleting tag:', error)
    return createErrorResponse(
      'Failed to delete tag',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
})
