"use client"

import { useState, useEffect } from "react"
import OwnerLogin from "@/components/owner/owner-login"
import OwnerDashboard from "@/components/owner/owner-dashboard"

export default function OwnerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if owner is already authenticated
    const ownerToken = localStorage.getItem('owner-token')
    if (ownerToken) {
      // In a real app, you'd verify this token with the server
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (password: string) => {
    // Simple password check (in production, use proper authentication)
    const ownerPassword = "admin123" // You can change this password
    
    if (password === ownerPassword) {
      setIsAuthenticated(true)
      localStorage.setItem('owner-token', 'authenticated')
      return true
    }
    return false
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('owner-token')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return isAuthenticated ? (
    <OwnerDashboard onLogout={handleLogout} />
  ) : (
    <OwnerLogin onLogin={handleLogin} />
  )
}