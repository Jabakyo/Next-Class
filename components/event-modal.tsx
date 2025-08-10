"use client"

import type React from "react"

import type { ReactElement } from "react"

import { useState, useEffect } from "react"
// // Removed lucide-react import
// Temporary icon replacements
const X = () => <span>❌</span>
const Search = () => <span>🔍</span>

import type { User } from "@/types/user"

// Update the interface to include current user and onSubmit parameters
interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (eventData: {
    title: string
    date: string
    time: string
    endTime: string
    duration: number
    location: string
    description: string
    invitees: string[]
  }) => Promise<void>
  currentUser: User
}

export default function EventModal({ isOpen, onClose, onSubmit, currentUser }: EventModalProps): ReactElement | null {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    endTime: "",
    duration: 1, // Default to 1 hour
    location: "",
    description: "",
  })
  const [selectedInvitees, setSelectedInvitees] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load available users when modal opens from API
  useEffect(() => {
    if (isOpen) {
      const loadUsers = async () => {
        try {
          const response = await fetch('/api/users/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: '' }) // Empty query to get all users
          })
          
          if (response.ok) {
            const data = await response.json()
            const otherUsers = data.users.filter((u: User) => u.id !== currentUser.id && u.hasSharedSchedule)
            console.log('Available users for event invites:', otherUsers.map(u => ({
              name: u.name,
              hasSharedSchedule: u.hasSharedSchedule,
              verificationStatus: u.scheduleVerificationStatus
            })))
            setAvailableUsers(otherUsers)
          }
        } catch (error) {
          console.error('Error loading users for event invites:', error)
          setAvailableUsers([])
        }
      }
      
      loadUsers()
    }
  }, [isOpen, currentUser.id])

  // Filter users based on search term
  const filteredUsers = availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedInvitees.some((invitee) => invitee.id === user.id),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        invitees: selectedInvitees.map((user) => user.id),
      })
      setFormData({ title: "", date: "", time: "", endTime: "", duration: 1, location: "", description: "" })
      setSelectedInvitees([])
      setSearchTerm("")
    } catch (error) {
      console.error('Failed to create event:', error)
      // Keep form data so user can retry
    } finally {
      setIsSubmitting(false)
    }
  }

  const addInvitee = (user: User) => {
    setSelectedInvitees((prev) => [...prev, user])
    setSearchTerm("")
    setShowUserSearch(false)
  }

  const removeInvitee = (userId: string) => {
    setSelectedInvitees((prev) => prev.filter((user) => user.id !== userId))
  }

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, durationHours: number): string => {
    if (!startTime) return ""
    
    const [hours, minutes] = startTime.split(":").map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)
    
    const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000)
    
    return `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }
      
      // Auto-calculate end time when start time or duration changes
      if (name === "time" || name === "duration") {
        const duration = name === "duration" ? Number(value) : prev.duration
        const startTime = name === "time" ? value : prev.time
        newData.endTime = calculateEndTime(startTime, duration)
      }
      
      return newData
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-2xl font-bold text-black">Create New Event</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Event Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="time" className="block text-sm font-semibold text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              />
            </div>
            
            <div>
              <label htmlFor="duration" className="block text-sm font-semibold text-gray-700 mb-2">
                Duration
              </label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              >
                <option value={0.5}>30 minutes</option>
                <option value={1}>1 hour</option>
                <option value={1.5}>1.5 hours</option>
                <option value={2}>2 hours</option>
                <option value={2.5}>2.5 hours</option>
                <option value={3}>3 hours</option>
                <option value={4}>4 hours</option>
                <option value={5}>5 hours</option>
                <option value={6}>6 hours</option>
                <option value={8}>8 hours</option>
              </select>
            </div>
          </div>

          {/* Show calculated end time */}
          {formData.time && formData.endTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-800 font-medium">Event Duration:</span>
                <span className="text-blue-600">
                  {formData.time} - {formData.endTime}
                  {formData.duration === 1 ? " (1 hour)" : ` (${formData.duration} hours)`}
                </span>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              placeholder="Enter location"
            />
          </div>

          {/* Invite People Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Invite People</label>

            {/* Selected Invitees */}
            {selectedInvitees.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">{selectedInvitees.length} people invited:</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedInvitees.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={`${user.name}'s avatar`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-blue-800 text-sm">{user.name}</div>
                          <div className="text-xs text-blue-600">{user.selectedClasses?.length || 0} classes</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeInvitee(user.id)}
                        className="p-1 hover:bg-blue-200 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Search */}
            <div className="relative">
              <div className="flex">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search students to invite..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setShowUserSearch(e.target.value.length > 0)
                    }}
                    onFocus={() => setShowUserSearch(searchTerm.length > 0)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  />
                </div>
              </div>

              {/* Search Results - Same style as header search */}
              {showUserSearch && filteredUsers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto">
                  {filteredUsers.slice(0, 8).map((user) => (
                    <div
                      key={user.id}
                      onClick={() => addInvitee(user)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.name}'s avatar`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.selectedClasses?.length || 0} classes</div>
                      </div>
                      <div className="text-xs flex items-center gap-2">
                        <span className="text-gray-400">{user.hasSharedSchedule ? "Shared" : "Private"}</span>
                        {user.hasSharedSchedule && (
                          <>
                            {user.scheduleVerificationStatus === 'verified' && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">✓ Verified</span>
                            )}
                            {user.scheduleVerificationStatus === 'pending' && (
                              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">⏳ Pending</span>
                            )}
                            {user.scheduleVerificationStatus === 'rejected' && (
                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">✗ Rejected</span>
                            )}
                            {(!user.scheduleVerificationStatus || user.scheduleVerificationStatus === 'none') && (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">? Unverified</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && searchTerm && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No students found matching "{searchTerm}"
                    </div>
                  )}
                </div>
              )}

              {/* Show available users count */}
              {!showUserSearch && availableUsers.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">{availableUsers.length} students available to invite</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all resize-none"
              placeholder="Enter event description"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-full font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-black"
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
