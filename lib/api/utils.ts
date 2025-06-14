import { NextRequest, NextResponse } from 'next/server'
import { ZodError, ZodSchema } from 'zod'
import { createClient } from '@/lib/supabase/server'

/**
 * Standard API error response structure
 */
export interface ApiError {
  error: string
  message: string
  details?: any
  code?: string
}

/**
 * Standard API success response structure
 */
export interface ApiResponse<T = any> {
  data?: T
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

/**
 * HTTP status codes for consistent API responses
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number = HTTP_STATUS.BAD_REQUEST,
  details?: any,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: 'API Error',
      message,
      details,
      code,
    },
    { status }
  )
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  status: number = HTTP_STATUS.OK,
  meta?: ApiResponse<T>['meta']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      data,
      message,
      meta,
    },
    { status }
  )
}

/**
 * Validates request body against a Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: NextResponse<ApiError> }> {
  try {
    const body = await request.json()
    const validatedData = schema.parse(body)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: createErrorResponse(
          'Validation failed',
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          error.errors,
          'VALIDATION_ERROR'
        ),
      }
    }
    return {
      success: false,
      error: createErrorResponse(
        'Invalid JSON in request body',
        HTTP_STATUS.BAD_REQUEST,
        undefined,
        'INVALID_JSON'
      ),
    }
  }
}

/**
 * Validates URL parameters against a Zod schema
 */
export function validateParams<T>(
  params: any,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; error: NextResponse<ApiError> } {
  try {
    const validatedData = schema.parse(params)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: createErrorResponse(
          'Invalid parameters',
          HTTP_STATUS.BAD_REQUEST,
          error.errors,
          'INVALID_PARAMS'
        ),
      }
    }
    return {
      success: false,
      error: createErrorResponse(
        'Parameter validation failed',
        HTTP_STATUS.BAD_REQUEST,
        undefined,
        'PARAM_ERROR'
      ),
    }
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; error: NextResponse<ApiError> } {
  try {
    const queryObject = Object.fromEntries(searchParams.entries())
    const validatedData = schema.parse(queryObject)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: createErrorResponse(
          'Invalid query parameters',
          HTTP_STATUS.BAD_REQUEST,
          error.errors,
          'INVALID_QUERY'
        ),
      }
    }
    return {
      success: false,
      error: createErrorResponse(
        'Query parameter validation failed',
        HTTP_STATUS.BAD_REQUEST,
        undefined,
        'QUERY_ERROR'
      ),
    }
  }
}

/**
 * Gets authenticated user from request
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      success: false,
      error: createErrorResponse(
        'Authentication required',
        HTTP_STATUS.UNAUTHORIZED,
        undefined,
        'AUTH_REQUIRED'
      ),
    }
  }

  return { success: true, user }
}

/**
 * Handles database errors and converts them to API responses
 */
export function handleDatabaseError(error: any): NextResponse<ApiError> {
  console.error('Database error:', error)

  // Handle specific Supabase/PostgreSQL errors
  if (error.code === '23505') {
    return createErrorResponse(
      'Resource already exists',
      HTTP_STATUS.CONFLICT,
      undefined,
      'DUPLICATE_RESOURCE'
    )
  }

  if (error.code === '23503') {
    return createErrorResponse(
      'Referenced resource not found',
      HTTP_STATUS.BAD_REQUEST,
      undefined,
      'FOREIGN_KEY_VIOLATION'
    )
  }

  if (error.code === 'PGRST116') {
    return createErrorResponse(
      'Resource not found',
      HTTP_STATUS.NOT_FOUND,
      undefined,
      'NOT_FOUND'
    )
  }

  // Generic database error
  return createErrorResponse(
    'Database operation failed',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    process.env.NODE_ENV === 'development' ? error : undefined,
    'DATABASE_ERROR'
  )
}

/**
 * Wraps API handlers with error handling
 */
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('API handler error:', error)
      return createErrorResponse(
        'Internal server error',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        process.env.NODE_ENV === 'development' ? error : undefined,
        'INTERNAL_ERROR'
      )
    }
  }
}
