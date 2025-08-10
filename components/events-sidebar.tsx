"use client"

import { useState, useEffect } from "react"
// Temporary icon replacements
const Users = () => <span>👥</span>
const Check = () => <span>✅</span>
const X = () => <span>❌</span>
const Clock = () => <span>⏰</span>
const XCircle = () => <span>⭐</span>


interface EventAttendee {
  userId: string
  status: 'pending' | 'accepted' | 'declined'
}

interface Event {
  id: number
  title: string
  date: string
  time: string
  location: string
  invitees?: string[]
  createdBy?: string
  attendees?: EventAttendee[]
  status?: 'active' | 'cancelled'
  cancelledAt?: string
  cancelReason?: string
}

interface EventsSidebarProps {
  events: Event[]
  currentUser?: { id: string; name: string }
  onEventResponse?: (eventId: number, response: 'accepted' | 'declined') => void
  onEventClick?: (event: Event) => void
}

export default function EventsSidebar({ events, currentUser, onEventResponse, onEventClick }: EventsSidebarProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      day: date.toLocaleDateString("en-US", { 
        day: 'numeric',
        timeZone: 'America/New_York'
      }),
      month: date.toLocaleDateString("en-US", { 
        month: "short",
        timeZone: 'America/New_York'
      }),
    }
  }

  const formatTime = (timeString: string) => {
    // If timeString is already in HH:MM format, create a date object for today
    const [hours, minutes] = timeString.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    
    return date.toLocaleTimeString("en-US", {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York'
    })
  }

  const getInviteeNames = (invitees: string[] = []) => {
    if (invitees.length === 0 || !isClient) return ""

    try {
      // Get user names from localStorage
      const allUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const inviteeNames = invitees.map((id) => {
        const user = allUsers.find((u: any) => u.id === id)
        return user ? user.name : "Unknown"
      })

      if (inviteeNames.length === 1) return inviteeNames[0]
      if (inviteeNames.length === 2) return `${inviteeNames[0]} and ${inviteeNames[1]}`
      return `${inviteeNames[0]} and ${inviteeNames.length - 1} others`
    } catch (error) {
      console.error('Error getting invitee names:', error)
      return `${invitees.length} invitee${invitees.length === 1 ? '' : 's'}`
    }
  }

  const isUserInvited = (event: Event) => {
    return event.invitees?.includes(currentUser?.id || '') || false
  }

  const getUserResponseStatus = (event: Event) => {
    if (!currentUser || !event.attendees) return 'pending'
    const attendee = event.attendees.find(a => a.userId === currentUser.id)
    return attendee?.status || 'pending'
  }

  const handleEventResponse = (eventId: number, response: 'accepted' | 'declined') => {
    if (onEventResponse) {
      onEventResponse(eventId, response)
    }
  }


  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl h-fit">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-black">Upcoming Events</h3>
      </div>

      <div className="space-y-4">
        {events.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">No upcoming events</p>
            <p className="text-gray-400 text-xs mt-1">Create your first event to get started</p>
          </div>
        )}
        {events.map((event) => {
          const { day, month } = formatDate(event.date)
          const inviteeNames = getInviteeNames(event.invitees)
          const isInvited = isUserInvited(event)
          const userStatus = getUserResponseStatus(event)

          return (
            <div
              key={event.id}
              onClick={() => onEventClick && onEventClick(event)}
              className={`flex gap-3 p-4 rounded-2xl hover:shadow-md transition-all duration-200 group border cursor-pointer ${
                isInvited && userStatus === 'pending'
                  ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {/* Date Badge */}
              <div className="bg-black text-white rounded-xl p-3 text-center min-w-[60px] flex flex-col justify-center shadow-sm">
                <div className="text-lg font-bold leading-none">{day}</div>
                <div className="text-xs font-medium uppercase tracking-wide">{month}</div>
              </div>

              {/* Event Content */}
              <div className="flex-1 min-w-0">
                {/* Title and Details */}
                <div className="mb-2">
                  <h4 className="font-semibold text-gray-900 group-hover:text-black transition-colors line-clamp-2 mb-1">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="font-medium">
                      {formatTime(event.time)}
                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="truncate">{event.location}</span>
                  </div>
                  {event.duration && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        {event.duration === 1 ? "1 hour" : `${event.duration} hours`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Indicators */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Invitation status */}
                    {isInvited && userStatus === 'pending' && event.status !== 'cancelled' && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-medium">You're invited!</span>
                      </div>
                    )}
                    
                    {/* Cancelled status */}
                    {event.status === 'cancelled' && (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-3 h-3" />
                        <span className="text-xs font-medium">Cancelled</span>
                      </div>
                    )}

                    {/* Creator status */}
                    {event.createdBy === currentUser?.id && (
                      <span className="text-xs text-gray-500">Created by you</span>
                    )}

                    {/* Invitees count */}
                    {event.invitees && event.invitees.length > 0 && !isInvited && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <Users className="w-3 h-3" />
                        <span className="text-xs">{inviteeNames}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {isInvited && event.status !== 'cancelled' && (
                    <div className="flex-shrink-0">
                      {userStatus === 'pending' ? (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEventResponse(event.id, 'accepted')
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors font-medium"
                          >
                            <Check className="w-3 h-3" />
                            Join
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEventResponse(event.id, 'declined')
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors font-medium"
                          >
                            <X className="w-3 h-3" />
                            Decline
                          </button>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md font-medium ${
                          userStatus === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userStatus === 'accepted' ? (
                            <>
                              <Check className="w-3 h-3" />
                              Joined
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3" />
                              Declined
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cancellation reason */}
                {event.status === 'cancelled' && event.cancelReason && (
                  <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-700 font-medium">Reason: {event.cancelReason}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
