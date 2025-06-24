import { NextRequest } from 'next/server'
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequestBody,
  validateParams,
  getAuthenticatedUser,
  handleDatabaseError,
  withErrorHandling,
  HTTP_STATUS,
} from '@/lib/api/utils'
import { UpdateProjectListSchema, ProjectListIdSchema } from '@/lib/api/validation'
import { recordProjectListUpdate, recordProjectListDeletion } from '@/lib/api/action-history'
import { createClient } from '@/lib/supabase/server'

/**
 * PUT /api/project_lists/[id] - Update a project list
 */
export const PUT = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  // Authenticate user
  const authResult = await getAuthenticatedUser()
  if (!authResult.success) {
    return authResult.error
  }
  const { user } = authResult

  // Await params since it's a Promise in Next.js App Router
  const resolvedParams = await params

  // Validate parameters
  const paramValidation = validateParams(resolvedParams, ProjectListIdSchema)
  if (!paramValidation.success) {
    return paramValidation.error
  }
  const { id } = paramValidation.data

  // Validate request body
  const validationResult = await validateRequestBody(request, UpdateProjectListSchema)
  if (!validationResult.success) {
    return validationResult.error
  }
  const updateData = validationResult.data

  const supabase = await createClient()

  try {
    // Get current project list data for action history
    const { data: currentProjectList, error: fetchError } = await supabase
      .from('project_lists')
      .select(`
        *,
        areas (
          id,
          name,
          color
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      return handleDatabaseError(fetchError)
    }

    if (!currentProjectList) {
      return createErrorResponse(
        'Project list not found',
        HTTP_STATUS.NOT_FOUND,
        undefined,
        'PROJECT_LIST_NOT_FOUND'
      )
    }

    // Prepare update data
    const updatedProjectListData = {
      ...updateData,
      updated_at: new Date().toISOString(),
    }

    // Update the project list
    const { data: updatedProjectList, error: updateError } = await supabase
      .from('project_lists')
      .update(updatedProjectListData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        areas (
          id,
          name,
          color
        )
      `)
      .single()

    if (updateError) {
      return handleDatabaseError(updateError)
    }

    // Record action for undo/redo functionality
    await recordProjectListUpdate(user.id, id, currentProjectList, updatedProjectList, {
      fields_updated: Object.keys(updateData),
    })

    return createSuccessResponse(
      updatedProjectList,
      'Project list updated successfully',
      HTTP_STATUS.OK
    )
  } catch (error) {
    console.error('Error updating project list:', error)
    return createErrorResponse(
      'Failed to update project list',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
})

/**
 * DELETE /api/project_lists/[id] - Delete a project list
 */
export const DELETE = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  // Authenticate user
  const authResult = await getAuthenticatedUser()
  if (!authResult.success) {
    return authResult.error
  }
  const { user } = authResult

  // Await params since it's a Promise in Next.js App Router
  const resolvedParams = await params

  // Validate parameters
  const paramValidation = validateParams(resolvedParams, ProjectListIdSchema)
  if (!paramValidation.success) {
    return paramValidation.error
  }
  const { id } = paramValidation.data

  const supabase = await createClient()

  try {
    // Get current project list data for action history
    const { data: currentProjectList, error: fetchError } = await supabase
      .from('project_lists')
      .select(`
        *,
        areas (
          id,
          name,
          color
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      return handleDatabaseError(fetchError)
    }

    if (!currentProjectList) {
      return createErrorResponse(
        'Project list not found',
        HTTP_STATUS.NOT_FOUND,
        undefined,
        'PROJECT_LIST_NOT_FOUND'
      )
    }

    // Start a transaction to handle cascading operations
    const { data: tasksToMove, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title')
      .eq('project_list_id', id)
      .eq('user_id', user.id)
      .eq('is_deleted', false)

    if (tasksError) {
      return handleDatabaseError(tasksError)
    }

    // Move tasks to inbox (set project_list_id to null)
    if (tasksToMove && tasksToMove.length > 0) {
      const { error: moveTasksError } = await supabase
        .from('tasks')
        .update({
          project_list_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('project_list_id', id)
        .eq('user_id', user.id)

      if (moveTasksError) {
        return handleDatabaseError(moveTasksError)
      }
    }

    // Delete the project list
    const { error: deleteError } = await supabase
      .from('project_lists')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return handleDatabaseError(deleteError)
    }

    // Record action for undo/redo functionality
    await recordProjectListDeletion(user.id, id, currentProjectList, {
      tasks_moved_to_inbox: tasksToMove?.length || 0,
      moved_task_ids: tasksToMove?.map(task => task.id) || [],
    })

    return createSuccessResponse(
      {
        deleted_project_list: currentProjectList,
        tasks_moved_to_inbox: tasksToMove?.length || 0,
      },
      'Project list deleted successfully',
      HTTP_STATUS.OK
    )
  } catch (error) {
    console.error('Error deleting project list:', error)
    return createErrorResponse(
      'Failed to delete project list',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
})
