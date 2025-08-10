import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

export interface ApiError {
  message: string
  code?: string
  details?: any
  statusCode: number
  trackingId?: string
}

export interface ErrorContext {
  userId?: string
  endpoint?: string
  userAgent?: string
  ip?: string
  requestId?: string
}

/**
 * Standard API error response with tracking ID
 */
export function createErrorResponse(message: string, statusCode: number, code?: string, details?: any): NextResponse {
  const trackingId = crypto.randomUUID()
  
  const errorResponse = {
    error: message,
    code,
    trackingId,
    timestamp: new Date().toISOString()
  }

  // Only include details in development
  if (process.env.NODE_ENV === 'development' && details) {
    Object.assign(errorResponse, { details })
  }

  logger.error('API Error Response', {
    trackingId,
    message,
    code,
    statusCode,
    details: process.env.NODE_ENV === 'development' ? details : undefined
  })

  return NextResponse.json(errorResponse, { status: statusCode })
}

/**
 * Standard API success response with better typing
 */
export function createSuccessResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  })
}

/**
 * Handle API errors with consistent logging and response
 */
export function handleApiError(
  error: any, 
  context: ErrorContext, 
  endpoint: string
): NextResponse {
  const trackingId = crypto.randomUUID()
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Enhanced error logging
  logger.error('API Error', {
    trackingId,
    endpoint,
    context,
    error: {
      name: error.name,
      message: error.message,
      stack: isProduction ? undefined : error.stack,
      statusCode: error.statusCode
    },
    timestamp: new Date().toISOString()
  })

  // Security: Don't expose internal errors in production
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    // Client errors - safe to expose
    return createErrorResponse(
      error.message,
      error.statusCode,
      error.code,
      isProduction ? undefined : error.details
    )
  } else {
    // Server errors - sanitize message
    return createErrorResponse(
      isProduction ? 'Internal server error' : error.message,
      500,
      'INTERNAL_ERROR',
      isProduction ? { trackingId } : { error: error.message, stack: error.stack }
    )
  }
}

/**
 * Enhanced validation with detailed error reporting
 */
export function validateInput<T>(
  data: any,
  schema: any,
  context: ErrorContext
): { success: true; data: T } | { success: false; error: NextResponse } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error: any) {
    logger.warn('Input validation failed', {
      context,
      error: error.message,
      issues: error.issues || undefined
    })

    const message = error.issues 
      ? `Validation failed: ${error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ')}`
      : 'Invalid input data'

    return {
      success: false,
      error: createErrorResponse(message, 400, 'VALIDATION_ERROR')
    }
  }
}

/**
 * Rate limit error handler
 */
export function createRateLimitError(resetTime?: number): NextResponse {
  const message = 'Too many requests. Please try again later.'
  const response = createErrorResponse(message, 429, 'RATE_LIMIT_EXCEEDED')
  
  if (resetTime) {
    response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString())
  }
  
  return response
}

/**
 * Common API errors
 */
export const ApiErrors = {
  UNAUTHORIZED: {
    message: 'Authentication required',
    code: 'UNAUTHORIZED',
    statusCode: 401
  },
  FORBIDDEN: {
    message: 'Access forbidden',
    code: 'FORBIDDEN', 
    statusCode: 403
  },
  NOT_FOUND: {
    message: 'Resource not found',
    code: 'NOT_FOUND',
    statusCode: 404
  },
  VALIDATION_ERROR: (details: any) => ({
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details,
    statusCode: 400
  }),
  EMAIL_SERVICE_ERROR: {
    message: 'Email service unavailable',
    code: 'EMAIL_SERVICE_ERROR',
    statusCode: 503
  },
  FILE_OPERATION_ERROR: {
    message: 'File operation failed',
    code: 'FILE_OPERATION_ERROR',
    statusCode: 500
  }
}

/**
 * Validation helper
 */
export function validateRequired(data: any, requiredFields: string[]): string[] {
  const missing = requiredFields.filter(field => !data[field])
  return missing
}