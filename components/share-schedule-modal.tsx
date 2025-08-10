"use client"

import type React from "react"

import { useState } from "react"
// import { X, Share2, Lock, Eye } from "lucide-react"
// Temporary icon replacements
const X = () => <span>❌</span>
const Share2 = () => <span>⭐</span>
const Lock = () => <span>⭐</span>
const Eye = () => <span>👁️</span>


interface ShareScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (isShared: boolean) => void
  currentlyShared: boolean
  userVerificationStatus?: string
}

export default function ShareScheduleModal({ isOpen, onClose, onSubmit, currentlyShared, userVerificationStatus }: ShareScheduleModalProps) {
  const [isShared, setIsShared] = useState(currentlyShared)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(isShared)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-2xl font-bold text-black">Schedule Sharing</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Verification Warning */}
          {userVerificationStatus !== 'verified' && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Verification Required</span>
              </div>
              <p className="text-sm text-yellow-700">
                You must verify your schedule before sharing it with others. Please submit your schedule verification first.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {/* Share Option */}
            <div
              onClick={() => !currentlyShared && userVerificationStatus === 'verified' && setIsShared(true)}
              className={`p-4 border-2 rounded-xl transition-all ${
                isShared
                  ? "border-black bg-gray-50"
                  : currentlyShared
                    ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                    : userVerificationStatus !== 'verified'
                      ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                      : "border-gray-200 hover:border-gray-300 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Share2 className="w-5 h-5 text-black" />
                <span className="font-semibold text-black">Share My Schedule</span>
                {isShared && <div className="w-2 h-2 bg-black rounded-full ml-auto" />}
              </div>
              <p className="text-sm text-gray-600 ml-8">
                Other students can view your schedule and you can view theirs. This enables mutual schedule sharing.
              </p>
              {currentlyShared && <p className="text-xs text-green-600 ml-8 mt-2 font-medium">✓ Currently sharing</p>}
            </div>

            {/* Private Option - Only show if not currently shared */}
            {!currentlyShared && (
              <div
                onClick={() => setIsShared(false)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  !isShared ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="w-5 h-5 text-black" />
                  <span className="font-semibold text-black">Keep Private</span>
                  {!isShared && <div className="w-2 h-2 bg-black rounded-full ml-auto" />}
                </div>
                <p className="text-sm text-gray-600 ml-8">
                  Your schedule will remain private. You won't be able to view other students' schedules.
                </p>
              </div>
            )}

            {/* Warning for already shared schedules */}
            {currentlyShared && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-800">Permanent Sharing</span>
                </div>
                <p className="text-sm text-blue-700">
                  Once you share your schedule, it cannot be made private again. This ensures consistent community
                  participation and trust among students.
                </p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-800">Mutual Sharing Policy</span>
            </div>
            <p className="text-sm text-blue-700">
              To view other students' schedules, you must share your own schedule. This ensures fair and mutual
              participation in the community.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-full font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            {!currentlyShared && (
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                {isShared ? "Share Schedule" : "Keep Private"}
              </button>
            )}
            {currentlyShared && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-full font-semibold"
              >
                Already Shared ✓
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
