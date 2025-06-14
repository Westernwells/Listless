import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequestBody,
  getAuthenticatedUser,
  handleDatabaseError,
  withErrorHandling,
  HTTP_STATUS,
} from '@/lib/api/utils'
import { CreateProjectListSchema } from '@/lib/api/validation'
import { recordProjectListCreation } from '@/lib/api/action-history'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/project_lists - Create a new project list
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const authResult = await getAuthenticatedUser()
  if (!authResult.success) {
    return authResult.error
  }
  const { user } = authResult

  // Validate request body
  const validationResult = await validateRequestBody(request, CreateProjectListSchema)
  if (!validationResult.success) {
    return validationResult.error
  }
  const projectListData = validationResult.data

  const supabase = await createClient()
  const projectListId = uuidv4()

  try {
    // Prepare project list data for insertion
    const newProjectList = {
      id: projectListId,
      user_id: user.id,
      name: projectListData.name,
      description: projectListData.description || null,
      color: projectListData.color,
      area_id: projectListData.area_id || null,
      sort_order: projectListData.sort_order,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Insert project list into database
    const { data: createdProjectList, error: insertError } = await supabase
      .from('project_lists')
      .insert(newProjectList)
      .select(`
        *,
        areas (
          id,
          name,
          color
        )
      `)
      .single()

    if (insertError) {
      return handleDatabaseError(insertError)
    }

    // Record action for undo/redo functionality
    await recordProjectListCreation(user.id, projectListId, createdProjectList, {
      area_assigned: !!projectListData.area_id,
    })

    return createSuccessResponse(
      createdProjectList,
      'Project list created successfully',
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    console.error('Error creating project list:', error)
    return createErrorResponse(
      'Failed to create project list',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
})
