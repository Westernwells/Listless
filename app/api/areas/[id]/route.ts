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
import { UpdateAreaSchema, AreaIdSchema } from '@/lib/api/validation'
import { recordAreaUpdate, recordAreaDeletion } from '@/lib/api/action-history'
import { createClient } from '@/lib/supabase/server'

/**
 * PUT /api/areas/[id] - Update an area
 */
export const PUT = withErrorHandling(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Authenticate user
  const authResult = await getAuthenticatedUser()
  if (!authResult.success) {
    return authResult.error
  }
  const { user } = authResult

  // Validate parameters
  const paramValidation = validateParams(params, AreaIdSchema)
  if (!paramValidation.success) {
    return paramValidation.error
  }
  const { id } = paramValidation.data

  // Validate request body
  const validationResult = await validateRequestBody(request, UpdateAreaSchema)
  if (!validationResult.success) {
    return validationResult.error
  }
  const updateData = validationResult.data

  const supabase = await createClient()

  try {
    // Get current area data for action history
    const { data: currentArea, error: fetchError } = await supabase
      .from('areas')
      .select(`
        *,
        project_lists (
          id,
          name,
          description,
          color,
          sort_order,
          is_archived
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      return handleDatabaseError(fetchError)
    }

    if (!currentArea) {
      return createErrorResponse(
        'Area not found',
        HTTP_STATUS.NOT_FOUND,
        undefined,
        'AREA_NOT_FOUND'
      )
    }

    // Prepare update data
    const updatedAreaData = {
      ...updateData,
      updated_at: new Date().toISOString(),
    }

    // Update the area
    const { data: updatedArea, error: updateError } = await supabase
      .from('areas')
      .update(updatedAreaData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        project_lists (
          id,
          name,
          description,
          color,
          sort_order,
          is_archived
        )
      `)
      .single()

    if (updateError) {
      return handleDatabaseError(updateError)
    }

    // Record action for undo/redo functionality
    await recordAreaUpdate(user.id, id, currentArea, updatedArea, {
      fields_updated: Object.keys(updateData),
    })

    return createSuccessResponse(
      updatedArea,
      'Area updated successfully',
      HTTP_STATUS.OK
    )
  } catch (error) {
    console.error('Error updating area:', error)
    return createErrorResponse(
      'Failed to update area',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
})

/**
 * DELETE /api/areas/[id] - Delete an area
 */
export const DELETE = withErrorHandling(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Authenticate user
  const authResult = await getAuthenticatedUser()
  if (!authResult.success) {
    return authResult.error
  }
  const { user } = authResult

  // Validate parameters
  const paramValidation = validateParams(params, AreaIdSchema)
  if (!paramValidation.success) {
    return paramValidation.error
  }
  const { id } = paramValidation.data

  const supabase = await createClient()

  try {
    // Get current area data for action history
    const { data: currentArea, error: fetchError } = await supabase
      .from('areas')
      .select(`
        *,
        project_lists (
          id,
          name,
          description,
          color,
          sort_order,
          is_archived
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      return handleDatabaseError(fetchError)
    }

    if (!currentArea) {
      return createErrorResponse(
        'Area not found',
        HTTP_STATUS.NOT_FOUND,
        undefined,
        'AREA_NOT_FOUND'
      )
    }

    // Start cascading operations - get all project lists in this area
    const { data: projectListsToMove, error: projectListsError } = await supabase
      .from('project_lists')
      .select('id, name')
      .eq('area_id', id)
      .eq('user_id', user.id)

    if (projectListsError) {
      return handleDatabaseError(projectListsError)
    }

    // Get all tasks in project lists that will be moved to inbox
    let tasksToMove: any[] = []
    if (projectListsToMove && projectListsToMove.length > 0) {
      const projectListIds = projectListsToMove.map(pl => pl.id)
      
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, project_list_id')
        .in('project_list_id', projectListIds)
        .eq('user_id', user.id)
        .eq('is_deleted', false)

      if (tasksError) {
        return handleDatabaseError(tasksError)
      }

      tasksToMove = tasks || []

      // Move tasks to inbox (set project_list_id to null)
      if (tasksToMove.length > 0) {
        const { error: moveTasksError } = await supabase
          .from('tasks')
          .update({
            project_list_id: null,
            updated_at: new Date().toISOString(),
          })
          .in('project_list_id', projectListIds)
          .eq('user_id', user.id)

        if (moveTasksError) {
          return handleDatabaseError(moveTasksError)
        }
      }

      // Move project lists out of area (set area_id to null)
      const { error: moveProjectListsError } = await supabase
        .from('project_lists')
        .update({
          area_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('area_id', id)
        .eq('user_id', user.id)

      if (moveProjectListsError) {
        return handleDatabaseError(moveProjectListsError)
      }
    }

    // Delete the area
    const { error: deleteError } = await supabase
      .from('areas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return handleDatabaseError(deleteError)
    }

    // Record action for undo/redo functionality
    await recordAreaDeletion(user.id, id, currentArea, {
      project_lists_moved: projectListsToMove?.length || 0,
      tasks_moved_to_inbox: tasksToMove.length,
      moved_project_list_ids: projectListsToMove?.map(pl => pl.id) || [],
      moved_task_ids: tasksToMove.map(task => task.id),
    })

    return createSuccessResponse(
      {
        deleted_area: currentArea,
        project_lists_moved: projectListsToMove?.length || 0,
        tasks_moved_to_inbox: tasksToMove.length,
      },
      'Area deleted successfully',
      HTTP_STATUS.OK
    )
  } catch (error) {
    console.error('Error deleting area:', error)
    return createErrorResponse(
      'Failed to delete area',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
})
