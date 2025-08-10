"use client"

import { useState, useRef } from "react"
// // Removed lucide-react import
// Temporary icon replacements
const Camera = () => <span>⭐</span>
const Upload = () => <span>⭐</span>
const X = () => <span>❌</span>
const Trash2 = () => <span>🗑️</span>
const User = () => <span>👤</span>


interface AvatarUploadProps {
  currentAvatar?: string
  onAvatarChange: (avatarUrl: string) => void
  onAvatarRemove: () => void
  userName: string
}

export default function AvatarUpload({ 
  currentAvatar, 
  onAvatarChange, 
  onAvatarRemove, 
  userName 
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Maximum 5MB allowed.')
      return
    }

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        onAvatarChange(result.avatarUrl)
        setPreviewUrl(null)
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Avatar upload failed:', error)
      alert('Failed to upload avatar. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!currentAvatar) return

    try {
      const response = await fetch('/api/user/upload-avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      })

      if (response.ok) {
        onAvatarRemove()
      } else {
        throw new Error('Failed to remove avatar')
      }
    } catch (error) {
      console.error('Avatar removal failed:', error)
      alert('Failed to remove avatar. Please try again.')
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

  const displayAvatar = previewUrl || currentAvatar

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={`${userName}'s avatar`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <User className="w-16 h-16 text-white" />
            </div>
          )}
        </div>
        
        {/* Upload button overlay */}
        <div
          className={`absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-50 flex items-center justify-center transition-all cursor-pointer ${
            dragActive ? 'bg-opacity-50' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Upload Controls */}
      <div className="flex flex-col items-center space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Photo
              </>
            )}
          </button>

          {currentAvatar && (
            <button
              onClick={handleRemoveAvatar}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center">
          Click to upload or drag and drop<br />
          PNG, JPG up to 5MB
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  )
}