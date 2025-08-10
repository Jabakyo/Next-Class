"use client"

import type React from "react"

import { useState } from "react"
// // Removed lucide-react import
// Temporary icon replacements
const Eye = () => <span>👁️</span>
const EyeOff = () => <span>🙈</span>
const Mail = () => <span>📧</span>
const Lock = () => <span>⭐</span>

import type { User } from "@/types/user"
import LoadingImage from "@/components/loading-image"

interface LoginPageProps {
  onLogin: (user: User) => void
  onSwitchToSignup: () => void
}

export default function LoginPage({ onLogin, onSwitchToSignup }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("")
  const [isSendingReset, setIsSendingReset] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validate @dickinson.edu email
    if (!email.endsWith("@dickinson.edu")) {
      setError("Please use your @dickinson.edu email address")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to login')
        setIsLoading(false)
        return
      }

      // Store token in localStorage for client-side auth checks
      localStorage.setItem('auth-token', data.token)
      
      // Call parent component's login handler
      onLogin(data.user)
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordMessage("")
    setIsSendingReset(true)

    // Validate @dickinson.edu email
    if (!forgotPasswordEmail.endsWith("@dickinson.edu")) {
      setForgotPasswordMessage("Please use your @dickinson.edu email address")
      setIsSendingReset(false)
      return
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        setForgotPasswordMessage(data.error || 'Failed to send reset email')
        setIsSendingReset(false)
        return
      }

      setForgotPasswordMessage("Password reset email sent! Check your inbox.")
      setForgotPasswordEmail("")
    } catch (error) {
      console.error('Forgot password error:', error)
      setForgotPasswordMessage('Network error. Please try again.')
    } finally {
      setIsSendingReset(false)
    }
  }

  const resetForgotPasswordForm = () => {
    setShowForgotPassword(false)
    setForgotPasswordEmail("")
    setForgotPasswordMessage("")
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
            <h1 className="text-3xl font-bold text-black mb-2">
              {showForgotPassword ? "Reset Password" : "Welcome Back"}
            </h1>
            <p className="text-gray-600">
              {showForgotPassword 
                ? "Enter your email to receive a password reset link" 
                : "Sign in to access your class schedule"
              }
            </p>
          </div>

          {!showForgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Dickinson Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    placeholder="your.name@dickinson.edu"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    placeholder="Enter your password"
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

              {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-black font-semibold hover:underline text-sm"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Dickinson Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="forgot-email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    placeholder="your.name@dickinson.edu"
                    required
                  />
                </div>
              </div>

              {forgotPasswordMessage && (
                <div className={`text-sm text-center p-3 rounded-lg ${
                  forgotPasswordMessage.includes('sent') 
                    ? 'text-green-700 bg-green-50' 
                    : 'text-red-500 bg-red-50'
                }`}>
                  {forgotPasswordMessage}
                  {forgotPasswordMessage.includes('sent') && (
                    <div className="mt-2 text-xs text-gray-600">
                      <strong>Note:</strong> The email might be in your spam/junk folder. Please check there if you don't see it in your inbox.
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSendingReset}
                className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingReset ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="text-center space-y-3">
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  💡 <strong>Tip:</strong> Check your spam/junk folder if you don't receive the email within a few minutes.
                </div>
                <button
                  type="button"
                  onClick={resetForgotPasswordForm}
                  className="text-gray-600 hover:text-black font-semibold text-sm"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {!showForgotPassword && (
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <button onClick={onSwitchToSignup} className="text-black font-semibold hover:underline">
                  Sign up
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
