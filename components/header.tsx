"use client"

import { useState, useEffect, useRef } from "react"
// import {
  Bell,
  Share2,
  Plus,
  Menu,
  X,
  LogOut,
  Trophy,
  Settings,
  Shield,
  CheckCircle,
  AlertCircle,
  Users,
  UserCheck,
  HelpCircle,
  Mail,
  Calendar,
  BookOpen,
} from "lucide-react"
// Temporary icon replacements
const Bell = () => <span>🔔</span>
const Share2 = () => <span>⭐</span>
const Plus = () => <span>➕</span>
const Menu = () => <span>⭐</span>
const X = () => <span>❌</span>
const LogOut = () => <span>🚪</span>
const Trophy = () => <span>⭐</span>
const Settings = () => <span>⚙️</span>
const Shield = () => <span>🛡️</span>
const CheckCircle = () => <span>✅</span>
const AlertCircle = () => <span>⭐</span>
const Users = () => <span>👥</span>
const UserCheck = () => <span>⭐</span>
const HelpCircle = () => <span>⭐</span>
const Mail = () => <span>📧</span>
const Calendar = () => <span>📅</span>
const BookOpen = () => <span>📚</span>

import type { User, Event } from "@/types/user"

interface HeaderProps {
  user: User
  onOpenEventModal: () => void
  onLogout: () => void
  onNavigateToBrowse: () => void
  onNavigateToRankings: () => void
  onNavigateToAdmin: () => void
  onNavigateToCourses: () => void
  onOpenShareModal: () => void
  onOpenAccountPage: () => void
  onQuickShare?: () => void
}

export default function Header({
  user,
  onOpenEventModal,
  onLogout,
  onNavigateToBrowse,
  onNavigateToRankings,
  onNavigateToAdmin,
  onNavigateToCourses,
  onOpenShareModal,
  onOpenAccountPage,
  onQuickShare,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  
  // Check if user is admin (you can customize this logic)
  const isAdmin = user.email === 'admin@dickinson.edu' || user.email === 'owner@dickinson.edu' || user.id === 'admin'
  
  // Check if user can browse schedules
  const canBrowseSchedules = user.hasSharedSchedule && user.scheduleVerificationStatus === 'verified'

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      const events = JSON.parse(localStorage.getItem("events") || "[]")
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      
      // Get read notifications from API
      let readNotifications: string[] = []
      try {
        const token = localStorage.getItem('auth-token')
        const response = await fetch('/api/notifications/mark-read', {
          method: 'GET',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        })
        if (response.ok) {
          const data = await response.json()
          readNotifications = data.readNotifications || []
        } else {
          // Fallback to localStorage if API fails
          readNotifications = JSON.parse(localStorage.getItem(`notificationsRead_${user.id}`) || "[]")
        }
      } catch (error) {
        console.error('Error loading read notifications:', error)
        // Fallback to localStorage if API fails
        readNotifications = JSON.parse(localStorage.getItem(`notificationsRead_${user.id}`) || "[]")
      }
      
      const recentActivities = []
      
      // Get recent events (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      // Add event notifications
      events.forEach((event: Event) => {
        const eventDate = new Date(event.date)
        if (eventDate >= sevenDaysAgo) {
          if (event.invitees?.includes(user.id)) {
            const notificationId = `event-${event.id}`
            recentActivities.push({
              id: notificationId,
              type: 'event_invite',
              title: `New event invite: ${event.title}`,
              message: `${eventDate.toLocaleDateString()} at ${event.time}`,
              timestamp: event.createdAt || eventDate.toISOString(),
              read: readNotifications.includes(notificationId),
              icon: 'calendar'
            })
          }
          
          if (event.attendees?.some((a: any) => a.userId === user.id && a.status === 'accepted')) {
            const notificationId = `event-joined-${event.id}`
            recentActivities.push({
              id: notificationId,
              type: 'event_joined',
              title: `You joined: ${event.title}`,
              message: `${eventDate.toLocaleDateString()} at ${event.time}`,
              timestamp: event.createdAt || eventDate.toISOString(),
              read: readNotifications.includes(notificationId),
              icon: 'check'
            })
          }
        }
      })
      
      // Add verification notifications
      if (user.scheduleVerificationStatus === 'verified' && user.verificationSubmittedAt) {
        const verDate = new Date(user.verificationSubmittedAt)
        if (verDate >= sevenDaysAgo) {
          const notificationId = 'verification-approved'
          recentActivities.push({
            id: notificationId,
            type: 'verification',
            title: 'Schedule verified!',
            message: 'You can now browse other schedules',
            timestamp: user.verificationSubmittedAt,
            read: readNotifications.includes(notificationId),
            icon: 'shield'
          })
        }
      }
      
      // Sort by timestamp
      recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      setNotifications(recentActivities.slice(0, 10))
    }
    
    loadNotifications()
  }, [user.id, user.scheduleVerificationStatus])

  // Load all users for search
  useEffect(() => {
    if (searchTerm.length > 0) {
      // Fetch users from API instead of localStorage
      fetch('/api/users/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchTerm })
      })
      .then(response => response.json())
      .then(data => {
        if (data.users) {
          const filtered = data.users
            .filter((u: any) => 
              u.id !== user.id && 
              u.hasSharedSchedule
            )
            .slice(0, 5) // Show max 5 results
          setSearchResults(filtered)
          setShowDropdown(filtered.length > 0)
        }
      })
      .catch(error => {
        console.error('Error searching users:', error)
        setSearchResults([])
        setShowDropdown(false)
      })
    } else {
      setSearchResults([])
      setShowDropdown(false)
    }
  }, [searchTerm, user.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelectStudent = (student: any) => {
    // Save selected student to localStorage and navigate
    localStorage.setItem("searchTerm", student.name)
    localStorage.setItem("selectedSearchUser", JSON.stringify(student))
    onNavigateToBrowse()
    setSearchTerm("")
    setShowDropdown(false)
  }


  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - User Profile */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.name}'s avatar`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                    user.hasSharedSchedule ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {user.hasSharedSchedule ? "Shared" : "Private"}
                </span>
                
                {/* Always show verification status */}
                {user.scheduleVerificationStatus === 'verified' && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                )}
                {user.scheduleVerificationStatus === 'pending' && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Pending
                  </span>
                )}
                {user.scheduleVerificationStatus === 'rejected' && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    <X className="w-3 h-3 mr-1" />
                    Rejected
                  </span>
                )}
                {(!user.scheduleVerificationStatus || user.scheduleVerificationStatus === 'none') && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                    <HelpCircle className="w-3 h-3 mr-1" />
                    Unverified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center - Search */}
          {canBrowseSchedules && (
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <div className="relative" ref={searchRef}>
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm.length > 0 && setShowDropdown(true)}
                className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              
              {/* Search Dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                  {searchResults.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          {student.avatar ? (
                            <img
                              src={student.avatar}
                              alt={`${student.name}'s avatar`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                              {student.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                        {(student.scheduleVerificationStatus === 'verified' || student.isVerified) && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                  {searchTerm.length > 0 && searchResults.length === 0 && (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      No verified students found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToRankings}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Trophy className="w-5 h-5" />
            </button>

            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-500 mt-1">Recent activities and updates</p>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${
                              notification.icon === 'calendar' ? 'bg-blue-100 text-blue-600' :
                              notification.icon === 'check' ? 'bg-green-100 text-green-600' :
                              notification.icon === 'shield' ? 'bg-purple-100 text-purple-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {notification.icon === 'calendar' && <Calendar className="w-4 h-4" />}
                              {notification.icon === 'check' && <CheckCircle className="w-4 h-4" />}
                              {notification.icon === 'shield' && <Shield className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No new notifications</p>
                      </div>
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-200">
                      <button 
                        onClick={async () => {
                          try {
                            // Mark all notifications as read via API
                            const notificationIds = notifications.map(n => n.id)
                            const token = localStorage.getItem('auth-token')
                            
                            const response = await fetch('/api/notifications/mark-read', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                ...(token && { 'Authorization': `Bearer ${token}` })
                              },
                              body: JSON.stringify({ 
                                notificationIds,
                                markAll: true 
                              })
                            })
                            
                            if (response.ok) {
                              // Update local state
                              const updatedNotifications = notifications.map(n => ({ ...n, read: true }))
                              setNotifications(updatedNotifications)
                            } else {
                              // Fallback to localStorage if API fails
                              const updatedNotifications = notifications.map(n => ({ ...n, read: true }))
                              setNotifications(updatedNotifications)
                              const readNotificationIds = updatedNotifications.map(n => n.id)
                              localStorage.setItem(`notificationsRead_${user.id}`, JSON.stringify(readNotificationIds))
                            }
                          } catch (error) {
                            console.error('Error marking notifications as read:', error)
                            // Fallback to localStorage if API fails
                            const updatedNotifications = notifications.map(n => ({ ...n, read: true }))
                            setNotifications(updatedNotifications)
                            const readNotificationIds = updatedNotifications.map(n => n.id)
                            localStorage.setItem(`notificationsRead_${user.id}`, JSON.stringify(readNotificationIds))
                          }
                          
                          setShowNotifications(false)
                        }}
                        className="text-center w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                // If user is verified and not already shared, do quick share
                if (user.scheduleVerificationStatus === 'verified' && !user.hasSharedSchedule && onQuickShare) {
                  onQuickShare()
                } else {
                  // Otherwise open the modal
                  onOpenShareModal()
                }
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenEventModal}
              className="p-2 bg-black text-white hover:bg-gray-800 rounded-full transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-16 right-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 m-4">
          <div className="py-2">
            <button
              onClick={() => {
                onOpenAccountPage()
                setIsMenuOpen(false)
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-5 h-5" />
              Account Settings
            </button>


            <button
              onClick={() => {
                onNavigateToBrowse()
                setIsMenuOpen(false)
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Users className="w-5 h-5" />
              Browse Schedules
            </button>

            <button
              onClick={() => {
                onNavigateToRankings()
                setIsMenuOpen(false)
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Trophy className="w-5 h-5" />
              Rankings
            </button>

            <button
              onClick={() => {
                onNavigateToCourses()
                setIsMenuOpen(false)
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              Course Catalog
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  onNavigateToAdmin()
                  setIsMenuOpen(false)
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <UserCheck className="w-5 h-5" />
                Admin Panel
              </button>
            )}

            <div className="border-t border-gray-200 my-2"></div>

            <button
              onClick={() => {
                setShowHelpModal(true)
                setIsMenuOpen(false)
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <div>
                <div className="font-medium">Get Help</div>
                <div className="text-xs text-gray-500">Email us for support</div>
              </div>
            </button>

            <div className="border-t border-gray-200 my-2"></div>

            <button
              onClick={() => {
                onLogout()
                setIsMenuOpen(false)
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Get Help
              </h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center">
                <Mail className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Support?</h3>
                <p className="text-gray-600 mb-6">
                  If you have any questions or need assistance, please email us at:
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="font-mono text-lg text-blue-800 font-semibold">
                      tomimatk@dickinson.edu
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  We'll get back to you as soon as possible!
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      window.location.href = 'mailto:tomimatk@dickinson.edu?subject=Help Request - NC Portal'
                      setShowHelpModal(false)
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Send Email
                  </button>
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
