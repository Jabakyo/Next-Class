"use client"

import { useState, useEffect } from "react"
import LoginPage from "@/components/auth/login-page"
import SignupPage from "@/components/auth/signup-page"
import Dashboard from "@/components/dashboard"
import BrowseSchedules from "@/components/browse-schedules"
import ScheduleRankings from "@/components/schedule-rankings"
import AdminPanel from "@/components/admin-panel"
import CoursesPage from "./courses/page"
import type { User } from "@/types/user"

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState<"login" | "signup" | "dashboard" | "browse" | "rankings" | "admin" | "courses">("login")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in via API
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setCurrentUser(data.user)
          setCurrentPage("dashboard")
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Clear any invalid tokens
        localStorage.removeItem('auth-token')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  const handleLogin = (user: User) => {
    setCurrentUser(user)
    setCurrentPage("dashboard")
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setCurrentUser(null)
      localStorage.removeItem('auth-token')
      setCurrentPage("login")
    }
  }

  const handleSignup = (user: User) => {
    setCurrentUser(user)
    setCurrentPage("dashboard")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading Orange Platform...</div>
      </div>
    )
  }

  // Add a quick test button for development
  const handleQuickTest = () => {
    const testUser = {
      id: "test-user",
      name: "Test Student",
      email: "test.student@dickinson.edu",
      isVerified: true,
      hasSharedSchedule: true,
      selectedClasses: [
        {
          id: "math151",
          courseCode: "MATH 151",
          courseName: "Calculus I",
          professor: "Dr. Johnson",
          credits: 4,
          meetingTimes: [{ days: ["Monday", "Wednesday", "Friday"], startTime: "09:00", endTime: "10:00" }],
          room: "Math Building 105",
        },
      ],
    }
    handleLogin(testUser)
  }

  if (!currentUser) {
    return currentPage === "login" ? (
      <LoginPage onLogin={handleLogin} onSwitchToSignup={() => setCurrentPage("signup")} />
    ) : (
      <SignupPage onSignup={handleSignup} onSwitchToLogin={() => setCurrentPage("login")} />
    )
  }

  return (
    <>
      {currentPage === "dashboard" ? (
        <Dashboard
          user={currentUser}
          onLogout={handleLogout}
          onNavigateToBrowse={() => setCurrentPage("browse")}
          onNavigateToRankings={() => setCurrentPage("rankings")}
          onNavigateToAdmin={() => setCurrentPage("admin")}
          onNavigateToCourses={() => setCurrentPage("courses")}
          onUpdateUser={setCurrentUser}
        />
      ) : currentPage === "browse" ? (
        <BrowseSchedules
          user={currentUser}
          onNavigateToDashboard={() => setCurrentPage("dashboard")}
          onLogout={handleLogout}
        />
      ) : currentPage === "rankings" ? (
        <ScheduleRankings
          user={currentUser}
          onNavigateToBrowse={() => setCurrentPage("browse")}
          onNavigateToDashboard={() => setCurrentPage("dashboard")}
        />
      ) : currentPage === "courses" ? (
        <CoursesPage />
      ) : (
        <AdminPanel
          onNavigateToDashboard={() => setCurrentPage("dashboard")}
        />
      )}
    </>
  )
}
