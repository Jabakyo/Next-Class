import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .refine((email) => email.endsWith('@dickinson.edu'), {
      message: 'Please use your @dickinson.edu email address'
    }),
  password: z.string()
    .min(1, 'Password is required')
})

export const signupSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .refine((email) => email.endsWith('@dickinson.edu'), {
      message: 'Please use your @dickinson.edu email address'
    }),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must be less than 50 characters'),
  studentId: z.string()
    .min(1, 'Student ID is required')
    .regex(/^[0-9]+$/, 'Student ID must contain only numbers')
    .refine((id) => id.length === 9, {
      message: 'STUDENTIDを正しく入力してください'
    }),
  year: z.string().optional(),
  major: z.string().optional(),
  interests: z.array(z.string()).optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
  settings: z.object({
    privacy: z.object({
      showEmail: z.boolean(),
      showSchedule: z.boolean(),
      showInterests: z.boolean(),
      showSocialLinks: z.boolean(),
    }),
    notifications: z.object({
      classUpdates: z.boolean(),
      classmateRequests: z.boolean(),
      scheduleChanges: z.boolean(),
      newFeatures: z.boolean(),
    }),
  }).optional(),
  selectedClasses: z.array(z.any()).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>