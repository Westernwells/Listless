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
import { CreateTagSchema } from '@/lib/api/validation'
import { recordTagCreation } from '@/lib/api/action-history'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/tags - List all tags for the authenticated user
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
    // Get all tags for the user
    const { data: tags, error: fetchError } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (fetchError) {
      return handleDatabaseError(fetchError)
    }

    return createSuccessResponse(
      tags || [],
      'Tags retrieved successfully',
      HTTP_STATUS.OK
    )
  } catch (error) {
    console.error('Error fetching tags:', error)
    return createErrorResponse(
      'Failed to fetch tags',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
})

/**
 * POST /api/tags - Create a new tag
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const authResult = await getAuthenticatedUser()
  if (!authResult.success || !authResult.user) {
    return authResult.error
  }
  const { user } = authResult

  // Validate request body
  const validationResult = await validateRequestBody(request, CreateTagSchema)
  if (!validationResult.success) {
    return validationResult.error
  }
  const tagData = validationResult.data

  const supabase = await createClient()
  const tagId = uuidv4()

  try {
    // Check if tag with same name already exists for this user
    const { data: existingTag, error: checkError } = await supabase
      .from('tags')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', tagData.name.toLowerCase().trim())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return handleDatabaseError(checkError)
    }

    if (existingTag) {
      return createErrorResponse(
        'A tag with this name already exists',
        HTTP_STATUS.CONFLICT,
        undefined,
        'DUPLICATE_TAG'
      )
    }

    // Create the tag
    const { data: newTag, error: insertError } = await supabase
      .from('tags')
      .insert({
        id: tagId,
        user_id: user.id,
        name: tagData.name.toLowerCase().trim(),
        color: tagData.color,
        is_system: false,
      })
      .select()
      .single()

    if (insertError) {
      return handleDatabaseError(insertError)
    }

    // Record action for undo/redo functionality
    await recordTagCreation(user.id, tagId, newTag)

    return createSuccessResponse(
      newTag,
      'Tag created successfully',
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    console.error('Error creating tag:', error)
    return createErrorResponse(
      'Failed to create tag',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    )
  }
})
