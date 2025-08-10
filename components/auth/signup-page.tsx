"use client"

import type React from "react"

import { useState } from "react"
import { Eye, EyeOff, Mail, Lock, UserIcon, X, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react"
import type { User, SelectedClass } from "@/types/user"
import ClassSelectionModal from "@/components/class-selection-modal"
import LoadingImage from "@/components/loading-image"

interface SignupPageProps {
  onSignup: (user: User) => void
  onSwitchToLogin: () => void
}

type SignupStep = "account" | "classes" | "verification" | "complete" | "email-sent"

export default function SignupPage({ onSignup, onSwitchToLogin }: SignupPageProps) {
  const [currentStep, setCurrentStep] = useState<SignupStep>("account")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    studentId: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedClasses, setSelectedClasses] = useState<SelectedClass[]>([])
  const [isClassModalOpen, setIsClassModalOpen] = useState(false)
  const [verificationFile, setVerificationFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }


  const handleAccountStep = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.email.endsWith("@dickinson.edu")) {
      setError("Please use your @dickinson.edu email address")
      return
    }

    if (!formData.studentId.trim()) {
      setError("Student ID is required")
      return
    }

    if (!/^[0-9]+$/.test(formData.studentId.trim())) {
      setError("Student ID must contain only numbers")
      return
    }

    if (formData.studentId.trim().length !== 9) {
      setError("Please enter your STUDENT ID correctly")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setCurrentStep("classes")
  }

  const handleClassesStep = () => {
    setCurrentStep("verification")
  }

  const handleVerificationStep = () => {
    setCurrentStep("complete")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVerificationFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleFinalSubmit = async () => {
    setIsLoading(true)
    setError("")


    try {
      // Send signup request with selected classes
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          studentId: formData.studentId,
          year: 'Freshman',
          major: 'Undeclared',
          interests: [],
          bio: '',
          avatar: '',
          socialLinks: {
            twitter: '',
            linkedin: '',
            github: '',
            instagram: ''
          },
          settings: {
            privacy: {
              showEmail: false,
              showSchedule: true,
              showInterests: true,
              showSocialLinks: true
            },
            notifications: {
              classUpdates: true,
              classmateRequests: true,
              scheduleChanges: true,
              newFeatures: false
            }
          },
          selectedClasses: selectedClasses
        }),
      })

      let responseData
      const responseText = await signupResponse.text()
      
      console.log('Raw response:', responseText)
      console.log('Response status:', signupResponse.status)
      console.log('Response headers:', Object.fromEntries(signupResponse.headers.entries()))
      
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError)
        console.error('Response text:', responseText.substring(0, 500) + '...')
        setError('Server error: Invalid response format')
        setIsLoading(false)
        return
      }

      if (!signupResponse.ok) {
        // If email already has a pending verification, show the email-sent step
        if (responseData.error && responseData.error.includes('verification email has already been sent')) {
          setCurrentStep('email-sent' as SignupStep)
          setIsLoading(false)
          return
        }
        setError(responseData.error || 'Failed to create account')
        setIsLoading(false)
        return
      }

      // Check if email verification is required
      if (responseData.requiresVerification) {
        // Show success message about email verification
        setCurrentStep('email-sent' as SignupStep)
        setIsLoading(false)
      } else {
        // Direct login after successful account creation
        localStorage.setItem('auth-token', responseData.token)
        console.log('✅ Account created and logged in successfully')
        onSignup(responseData.user)
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  const renderAccountStep = () => (
    <form onSubmit={handleAccountStep} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
          Full Name
        </label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            placeholder="Enter your full name"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="studentId" className="block text-sm font-semibold text-gray-700 mb-2">
          Student ID
        </label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            placeholder="Enter your student ID number"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
          Dickinson Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
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
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            placeholder="Create a password"
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
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            placeholder="Confirm your password"
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

      {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}

      <button
        type="submit"
        className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2"
      >
Continue to Profile Setup
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  )

  const renderClassesStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h4 className="text-xl font-bold text-black mb-2">Select Your Classes</h4>
        <p className="text-gray-600">Add your current classes to get started with Orange</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h5 className="font-semibold text-blue-800 mb-2">Why add classes?</h5>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Find classmates in your courses</li>
          <li>• Create study groups with people in your classes</li>
          <li>• See who else is taking similar courses</li>
          <li>• Get your schedule organized from day one</li>
        </ul>
      </div>

      {selectedClasses.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h5 className="font-semibold text-green-800 mb-2">
            Selected Classes ({selectedClasses.length}) - {selectedClasses.length * 3}{" "}
            credits (estimated)
          </h5>
          <div className="space-y-2">
            {selectedClasses.map((cls) => (
              <div key={cls.id} className="flex justify-between items-center bg-green-100 rounded-lg p-2">
                <span className="text-green-800 font-medium">
                  {cls.subject} {cls.courseNumber}-{cls.section} - {cls.title}
                </span>
                <button
                  onClick={() => setSelectedClasses((prev) => prev.filter((c) => c.id !== cls.id))}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsClassModalOpen(true)}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all"
      >
        {selectedClasses.length > 0 ? "Modify Classes" : "Select Classes"}
      </button>

      <div className="flex gap-4">
        <button
          onClick={() => setCurrentStep("account")}
          className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleClassesStep}
          className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )


  const renderVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h4 className="text-xl font-bold text-black mb-2">Verify Your Schedule</h4>
        <p className="text-gray-600">Upload a screenshot of your class schedule to verify your classes</p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        {previewUrl ? (
          <div className="space-y-4">
            <img src={previewUrl} alt="Schedule preview" className="max-w-full max-h-64 mx-auto rounded-lg" />
            <button
              type="button"
              onClick={() => {
                setVerificationFile(null)
                setPreviewUrl("")
              }}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="verification-upload"
            />
            <label
              htmlFor="verification-upload"
              className="cursor-pointer inline-flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">Click to upload schedule screenshot</p>
              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
            </label>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          📝 <strong>Optional:</strong> You can skip this step and verify your schedule later from your dashboard.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setCurrentStep("classes")}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleVerificationStep}
          className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Skip for now
        </button>
        {verificationFile && (
          <button
            type="button"
            onClick={handleVerificationStep}
            className="flex-1 py-3 px-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Continue with verification
          </button>
        )}
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h4 className="text-2xl font-bold text-black mb-2">Welcome to Orange!</h4>
      <p className="text-gray-600 mb-6">Your account has been created successfully</p>

      <div className="bg-gray-50 rounded-xl p-4 text-left">
        <h5 className="font-semibold text-gray-800 mb-3">Account Summary:</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium">{formData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{formData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Student ID:</span>
            <span className="font-medium">{formData.studentId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Classes:</span>
            <span className="font-medium">{selectedClasses.length} selected</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleFinalSubmit}
        disabled={isLoading}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Creating Account..." : "Complete Registration"}
      </button>
    </div>
  )

  const renderEmailSentStep = () => {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h4 className="text-2xl font-bold text-black mb-2">Confirmation Email Sent!</h4>
        <p className="text-gray-600 mb-6">
          We sent an email to <strong>{formData.email}</strong>.
        </p>
        
        <div className="bg-blue-50 rounded-xl p-4 text-left">
          <h5 className="font-semibold text-blue-800 mb-3">Next Steps:</h5>
          <div className="text-sm text-blue-700 space-y-2">
            <p>1. Check your mailbox</p>
            <p>2. Click the 'Verify Email Address' button</p>
            <p>3. Your account will be automatically created and you'll be logged in</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left">
          <p className="text-sm text-yellow-700">
            <strong>If you don't receive the email:</strong><br />
            • Please check your spam folder<br />
            • Please click within 24 hours<br />
            • Please verify that your email address is correct
          </p>
        </div>

        <button
          onClick={onSwitchToLogin}
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
        >
          Return to Login Page
        </button>
      </div>
    )
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case "account":
        return "Create Account"
      case "classes":
        return "Select Classes"
      case "verification":
        return "Verify Schedule"
      case "complete":
        return "Complete Setup"
      case "email-sent":
        return "Check Your Email"
      default:
        return "Join Orange"
    }
  }

  const getStepNumber = () => {
    switch (currentStep) {
      case "account":
        return 1
      case "classes":
        return 2
      case "verification":
        return 3
      case "complete":
        return 4
      case "email-sent":
        return 5
      default:
        return 1
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <LoadingImage
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-7gl6pr8trbqDZFoBJ5QAJysuvuYLxa.png"
              alt="Orange Logo"
              className="w-16 h-16 mx-auto mb-4 rounded-xl shadow-lg"
            />
            <h1 className="text-3xl font-bold text-black mb-2">{getStepTitle()}</h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`w-6 h-2 rounded-full ${
                    step <= getStepNumber() ? "bg-black" : "bg-gray-200"
                  } transition-colors duration-200`}
                />
              ))}
            </div>
            <p className="text-gray-600">Step {getStepNumber()} of 5</p>
          </div>

          {currentStep === "account" && renderAccountStep()}
          {currentStep === "classes" && renderClassesStep()}
          {currentStep === "verification" && renderVerificationStep()}
          {currentStep === "complete" && renderCompleteStep()}
          {currentStep === "email-sent" && renderEmailSentStep()}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <button onClick={onSwitchToLogin} className="text-black font-semibold hover:underline">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>

      {isClassModalOpen && (
        <ClassSelectionModal
          isOpen={isClassModalOpen}
          onClose={() => setIsClassModalOpen(false)}
          onSubmit={(classes) => {
            setSelectedClasses(classes)
            setIsClassModalOpen(false)
          }}
          currentlySelected={selectedClasses}
        />
      )}
    </div>
  )
}