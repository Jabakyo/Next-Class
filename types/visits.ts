export interface ProfileVisit {
  id: string
  visitedUserId: string  // User whose profile was visited
  visitorUserId?: string // User who visited (optional for anonymous visits)
  timestamp: string
  visitorIP?: string     // For anonymous visit tracking
}

export interface UserRanking {
  userId: string
  userName: string
  userEmail: string
  userAvatar?: string
  userYear?: string
  userMajor?: string
  weeklyViews: number
  monthlyViews: number
  totalViews: number
  weeklyTrend: 'up' | 'down' | 'same'
  monthlyTrend: 'up' | 'down' | 'same'
}