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
import { UpdateUserProfileSchema } from '@/lib/api/validation'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/user/profile - Get the current user's profile
 */
export const GET = withErrorHandling(async () => {
  const authResult = await getAuthenticatedUser()
  if (!authResult.success) {
    return authResult.error
  }
  const { user } = authResult

  const supabase = await createClient()

  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      return handleDatabaseError(error)
    }

    return createSuccessResponse(profile, 'Profile retrieved successfully', HTTP_STATUS.OK)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return createErrorResponse('Failed to fetch profile', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
})

/**
 * PUT /api/user/profile - Update the current user's profile
 */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const authResult = await getAuthenticatedUser()
  if (!authResult.success) {
    return authResult.error
  }
  const { user } = authResult

  const validationResult = await validateRequestBody(request, UpdateUserProfileSchema)
  if (!validationResult.success) {
    return validationResult.error
  }
  const updateData = validationResult.data

  const supabase = await createClient()

  try {
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('*')
      .single()

    if (updateError) {
      return handleDatabaseError(updateError)
    }

    return createSuccessResponse(updated, 'Profile updated successfully', HTTP_STATUS.OK)
  } catch (error) {
    console.error('Error updating profile:', error)
    return createErrorResponse('Failed to update profile', HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }
})

