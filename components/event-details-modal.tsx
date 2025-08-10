"use client"

import { useState, useEffect } from "react"
// import { X, Calendar, Clock, MapPin, Users, User, Check, XIcon, Trash2 } from "lucide-react"
// Temporary icon replacements
const X = () => <span>❌</span>
const Calendar = () => <span>📅</span>
const Clock = () => <span>⏰</span>
const MapPin = () => <span>📍</span>
const Users = () => <span>👥</span>
const User = () => <span>👤</span>
const Check = () => <span>✅</span>
const XIcon = () => <span>⭐</span>
const Trash2 = () => <span>🗑️</span>

import type { Event, EventAttendee } from "@/types/user"

interface EventDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  event: Event | null
  currentUser?: { id: string; name: string }
  onEventResponse?: (eventId: number, response: 'accepted' | 'declined') => Promise<void>
  onCancelEvent?: (eventId: number, cancelReason?: string) => Promise<void>
}

export default function EventDetailsModal({ 
  isOpen, 
  onClose, 
  event, 
  currentUser,
  onEventResponse,
  onCancelEvent 
}: EventDetailsModalProps) {
  const [isClient, setIsClient] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isOpen || !event) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/New_York'
    })
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

  const getAttendeeNames = () => {
    if (!event.attendees || event.attendees.length === 0 || !isClient) return []
    
    try {
      const allUsers = JSON.parse(localStorage.getItem("users") || "[]")
      return event.attendees.map(attendee => {
        const user = allUsers.find((u: any) => u.id === attendee.userId)
        return {
          name: user ? user.name : "Unknown User",
          status: attendee.status,
          userId: attendee.userId
        }
      })
    } catch (error) {
      console.error('Error getting attendee names:', error)
      return []
    }
  }

  const getCreatorName = () => {
    if (!event.createdBy || !isClient) return "Unknown"
    
    try {
      const allUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const creator = allUsers.find((u: any) => u.id === event.createdBy)
      return creator ? creator.name : "Unknown User"
    } catch (error) {
      console.error('Error getting creator name:', error)
      return "Unknown"
    }
  }

  const isUserInvited = () => {
    return event.invitees?.includes(currentUser?.id || '') || false
  }

  const getUserResponseStatus = () => {
    if (!currentUser || !event.attendees) return 'pending'
    const attendee = event.attendees.find(a => a.userId === currentUser.id)
    return attendee?.status || 'pending'
  }

  const handleEventResponse = async (response: 'accepted' | 'declined') => {
    if (isResponding || !onEventResponse) return
    
    setIsResponding(true)
    try {
      await onEventResponse(event.id, response)
    } catch (error) {
      console.error('Failed to respond to event:', error)
    } finally {
      setIsResponding(false)
    }
  }

  const handleCancelEvent = async () => {
    if (isCancelling || !onCancelEvent) return
    
    if (window.confirm('Are you sure you want to cancel this event? This action cannot be undone.')) {
      const cancelReason = window.prompt('Optional: Provide a reason for cancellation (this will be visible to all invitees):')
      
      setIsCancelling(true)
      try {
        await onCancelEvent(event.id, cancelReason || undefined)
        onClose()
      } catch (error) {
        console.error('Failed to cancel event:', error)
      } finally {
        setIsCancelling(false)
      }
    }
  }

  const attendeeNames = getAttendeeNames()
  const creatorName = getCreatorName()
  const isInvited = isUserInvited()
  const userStatus = getUserResponseStatus()
  const isCreator = event.createdBy === currentUser?.id

  const acceptedCount = attendeeNames.filter(a => a.status === 'accepted').length
  const declinedCount = attendeeNames.filter(a => a.status === 'declined').length
  const pendingCount = attendeeNames.filter(a => a.status === 'pending').length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Event Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Event Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
            <p className="text-gray-600">Created by {creatorName}</p>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Date</p>
                  <p className="text-gray-600">{formatDate(event.date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Time</p>
                  <div className="text-gray-600">
                    <p>{formatTime(event.time)}</p>
                    {event.endTime && (
                      <p className="text-sm text-gray-500">
                        to {formatTime(event.endTime)}
                        {event.duration && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            {event.duration === 1 ? "1 hour" : `${event.duration} hours`}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Location</p>
                  <p className="text-gray-600">{event.location}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Event Host</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      👑 {creatorName}
                      {event.createdBy === currentUser?.id && " (You)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Attendance Summary</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-green-600">✓ {acceptedCount} attending</p>
                    <p className="text-red-600">✗ {declinedCount} declined</p>
                    <p className="text-gray-500">⏳ {pendingCount} pending</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{event.description}</p>
            </div>
          )}

          {/* Response Section for Invited Users */}
          {isInvited && !isCreator && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Your Response</h3>
              {userStatus === 'pending' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEventResponse('accepted')}
                    disabled={isResponding}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    {isResponding ? "Joining..." : "Join Event"}
                  </button>
                  <button
                    onClick={() => handleEventResponse('declined')}
                    disabled={isResponding}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XIcon className="w-4 h-4" />
                    {isResponding ? "Declining..." : "Decline"}
                  </button>
                </div>
              ) : (
                <div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium mb-3 ${
                    userStatus === 'accepted'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {userStatus === 'accepted' ? (
                      <>
                        <Check className="w-4 h-4" />
                        You're attending this event
                      </>
                    ) : (
                      <>
                        <XIcon className="w-4 h-4" />
                        You declined this event
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Want to change your response?</div>
                  <div className="flex gap-2">
                    {userStatus !== 'accepted' && (
                      <button
                        onClick={() => handleEventResponse('accepted')}
                        disabled={isResponding}
                        className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="w-3 h-3" />
                        {isResponding ? "..." : "Join"}
                      </button>
                    )}
                    {userStatus !== 'declined' && (
                      <button
                        onClick={() => handleEventResponse('declined')}
                        disabled={isResponding}
                        className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XIcon className="w-3 h-3" />
                        {isResponding ? "..." : "Decline"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Event Management Section for Creators */}
          {isCreator && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Event Management</h3>
              <p className="text-sm text-gray-600 mb-4">As the event creator, you can cancel this event. All invitees will be notified.</p>
              <button
                onClick={handleCancelEvent}
                disabled={isCancelling}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {isCancelling ? "Cancelling..." : "Cancel Event"}
              </button>
            </div>
          )}

          {/* Attendee Lists - Always show sections */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">Event Attendees</h2>
            
            {/* Grid layout for attendee sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Joined (Accepted) */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  Joined ({acceptedCount})
                </h3>
                {acceptedCount > 0 ? (
                  <div className="space-y-2">
                    {attendeeNames
                      .filter(attendee => attendee.status === 'accepted')
                      .map((attendee, index) => (
                        <div
                          key={index}
                          className="flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium border border-green-300"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {attendee.name}
                          {attendee.userId === currentUser?.id && " (You)"}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-green-700 text-sm italic">No one has joined yet</p>
                )}
              </div>

              {/* Declined */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <XIcon className="w-5 h-5 text-red-600" />
                  Declined ({declinedCount})
                </h3>
                {declinedCount > 0 ? (
                  <div className="space-y-2">
                    {attendeeNames
                      .filter(attendee => attendee.status === 'declined')
                      .map((attendee, index) => (
                        <div
                          key={index}
                          className="flex items-center px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium border border-red-300"
                        >
                          <XIcon className="w-4 h-4 mr-2" />
                          {attendee.name}
                          {attendee.userId === currentUser?.id && " (You)"}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-red-700 text-sm italic">No one has declined</p>
                )}
              </div>

              {/* Haven't Decided (Pending) */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Haven't Decided ({pendingCount})
                </h3>
                {pendingCount > 0 ? (
                  <div className="space-y-2">
                    {attendeeNames
                      .filter(attendee => attendee.status === 'pending')
                      .map((attendee, index) => (
                        <div
                          key={index}
                          className="flex items-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium border border-yellow-300"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          {attendee.name}
                          {attendee.userId === currentUser?.id && " (You)"}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-yellow-700 text-sm italic">Everyone has responded</p>
                )}
              </div>
            </div>

            {/* Show message if no attendees at all - full width */}
            {attendeeNames.length === 0 && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">No invitations sent</p>
                <p className="text-gray-500 text-sm">This is a private event with no other invitees</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-3xl border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}