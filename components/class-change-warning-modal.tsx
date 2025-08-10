"use client"

import React from "react"
// // Removed lucide-react import
// Temporary icon replacements
const X = () => <span>❌</span>
const AlertTriangle = () => <span>⚠️</span>
const Shield = () => <span>🛡️</span>


interface ClassChangeWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isVerified: boolean
}

export default function ClassChangeWarningModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  isVerified
}: ClassChangeWarningModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Class Change Warning
              </h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-6">
            {isVerified ? (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900">
                        Your Schedule is Currently Verified
                      </p>
                      <p className="text-sm text-yellow-800 mt-1">
                        Changing your classes will reset your verification status to "Unverified"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">What this means:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>You will lose your verified status immediately</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>You'll need to submit a new screenshot of your updated schedule</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>Admin approval will be required again (1-2 business days)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>You won't be able to browse other students' schedules until re-verified</span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900">
                  You can change your classes freely. Since your schedule is not currently verified, 
                  this change won't affect your verification status.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 rounded-full font-semibold transition-all ${
                isVerified
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isVerified ? 'Proceed Anyway' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}