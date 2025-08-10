export interface LoginActivity {
  timestamp: string
  ipAddress?: string
  userAgent?: string
  success: boolean
}

export interface ProfileView {
  viewerId: string
  viewerName: string
  viewerEmail: string
  timestamp: string
  duration?: number // in seconds
}

export interface UserActivity {
  lastLogin?: string
  loginHistory: LoginActivity[]
  profileViews: ProfileView[]
  profileViewedBy: ProfileView[]
}