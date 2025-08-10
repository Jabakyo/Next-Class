"use client"

import { useState, useEffect } from "react"

// Temporary icon replacements
const ArrowLeft = () => <span>←</span>
const User = () => <span>👤</span>
const BookOpen = () => <span>📚</span>
const Shield = () => <span>🛡️</span>
const CheckCircle = () => <span>✅</span>
const AlertTriangle = () => <span>⚠️</span>
const Trash2 = () => <span>🗑️</span>
const Calendar = () => <span>📅</span>
const Clock = () => <span>⏰</span>
const MapPin = () => <span>📍</span>
const Users = () => <span>👥</span>
const Mail = () => <span>📧</span>
const GraduationCap = () => <span>🎓</span>
const Award = () => <span>🏆</span>
const Eye = () => <span>👁️</span>
const EyeOff = () => <span>🙈</span>
const Instagram = () => <span>📷</span>
const Bell = () => <span>🔔</span>
const BellOff = () => <span>🔕</span>
const FileImage = () => <span>🖼️</span>
const Plus = () => <span>➕</span>
const Edit3 = () => <span>✏️</span>
import type { User as UserType, SelectedClass } from "@/types/user"
import EnhancedClassModal from "@/components/enhanced-class-modal"
import AvatarUpload from "@/components/avatar-upload"
import ClassChangeWarningModal from "@/components/class-change-warning-modal"

interface AccountPageProps {
  user: UserType
  onBack: () => void
  onUpdateUser: (user: UserType) => void
  onOpenClassModal: () => void
}

export default function AccountPage({
  user,
  onBack,
  onUpdateUser,
  onOpenClassModal,
}: AccountPageProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "classes" | "privacy">("profile")
  const [showSaved, setShowSaved] = useState(false)
  const [isClassModalOpen, setIsClassModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<SelectedClass | null>(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [showClassChangeWarning, setShowClassChangeWarning] = useState(false)
  const [pendingClassAction, setPendingClassAction] = useState<() => void>(() => {})

  // Auto-save user data whenever user object changes
  useEffect(() => {
    const saveUserData = () => {
      // Save to localStorage
      localStorage.setItem("currentUser", JSON.stringify(user))

      // Update users array in localStorage
      const allUsers = JSON.parse(localStorage.getItem("users") || "[]")
      const updatedUsers = allUsers.map((u: any) =>
        u.id === user.id ? user : u
      )
      localStorage.setItem("users", JSON.stringify(updatedUsers))

      // Show saved indicator
      setShowSaved(true)
      const timer = setTimeout(() => {
        setShowSaved(false)
      }, 2000)

      return () => clearTimeout(timer)
    }

    // Save data whenever user changes (but skip initial mount)
    if (user.id) {
      const cleanup = saveUserData()
      return cleanup
    }
  }, [user])

  const handleRemoveClassWarning = (classId: string) => {
    if (user.scheduleVerificationStatus === 'verified') {
      // Show warning if user is verified
      setPendingClassAction(() => () => {
        performRemoveClass(classId)
      })
      setShowClassChangeWarning(true)
    } else {
      // No warning needed if not verified
      performRemoveClass(classId)
    }
  }

  const performRemoveClass = (classId: string) => {
    const updatedClasses = (user.classes || []).filter((cls) => cls.id !== classId)
    
    // If removing a class and user was verified, reset verification status
    const shouldResetVerification = user.scheduleVerificationStatus === 'verified'
    
    const updatedUser = {
      ...user,
      classes: updatedClasses,
      // Reset verification if needed
      ...(shouldResetVerification && {
        scheduleVerificationStatus: 'none' as const,
        verificationScreenshot: undefined,
        verificationSubmittedAt: undefined,
        previousClasses: user.classes || [],
        classesChangedAt: new Date().toISOString()
      })
    }

    // Update user - auto-save will handle persistence
    onUpdateUser(updatedUser)
  }

  const handleOpenAddClassModal = () => {
    if (user.scheduleVerificationStatus === 'verified') {
      // Show warning if user is verified
      setPendingClassAction(() => () => {
        setModalMode('add')
        setEditingClass(null)
        setIsClassModalOpen(true)
      })
      setShowClassChangeWarning(true)
    } else {
      // No warning needed if not verified
      setModalMode('add')
      setEditingClass(null)
      setIsClassModalOpen(true)
    }
  }

  const handleOpenEditClassModal = (classData: SelectedClass) => {
    if (user.scheduleVerificationStatus === 'verified') {
      // Show warning if user is verified
      setPendingClassAction(() => () => {
        setModalMode('edit')
        setEditingClass(classData)
        setIsClassModalOpen(true)
      })
      setShowClassChangeWarning(true)
    } else {
      // No warning needed if not verified
      setModalMode('edit')
      setEditingClass(classData)
      setIsClassModalOpen(true)
    }
  }

  const handleAvatarChange = (avatarUrl: string) => {
    const updatedUser = {
      ...user,
      avatar: avatarUrl
    }
    onUpdateUser(updatedUser)
  }

  const handleAvatarRemove = () => {
    const updatedUser = {
      ...user,
      avatar: ''
    }
    onUpdateUser(updatedUser)
  }

  const handleClassModalSubmit = (classData: SelectedClass) => {
    let updatedClasses: SelectedClass[]
    
    if (modalMode === 'add') {
      updatedClasses = [...(user.classes || []), classData]
    } else {
      updatedClasses = (user.classes || []).map(cls => 
        cls.id === classData.id ? classData : cls
      )
    }

    // Check if classes have actually changed
    const classesHaveChanged = () => {
      const currentClasses = user.classes || []
      if (updatedClasses.length !== currentClasses.length) return true

      const updatedIds = updatedClasses.map((cls) => cls.id).sort()
      const currentIds = currentClasses.map((cls) => cls.id).sort()

      return JSON.stringify(updatedIds) !== JSON.stringify(currentIds)
    }

    // If classes have changed and user was verified, reset verification status
    const shouldResetVerification = classesHaveChanged() && user.scheduleVerificationStatus === 'verified'

    const updatedUser = {
      ...user,
      classes: updatedClasses,
      // Reset verification if needed
      ...(shouldResetVerification && {
        scheduleVerificationStatus: 'none' as const,
        verificationScreenshot: undefined,
        verificationSubmittedAt: undefined,
        previousClasses: user.classes || [],
        classesChangedAt: new Date().toISOString()
      })
    }

    onUpdateUser(updatedUser)
    setIsClassModalOpen(false)
    setEditingClass(null)
  }

  const handleClassModalDelete = (classId: string) => {
    setIsClassModalOpen(false)
    setEditingClass(null)
    handleRemoveClassWarning(classId)
  }

  const totalCredits = (user.classes || []).reduce((sum, cls) => {
    // Default to 3 credits per class since credits field doesn't exist
    return sum + 3
  }, 0)


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600">Manage your profile and preferences</p>
            </div>
            {showSaved && (
              <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Auto-saved
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "profile"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile Details
                </div>
              </button>
              <button
                onClick={() => setActiveTab("classes")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "classes"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  My Classes
                </div>
              </button>
              <button
                onClick={() => setActiveTab("privacy")}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === "privacy"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy Settings
                </div>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {activeTab === "profile" && (
              <div className="space-y-8">
                {/* Basic Profile Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Profile Avatar & Name */}
                    <div className="flex flex-col items-center space-y-4">
                      <AvatarUpload
                        currentAvatar={user.avatar}
                        onAvatarChange={handleAvatarChange}
                        onAvatarRemove={handleAvatarRemove}
                        userName={user.name}
                      />
                      <div className="text-center">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">{user.name}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{user.email}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <GraduationCap className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">ID: {user.studentId}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Academic Details */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-3">Academic Details</h5>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Year:</span>
                            <select
                              value={user.year}
                              onChange={(e) => {
                                const updatedUser = {
                                  ...user,
                                  year: e.target.value
                                }
                                onUpdateUser(updatedUser)
                              }}
                              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Freshman">Freshman</option>
                              <option value="Sophomore">Sophomore</option>
                              <option value="Junior">Junior</option>
                              <option value="Senior">Senior</option>
                              <option value="Graduate">Graduate</option>
                            </select>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Major:</span>
                            <input
                              type="text"
                              value={user.major}
                              onChange={(e) => {
                                const updatedUser = {
                                  ...user,
                                  major: e.target.value
                                }
                                onUpdateUser(updatedUser)
                              }}
                              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter your major"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Verification Status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Schedule Verification
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium text-gray-900">Verification Status</p>
                        <p className="text-sm text-gray-600">Current status of your schedule verification</p>
                      </div>
                      <div>
                        {user.scheduleVerificationStatus === 'verified' && (
                          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verified
                          </span>
                        )}
                        {user.scheduleVerificationStatus === 'pending' && (
                          <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                            <Clock className="w-4 h-4 mr-1" />
                            Pending
                          </span>
                        )}
                        {user.scheduleVerificationStatus === 'rejected' && (
                          <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Rejected
                          </span>
                        )}
                        {(!user.scheduleVerificationStatus || user.scheduleVerificationStatus === 'none') && (
                          <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Not Submitted
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {user.verificationSubmittedAt && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Submitted:</strong> {new Date(user.verificationSubmittedAt).toLocaleString()}
                      </div>
                    )}
                    
                    {user.verificationScreenshot && (
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <FileImage className="w-4 h-4" />
                        <span>Screenshot uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bio</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{user.bio}</p>
                    </div>
                  </div>
                )}

                {/* Instagram */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Instagram className="w-4 h-4 text-pink-500" />
                      <span className="font-medium text-gray-900">Instagram</span>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={user.socialLinks?.instagram || ""}
                        onChange={(e) => {
                          const updatedUser = {
                            ...user,
                            socialLinks: {
                              ...user.socialLinks,
                              instagram: e.target.value
                            }
                          }
                          onUpdateUser(updatedUser)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                        placeholder="https://instagram.com/username or @username"
                      />
                      {user.socialLinks?.instagram && (
                        <div className="text-xs text-gray-500">
                          Preview: {user.socialLinks.instagram.startsWith('http') ? (
                            <a 
                              href={user.socialLinks.instagram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-pink-600 hover:text-pink-700 underline ml-1"
                            >
                              {user.socialLinks.instagram}
                            </a>
                          ) : (
                            <span className="text-pink-600 ml-1">{user.socialLinks.instagram}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                {user.achievements && user.achievements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      Achievements
                    </h3>
                    <div className="space-y-2">
                      {user.achievements.map((achievement, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                        >
                          <Award className="w-5 h-5 text-yellow-600" />
                          <span className="text-yellow-800 font-medium">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {activeTab === "classes" && (
              <div className="space-y-6">
                {/* Update My Classes Section */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Update My Classes</h3>
                    </div>
                    <button
                      onClick={handleOpenAddClassModal}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Class
                    </button>
                  </div>

                  {/* Classes List */}
                  {(user.classes || []).length > 0 ? (
                    <div className="space-y-4">
                      {(user.classes || []).map((cls) => (
                        <div
                          key={cls.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-gray-900">
                                  {cls.subject} {cls.courseNumber}-{cls.section}
                                </h4>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                                  CRN: {cls.crn}
                                </span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                                  {cls.term}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2 font-medium">{cls.title}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {cls.instructor}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {cls.room}
                                </div>
                              </div>
                              {/* Meeting Times */}
                              <div className="space-y-1">
                                {cls.meetingTimes?.map((meeting, index) => (
                                  <div key={index} className="flex items-center gap-1 text-sm text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-medium">{meeting.days.join(", ")}</span>
                                    <span>{meeting.startTime} - {meeting.endTime}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditClassModal(cls)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit class"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveClassWarning(cls.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove class"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Class Statistics Summary */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Calendar className="w-5 h-5 text-blue-600" />
                              <span className="font-medium text-blue-900">Total Classes</span>
                            </div>
                            <span className="text-2xl font-bold text-blue-800">{(user.classes || []).length}</span>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Clock className="w-5 h-5 text-green-600" />
                              <span className="font-medium text-green-900">Est. Credits</span>
                            </div>
                            <span className="text-2xl font-bold text-green-800">{totalCredits}</span>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <BookOpen className="w-5 h-5 text-purple-600" />
                              <span className="font-medium text-purple-900">Term</span>
                            </div>
                            <span className="text-lg font-bold text-purple-800">
                              {(user.classes || [])[0]?.term || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Classes Found</h4>
                      <p className="text-gray-600 mb-6">Your class schedule will appear here once classes are added to your profile</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-6">
                {/* Privacy Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacy Settings
                  </h3>
                  
                  {/* Notification Settings */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Notification Settings</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Class Updates</p>
                          <p className="text-sm text-gray-600">Receive notifications about class changes</p>
                        </div>
                        <button
                          onClick={() => {
                            const updatedUser = {
                              ...user,
                              settings: {
                                ...user.settings,
                                notifications: {
                                  ...user.settings?.notifications,
                                  classUpdates: !user.settings?.notifications?.classUpdates
                                }
                              }
                            }
                            onUpdateUser(updatedUser)
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            user.settings?.notifications?.classUpdates ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.settings?.notifications?.classUpdates ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Event Invitations</p>
                          <p className="text-sm text-gray-600">Get notified when invited to events</p>
                        </div>
                        <button
                          onClick={() => {
                            const updatedUser = {
                              ...user,
                              settings: {
                                ...user.settings,
                                notifications: {
                                  ...user.settings?.notifications,
                                  classmateRequests: !user.settings?.notifications?.classmateRequests
                                }
                              }
                            }
                            onUpdateUser(updatedUser)
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            user.settings?.notifications?.classmateRequests ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.settings?.notifications?.classmateRequests ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Schedule Changes</p>
                          <p className="text-sm text-gray-600">Alert me about schedule modifications</p>
                        </div>
                        <button
                          onClick={() => {
                            const updatedUser = {
                              ...user,
                              settings: {
                                ...user.settings,
                                notifications: {
                                  ...user.settings?.notifications,
                                  scheduleChanges: !user.settings?.notifications?.scheduleChanges
                                }
                              }
                            }
                            onUpdateUser(updatedUser)
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            user.settings?.notifications?.scheduleChanges ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.settings?.notifications?.scheduleChanges ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">New Features</p>
                          <p className="text-sm text-gray-600">Get updates about new platform features</p>
                        </div>
                        <button
                          onClick={() => {
                            const updatedUser = {
                              ...user,
                              settings: {
                                ...user.settings,
                                notifications: {
                                  ...user.settings?.notifications,
                                  newFeatures: !user.settings?.notifications?.newFeatures
                                }
                              }
                            }
                            onUpdateUser(updatedUser)
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            user.settings?.notifications?.newFeatures ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.settings?.notifications?.newFeatures ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Profile Privacy Settings */}
                  <div className="bg-gray-50 rounded-lg p-6 mt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Profile Privacy</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Show Email Address</p>
                          <p className="text-sm text-gray-600">Allow other students to see your email</p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('auth-token')
                              const response = await fetch('/api/user/privacy', {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  ...(token && { 'Authorization': `Bearer ${token}` })
                                },
                                body: JSON.stringify({
                                  showEmail: !user.settings?.privacy?.showEmail
                                })
                              })
                              
                              if (response.ok) {
                                const data = await response.json()
                                const updatedUser = {
                                  ...user,
                                  settings: {
                                    ...user.settings,
                                    privacy: data.privacy
                                  }
                                }
                                onUpdateUser(updatedUser)
                              }
                            } catch (error) {
                              console.error('Error updating privacy settings:', error)
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            user.settings?.privacy?.showEmail ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.settings?.privacy?.showEmail ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Show Schedule</p>
                          <p className="text-sm text-gray-600">Display your class schedule to others</p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('auth-token')
                              const response = await fetch('/api/user/privacy', {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  ...(token && { 'Authorization': `Bearer ${token}` })
                                },
                                body: JSON.stringify({
                                  showSchedule: !user.settings?.privacy?.showSchedule
                                })
                              })
                              
                              if (response.ok) {
                                const data = await response.json()
                                const updatedUser = {
                                  ...user,
                                  settings: {
                                    ...user.settings,
                                    privacy: data.privacy
                                  }
                                }
                                onUpdateUser(updatedUser)
                              }
                            } catch (error) {
                              console.error('Error updating privacy settings:', error)
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            user.settings?.privacy?.showSchedule ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.settings?.privacy?.showSchedule ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Show Social Links</p>
                          <p className="text-sm text-gray-600">Display your social media links</p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('auth-token')
                              const response = await fetch('/api/user/privacy', {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  ...(token && { 'Authorization': `Bearer ${token}` })
                                },
                                body: JSON.stringify({
                                  showSocialLinks: !user.settings?.privacy?.showSocialLinks
                                })
                              })
                              
                              if (response.ok) {
                                const data = await response.json()
                                const updatedUser = {
                                  ...user,
                                  settings: {
                                    ...user.settings,
                                    privacy: data.privacy
                                  }
                                }
                                onUpdateUser(updatedUser)
                              }
                            } catch (error) {
                              console.error('Error updating privacy settings:', error)
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            user.settings?.privacy?.showSocialLinks ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.settings?.privacy?.showSocialLinks ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Sharing Status */}
                  <div className="bg-orange-50 rounded-lg p-6 mt-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Schedule Sharing Status</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        {user.hasSharedSchedule
                          ? "Your schedule is currently shared with other students"
                          : "Your schedule is private and not visible to others"}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.hasSharedSchedule 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.hasSharedSchedule ? 'Shared' : 'Private'}
                      </span>
                    </div>
                    {user.hasSharedSchedule && (
                      <p className="text-xs text-orange-700 mt-3">
                        <strong>Note:</strong> Once shared, schedules cannot be made private again to maintain platform integrity.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Class Modal */}
      <EnhancedClassModal
        isOpen={isClassModalOpen}
        onClose={() => {
          setIsClassModalOpen(false)
          setEditingClass(null)
        }}
        onSubmit={handleClassModalSubmit}
        onDelete={handleClassModalDelete}
        existingClass={editingClass}
        mode={modalMode}
        userId={user.id}
      />

      {/* Class Change Warning Modal */}
      <ClassChangeWarningModal
        isOpen={showClassChangeWarning}
        onClose={() => setShowClassChangeWarning(false)}
        onConfirm={() => {
          setShowClassChangeWarning(false)
          pendingClassAction()
        }}
        isVerified={user.scheduleVerificationStatus === 'verified'}
      />
    </div>
  )
}
