// API Client for handling all API calls with authentication

const API_BASE_URL = '/api'

// Helper function to get auth token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth-token')
}

// Helper function to make authenticated API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken()
  console.log('Making API call to:', endpoint, 'with token:', token ? 'present' : 'missing')
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  
  if (!response.ok) {
    console.error('API call failed:', {
      url: `${API_BASE_URL}${endpoint}`,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    const errorText = await response.text()
    console.error('Error response body:', errorText)
    
    let error
    try {
      error = JSON.parse(errorText)
    } catch {
      error = { error: errorText || 'Unknown error' }
    }
    
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Events API
export const eventsAPI = {
  // Get all events for current user
  getEvents: async () => {
    return apiCall('/events')
  },

  // Create new event
  createEvent: async (eventData: any) => {
    return apiCall('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    })
  },

  // Update existing event
  updateEvent: async (eventId: number, eventData: any) => {
    return apiCall(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    })
  },

  // Cancel/Delete event
  cancelEvent: async (eventId: number) => {
    return apiCall(`/events/${eventId}`, {
      method: 'DELETE',
    })
  },

  // Respond to event invitation
  respondToEvent: async (eventId: number, status: 'accepted' | 'declined' | 'pending') => {
    return apiCall(`/events/${eventId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    })
  },
}

// Analytics API
export const analyticsAPI = {
  // Record schedule view
  recordScheduleView: async (viewedUserId: string) => {
    return apiCall('/analytics/schedule-view', {
      method: 'POST',
      body: JSON.stringify({ viewedUserId }),
    })
  },

  // Get popular schedules
  getPopularSchedules: async (period: 'week' | 'month' | 'all' = 'all', limit: number = 10) => {
    return apiCall(`/analytics/popular-schedules?period=${period}&limit=${limit}`)
  },

  // Get view analytics for specific user
  getViewAnalytics: async (userId?: string, period: 'week' | 'month' | 'all' = 'all') => {
    const params = new URLSearchParams()
    if (userId) params.set('userId', userId)
    params.set('period', period)
    return apiCall(`/analytics/schedule-view?${params.toString()}`)
  },
}

// Notifications API
export const notificationsAPI = {
  // Mark notifications as read
  markAsRead: async (notificationIds: string[], markAll: boolean = false) => {
    return apiCall('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationIds, markAll }),
    })
  },

  // Get read notification status
  getReadStatus: async () => {
    return apiCall('/notifications/mark-read')
  },
}

// User Settings API
export const userSettingsAPI = {
  // Get user settings
  getSettings: async () => {
    return apiCall('/user/settings')
  },

  // Update user settings
  updateSettings: async (settings: { notifications?: any; privacy?: any }) => {
    return apiCall('/user/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  },

  // Get privacy settings
  getPrivacySettings: async () => {
    return apiCall('/user/privacy')
  },

  // Update privacy settings
  updatePrivacySettings: async (privacy: any) => {
    return apiCall('/user/privacy', {
      method: 'PUT',
      body: JSON.stringify(privacy),
    })
  },
}

// Search API
export const searchAPI = {
  // Search users with filters
  searchUsers: async (params: {
    q?: string
    class?: string
    timeSlot?: string
    subject?: string
    verification?: string
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, value.toString())
      }
    })
    return apiCall(`/search/users?${searchParams.toString()}`)
  },

  // Get search preferences
  getSearchPreferences: async () => {
    return apiCall('/search/preferences')
  },

  // Save search preferences
  saveSearchPreferences: async (type: string, data: any) => {
    return apiCall('/search/preferences', {
      method: 'POST',
      body: JSON.stringify({ type, data }),
    })
  },

  // Delete search preferences
  deleteSearchPreferences: async (type: string, name?: string) => {
    const params = new URLSearchParams({ type })
    if (name) params.set('name', name)
    return apiCall(`/search/preferences?${params.toString()}`, {
      method: 'DELETE',
    })
  },
}

// Fallback functions for localStorage (for graceful degradation)
export const localStorageFallback = {
  // Events fallback
  getEvents: () => {
    try {
      const events = localStorage.getItem('events')
      return events ? JSON.parse(events) : []
    } catch {
      return []
    }
  },

  saveEvents: (events: any[]) => {
    try {
      localStorage.setItem('events', JSON.stringify(events))
    } catch (error) {
      console.error('Failed to save events to localStorage:', error)
    }
  },

  // Analytics fallback
  getViewCounts: () => {
    try {
      const viewCounts = localStorage.getItem('scheduleViews')
      return viewCounts ? JSON.parse(viewCounts) : {}
    } catch {
      return {}
    }
  },

  getViewHistory: () => {
    try {
      const viewHistory = localStorage.getItem('scheduleViewHistory')
      return viewHistory ? JSON.parse(viewHistory) : {}
    } catch {
      return {}
    }
  },

  // Notifications fallback
  getReadNotifications: (userId: string) => {
    try {
      const readNotifications = localStorage.getItem(`notificationsRead_${userId}`)
      return readNotifications ? JSON.parse(readNotifications) : []
    } catch {
      return []
    }
  }
}

// Hybrid function that tries API first, falls back to localStorage
export const hybridAPI = {
  // Get events with fallback
  getEvents: async (): Promise<any[]> => {
    try {
      const response = await eventsAPI.getEvents()
      console.log('Events API response:', response)
      return response.events || []
    } catch (error) {
      console.error('API call failed, using localStorage fallback:', error)
      return localStorageFallback.getEvents()
    }
  },

  // Save events with API and localStorage backup
  saveEvent: async (eventData: any): Promise<any> => {
    try {
      const response = await eventsAPI.createEvent(eventData)
      
      // Also save to localStorage as backup
      const currentEvents = localStorageFallback.getEvents()
      currentEvents.push(response.event)
      localStorageFallback.saveEvents(currentEvents)
      
      return response.event
    } catch (error) {
      console.warn('API call failed, saving to localStorage only:', error)
      
      // Fallback to localStorage only
      const currentEvents = localStorageFallback.getEvents()
      const newId = currentEvents.length > 0 ? Math.max(...currentEvents.map(e => e.id)) + 1 : 1
      const newEvent = {
        ...eventData,
        id: newId,
        createdAt: new Date().toISOString(),
        attendees: [],
        status: 'active'
      }
      currentEvents.push(newEvent)
      localStorageFallback.saveEvents(currentEvents)
      return newEvent
    }
  }
}