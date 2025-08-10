"use client"

import { useState, useEffect } from "react"
// Temporary icon replacements
const ArrowLeft = () => <span>←</span>
const Trophy = () => <span>⭐</span>
const Eye = () => <span>👁️</span>
const TrendingUp = () => <span>⭐</span>
const Medal = () => <span>⭐</span>
const Crown = () => <span>⭐</span>
const Award = () => <span>🏆</span>
const Shield = () => <span>🛡️</span>

import type { User } from "@/types/user"
import LoadingImage from "@/components/loading-image"

interface RankingPageProps {
  user: User
  onNavigateToDashboard: () => void
  onLogout: () => void
}

interface UserRanking {
  user: User
  viewCount: number
  rank: number
  trend: "up" | "down" | "same"
}

export default function RankingPage({ user, onNavigateToDashboard, onLogout }: RankingPageProps) {
  
  const [rankings, setRankings] = useState<UserRanking[]>([])
  const [timeFilter, setTimeFilter] = useState<"week" | "month">("week")

  useEffect(() => {
    // Load view counts from localStorage
    const viewCounts = JSON.parse(localStorage.getItem("scheduleViews") || "{}")
    const viewHistory = JSON.parse(localStorage.getItem("scheduleViewHistory") || "{}")
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]")

    console.log("All users loaded:", allUsers.length)
    console.log("View counts:", viewCounts)

    // Filter users who have shared schedules (excluding current user)
    const eligibleUsers = allUsers.filter((u: User) => u.id !== user.id && u.hasSharedSchedule)

    console.log("Eligible users for ranking:", eligibleUsers.length)

    // Calculate time-filtered view counts
    const getFilteredViewCount = (userId: string) => {
      const history = viewHistory[userId] || []
      const now = new Date()
      const cutoffDate = new Date()
      
      if (timeFilter === "week") {
        cutoffDate.setDate(now.getDate() - 7)
      } else if (timeFilter === "month") {
        cutoffDate.setMonth(now.getMonth() - 1)
      }
      
      // Count views within the time period
      const filteredViews = history.filter((viewTimestamp: string) => {
        const viewDate = new Date(viewTimestamp)
        return viewDate >= cutoffDate
      })
      
      return filteredViews.length
    }

    // Create rankings with time-filtered view counts
    const userRankings: UserRanking[] = eligibleUsers.map((u: User) => {
      const filteredViewCount = getFilteredViewCount(u.id)
      const totalViewCount = viewCounts[u.id] || 0
      
      return {
        user: u,
        viewCount: filteredViewCount,
        rank: 0, // Will be set after sorting
        trend: Math.random() > 0.5 ? "up" : Math.random() > 0.3 ? "down" : "same", // Mock trend data
      }
    })

    // Sort by view count (descending), then by name for consistent ordering
    userRankings.sort((a, b) => {
      if (b.viewCount !== a.viewCount) {
        return b.viewCount - a.viewCount
      }
      return a.user.name.localeCompare(b.user.name)
    })

    // Update ranks
    userRankings.forEach((ranking, index) => {
      ranking.rank = index + 1
    })

    console.log("Final rankings:", userRankings.length)
    setRankings(userRankings)
  }, [user.id, timeFilter])

  const filteredRankings = rankings

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">#{rank}</span>
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "down":
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
      default:
        return <div className="w-4 h-4" />
    }
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
    if (rank === 3) return "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
    if (rank <= 10) return "bg-gradient-to-r from-blue-400 to-blue-600 text-white"
    return "bg-gray-100 text-gray-700"
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <button onClick={onNavigateToDashboard} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <LoadingImage
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-7gl6pr8trbqDZFoBJ5QAJysuvuYLxa.png"
                alt="Orange Logo"
                className="w-12 h-12 rounded-xl shadow-lg shadow-gray-400"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Schedule Rankings
                </h1>
                <p className="text-sm text-gray-600">Most viewed student schedules</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl mb-8">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Time Period</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Top 3 Most Viewed */}
        {filteredRankings.length > 0 && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl mb-8">
            <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              Top 3 Most Viewed
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredRankings.slice(0, 3).map((ranking, index) => (
                <div
                  key={ranking.user.id}
                  className={`relative p-6 rounded-2xl border-2 text-center transition-all hover:shadow-lg ${
                    index === 0
                      ? "border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-100"
                      : index === 1
                      ? "border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100"
                      : "border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100"
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                          ? "bg-gray-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {ranking.rank}
                    </div>
                  </div>

                  {/* Rank Icon */}
                  <div className="mb-4">
                    {getRankIcon(ranking.rank)}
                  </div>

                  {/* User Avatar */}
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg">
                    {ranking.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>

                  {/* User Info */}
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-black mb-1">{ranking.user.name}</h3>
                    <p className="text-gray-600 text-sm">{ranking.user.classes?.length || 0} classes</p>
                  </div>

                  {/* View Count */}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-gray-500" />
                    <span className="font-bold text-2xl text-black">{ranking.viewCount}</span>
                    <span className="text-gray-500 text-sm">views</span>
                  </div>

                  {/* Trend */}
                  <div className="flex items-center justify-center gap-1">
                    {getTrendIcon(ranking.trend)}
                    <span
                      className={`text-xs font-medium ${
                        ranking.trend === "up"
                          ? "text-green-600"
                          : ranking.trend === "down"
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      {ranking.trend === "up" ? "Trending" : ranking.trend === "down" ? "Declining" : "Stable"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
