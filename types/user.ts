// Enhanced User type with better type safety
export interface User {
  readonly id: string
  name: string
  email: string
  studentId: string
  year: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate'
  major: string
  interests: readonly string[]
  bio: string
  avatar: string
  socialLinks: SocialLinks
  settings: UserSettings
  classes: readonly SelectedClass[]
  selectedClasses?: readonly SelectedClass[] // For backward compatibility
  points: number
  achievements: readonly string[]
  hasSharedSchedule: boolean
  scheduleVerificationStatus: 'none' | 'pending' | 'verified' | 'rejected'
  verificationSubmittedAt?: string
  verificationScreenshot?: string
  previousClasses?: readonly SelectedClass[]
  classesChangedAt?: string
  activity: UserActivity
  // Enhanced security fields
  readonly createdAt: string
  readonly updatedAt: string
  lastLoginAt?: string
  isActive: boolean
  emailVerified: boolean
  passwordStrength?: 'weak' | 'medium' | 'strong' | 'very_strong'
  mfaEnabled: boolean
  accountLocked: boolean
  lockoutReason?: string
  lockoutUntil?: string
}

export interface SocialLinks {
  readonly twitter?: string
  readonly linkedin?: string
  readonly github?: string
  readonly instagram?: string
}

export interface UserSettings {
  privacy: PrivacySettings
  notifications: NotificationSettings
  readonly theme?: 'light' | 'dark' | 'system'
  readonly language?: string
  readonly timezone?: string
}

export interface PrivacySettings {
  showEmail: boolean
  showSchedule: boolean
  showInterests: boolean
  showSocialLinks: boolean
  showYear: boolean
  showMajor: boolean
  allowDirectMessages: boolean
  allowCalendarInvites: boolean
  profileVisibility: 'public' | 'students_only' | 'friends_only' | 'private'
}

export interface NotificationSettings {
  classUpdates: boolean
  classmateRequests: boolean
  scheduleChanges: boolean
  newFeatures: boolean
  securityAlerts: boolean
  email: EmailNotificationSettings
  push: PushNotificationSettings
}

export interface EmailNotificationSettings {
  enabled: boolean
  frequency: 'immediate' | 'daily' | 'weekly'
  securityAlerts: boolean
  classReminders: boolean
}

export interface PushNotificationSettings {
  enabled: boolean
  classReminders: boolean
  messages: boolean
  events: boolean
}

export interface UserActivity {
  lastLogin?: string
  loginHistory: readonly LoginHistoryEntry[]
  profileViews: readonly ProfileView[]
  profileViewedBy: readonly ProfileView[]
  readonly totalLogins: number
  readonly averageSessionDuration?: number
  readonly lastPasswordChange?: string
  readonly securityEvents: readonly SecurityEvent[]
}

export interface LoginHistoryEntry {
  readonly timestamp: string
  readonly ipAddress: string
  readonly userAgent: string
  readonly success: boolean
  readonly location?: GeoLocation
  readonly sessionDuration?: number
  readonly logoutType?: 'manual' | 'timeout' | 'forced'
}

export interface ProfileView {
  readonly viewerId: string
  readonly viewerName: string
  readonly viewerEmail: string
  readonly timestamp: string
  readonly duration?: number
  readonly referrer?: string
  readonly viewType: 'search' | 'direct' | 'link' | 'recommendation'
}

export interface SecurityEvent {
  readonly id: string
  readonly type: 'login_attempt' | 'password_change' | 'profile_update' | 'suspicious_activity' | 'account_locked' | 'account_unlocked'
  readonly timestamp: string
  readonly ipAddress: string
  readonly userAgent: string
  readonly success: boolean
  readonly details?: Record<string, unknown>
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface GeoLocation {
  readonly country?: string
  readonly region?: string
  readonly city?: string
  readonly timezone?: string
}

export interface UserWithPassword extends User {
  password: string
}

export interface MeetingTime {
  days: string[]
  startTime: string
  endTime: string
}

export interface AvailableClass {
  id: string
  subject: string
  courseNumber: string
  section: string
  crn: string
  term: string
  title: string
  instructor: string
  meetingTimes: MeetingTime[]
  room: string
  capacity: number
  enrolled: number
  description: string
}

export interface SelectedClass {
  id: string
  subject: string
  courseNumber: string
  section: string
  crn: string
  term: string
  title: string
  instructor: string
  meetingTimes: MeetingTime[]
  room: string
}

export interface EventAttendee {
  userId: string
  status: 'pending' | 'accepted' | 'declined'
}

export interface Event {
  id: number
  title: string
  date: string
  time: string
  endTime?: string
  duration?: number // Duration in hours
  location: string
  description?: string
  invitees?: string[]
  createdBy?: string
  createdAt?: string
  attendees?: EventAttendee[]
  status?: 'active' | 'cancelled'
  cancelledAt?: string
  cancelReason?: string
}
