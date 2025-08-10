"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
// // Removed lucide-react import
// Temporary icon replacements
const CheckCircle = () => <span>✅</span>
const XCircle = () => <span>⭐</span>
const Mail = () => <span>📧</span>
const Loader2 = () => <span>⏳</span>

import LoadingImage from "@/components/loading-image"

interface VerificationState {
  status: 'loading' | 'success' | 'error'
  message: string
  user?: any
}

export default function VerifyEmailPage() {
  const [verificationState, setVerificationState] = useState<VerificationState>({
    status: 'loading',
    message: 'Verifying email address...'
  })
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setVerificationState({
        status: 'error',
        message: 'Invalid verification link.'
      })
      return
    }

    // Verify the token
    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (response.ok) {
          // Store the auth token
          localStorage.setItem('auth-token', data.token)
          
          setVerificationState({
            status: 'success',
            message: 'Email address verified! Your account has been created and you will be automatically logged in.',
            user: data.user
          })

          // Redirect to main app after 3 seconds
          setTimeout(() => {
            window.location.href = '/'
          }, 3000)
        } else {
          setVerificationState({
            status: 'error',
            message: data.error || 'Email verification failed.'
          })
        }
      } catch (error) {
        console.error('Verification error:', error)
        setVerificationState({
          status: 'error',
          message: 'A network error occurred. Please try again.'
        })
      }
    }

    verifyEmail()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center">
          <LoadingImage
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-7gl6pr8trbqDZFoBJ5QAJysuvuYLxa.png"
            alt="Orange Logo"
            className="w-16 h-16 mx-auto mb-6 rounded-xl shadow-lg"
          />

          {verificationState.status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-black mb-4">Verifying...</h1>
              <p className="text-gray-600">{verificationState.message}</p>
            </>
          )}

          {verificationState.status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-black mb-4">Verification Complete!</h1>
              <p className="text-gray-600 mb-6">{verificationState.message}</p>
              
              {verificationState.user && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <p className="text-green-800 font-semibold">
                    Welcome, {verificationState.user.name}!
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Moving to dashboard in 3 seconds...
                  </p>
                </div>
              )}

              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all"
              >
                To Dashboard
              </button>
            </>
          )}

          {verificationState.status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-black mb-4">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{verificationState.message}</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/signup')}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all"
                >
                  Sign Up Again
                </button>
                
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  To Login Page
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}