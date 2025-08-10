// Enhanced API response types with better type safety

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  trackingId?: string
  timestamp: string
}

export interface ApiError {
  error: string
  code?: string
  trackingId?: string
  timestamp: string
  details?: Record<string, any>
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// Authentication types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: SafeUser
  token: string
  expiresAt: string
}

export interface SignupRequest {
  email: string
  password: string
  name: string
  studentId: string
  year?: string
  major?: string
  interests?: string[]
  bio?: string
  selectedClasses?: CourseSelection[]
}

export interface SignupResponse {
  message: string
  requiresVerification: boolean
  verificationSent: boolean
}

// User types with enhanced safety
export interface SafeUser {
  id: string
  email: string
  name: string
  studentId: string
  year: string
  major: string
  avatar?: string
  bio?: string
  interests: string[]
  classes: UserClass[]
  scheduleVerificationStatus: 'none' | 'pending' | 'verified' | 'rejected'
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  socialLinks?: SocialLinks
  settings: UserSettings
}

export interface UserClass {
  courseId: string
  courseName: string
  courseCode: string
  instructor: string
  schedule: {
    days: string[]
    time: string
    location: string
  }
  credits: number
  term: string
}

export interface SocialLinks {
  twitter?: string
  linkedin?: string
  github?: string
  instagram?: string
}

export interface UserSettings {
  privacy: PrivacySettings
  notifications: NotificationSettings
}

export interface PrivacySettings {
  showEmail: boolean
  showSchedule: boolean
  showInterests: boolean
  showSocialLinks: boolean
  showYear: boolean
  showMajor: boolean
}

export interface NotificationSettings {
  classUpdates: boolean
  classmateRequests: boolean
  scheduleChanges: boolean
  newFeatures: boolean
  securityAlerts: boolean
}

// Course and class types
export interface Course {
  id: string
  code: string
  name: string
  description?: string
  instructor: string
  credits: number
  term: string
  schedule: {
    days: string[]
    time: string
    location: string
  }
  capacity: number
  enrolled: number
  prerequisites?: string[]
  subject: string
  level: number
}

export interface CourseSelection {
  courseId: string
  courseName: string
  courseCode: string
  instructor: string
  schedule: {
    days: string[]
    time: string
    location: string
  }
}

// Event types
export interface Event {
  id: string
  title: string
  description?: string
  creatorId: string
  creatorName: string
  date: string
  time: string
  location: string
  type: 'social' | 'academic' | 'career' | 'sports' | 'other'
  maxAttendees?: number
  isPrivate: boolean
  attendees: EventAttendee[]
  createdAt: string
  updatedAt: string
}

export interface EventAttendee {
  userId: string
  userName: string
  response: 'attending' | 'maybe' | 'not_attending'
  respondedAt: string
}

export interface CreateEventRequest {
  title: string
  description?: string
  date: string
  time: string
  location: string
  type: Event['type']
  maxAttendees?: number
  isPrivate?: boolean
}

// Search and filter types
export interface UserSearchRequest {
  query: string
}

export interface CourseSearchRequest {
  query?: string
  subject?: string
  level?: string
  term?: string
  instructor?: string
  days?: string[]
  limit?: number
}

export interface UserSearchResult {
  id: string
  name: string
  email: string
  year: string
  major: string
  avatar?: string
  bio?: string
  commonClasses: number
  isPublicProfile: boolean
}

// File upload types
export interface FileUploadResponse {
  message: string
  url: string
  success: boolean
}

// Verification types
export interface VerificationRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  studentId: string
  screenshotUrl: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedAt?: string
  reviewedBy?: string
  reason?: string
  currentClasses: UserClass[]
  previousClasses?: UserClass[]
  classesChangedAt?: string
}

// Admin/Owner types
export interface AdminActionRequest {
  requestId: string
  reason?: string
}

export interface DeleteUserRequest {
  userId: string
}

// Notification types
export interface Notification {
  id: string
  userId: string
  type: 'class_update' | 'classmate_request' | 'schedule_change' | 'verification_status' | 'security_alert'
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  createdAt: string
}

export interface MarkNotificationReadRequest {
  notificationIds: string[]
}

// Analytics types
export interface VisitRecord {
  id: string
  viewerId: string
  viewedUserId: string
  timestamp: string
  ip?: string
  userAgent?: string
}

export interface PopularSchedule {
  classes: string[]
  count: number
  users: string[]
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: number
}

// Security types
export interface SecurityEvent {
  type: 'login_attempt' | 'password_change' | 'profile_update' | 'suspicious_activity'
  userId?: string
  ip: string
  userAgent: string
  success: boolean
  timestamp: string
  details?: Record<string, any>
}

// Utility types for enhanced type safety
export type NonEmptyString<T extends string> = T extends '' ? never : T
export type Email = `${string}@${string}.${string}`
export type DickinsonEmail = `${string}@dickinson.edu`
export type CourseCode = `${string}${number}`
export type StudentId = `${number}`

// Form validation types
export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

// Database operation types
export interface DatabaseOperation<T> {
  success: boolean
  data?: T
  error?: string
  affectedRows?: number
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Export utility type helpers
export type RequireField<T, K extends keyof T> = T & Required<Pick<T, K>>
export type OptionalField<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type StrictPick<T, K extends keyof T> = Pick<T, K> & { [P in K]: NonNullable<T[P]> }

// Brand types for additional safety
export type UserId = string & { readonly brand: unique symbol }
export type CourseId = string & { readonly brand: unique symbol }
export type EventId = string & { readonly brand: unique symbol }
export type NotificationId = string & { readonly brand: unique symbol }