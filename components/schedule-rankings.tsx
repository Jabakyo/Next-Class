"use client"

import { useState, useEffect } from "react"
// import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Eye, 
  Calendar,
  Users,
  Crown,
  Medal,
  Award,
  ChevronDown,
  ArrowLeft
} from "lucide-react"
// Temporary icon replacements
const Trophy = () => <span>⭐</span>
const TrendingUp = () => <span>⭐</span>
const TrendingDown = () => <span>⭐</span>
const Minus = () => <span>⭐</span>
const Eye = () => <span>👁️</span>
const Calendar = () => <span>📅</span>
const Users = () => <span>👥</span>
const Crown = () => <span>⭐</span>
const Medal = () => <span>⭐</span>
const Award = () => <span>🏆</span>
const ChevronDown = () => <span>⬇️</span>
const ArrowLeft = () => <span>←</span>

import type { UserRanking } from "@/types/visits"
import type { User } from "@/types/user"

interface ScheduleRankingsProps {
  user: User
  onNavigateToBrowse: () => void
  onNavigateToDashboard: () => void
}

export default function ScheduleRankings({ user, onNavigateToBrowse, onNavigateToDashboard }: ScheduleRankingsProps) {
  const [rankings, setRankings] = useState<UserRanking[]>([])
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week')
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVisits: 0
  })

  useEffect(() => {
    loadRankings()
  }, [period])

  const loadRankings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/visits/rankings?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setRankings(data.rankings)
        setStats({
          totalUsers: data.totalUsers,
          totalVisits: data.totalVisits
        })
      }
    } catch (error) {
      console.error('Error loading rankings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewProfile = (ranking: UserRanking) => {
    // Record the visit
    fetch('/api/visits/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ visitedUserId: ranking.userId })
    }).then(() => {
      // Navigate to profile view
      localStorage.setItem("selectedSearchUser", JSON.stringify({
        id: ranking.userId,
        name: ranking.userName,
        email: ranking.userEmail,
        avatar: ranking.userAvatar,
        year: ranking.userYear,
        major: ranking.userMajor
      }))
      onNavigateToBrowse()
    })
  }

  const getRankIcon = (index: number) => {
    switch (index + 1) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold">#{index + 1}</div>
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getViewCount = (ranking: UserRanking) => {
    switch (period) {
      case 'week':
        return ranking.weeklyViews
      case 'month':
        return ranking.monthlyViews
      default:
        return ranking.totalViews
    }
  }

  const getTrend = (ranking: UserRanking) => {
    switch (period) {
      case 'week':
        return ranking.weeklyTrend
      case 'month':
        return ranking.monthlyTrend
      default:
        return 'same'
    }
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'week':
        return 'This Week'
      case 'month':
        return 'This Month'
      default:
        return 'All Time'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onNavigateToDashboard}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">Schedule Rankings</h1>
                <p className="text-gray-600">Most viewed student schedules</p>
              </div>
            </div>
            
            {/* Period Selector */}
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'all')}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {rankings.length >= 3 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-black mb-2">🏆 Top 3 Most Viewed</h2>
            <p className="text-xl text-gray-600">{getPeriodLabel()}</p>
          </div>
          
          <div className="flex items-end justify-center gap-8 mb-16">
            {/* 2nd Place */}
            <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleViewProfile(rankings[1])}>
              <div className="bg-gray-400 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                2
              </div>
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-gray-400">
                {rankings[1]?.userAvatar ? (
                  <img
                    src={rankings[1].userAvatar}
                    alt={rankings[1].userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white font-bold text-xl">
                    {rankings[1]?.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-black text-center">{rankings[1]?.userName}</h3>
              <p className="text-gray-600 text-center">{rankings[1]?.userYear} • {rankings[1]?.userMajor}</p>
              <div className="bg-gray-100 px-4 py-2 rounded-full mt-2">
                <span className="text-lg font-bold text-black">{getViewCount(rankings[1])} views</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center transform scale-110 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleViewProfile(rankings[0])}>
              <div className="bg-yellow-500 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                👑
              </div>
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-yellow-500">
                {rankings[0]?.userAvatar ? (
                  <img
                    src={rankings[0].userAvatar}
                    alt={rankings[0].userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-yellow-600 flex items-center justify-center text-white font-bold text-2xl">
                    {rankings[0]?.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-black text-center">{rankings[0]?.userName}</h3>
              <p className="text-gray-600 text-center">{rankings[0]?.userYear} • {rankings[0]?.userMajor}</p>
              <div className="bg-yellow-100 px-6 py-3 rounded-full mt-2">
                <span className="text-xl font-bold text-black">{getViewCount(rankings[0])} views</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleViewProfile(rankings[2])}>
              <div className="bg-amber-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                3
              </div>
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-amber-600">
                {rankings[2]?.userAvatar ? (
                  <img
                    src={rankings[2].userAvatar}
                    alt={rankings[2].userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-amber-700 flex items-center justify-center text-white font-bold text-xl">
                    {rankings[2]?.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-black text-center">{rankings[2]?.userName}</h3>
              <p className="text-gray-600 text-center">{rankings[2]?.userYear} • {rankings[2]?.userMajor}</p>
              <div className="bg-amber-100 px-4 py-2 rounded-full mt-2">
                <span className="text-lg font-bold text-black">{getViewCount(rankings[2])} views</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-black">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-black">{stats.totalVisits.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Trending Up</p>
                <p className="text-2xl font-bold text-black">
                  {rankings.filter(r => getTrend(r) === 'up').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Period</p>
                <p className="text-2xl font-bold text-black">{getPeriodLabel()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rankings List */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-black">All Rankings</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete ranking list for {getPeriodLabel().toLowerCase()}
            </p>
          </div>
          
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading rankings...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">No Rankings Yet</h3>
              <p className="text-gray-600">Start viewing profiles to see rankings appear!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rankings.map((ranking, index) => (
                <div
                  key={ranking.userId}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleViewProfile(ranking)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex-shrink-0">
                        {index < 3 ? getRankIcon(index) : (
                          <div className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold">
                            #{index + 1}
                          </div>
                        )}
                      </div>
                      
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-black flex items-center justify-center">
                        {ranking.userAvatar ? (
                          <img
                            src={ranking.userAvatar}
                            alt={ranking.userName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {ranking.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div>
                        <h3 className="font-semibold text-black">{ranking.userName}</h3>
                        <p className="text-sm text-gray-600">
                          {ranking.userYear} • {ranking.userMajor}
                        </p>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span className="font-bold text-lg text-black">
                            {getViewCount(ranking).toLocaleString()}
                          </span>
                          {getTrendIcon(getTrend(ranking))}
                        </div>
                        <p className="text-xs text-gray-500">
                          {period === 'week' ? 'weekly' : period === 'month' ? 'monthly' : 'total'} views
                        </p>
                      </div>
                      
                      {/* View Profile Button */}
                      <div className="text-black hover:text-gray-700">
                        <Eye className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}