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
import { CreateAreaSchema } from '@/lib/api/validation'
import { recordAreaCreation } from '@/lib/api/action-history'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/areas - List all areas with their project lists
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const authResult = await getAuthenticatedUser()
  if (!authResult.success || !authResult.user) {
    return authResult.error
  }
  const { user } = authResult

  const supabase = await createClient()

  try {
    // Get all areas with their project lists
    const { data: areas, error: fetchError } = await supabase
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
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('sort_order', { ascending: true })

    if (fetchError) {
      return handleDatabaseError(fetchError)
    }

    return createSuccessResponse(
      areas || [],
      'Areas retrieved successfully',
      HTTP_STATUS.OK
    )
  } catch (error) {
    console.error('Error fetching areas:', error)
    return createErrorResponse(
      'Failed to fetch areas',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
})

/**
 * POST /api/areas - Create a new area
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const authResult = await getAuthenticatedUser();
  if (!authResult.success || !authResult.user) {
    return authResult.error;
  }
  console.log(`Running on port: ${process.env.PORT || 3000}`);
  const { user } = authResult

  // Validate request body
  const validationResult = await validateRequestBody(request, CreateAreaSchema)
  if (!validationResult.success) {
    return validationResult.error
  }
  const areaData = validationResult.data

  const supabase = await createClient()
  const areaId = uuidv4()

  try {
    // Prepare area data for insertion
    const newArea = {
      id: areaId,
      user_id: authResult.user.id,
      name: areaData.name,
      description: areaData.description || null,
      color: areaData.color,
      sort_order: areaData.sort_order,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Insert area into database
    const { data: createdArea, error: insertError } = await supabase
      .from('areas')
      .insert(newArea)
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

    if (insertError) {
      return handleDatabaseError(insertError)
    }

    // Record action for undo/redo functionality
    await recordAreaCreation(authResult.user.id, areaId, createdArea)

    return createSuccessResponse(
      createdArea,
      'Area created successfully',
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    console.error('Error creating area:', error)
    return createErrorResponse(
      'Failed to create area',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
})
