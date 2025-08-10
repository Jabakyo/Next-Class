"use client"

import type React from "react"
import { useState, useRef } from "react"
// import { X, Upload, Camera, Shield, CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react"
// Temporary icon replacements
const X = () => <span>❌</span>
const Upload = () => <span>⭐</span>
const Camera = () => <span>⭐</span>
const Shield = () => <span>🛡️</span>
const CheckCircle = () => <span>✅</span>
const AlertCircle = () => <span>⭐</span>
const Clock = () => <span>⏰</span>
const XCircle = () => <span>⭐</span>


interface ScheduleVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerificationSubmit: (file: File) => Promise<void>
  verificationStatus: 'none' | 'pending' | 'verified' | 'rejected'
}

export default function ScheduleVerificationModal({
  isOpen,
  onClose,
  onVerificationSubmit,
  verificationStatus,
}: ScheduleVerificationModalProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setUploadedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!uploadedFile) return

    setIsSubmitting(true)
    await onVerificationSubmit(uploadedFile)
    setIsSubmitting(false)
    
    // Reset state
    setUploadedFile(null)
    setPreviewUrl(null)
  }

  const handleClose = () => {
    setUploadedFile(null)
    setPreviewUrl(null)
    setDragActive(false)
    setIsSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Schedule Verification</h2>
                <p className="text-sm text-gray-600">Verify your Dickinson course schedule</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {verificationStatus === 'verified' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Schedule Already Verified!</h3>
              <p className="text-gray-600 mb-6">Your course schedule has been verified successfully.</p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          ) : verificationStatus === 'pending' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-yellow-600 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Verification Under Review</h3>
              <p className="text-gray-600 mb-2">Your schedule verification is being reviewed by our team.</p>
              <p className="text-sm text-gray-500 mb-6">This usually takes 1-2 business days.</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You cannot view other students' schedules while your verification is pending.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          ) : verificationStatus === 'rejected' ? (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Previous Verification Rejected</h3>
                <p className="text-gray-600 mb-2">Your previous verification was not approved.</p>
                <p className="text-sm text-gray-500 mb-4">You can submit a new screenshot with the correct requirements below.</p>
              </div>

              {/* Show upload form for reapplication */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Resubmit your verification:</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>Log into your Dickinson student portal</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span>Navigate to "Your Courses" or "Class Schedule"</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span>Take a screenshot showing all your enrolled courses</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    <span>Upload the screenshot below</span>
                  </li>
                </ol>
              </div>


              {/* File Upload Area for reapplication */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive
                    ? "border-blue-400 bg-blue-50"
                    : uploadedFile
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Schedule Screenshot Preview"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">New screenshot uploaded</span>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Upload different image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-700 mb-2">Upload new schedule screenshot</p>
                      <p className="text-gray-500 mb-4">Drag and drop your image here, or click to browse</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                      >
                        Choose File
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />

              {/* Privacy Notice */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <strong>Privacy & Security:</strong> Your screenshot is used only for verification purposes. We verify that your schedule matches what you've entered in the app. Personal information is kept secure and never shared.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!uploadedFile || isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "Resubmitting..." : "Resubmit for Verification"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How to verify your schedule:</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>Log into your Dickinson student portal</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span>Navigate to "Your Courses" or "Class Schedule"</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span>Take a screenshot showing all your enrolled courses</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    <span>Upload the screenshot below</span>
                  </li>
                </ol>
              </div>


              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive
                    ? "border-blue-400 bg-blue-50"
                    : uploadedFile
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Schedule Screenshot Preview"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Screenshot uploaded successfully</span>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Upload different image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-700 mb-2">Upload your schedule screenshot</p>
                      <p className="text-gray-500 mb-4">Drag and drop your image here, or click to browse</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                      >
                        Choose File
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />

              {/* Privacy Notice */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <strong>Privacy & Security:</strong> Your screenshot is used only for verification purposes. We verify that your schedule matches what you've entered in the app. Personal information is kept secure and never shared.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!uploadedFile || isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "Submitting..." : "Submit for Verification"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}