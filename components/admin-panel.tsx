"use client"

import { useState, useEffect } from "react"
// Temporary icon replacements
const ArrowLeft = () => <span>←</span>
const CheckCircle = () => <span>✅</span>
const XCircle = () => <span>⭐</span>
const Clock = () => <span>⏰</span>
const User = () => <span>👤</span>
const Calendar = () => <span>📅</span>
const Download = () => <span>⭐</span>

import type { VerificationRequest } from "@/types/verification"

interface AdminPanelProps {
  onNavigateToDashboard: () => void
}

export default function AdminPanel({ onNavigateToDashboard }: AdminPanelProps) {
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadVerificationRequests()
  }, [])

  const loadVerificationRequests = async () => {
    try {
      const response = await fetch('/api/admin/verification-requests', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('Error loading verification requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch('/api/admin/approve-verification', {
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

  const handleReject = async (requestId: string, reason: string) => {
    try {
      const response = await fetch('/api/admin/reject-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ requestId, reason }),
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={onNavigateToDashboard} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">Admin Panel - Schedule Verifications</h1>
            </div>
            <div className="text-sm text-gray-600">
              Pending: {pendingRequests.length} | Processed: {processedRequests.length}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Requests List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Requests</h2>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                  <p className="text-gray-600">Loading requests...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No pending requests</p>
                  ) : (
                    pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        onClick={() => setSelectedRequest(request)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedRequest?.id === request.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{request.userName}</span>
                          <Clock className="w-4 h-4 text-yellow-500" />
                        </div>
                        <p className="text-sm text-gray-600">{request.userEmail}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {processedRequests.length > 0 && (
                <>
                  <h3 className="text-md font-semibold text-gray-700 mt-6 mb-3">Recently Processed</h3>
                  <div className="space-y-2">
                    {processedRequests.slice(0, 5).map((request) => (
                      <div
                        key={request.id}
                        className="p-3 border border-gray-200 rounded-lg opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{request.userName}</span>
                          {request.status === 'approved' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {request.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                          {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Request Details */}
          <div className="lg:col-span-2">
            {selectedRequest ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Details</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Student Name</p>
                    <p className="font-medium text-gray-900">{selectedRequest.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedRequest.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Student ID</p>
                    <p className="font-medium text-gray-900">{selectedRequest.studentId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedRequest.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-700 mb-3">Uploaded Screenshot</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={selectedRequest.screenshotUrl}
                      alt="Schedule Screenshot"
                      className="w-full"
                    />
                  </div>
                  <a
                    href={selectedRequest.screenshotUrl}
                    download
                    className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Screenshot
                  </a>
                </div>

                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve Verification
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:')
                        if (reason) handleReject(selectedRequest.id, reason)
                      }}
                      className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Verification
                    </button>
                  </div>
                )}

                {selectedRequest.status !== 'pending' && (
                  <div className={`p-4 rounded-lg ${
                    selectedRequest.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <p className="font-medium text-gray-900">
                      Status: {selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'}
                    </p>
                    {selectedRequest.reviewedAt && (
                      <p className="text-sm text-gray-600">
                        Reviewed on: {new Date(selectedRequest.reviewedAt).toLocaleString()}
                      </p>
                    )}
                    {selectedRequest.rejectionReason && (
                      <p className="text-sm text-red-600 mt-2">
                        Reason: {selectedRequest.rejectionReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a request to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}