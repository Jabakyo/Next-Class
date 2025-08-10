"use client"

import { useState, useEffect } from "react"
// import { 
  Shield, 
  LogOut, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  Calendar,
  Mail,
  User,
  AlertTriangle,
  TrendingUp,
  FileImage,
  Trash2
} from "lucide-react"
// Temporary icon replacements
const Shield = () => <span>🛡️</span>
const LogOut = () => <span>🚪</span>
const Users = () => <span>👥</span>
const CheckCircle = () => <span>✅</span>
const XCircle = () => <span>⭐</span>
const Clock = () => <span>⏰</span>
const Download = () => <span>⭐</span>
const Calendar = () => <span>📅</span>
const Mail = () => <span>📧</span>
const User = () => <span>👤</span>
const AlertTriangle = () => <span>⚠️</span>
const TrendingUp = () => <span>⭐</span>
const FileImage = () => <span>🖼️</span>
const Trash2 = () => <span>🗑️</span>

import type { VerificationRequest } from "@/types/verification"

interface OwnerDashboardProps {
  onLogout: () => void
}

interface UserData {
  id: string
  name: string
  email: string
  studentId: string
  year: string
  major: string
  classes: any[]
  hasSharedSchedule: boolean
  scheduleVerificationStatus?: string
  verificationSubmittedAt?: string
  verificationScreenshot?: string
  points: number
  achievements: string[]
  interests: string[]
  bio: string
  avatar: string
  socialLinks: any
  settings: any
}

export default function OwnerDashboard({ onLogout }: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'verifications' | 'users'>('verifications')
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'type-name'>('confirm')
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    totalUsers: 0
  })

  useEffect(() => {
    loadVerificationRequests()
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users/search?all=true', {
        headers: {
          'x-owner-token': localStorage.getItem('owner-token') || ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setStats(prev => ({ ...prev, totalUsers: data.users?.length || 0 }))
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadVerificationRequests = async () => {
    try {
      const response = await fetch('/api/owner/verification-requests', {
        headers: {
          'x-owner-token': localStorage.getItem('owner-token') || ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
        
        // Calculate stats
        const pending = data.requests.filter((r: VerificationRequest) => r.status === 'pending').length
        const approved = data.requests.filter((r: VerificationRequest) => r.status === 'approved').length
        const rejected = data.requests.filter((r: VerificationRequest) => r.status === 'rejected').length
        
        setStats({
          pending,
          approved,
          rejected,
          total: data.requests.length
        })
      }
    } catch (error) {
      console.error('Error loading verification requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch('/api/owner/approve-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-token': localStorage.getItem('owner-token') || ''
        },
        body: JSON.stringify({ requestId }),
      })

      if (response.ok) {
        await loadVerificationRequests()
        setSelectedRequest(null)
      }
    } catch (error) {
      console.error('Error approving verification:', error)
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      const response = await fetch('/api/owner/reject-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-token': localStorage.getItem('owner-token') || ''
        },
        body: JSON.stringify({ requestId, reason: 'Verification denied' }),
      })

      if (response.ok) {
        await loadVerificationRequests()
        setSelectedRequest(null)
      }
    } catch (error) {
      console.error('Error rejecting verification:', error)
    }
  }

  const handleDeleteUser = async (user: UserData) => {
    setUserToDelete(user)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/admin/delete-user?userId=${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-owner-token': localStorage.getItem('owner-token') || ''
        }
      })

      if (response.ok) {
        await loadUsers()
        await loadVerificationRequests()
        if (selectedUser?.id === userToDelete.id) {
          setSelectedUser(null)
        }
        setShowDeleteConfirm(false)
        setUserToDelete(null)
      } else {
        const error = await response.json()
        console.error('Error deleting user:', error.error)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const cancelDeleteUser = () => {
    setShowDeleteConfirm(false)
    setUserToDelete(null)
    setDeleteConfirmText("")
    setDeleteStep('confirm')
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const processedRequests = requests.filter(r => r.status !== 'pending')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Owner Portal</h1>
                <p className="text-blue-200 text-sm">Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('verifications')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'verifications' 
                      ? 'bg-white text-blue-900' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Verifications
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'users' 
                      ? 'bg-white text-blue-900' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Users
                </button>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <p className="text-blue-200 text-sm">Pending</p>
                <p className="text-white text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <p className="text-blue-200 text-sm">Approved</p>
                <p className="text-white text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-300" />
              </div>
              <div>
                <p className="text-blue-200 text-sm">Rejected</p>
                <p className="text-white text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <p className="text-blue-200 text-sm">Total</p>
                <p className="text-white text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <p className="text-blue-200 text-sm">Users</p>
                <p className="text-white text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'verifications' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Requests List */}
            <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Verification Requests
              </h2>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-blue-300 mx-auto mb-2 animate-spin" />
                  <p className="text-blue-200">Loading requests...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.length === 0 ? (
                    <p className="text-blue-200 text-center py-8">No pending requests</p>
                  ) : (
                    <>
                      <h3 className="text-sm font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Pending ({pendingRequests.length})
                      </h3>
                      {pendingRequests.map((request) => (
                        <div
                          key={request.id}
                          onClick={() => setSelectedRequest(request)}
                          className={`p-4 rounded-xl cursor-pointer transition-all border ${ 
                            selectedRequest?.id === request.id
                              ? 'bg-yellow-500/20 border-yellow-400'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-white">{request.userName}</span>
                            <Clock className="w-4 h-4 text-yellow-400" />
                          </div>
                          <p className="text-sm text-blue-200">{request.userEmail}</p>
                          <p className="text-xs text-blue-300 mt-1">
                            {new Date(request.submittedAt).toLocaleDateString()}
                          </p>
                          {request.classesChangedAt && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                <Calendar className="w-3 h-3 mr-1" />
                                Classes Changed
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {processedRequests.length > 0 && (
                    <>
                      <h3 className="text-sm font-semibold text-blue-300 mt-6 mb-3">Recently Processed</h3>
                      <div className="space-y-2">
                        {processedRequests.slice(0, 5).map((request) => (
                          <div
                            key={request.id}
                            className="p-3 rounded-lg bg-white/5 border border-white/10 opacity-60"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-white">{request.userName}</span>
                              {request.status === 'approved' ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                            </div>
                            <p className="text-xs text-blue-300">
                              {request.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                              {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Request Details */}
          <div className="lg:col-span-2">
            {selectedRequest ? (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <FileImage className="w-5 h-5" />
                  Verification Details
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-blue-200 mb-1">Student Name</p>
                    <p className="font-medium text-white">{selectedRequest.userName}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-blue-200 mb-1">Email</p>
                    <p className="font-medium text-white">{selectedRequest.userEmail}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-blue-200 mb-1">Student ID</p>
                    <p className="font-medium text-white">{selectedRequest.studentId}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-blue-200 mb-1">Submitted</p>
                    <p className="font-medium text-white">
                      {new Date(selectedRequest.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Current Classes Section */}
                {(selectedRequest.currentClasses && selectedRequest.currentClasses.length > 0) && (
                  <div className="mb-6">
                    <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {selectedRequest.classesChangedAt ? 'Class Changes' : 'Current Classes'}
                    </h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      {selectedRequest.classesChangedAt && (
                        <p className="text-sm text-blue-200 mb-3">
                          Classes changed on: {new Date(selectedRequest.classesChangedAt).toLocaleString()}
                        </p>
                      )}
                      {!selectedRequest.classesChangedAt && (
                        <p className="text-sm text-blue-200 mb-3">
                          Current schedule for verification
                        </p>
                      )}
                      
                      {/* Show all classes if no previous classes, otherwise show changes */}
                      {(!selectedRequest.previousClasses || selectedRequest.previousClasses.length === 0) ? (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-blue-400 mb-2">📚 All Classes:</h4>
                          <div className="space-y-2">
                            {(selectedRequest.currentClasses || []).map((cls: any, idx: number) => (
                              <div key={idx} className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                                <p className="text-white font-medium">
                                  {cls.subject} {cls.courseNumber}-{cls.section} - {cls.title}
                                </p>
                                <p className="text-sm text-blue-300">
                                  {cls.instructor} | {cls.room} | {cls.term}
                                </p>
                                {cls.meetingTimes && cls.meetingTimes.length > 0 && (
                                  <p className="text-xs text-blue-200 mt-1">
                                    {cls.meetingTimes.map((meeting: any, midx: number) => (
                                      <span key={midx}>
                                        {meeting.days.join(', ')} {meeting.startTime}-{meeting.endTime}
                                        {midx < cls.meetingTimes.length - 1 && ' | '}
                                      </span>
                                    ))}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Added Classes */}
                          {(() => {
                            const previousIds = (selectedRequest.previousClasses || []).map((c: any) => c.id)
                            const addedClasses = (selectedRequest.currentClasses || []).filter((c: any) => !previousIds.includes(c.id))
                            
                            if (addedClasses.length > 0) {
                              return (
                                <div className="mb-4">
                                  <h4 className="text-sm font-semibold text-green-400 mb-2">✓ Added Classes:</h4>
                                  <div className="space-y-2">
                                    {addedClasses.map((cls: any, idx: number) => (
                                      <div key={idx} className="bg-green-500/10 border border-green-500/20 rounded p-3">
                                        <p className="text-white font-medium">
                                          {cls.subject} {cls.courseNumber}-{cls.section} - {cls.title}
                                        </p>
                                        <p className="text-sm text-green-300">
                                          {cls.instructor} | {cls.room} | {cls.term}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            }
                            return null
                          })()}
                        </>
                      )}
                      
                      {/* Removed Classes */}
                      {(() => {
                        const currentIds = (selectedRequest.currentClasses || []).map((c: any) => c.id)
                        const removedClasses = (selectedRequest.previousClasses || []).filter((c: any) => !currentIds.includes(c.id))
                        
                        if (removedClasses.length > 0) {
                          return (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-red-400 mb-2">✗ Removed Classes:</h4>
                              <div className="space-y-2">
                                {removedClasses.map((cls: any, idx: number) => (
                                  <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded p-3">
                                    <p className="text-white font-medium">
                                      {cls.subject} {cls.courseNumber}-{cls.section} - {cls.title}
                                    </p>
                                    <p className="text-sm text-red-300">
                                      {cls.instructor} | {cls.room} | {cls.term}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}
                      
                      {/* Unchanged Classes */}
                      {(() => {
                        const currentIds = (selectedRequest.currentClasses || []).map((c: any) => c.id)
                        const unchangedClasses = (selectedRequest.currentClasses || []).filter((c: any) => 
                          (selectedRequest.previousClasses || []).some((p: any) => p.id === c.id)
                        )
                        
                        if (unchangedClasses.length > 0) {
                          return (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-400 mb-2">• Unchanged Classes:</h4>
                              <div className="space-y-2">
                                {unchangedClasses.map((cls: any, idx: number) => (
                                  <div key={idx} className="bg-white/5 border border-white/10 rounded p-3">
                                    <p className="text-gray-200 font-medium">
                                      {cls.subject} {cls.courseNumber}-{cls.section} - {cls.title}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                      {cls.instructor} | {cls.room} | {cls.term}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                    <FileImage className="w-4 h-4" />
                    Course Schedule Screenshot
                  </h3>
                  <div className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={selectedRequest.screenshotUrl}
                      alt="Schedule Screenshot"
                      className="w-full max-h-96 object-contain"
                    />
                  </div>
                  <a
                    href={selectedRequest.screenshotUrl}
                    download
                    className="mt-3 inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Screenshot
                  </a>
                </div>

                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve Verification
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Verification
                    </button>
                  </div>
                )}

                {selectedRequest.status !== 'pending' && (
                  <div className={`p-4 rounded-lg ${
                    selectedRequest.status === 'approved' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <p className="font-medium text-white">
                      Status: {selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'}
                    </p>
                    {selectedRequest.reviewedAt && (
                      <p className="text-sm text-blue-200">
                        Reviewed on: {new Date(selectedRequest.reviewedAt).toLocaleString()}
                      </p>
                    )}
                    {selectedRequest.rejectionReason && (
                      <p className="text-sm text-red-300 mt-2">
                        Reason: {selectedRequest.rejectionReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
                <User className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Select a Request</h3>
                <p className="text-blue-200">Choose a verification request from the list to review details</p>
                {pendingRequests.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-yellow-300">
                      {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''} waiting for review
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        ) : (
          // Users Tab
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Users List */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Users ({users.length})
                  </h2>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:border-white/40 transition-all"
                  />
                </div>

                {/* Users List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {users
                    .filter(user => 
                      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 rounded-lg border transition-all ${
                        selectedUser?.id === user.id
                          ? 'bg-white/10 border-white/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="flex items-center gap-3 flex-1 text-left hover:bg-white/5 rounded-lg p-2 -m-2 transition-all"
                        >
                          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-300" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-white">{user.name}</p>
                            <p className="text-sm text-blue-200">{user.email}</p>
                            <p className="text-xs text-blue-300">ID: {user.studentId}</p>
                          </div>
                          <div className="text-right">
                            <div className={`w-2 h-2 rounded-full ${
                              user.scheduleVerificationStatus === 'verified' ? 'bg-green-400' : 'bg-yellow-400'
                            }`} />
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteUser(user)
                          }}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-all text-red-400 hover:text-red-300"
                          title="Delete user account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* User Details Panel */}
            <div className="lg:col-span-2">
              {selectedUser ? (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                      {selectedUser.avatar ? (
                        <img src={selectedUser.avatar} alt={selectedUser.name} className="w-16 h-16 rounded-full" />
                      ) : (
                        <User className="w-8 h-8 text-blue-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedUser.name}</h3>
                      <p className="text-blue-200">{selectedUser.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedUser.scheduleVerificationStatus === 'verified' ? 'bg-green-400' : 'bg-yellow-400'
                        }`} />
                        <span className="text-xs text-blue-300">
                          {selectedUser.scheduleVerificationStatus === 'verified' ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* User Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Basic Information</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-blue-200">Student ID</label>
                          <p className="text-white font-medium">{selectedUser.studentId}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-blue-200">Year</label>
                          <p className="text-white font-medium">{selectedUser.year}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-blue-200">Major</label>
                          <p className="text-white font-medium">{selectedUser.major}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm text-blue-200">Points</label>
                          <p className="text-white font-medium">{selectedUser.points}</p>
                        </div>

                        <div>
                          <label className="text-sm text-blue-200">Bio</label>
                          <p className="text-white font-medium">{selectedUser.bio || 'No bio provided'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Classes & Schedule */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Classes ({selectedUser.classes.length})</h4>
                      
                      {selectedUser.classes.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedUser.classes.map((cls: any, idx: number) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                              <p className="text-white font-medium">
                                {cls.subject} {cls.courseNumber}-{cls.section}
                              </p>
                              <p className="text-sm text-blue-200">{cls.title}</p>
                              <p className="text-xs text-blue-300">
                                {cls.instructor} | {cls.room}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-blue-200 text-sm">No classes registered</p>
                      )}

                      {selectedUser.verificationScreenshot && (
                        <div>
                          <label className="text-sm text-blue-200">Verification Screenshot</label>
                          <div className="mt-2">
                            <img 
                              src={selectedUser.verificationScreenshot} 
                              alt="Schedule verification"
                              className="max-w-full h-32 object-cover rounded-lg border border-white/20"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/20">
                    {/* Social Links */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Social Links</h4>
                      <div className="space-y-2">
                        {selectedUser.socialLinks?.twitter && (
                          <p className="text-sm text-blue-200">Twitter: {selectedUser.socialLinks.twitter}</p>
                        )}
                        {selectedUser.socialLinks?.linkedin && (
                          <p className="text-sm text-blue-200">LinkedIn: {selectedUser.socialLinks.linkedin}</p>
                        )}
                        {selectedUser.socialLinks?.github && (
                          <p className="text-sm text-blue-200">GitHub: {selectedUser.socialLinks.github}</p>
                        )}
                        {selectedUser.socialLinks?.instagram && (
                          <p className="text-sm text-blue-200">Instagram: {selectedUser.socialLinks.instagram}</p>
                        )}
                        {!selectedUser.socialLinks?.twitter && !selectedUser.socialLinks?.linkedin && 
                         !selectedUser.socialLinks?.github && !selectedUser.socialLinks?.instagram && (
                          <p className="text-blue-200 text-sm">No social links provided</p>
                        )}
                      </div>
                    </div>

                    {/* Settings & Verification */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Account Status</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-200">Schedule Shared:</span>
                          <span className="text-white font-medium">
                            {selectedUser.hasSharedSchedule ? 'Yes' : 'No'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-200">Verification Status:</span>
                          <span className={`font-medium ${selectedUser.scheduleVerificationStatus === 'verified' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {selectedUser.scheduleVerificationStatus || 'Unverified'}
                          </span>
                        </div>

                        {selectedUser.verificationSubmittedAt && (
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-200">Verified At:</span>
                            <span className="text-white font-medium text-sm">
                              {new Date(selectedUser.verificationSubmittedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between">
                          <span className="text-sm text-blue-200">Achievements:</span>
                          <span className="text-white font-medium">
                            {selectedUser.achievements.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Activity Data Section */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Activity & Access Data</h4>
                      
                      {/* Last Login */}
                      {selectedUser.activity?.lastLogin && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <p className="text-sm text-blue-200 mb-1">Last Login</p>
                          <p className="text-white font-medium">
                            {new Date(selectedUser.activity.lastLogin).toLocaleString('ja-JP', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </p>
                        </div>
                      )}

                      {/* Login History */}
                      {selectedUser.activity?.loginHistory && selectedUser.activity.loginHistory.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <p className="text-sm text-blue-200 mb-3">Recent Login History</p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {selectedUser.activity.loginHistory.slice(0, 5).map((login: any, idx: number) => (
                              <div key={idx} className="text-xs">
                                <span className="text-white">{new Date(login.timestamp).toLocaleString('ja-JP')}</span>
                                <span className="text-blue-300 ml-2">IP: {login.ipAddress || 'Unknown'}</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-blue-300 mt-2">
                            Total logins: {selectedUser.activity.loginHistory.length}
                          </p>
                        </div>
                      )}

                      {/* Profile Views (Who viewed this user) */}
                      {selectedUser.activity?.profileViewedBy && selectedUser.activity.profileViewedBy.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <p className="text-sm text-blue-200 mb-3">Profile Viewed By</p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {selectedUser.activity.profileViewedBy.slice(0, 5).map((view: any, idx: number) => (
                              <div key={idx} className="text-xs">
                                <span className="text-white font-medium">{view.viewedUserName}</span>
                                <span className="text-blue-300 ml-2">
                                  {new Date(view.timestamp).toLocaleString('ja-JP')}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-blue-300 mt-2">
                            Total profile views: {selectedUser.activity.profileViewedBy.length}
                          </p>
                        </div>
                      )}

                      {/* Profiles Viewed (Who this user viewed) */}
                      {selectedUser.activity?.profileViews && selectedUser.activity.profileViews.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <p className="text-sm text-blue-200 mb-3">Profiles Viewed</p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {selectedUser.activity.profileViews.slice(0, 5).map((view: any, idx: number) => (
                              <div key={idx} className="text-xs">
                                <span className="text-white font-medium">{view.viewerName}</span>
                                <span className="text-blue-300 ml-2">
                                  {new Date(view.timestamp).toLocaleString('ja-JP')}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-blue-300 mt-2">
                            Total profiles viewed: {selectedUser.activity.profileViews.length}
                          </p>
                        </div>
                      )}

                      {/* No Activity Data */}
                      {!selectedUser.activity?.lastLogin && 
                       (!selectedUser.activity?.loginHistory || selectedUser.activity.loginHistory.length === 0) &&
                       (!selectedUser.activity?.profileViewedBy || selectedUser.activity.profileViewedBy.length === 0) &&
                       (!selectedUser.activity?.profileViews || selectedUser.activity.profileViews.length === 0) && (
                        <p className="text-blue-200 text-sm">No activity data available</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
                  <User className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Select a User</h3>
                  <p className="text-blue-200">Choose a user from the list to view detailed information</p>
                  {users.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-blue-300">
                        {users.length} user{users.length !== 1 ? 's' : ''} registered
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
      {showDeleteConfirm && userToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-lg w-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete User Account</h3>
                <p className="text-red-200 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            {deleteStep === 'confirm' ? (
              <>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                  <p className="text-white font-medium mb-2">You are about to delete:</p>
                  <div className="space-y-1">
                    <p className="text-blue-200">
                      <span className="font-medium">Name:</span> {userToDelete.name}
                    </p>
                    <p className="text-blue-200">
                      <span className="font-medium">Email:</span> {userToDelete.email}
                    </p>
                    <p className="text-blue-200">
                      <span className="font-medium">Student ID:</span> {userToDelete.studentId}
                    </p>
                    <p className="text-blue-200">
                      <span className="font-medium">Status:</span> {userToDelete.scheduleVerificationStatus || 'unverified'}
                    </p>
                    <p className="text-blue-200">
                      <span className="font-medium">Classes:</span> {userToDelete.classes?.length || 0} enrolled
                    </p>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                  <p className="text-red-200 text-sm font-semibold mb-2">
                    ⚠️ This will permanently delete:
                  </p>
                  <ul className="text-red-200 text-sm space-y-1 list-disc list-inside">
                    <li>User account and profile data</li>
                    <li>Class schedules and preferences</li>
                    <li>Activity history and login records</li>
                    <li>Verification screenshots and requests</li>
                    <li>All events created by this user</li>
                    <li>Profile views and analytics data</li>
                    <li>Social connections and interactions</li>
                  </ul>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                  <p className="text-amber-200 text-sm">
                    <strong>Impact on other users:</strong> Other students who have interacted with this user may lose connection history, and any shared events will be affected.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={cancelDeleteUser}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg font-medium transition-all border border-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setDeleteStep('type-name')}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-3 rounded-lg font-medium transition-all border border-red-500/30"
                  >
                    Continue to Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-white font-semibold mb-2">Final Confirmation</p>
                  <p className="text-gray-300 text-sm mb-4">
                    To confirm deletion, please type the user's full name exactly as shown:
                  </p>
                  <div className="bg-white/5 border border-white/20 rounded-lg p-3 mb-4">
                    <p className="text-blue-200 font-mono text-center">{userToDelete.name}</p>
                  </div>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type the full name here..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-400"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteStep('confirm')}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg font-medium transition-all border border-white/20"
                  >
                    Back
                  </button>
                  <button
                    onClick={confirmDeleteUser}
                    disabled={deleteConfirmText !== userToDelete.name}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      deleteConfirmText === userToDelete.name
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {deleteConfirmText === userToDelete.name ? 'Delete Account' : 'Type name to confirm'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}