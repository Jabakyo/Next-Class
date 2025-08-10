import { z } from 'zod'
import { validatePassword as validatePasswordSecurity } from './password-security'

// Re-export existing validations
export { loginSchema, signupSchema } from './validations'

// Enhanced email schema with additional security checks
const emailSchema = z.string()
  .trim()
  .toLowerCase()
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long')
  .refine((email) => {
    // Basic format validation
    const parts = email.split('@')
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0
  }, { message: 'Invalid email format' })
  .refine((email) => email.endsWith('@dickinson.edu'), {
    message: 'Please use your @dickinson.edu email address'
  })
  .refine((email) => {
    // Prevent common email injection patterns
    const dangerous = /[<>\"'%;()&+]/
    return !dangerous.test(email)
  }, { message: 'Email contains invalid characters' })

// Enhanced password schema that integrates with password security
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters long')
  .max(128, 'Password is too long')
  .refine((password) => {
    const validation = validatePasswordSecurity(password)
    return validation.isValid
  }, {
    message: 'Password does not meet security requirements'
  })

// Enhanced text input schemas with XSS protection
const safeTextSchema = (maxLength: number, minLength: number = 0) => z.string()
  .trim()
  .min(minLength)
  .max(maxLength)
  .refine((text) => {
    // Prevent XSS patterns
    const xssPatterns = /<script|javascript:|vbscript:|on\w+\s*=|<iframe|<object|<embed/i
    return !xssPatterns.test(text)
  }, { message: 'Text contains potentially dangerous content' })

const safeNameSchema = z.string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')

const safeUrlSchema = z.string()
  .url('Please enter a valid URL')
  .refine((url) => {
    try {
      const parsedUrl = new URL(url)
      return ['http:', 'https:'].includes(parsedUrl.protocol)
    } catch {
      return false
    }
  }, { message: 'Only HTTP and HTTPS URLs are allowed' })
  .refine((url) => {
    // Prevent local/private network access
    const host = new URL(url).hostname
    const privateRanges = [
      /^localhost$/i,
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ]
    return !privateRanges.some(range => range.test(host))
  }, { message: 'Private network URLs are not allowed' })

// Enhanced user search schema
export const userSearchSchema = z.object({
  query: safeTextSchema(100, 1)
    .refine((query) => {
      // Prevent SQL injection patterns in search
      const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b|--|\/\*|\*\/|;)/i
      return !sqlPatterns.test(query)
    }, { message: 'Search query contains invalid characters' })
})

// Enhanced profile update schema
export const updateProfileSchema = z.object({
  name: safeNameSchema.optional(),
  bio: safeTextSchema(500).optional(),
  year: z.enum(['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate']).optional(),
  major: safeTextSchema(100).optional(),
  interests: z.array(safeTextSchema(50)).max(10).optional(),
  socialLinks: z.object({
    twitter: safeUrlSchema.optional().or(z.literal('')),
    linkedin: safeUrlSchema.optional().or(z.literal('')),
    github: safeUrlSchema.optional().or(z.literal('')),
    instagram: safeUrlSchema.optional().or(z.literal('')),
  }).optional(),
  settings: z.object({
    privacy: z.object({
      showEmail: z.boolean(),
      showSchedule: z.boolean(),
      showInterests: z.boolean(),
      showSocialLinks: z.boolean(),
    }).optional(),
    notifications: z.object({
      classUpdates: z.boolean(),
      classmateRequests: z.boolean(),
      scheduleChanges: z.boolean(),
      newFeatures: z.boolean(),
    }).optional(),
  }).optional(),
})

// Schedule verification schema
export const verificationSubmitSchema = z.object({
  screenshot: z.string().min(1, 'Screenshot is required')
})

// Password reset schemas
export const forgotPasswordSchema = z.object({
  email: emailSchema
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema
})

// Enhanced event schemas
export const createEventSchema = z.object({
  title: safeTextSchema(200, 1),
  description: safeTextSchema(1000).optional(),
  date: z.string()
    .refine((date) => {
      const parsed = Date.parse(date)
      return !isNaN(parsed) && parsed > Date.now() - 24 * 60 * 60 * 1000
    }, { message: 'Date must be valid and not in the past' }),
  time: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  location: safeTextSchema(200, 1),
  type: z.enum(['social', 'academic', 'career', 'sports', 'other']),
  maxAttendees: z.number().int().min(1).max(1000).optional(),
  isPrivate: z.boolean().optional()
})

export const updateEventSchema = createEventSchema.partial()

export const eventResponseSchema = z.object({
  response: z.enum(['attending', 'maybe', 'not_attending'])
})

// Course search schema
export const courseSearchSchema = z.object({
  query: z.string().optional(),
  subject: z.string().optional(),
  level: z.string().optional(),
  term: z.string().optional(),
  instructor: z.string().optional(),
  days: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(100).optional()
})

// Admin/Owner schemas
export const adminActionSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  reason: z.string().max(500).optional()
})

export const deleteUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
})

// Notification schemas
export const markNotificationReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1, 'At least one notification ID is required')
})

// Privacy settings schema
export const privacySettingsSchema = z.object({
  privacy: z.object({
    showEmail: z.boolean(),
    showSchedule: z.boolean(),
    showInterests: z.boolean(),
    showSocialLinks: z.boolean(),
    showYear: z.boolean().optional(),
    showMajor: z.boolean().optional(),
  })
})

// Visit tracking schema
export const trackViewSchema = z.object({
  viewedUserId: z.string().min(1, 'User ID is required')
})

// Class selection schema
export const classSelectionSchema = z.object({
  classes: z.array(z.object({
    courseId: z.string(),
    courseName: z.string(),
    courseCode: z.string(),
    instructor: z.string(),
    schedule: z.object({
      days: z.array(z.string()),
      time: z.string(),
      location: z.string()
    })
  })).min(1, 'At least one class is required').max(10, 'Maximum 10 classes allowed')
})

// Email verification schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
})

// Test email schema (admin only)
export const testEmailSchema = z.object({
  to: emailSchema,
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(2000)
})

// Helper function to validate request body
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data?: T; error?: any }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.flatten() }
    }
    return { error: 'Invalid request body' }
  }
}

// Helper function to validate query params
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { data?: T; error?: any } {
  try {
    const params: any = {}
    searchParams.forEach((value, key) => {
      if (params[key]) {
        // Handle array params
        if (Array.isArray(params[key])) {
          params[key].push(value)
        } else {
          params[key] = [params[key], value]
        }
      } else {
        params[key] = value
      }
    })
    
    const data = schema.parse(params)
    return { data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.flatten() }
    }
    return { error: 'Invalid query parameters' }
  }
}