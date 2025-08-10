"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import Timetable from "@/components/timetable"
import EventsSidebar from "@/components/events-sidebar"
import EventModal from "@/components/event-modal"
import EventDetailsModal from "@/components/event-details-modal"
import ClassSelectionModal from "@/components/class-selection-modal"
import Notification from "@/components/notification"
import ShareScheduleModal from "@/components/share-schedule-modal"
import ScheduleVerificationModal from "@/components/schedule-verification-modal"
import AccountPage from "@/components/account-page"
import ClassChangeWarningModal from "@/components/class-change-warning-modal"
import type { User, Event, SelectedClass } from "@/types/user"
// Temporary icon replacements
const Share2 = () => <span>⭐</span>
const EyeOff = () => <span>🙈</span>
const Shield = () => <span>🛡️</span>
const Clock = () => <span>⏰</span>
const XCircle = () => <span>⭐</span>

import { hybridAPI, eventsAPI } from "@/lib/api-client"

interface DashboardProps {
  user: User
  onLogout: () => void
  onNavigateToBrowse: () => void
  onNavigateToRankings: () => void
  onNavigateToAdmin: () => void
  onNavigateToCourses: () => void
  onUpdateUser: (user: User) => void
}

export default function Dashboard({
  user,
  onLogout,
  onNavigateToBrowse,
  onNavigateToRankings,
  onNavigateToAdmin,
  onNavigateToCourses,
  onUpdateUser,
}: DashboardProps) {
  const [currentView, setCurrentView] = useState<"dashboard" | "account">("dashboard")
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isEventDetailsModalOpen, setIsEventDetailsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isClassModalOpen, setIsClassModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showClassChangeWarning, setShowClassChangeWarning] = useState(false)
  const [pendingClasses, setPendingClasses] = useState<SelectedClass[] | null>(null)

  // Update current time every minute for real-time event filtering
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute (can be changed to 5000 for testing)

    return () => clearInterval(timer)
  }, [])

  // Load events from localStorage on mount
  // Load events from API with localStorage fallback
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    const loadEvents = async () => {
      try {
        const loadedEvents = await hybridAPI.getEvents()
        setEvents(loadedEvents)
      } catch (error) {
        console.error('Error loading events:', error)
        // Initialize empty events array if everything fails
        setEvents([])
      }
    }

    loadEvents()
  }, [user.id])

  // Note: Removed automatic localStorage saving since API handles persistence

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Helper function to check if an event is upcoming (uses currentTime for real-time updates)
  const isEventUpcoming = (event: Event) => {
    if (event.status === 'cancelled') return false
    
    // Get current time in New York timezone
    const nyTime = currentTime.toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit", 
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
    
    // Parse NY time
    const [datePart, timePart] = nyTime.split(', ')
    const [month, day, year] = datePart.split('/')
    const [hour, minute] = timePart.split(':')
    const nyNow = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${minute}:00`)
    
    // Create event datetime
    const eventDateTime = new Date(`${event.date}T${event.time}:00`)
    
    // Use end time if available, otherwise use start time
    if (event.endTime) {
      const eventEndDateTime = new Date(`${event.date}T${event.endTime}:00`)
      return eventEndDateTime > nyNow
    }
    
    return eventDateTime > nyNow
  }

  // Filter events to show only upcoming ones and events user is invited to
  const upcomingEvents = events.filter(event => {
    const isUpcoming = isEventUpcoming(event)
    const isUserRelated = event.createdBy === user.id || event.invitees?.includes(user.id)
    
    // Debug logging for event filtering
    if (!isUpcoming && isUserRelated) {
      console.log(`Event "${event.title}" filtered out - past event`, {
        date: event.date,
        time: event.time,
        endTime: event.endTime,
        currentNYTime: currentTime.toLocaleString("en-US", { timeZone: "America/New_York" })
      })
    }
    
    return isUpcoming && isUserRelated
  })

  const handleUpdateClassesWithWarning = (selectedClasses: SelectedClass[]) => {
    // Check if classes have actually changed
    const classesHaveChanged = () => {
      const currentClasses = user.classes || []
      if (selectedClasses.length !== currentClasses.length) return true

      const selectedIds = selectedClasses.map((cls) => cls.id).sort()
      const currentIds = currentClasses.map((cls) => cls.id).sort()

      return JSON.stringify(selectedIds) !== JSON.stringify(currentIds)
    }

    // If classes have changed and user was verified, show warning first
    if (classesHaveChanged() && user.scheduleVerificationStatus === 'verified') {
      setPendingClasses(selectedClasses)
      setShowClassChangeWarning(true)
      setIsClassModalOpen(false)
    } else {
      // No warning needed, proceed directly
      handleUpdateClasses(selectedClasses)
    }
  }

  const handleUpdateClasses = async (selectedClasses: SelectedClass[]) => {
    // Check if classes have actually changed
    const classesHaveChanged = () => {
      const currentClasses = user.classes || []
      if (selectedClasses.length !== currentClasses.length) return true

      const selectedIds = selectedClasses.map((cls) => cls.id).sort()
      const currentIds = currentClasses.map((cls) => cls.id).sort()

      return JSON.stringify(selectedIds) !== JSON.stringify(currentIds)
    }

    // If classes have changed and user was verified, reset verification status
    const shouldResetVerification = classesHaveChanged() && user.scheduleVerificationStatus === 'verified'

    try {
      const updateData: any = {
        classes: selectedClasses
      }

      // If classes changed and user was verified, reset to unverified
      if (shouldResetVerification) {
        updateData.scheduleVerificationStatus = 'none'
        updateData.verificationScreenshot = null
        updateData.verificationSubmittedAt = null
        // Store previous classes for comparison
        updateData.previousClasses = user.classes || []
        updateData.classesChangedAt = new Date().toISOString()
      }

      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Failed to update classes')
      }

      const data = await response.json()
      const updatedUser = data.user

      onUpdateUser(updatedUser)
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))

      // Update users array in localStorage to keep data consistent
      const allUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = allUsers.map((u: any) =>
        u.id === user.id
          ? {
              ...u,
              classes: selectedClasses,
            }
          : u,
      )
      localStorage.setItem("users", JSON.stringify(updatedUsers))

      setIsClassModalOpen(false)
      
      if (shouldResetVerification) {
        showNotification("Classes updated! Your schedule verification has been reset and requires re-verification.")
      } else {
        showNotification("Classes updated successfully!")
      }
    } catch (error) {
      console.error('Error updating classes:', error)
      showNotification("Failed to update classes", "error")
    }
  }

  const handleAddEvent = async (eventData: {
    title: string
    date: string
    time: string
    location: string
    description: string
    invitees: string[]
  }) => {
    try {
      const newEvent = await eventsAPI.createEvent(eventData)
      
      // Add the new event to the local state
      setEvents((prev) => [newEvent, ...prev])
      setIsEventModalOpen(false)

      const inviteeCount = eventData.invitees.length
      const message =
        inviteeCount > 0
          ? `Event created and ${inviteeCount} ${inviteeCount === 1 ? "person" : "people"} invited!`
          : "Event created successfully!"

      showNotification(message)
    } catch (error) {
      console.error('Error creating event:', error)
      showNotification('Failed to create event', 'error')
    }
  }

  const handleEventResponse = async (eventId: number, response: 'accepted' | 'declined') => {
    // Validate that the user is actually invited to this event
    const event = events.find(e => e.id === eventId)
    if (!event) {
      showNotification('Event not found', 'error')
      return
    }
    
    if (!event.invitees?.includes(user.id)) {
      showNotification('You are not invited to this event', 'error')
      return
    }

    try {
      await eventsAPI.respondToEvent(eventId, response)
      
      // Update local state
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          const updatedAttendees = event.attendees || []
          const existingAttendeeIndex = updatedAttendees.findIndex(a => a.userId === user.id)
          
          if (existingAttendeeIndex >= 0) {
            // Update existing attendee status
            updatedAttendees[existingAttendeeIndex] = {
              ...updatedAttendees[existingAttendeeIndex],
              status: response
            }
          } else {
            // Add new attendee status
            updatedAttendees.push({
              userId: user.id,
              status: response
            })
          }
          
          return {
            ...event,
            attendees: updatedAttendees
          }
        }
        return event
      }))

      const responseText = response === 'accepted' ? 'joined' : 'declined'
      showNotification(`You have ${responseText} the event!`)
    } catch (error) {
      console.error('Error updating event response:', error)
      showNotification('Failed to update event response', 'error')
    }
  }

  const handleEventClick = (event: Event) => {
    console.log('Event clicked:', event.title, 'Event ID:', event.id)
    setSelectedEvent(event)
    setIsEventDetailsModalOpen(true)
    console.log('Modal should now be open')
  }

  const handleCancelEvent = async (eventId: number, cancelReason?: string) => {
    try {
      await eventsAPI.cancelEvent(eventId)
      
      // Update local state
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            status: 'cancelled' as const,
            cancelledAt: new Date().toISOString(),
            cancelReason: cancelReason || 'Event cancelled by organizer'
          }
        }
        return event
      }))
      showNotification('Event has been cancelled successfully!')
    } catch (error) {
      console.error('Error cancelling event:', error)
      showNotification('Failed to cancel event', 'error')
    }
  }

  const handleShareSchedule = async (isShared: boolean) => {
    // Only allow sharing, not making private
    if (!isShared && user.hasSharedSchedule) {
      showNotification("Once shared, schedules cannot be made private again", "error")
      return
    }

    // Require verification before allowing schedule sharing
    if (isShared && user.scheduleVerificationStatus !== 'verified') {
      showNotification("You must verify your schedule before sharing it with others", "error")
      return
    }

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          hasSharedSchedule: isShared
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update sharing preference')
      }

      const data = await response.json()
      const updatedUser = data.user

      // Update the user state
      onUpdateUser(updatedUser)

      // Update localStorage
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))

      // Update users array in localStorage to keep data consistent
      const allUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = allUsers.map((u: any) => (u.id === user.id ? { ...u, hasSharedSchedule: isShared } : u))
      localStorage.setItem("users", JSON.stringify(updatedUsers))

      setIsShareModalOpen(false)
      showNotification("Schedule shared successfully!")
    } catch (error) {
      console.error('Error updating sharing preference:', error)
      showNotification("Failed to update sharing preference", "error")
    }
  }

  const handleQuickToggleShare = async () => {
    // Only allow sharing if not already shared
    if (!user.hasSharedSchedule) {
      // Require verification before allowing schedule sharing
      if (user.scheduleVerificationStatus !== 'verified') {
        showNotification("You must verify your schedule before sharing it with others", "error")
        return
      }
      try {
        const response = await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            hasSharedSchedule: true
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update sharing preference')
        }

        const data = await response.json()
        const updatedUser = data.user

        // Update the user state
        onUpdateUser(updatedUser)

        // Update localStorage
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))

        // Update users array in localStorage to keep data consistent
        const allUsers = JSON.parse(localStorage.getItem("users") || "[]")
        const updatedUsers = allUsers.map((u: any) => (u.id === user.id ? { ...u, hasSharedSchedule: true } : u))
        localStorage.setItem("users", JSON.stringify(updatedUsers))

        showNotification("Schedule is now shared with everyone!")
      } catch (error) {
        console.error('Error updating sharing preference:', error)
        showNotification("Failed to share schedule", "error")
      }
    }
  }

  const handleVerificationSubmit = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('screenshot', file)

      const response = await fetch('/api/auth/submit-verification', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit verification')
      }

      // Update user status locally
      const updatedUser = { ...user, scheduleVerificationStatus: 'pending' as const }
      onUpdateUser(updatedUser)
      
      // Update profile on server
      await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          scheduleVerificationStatus: 'pending',
          verificationSubmittedAt: new Date().toISOString()
        }),
      })

      setIsVerificationModalOpen(false)
      showNotification("Verification submitted! We'll review it within 1-2 business days.", "success")
    } catch (error) {
      console.error('Error submitting verification:', error)
      showNotification(error instanceof Error ? error.message : "Failed to submit verification", "error")
    }
  }

  // Show account page if selected
  if (currentView === "account") {
    return (
      <AccountPage
        user={user}
        onBack={() => setCurrentView("dashboard")}
        onUpdateUser={onUpdateUser}
        onOpenClassModal={() => setIsClassModalOpen(true)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header
        user={user}
        onOpenEventModal={() => setIsEventModalOpen(true)}
        onLogout={onLogout}
        onNavigateToBrowse={onNavigateToBrowse}
        onNavigateToRankings={onNavigateToRankings}
        onNavigateToAdmin={onNavigateToAdmin}
        onNavigateToCourses={onNavigateToCourses}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenAccountPage={() => setCurrentView("account")}
        onQuickShare={handleQuickToggleShare}
      />

      {/* Only show banner if schedule is NOT shared */}
      {!user.hasSharedSchedule && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <EyeOff className="w-5 h-5 text-yellow-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Your schedule is private</p>
                <p className="text-sm text-yellow-700">
                  {user.scheduleVerificationStatus !== 'verified' 
                    ? 'Verify your schedule first, then share with other students'
                    : 'Share your schedule to browse other students\' schedules'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user.scheduleVerificationStatus !== 'verified' && (
                <button
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Get Verify
                </button>
              )}
              <button
                onClick={handleQuickToggleShare}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  user.scheduleVerificationStatus !== 'verified'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                }`}
                disabled={user.scheduleVerificationStatus !== 'verified'}
              >
                <Share2 className="w-4 h-4" />
                Share Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show verification banner if not verified and schedule is shared */}
      {user.hasSharedSchedule && user.scheduleVerificationStatus !== 'verified' && (
        <div className={`border-l-4 p-4 mx-4 mt-4 rounded-r-lg ${
          user.scheduleVerificationStatus === 'pending' 
            ? 'bg-blue-50 border-blue-400' 
            : user.scheduleVerificationStatus === 'rejected'
            ? 'bg-red-50 border-red-400'
            : 'bg-orange-50 border-orange-400'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {user.scheduleVerificationStatus === 'pending' ? (
                <Clock className="w-5 h-5 text-blue-400 mr-3 animate-spin" />
              ) : user.scheduleVerificationStatus === 'rejected' ? (
                <XCircle className="w-5 h-5 text-red-400 mr-3" />
              ) : (
                <Shield className="w-5 h-5 text-orange-400 mr-3" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  user.scheduleVerificationStatus === 'pending' 
                    ? 'text-blue-800' 
                    : user.scheduleVerificationStatus === 'rejected'
                    ? 'text-red-800'
                    : 'text-orange-800'
                }`}>
                  {user.scheduleVerificationStatus === 'pending' 
                    ? 'Verification under review' 
                    : user.scheduleVerificationStatus === 'rejected'
                    ? 'Verification was rejected'
                    : 'Schedule verification required'}
                </p>
                <p className={`text-sm ${
                  user.scheduleVerificationStatus === 'pending' 
                    ? 'text-blue-700' 
                    : user.scheduleVerificationStatus === 'rejected'
                    ? 'text-red-700'
                    : 'text-orange-700'
                }`}>
                  {user.scheduleVerificationStatus === 'pending'
                    ? 'Your verification is being reviewed (1-2 business days)'
                    : user.scheduleVerificationStatus === 'rejected'
                    ? 'You can resubmit a new screenshot with correct requirements'
                    : 'Verify your schedule to view other students\' schedules'}
                </p>
              </div>
            </div>
            {user.scheduleVerificationStatus !== 'pending' && (
              <button
                onClick={() => setIsVerificationModalOpen(true)}
                className={`text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  user.scheduleVerificationStatus === 'rejected'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-orange-400 hover:bg-orange-500'
                }`}
              >
                <Shield className="w-4 h-4" />
                {user.scheduleVerificationStatus === 'rejected' ? 'Resubmit Verification' : 'Get Verified'}
              </button>
            )}
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3">
            <Timetable
              selectedClasses={user.classes || []}
              onAddClass={() => setIsClassModalOpen(true)}
              user={user}
            />
          </div>
          <div className="xl:col-span-1">
            <EventsSidebar 
              events={upcomingEvents} 
              currentUser={user} 
              onEventResponse={handleEventResponse}
              onEventClick={handleEventClick}
            />
          </div>
        </div>
      </main>

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSubmit={handleAddEvent}
        currentUser={user}
      />

      <EventDetailsModal
        isOpen={isEventDetailsModalOpen}
        onClose={() => {
          setIsEventDetailsModalOpen(false)
          setSelectedEvent(null)
        }}
        event={selectedEvent}
        currentUser={user}
        onEventResponse={handleEventResponse}
        onCancelEvent={handleCancelEvent}
      />

      <ClassSelectionModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSubmit={handleUpdateClassesWithWarning}
        currentlySelected={user.classes || []}
      />

      <ShareScheduleModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSubmit={handleShareSchedule}
        currentlyShared={user.hasSharedSchedule}
        userVerificationStatus={user.scheduleVerificationStatus}
      />

      <ScheduleVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onVerificationSubmit={handleVerificationSubmit}
        verificationStatus={user.scheduleVerificationStatus || 'none'}
      />

      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      {/* Class Change Warning Modal */}
      <ClassChangeWarningModal
        isOpen={showClassChangeWarning}
        onClose={() => {
          setShowClassChangeWarning(false)
          setPendingClasses(null)
        }}
        onConfirm={() => {
          setShowClassChangeWarning(false)
          if (pendingClasses) {
            handleUpdateClasses(pendingClasses)
            setPendingClasses(null)
          }
        }}
        isVerified={user.scheduleVerificationStatus === 'verified'}
      />
    </div>
  )
}
