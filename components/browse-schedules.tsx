"use client"

import { useState, useEffect } from "react"
// Temporary icon replacements
const Search = () => <span>🔍</span>
const ArrowLeft = () => <span>←</span>
const Users = () => <span>👥</span>
const CheckCircle = () => <span>✅</span>
const Shield = () => <span>🛡️</span>
const Clock = () => <span>⏰</span>
const XCircle = () => <span>⭐</span>

import type { User } from "@/types/user"
import StudentProfileView from "@/components/student-profile-view"
import LoadingImage from "@/components/loading-image"

interface BrowseSchedulesProps {
  user: User
  onNavigateToDashboard: () => void
  onLogout: () => void
}

interface ClassInfo {
  subject: string
  courseNumber: string
  section: string
  crn: string
  term: string
  title: string
  instructor: string
  displayName: string
  fullCode: string
}

export default function BrowseSchedules({ user, onNavigateToDashboard, onLogout }: BrowseSchedulesProps) {
  // Check if user can browse schedules (must be shared AND verified)
  const canBrowseSchedules = user.hasSharedSchedule && user.scheduleVerificationStatus === 'verified'
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("All")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("All")
  const [selectedSubject, setSelectedSubject] = useState<string>("All")
  const [verificationFilter, setVerificationFilter] = useState<string>("All")
  const [otherUsers, setOtherUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])

  useEffect(() => {
    // Load search preferences from API
    const loadSearchPreferences = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        const response = await fetch('/api/search/preferences', {
          method: 'GET',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const prefs = data.preferences
          
          // Restore last search parameters
          if (prefs.lastSearchParams) {
            setSearchTerm(prefs.lastSearchParams.searchTerm || "")
            setSelectedClass(prefs.lastSearchParams.selectedClass || "All")
            setSelectedTimeSlot(prefs.lastSearchParams.selectedTimeSlot || "All") 
            setSelectedSubject(prefs.lastSearchParams.selectedSubject || "All")
            setVerificationFilter(prefs.lastSearchParams.verificationFilter || "All")
          }
        }
      } catch (error) {
        console.error('Error loading search preferences:', error)
      }
    }

    // Check if user came from header search
    const savedSearchTerm = localStorage.getItem("searchTerm")
    const selectedSearchUser = localStorage.getItem("selectedSearchUser")

    if (savedSearchTerm) {
      setSearchTerm(savedSearchTerm)
      localStorage.removeItem("searchTerm")
    } else {
      // Load saved preferences if no direct search
      loadSearchPreferences()
    }

    if (selectedSearchUser) {
      const user = JSON.parse(selectedSearchUser)
      setSelectedUser(user)
      localStorage.removeItem("selectedSearchUser")
    }
  }, [])

  useEffect(() => {
    // Load all users from API
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
          // Filter users who have shared schedules and are not the current user
          const filteredUsers = data.users.filter((u: User) => u.id !== user.id && u.hasSharedSchedule)
          setOtherUsers(filteredUsers)

          // Extract unique classes, subjects, and time slots from loaded users
          const classesMap = new Map<string, ClassInfo>()
          const subjects = new Set<string>()
          const timeSlots = new Set<string>()

          filteredUsers.forEach((user: User) => {
            user.classes?.forEach((cls) => {
              subjects.add(cls.subject)

              const classKey = `${cls.subject}-${cls.courseNumber}-${cls.section}-${cls.crn}`
              if (!classesMap.has(classKey)) {
                const fullCode = `${cls.subject} ${cls.courseNumber}-${cls.section}`
                classesMap.set(classKey, {
                  subject: cls.subject,
                  courseNumber: cls.courseNumber,
                  section: cls.section,
                  crn: cls.crn,
                  term: cls.term,
                  title: cls.title,
                  instructor: cls.instructor,
                  displayName: `${fullCode} - ${cls.title} (${cls.instructor}) [CRN: ${cls.crn}]`,
                  fullCode: fullCode,
                })
              }

              cls.meetingTimes?.forEach((mt) => {
                const timeSlot = `${mt.startTime}-${mt.endTime}`
                timeSlots.add(timeSlot)
              })
            })
          })

          const sortedClasses = Array.from(classesMap.values()).sort((a, b) =>
            a.displayName.localeCompare(b.displayName)
          )

          setAvailableClasses(sortedClasses)
          setAvailableSubjects(Array.from(subjects).sort())
          setAvailableTimeSlots(Array.from(timeSlots).sort())
        }
      } catch (error) {
        console.error('Error loading users:', error)
        setOtherUsers([])
      }
    }
    
    loadUsers()
  }, [user.id])

  // Save search preferences to API
  const saveSearchPreferences = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      await fetch('/api/search/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          lastSearchParams: {
            searchTerm,
            selectedClass,
            selectedTimeSlot,
            selectedSubject,
            verificationFilter
          }
        })
      })
    } catch (error) {
      console.error('Error saving search preferences:', error)
    }
  }

  // Debounced save search preferences
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveSearchPreferences()
    }, 1000) // Save after 1 second of inactivity
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedClass, selectedTimeSlot, selectedSubject, verificationFilter])

  // Track when a user views another user's schedule
  const handleSelectUser = (selectedUser: User) => {
    setSelectedUser(selectedUser)

    // Track profile view
    const token = localStorage.getItem('auth-token')
    fetch('/api/users/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({ targetUserId: selectedUser.id })
    }).catch(error => {
      console.error('Error tracking profile view:', error)
    })
  }

  // Filter users based on search term and filters
  const filteredUsers = otherUsers.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    // Filter by verification status
    if (verificationFilter === "Verified" && !student.isVerified) return false
    if (verificationFilter === "Unverified" && student.isVerified) return false

    const studentClasses = student.selectedClasses || student.classes || []
    if (studentClasses.length === 0) return true

    // Filter by subject
    if (selectedSubject !== "All") {
      const hasSubject = studentClasses.some((cls) => cls.subject === selectedSubject)
      if (!hasSubject) return false
    }

    // Filter by specific class
    if (selectedClass !== "All") {
      const selectedClassInfo = availableClasses.find((cls) => cls.displayName === selectedClass)
      if (selectedClassInfo) {
        const hasClass = studentClasses.some(
          (cls) =>
            cls.subject === selectedClassInfo.subject &&
            cls.courseNumber === selectedClassInfo.courseNumber &&
            cls.section === selectedClassInfo.section &&
            cls.crn === selectedClassInfo.crn,
        )
        if (!hasClass) return false
      }
    }

    // Filter by specific time slot
    if (selectedTimeSlot !== "All") {
      const hasTimeSlot = studentClasses.some((cls) =>
        cls.meetingTimes.some((mt) => `${mt.startTime}-${mt.endTime}` === selectedTimeSlot),
      )
      if (!hasTimeSlot) return false
    }

    return true
  })

  if (!user.hasSharedSchedule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-2xl">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-4">Share to Browse</h2>
          <p className="text-gray-600 mb-4">
            To view other students' schedules, you need to share your own schedule first. This ensures mutual
            participation in our community.
          </p>
          
          {/* Added: What you miss without sharing */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left text-sm">
            <p className="font-semibold text-blue-800 mb-2">Without sharing your schedule:</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>You cannot view other students' schedules</li>
              <li>You cannot find people in the same classes</li>
              <li>You cannot join study groups</li>
              <li>You cannot use the ranking feature</li>
            </ul>
          </div>
          <button
            onClick={onNavigateToDashboard}
            className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Show appropriate message if user cannot browse schedules
  if (!user.hasSharedSchedule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <button onClick={onNavigateToDashboard} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <LoadingImage
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-7gl6pr8trbqDZFoBJ5QAJysuvuYLxa.png"
                  alt="Orange Logo"
                  className="w-12 h-12 rounded-xl shadow-lg shadow-gray-400"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Browse Schedules</h1>
                  <p className="text-sm text-gray-600">Share your schedule first</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Share Required Message */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl text-center">
              <div className="mb-6">
                <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Share Your Schedule First</h2>
                <p className="text-gray-600 text-lg">
                  To browse other students' schedules, you need to share your own schedule first.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={onNavigateToDashboard}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (user.hasSharedSchedule && user.scheduleVerificationStatus && user.scheduleVerificationStatus !== 'verified') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <button onClick={onNavigateToDashboard} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <LoadingImage
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-7gl6pr8trbqDZFoBJ5QAJysuvuYLxa.png"
                  alt="Orange Logo"
                  className="w-12 h-12 rounded-xl shadow-lg shadow-gray-400"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Browse Schedules</h1>
                  <p className="text-sm text-gray-600">
                    {user.scheduleVerificationStatus === 'pending' 
                      ? 'Verification pending' 
                      : user.scheduleVerificationStatus === 'rejected'
                      ? 'Verification rejected'
                      : 'Verification required'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Verification Required Message */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl text-center">
              <div className="mb-6">
                {user.scheduleVerificationStatus === 'pending' ? (
                  <>
                    <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Verification Under Review</h2>
                    <p className="text-gray-600 text-lg">
                      Your schedule verification is being reviewed by our team.
                    </p>
                    <p className="text-gray-500 mt-2">
                      This usually takes 1-2 business days. You'll be able to browse schedules once approved.
                    </p>
                  </>
                ) : user.scheduleVerificationStatus === 'rejected' ? (
                  <>
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Verification Was Rejected</h2>
                    <p className="text-gray-600 text-lg">
                      Your previous verification was not approved.
                    </p>
                    <p className="text-gray-500 mt-2">
                      Please return to your dashboard to resubmit a new screenshot following the requirements.
                    </p>
                  </>
                ) : (
                  <>
                    <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Schedule Verification Required</h2>
                    <p className="text-gray-600 text-lg">
                      To browse other students' schedules, you need to verify your course schedule.
                    </p>
                    
                    {/* Added: What happens without verification */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-6 text-left">
                      <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Why is verification required?
                      </h3>
                      <div className="text-sm text-yellow-700 space-y-2">
                        <p><strong>Without verification, the following features are unavailable:</strong></p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>You cannot view other students' schedules</li>
                          <li>You cannot use the student search feature</li>
                          <li>You cannot search for classmates</li>
                          <li>You cannot find people taking the same classes</li>
                          <li>You cannot access schedule rankings</li>
                        </ul>
                        <p className="mt-3 font-medium">
                          📝 By verifying, you can join a trusted community based on accurate course information.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={onNavigateToDashboard}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <button onClick={onNavigateToDashboard} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <LoadingImage
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-7gl6pr8trbqDZFoBJ5QAJysuvuYLxa.png"
                alt="Orange Logo"
                className="w-12 h-12 rounded-xl shadow-lg shadow-gray-400"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-800">Browse Schedules</h1>
                <p className="text-sm text-gray-600">{filteredUsers.length} students found</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Search and Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Search & Filter</h3>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Status</label>
                  <select
                    value={verificationFilter}
                    onChange={(e) => setVerificationFilter(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  >
                    <option value="All">All Students</option>
                    <option value="Verified">Verified Only</option>
                    <option value="Unverified">Unverified Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  >
                    <option value="All">All Subjects</option>
                    {availableSubjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Specific Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all text-sm"
                  >
                    <option value="All">All Classes</option>
                    {availableClasses
                      .filter((cls) => selectedSubject === "All" || cls.subject === selectedSubject)
                      .map((classInfo) => (
                        <option key={classInfo.displayName} value={classInfo.displayName}>
                          {classInfo.displayName}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Time Slot</label>
                  <select
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  >
                    <option value="All">All Time Slots</option>
                    {availableTimeSlots.map((timeSlot) => {
                      const [start, end] = timeSlot.split("-")
                      const formatTime = (time: string) => {
                        const [hours, minutes] = time.split(":")
                        const hour = Number.parseInt(hours)
                        const ampm = hour >= 12 ? "PM" : "AM"
                        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
                        return `${displayHour}:${minutes} ${ampm}`
                      }
                      return (
                        <option key={timeSlot} value={timeSlot}>
                          {formatTime(start)} - {formatTime(end)}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-black mb-4">Students ({filteredUsers.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredUsers.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleSelectUser(student)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      selectedUser?.id === student.id
                        ? "bg-black text-white"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden relative">
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={`${student.name}'s avatar`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                        )}
                        {student.isVerified && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{student.name}</div>
                          {student.isVerified && (
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-green-500" />
                              <span className="text-xs text-green-600 font-medium">Verified</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs opacity-75">{(student.selectedClasses || student.classes)?.length || 0} classes</div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No students found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Display */}
          <div className="lg:col-span-3">
            {selectedUser ? (
              <div>
                {/* User Info Header */}
                <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden relative">
                      {selectedUser.avatar ? (
                        <img
                          src={selectedUser.avatar}
                          alt={`${selectedUser.name}'s avatar`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                          {selectedUser.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                      )}
                      {selectedUser.isVerified && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-black">{selectedUser.name}</h2>
                        {selectedUser.isVerified && (
                          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                            <Shield className="w-4 h-4" />
                            <span className="text-sm font-semibold">Verified Student</span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-600">{selectedUser.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedUser.isVerified
                          ? "This student's schedule has been verified as authentic"
                          : "Schedule not verified - information may not be current"}
                      </p>
                    </div>
                  </div>
                </div>
                <StudentProfileView
                  selectedClasses={selectedUser.selectedClasses || selectedUser.classes || []}
                  studentName={selectedUser.name}
                  studentEmail={selectedUser.email}
                  studentInstagram={selectedUser.socialLinks?.instagram}
                />
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-xl text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-black mb-2">Select a Student</h3>
                <p className="text-gray-600">Choose a student from the list to view their schedule</p>
                {filteredUsers.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Look for the <Shield className="w-4 h-4 inline text-green-500" /> verified badge for authentic
                      schedules
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
