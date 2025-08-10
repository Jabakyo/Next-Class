"use client"

import { useState, useEffect } from "react"
// Temporary icon replacements
const Shield = () => <span>🛡️</span>
const LogOut = () => <span>🚪</span>
const Users = () => <span>👥</span>
const CheckCircle = () => <span>✅</span>
const XCircle = () => <span>❌</span>
const Clock = () => <span>⏰</span>
const Download = () => <span>💾</span>
const User = () => <span>👤</span>
const AlertTriangle = () => <span>⚠️</span>
const TrendingUp = () => <span>📈</span>
const FileImage = () => <span>📄</span>

interface VerificationRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  studentId: string
  screenshotUrl: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}

interface OwnerDashboardProps {
  onLogout: () => void
}

export default function OwnerDashboard({ onLogout }: OwnerDashboardProps) {
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  })

  useEffect(() => {
    loadVerificationRequests()
  }, [])

  const loadVerificationRequests = async () => {
    try {
      // Call the main app's API (port 3000)
      const response = await fetch('http://localhost:3000/api/admin/verification-requests', {
        credentials: 'include',
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
      const response = await fetch('http://localhost:3000/api/admin/approve-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
      const response = await fetch('http://localhost:3000/api/admin/reject-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
                <p className="text-blue-200 text-sm">Schedule Verification Management</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
        </div>

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

                <div className="mb-6">
                  <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                    <FileImage className="w-4 h-4" />
                    Course Schedule Screenshot
                  </h3>
                  <div className="bg-white/5 rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={`http://localhost:3000${selectedRequest.screenshotUrl}`}
                      alt="Schedule Screenshot"
                      className="w-full max-h-96 object-contain"
                    />
                  </div>
                  <a
                    href={`http://localhost:3000${selectedRequest.screenshotUrl}`}
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
      </div>
    </div>
  )
}