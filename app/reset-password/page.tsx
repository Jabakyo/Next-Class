"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react"
import LoadingImage from "@/components/loading-image"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [resetSuccess, setResetSuccess] = useState(false)

  // Verify token on component mount
  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.")
      setIsVerifying(false)
      return
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Invalid or expired reset token')
          setTokenValid(false)
        } else {
          setTokenValid(true)
          setUserEmail(data.email)
        }
      } catch (error) {
        console.error('Token verification error:', error)
        setError('Network error. Please try again.')
        setTokenValid(false)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword: password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reset password')
        setIsLoading(false)
        return
      }

      setResetSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (error) {
      console.error('Password reset error:', error)
      setError('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center">
            <LoadingImage
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-7gl6pr8trbqDZFoBJ5QAJysuvuYLxa.png"
              alt="NC Logo"
              className="w-16 h-16 mx-auto mb-4 rounded-xl shadow-lg"
            />
            <h1 className="text-2xl font-bold text-black mb-4">Verifying Reset Link...</h1>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center">
            <LoadingImage
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-7gl6pr8trbqDZFoBJ5QAJysuvuYLxa.png"
              alt="NC Logo"
              className="w-16 h-16 mx-auto mb-4 rounded-xl shadow-lg"
            />
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-black mb-4">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center">
            <LoadingImage
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-7gl6pr8trbqDZFoBJ5QAJysuvuYLxa.png"
              alt="NC Logo"
              className="w-16 h-16 mx-auto mb-4 rounded-xl shadow-lg"
            />
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-black mb-4">Password Reset Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You will be redirected to the login page in a few seconds.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <LoadingImage
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-7gl6pr8trbqDZFoBJ5QAJysuvuYLxa.png"
              alt="NC Logo"
              className="w-16 h-16 mx-auto mb-4 rounded-xl shadow-lg"
            />
            <h1 className="text-3xl font-bold text-black mb-2">Reset Your Password</h1>
            <p className="text-gray-600">Enter a new password for {userEmail}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  placeholder="Enter new password (min 6 characters)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="space-y-2">
                <div className="text-xs text-gray-600">Password strength:</div>
                <div className="space-y-1">
                  <div className={`text-xs ${password.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                    ✓ At least 6 characters
                  </div>
                  <div className={`text-xs ${password !== confirmPassword && confirmPassword ? 'text-red-500' : password === confirmPassword && confirmPassword ? 'text-green-600' : 'text-gray-400'}`}>
                    ✓ Passwords match
                  </div>
                </div>
              </div>
            )}

            {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={isLoading || password !== confirmPassword || password.length < 6}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-black font-semibold text-sm"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}