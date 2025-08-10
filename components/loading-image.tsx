"use client"

import { useState } from "react"
// // Removed lucide-react import
// Temporary icon replacements
const ImageIcon = () => <span>⭐</span>
const AlertCircle = () => <span>⭐</span>


interface LoadingImageProps {
  src: string
  alt: string
  className?: string
  fallbackIcon?: React.ReactNode
  showSpinner?: boolean
}

export default function LoadingImage({ 
  src, 
  alt, 
  className = "", 
  fallbackIcon,
  showSpinner = true 
}: LoadingImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        {fallbackIcon || (
          <div className="flex items-center justify-center text-gray-400">
            <AlertCircle className="w-6 h-6" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && showSpinner && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${className}`}>
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}