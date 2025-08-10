import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'
import type { ProfileVisit, UserRanking } from '@/types/visits'

const VISITS_FILE = path.join(process.cwd(), 'data', 'profile-visits.json')

function loadVisits(): ProfileVisit[] {
  try {
    if (fs.existsSync(VISITS_FILE)) {
      const data = fs.readFileSync(VISITS_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading visits:', error)
  }
  return []
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // 'week', 'month', 'all'
    
    // Load visits and users
    const visits = loadVisits()
    const users = await db.users.findAll()
    
    // Create user map for easy lookup
    const userMap = new Map()
    users.forEach(user => {
      userMap.set(user.id, user)
    })

    // Calculate time ranges
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Group visits by user
    const userVisitStats = new Map<string, {
      weeklyViews: number
      monthlyViews: number
      totalViews: number
      previousWeekViews: number
      previousMonthViews: number
    }>()

    visits.forEach(visit => {
      const visitDate = new Date(visit.timestamp)
      const userId = visit.visitedUserId
      
      if (!userVisitStats.has(userId)) {
        userVisitStats.set(userId, {
          weeklyViews: 0,
          monthlyViews: 0,
          totalViews: 0,
          previousWeekViews: 0,
          previousMonthViews: 0
        })
      }
      
      const stats = userVisitStats.get(userId)!
      
      // Total views (all time)
      stats.totalViews++
      
      // Weekly views (last 7 days)
      if (visitDate >= oneWeekAgo) {
        stats.weeklyViews++
      }
      
      // Monthly views (last 30 days)
      if (visitDate >= oneMonthAgo) {
        stats.monthlyViews++
      }
      
      // Previous week views (for trend calculation)
      if (visitDate >= twoWeeksAgo && visitDate < oneWeekAgo) {
        stats.previousWeekViews++
      }
      
      // Previous month views (for trend calculation)
      if (visitDate >= twoMonthsAgo && visitDate < oneMonthAgo) {
        stats.previousMonthViews++
      }
    })

    // Create rankings
    const rankings: UserRanking[] = []
    
    userVisitStats.forEach((stats, userId) => {
      const user = userMap.get(userId)
      if (!user) return // Skip if user doesn't exist anymore
      
      // Calculate trends
      const weeklyTrend = stats.weeklyViews > stats.previousWeekViews ? 'up' :
                         stats.weeklyViews < stats.previousWeekViews ? 'down' : 'same'
      
      const monthlyTrend = stats.monthlyViews > stats.previousMonthViews ? 'up' :
                          stats.monthlyViews < stats.previousMonthViews ? 'down' : 'same'
      
      rankings.push({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userAvatar: user.avatar,
        userYear: user.year,
        userMajor: user.major,
        weeklyViews: stats.weeklyViews,
        monthlyViews: stats.monthlyViews,
        totalViews: stats.totalViews,
        weeklyTrend,
        monthlyTrend
      })
    })

    // Sort based on period
    let sortedRankings: UserRanking[]
    switch (period) {
      case 'week':
        sortedRankings = rankings.sort((a, b) => b.weeklyViews - a.weeklyViews)
        break
      case 'month':
        sortedRankings = rankings.sort((a, b) => b.monthlyViews - a.monthlyViews)
        break
      default:
        sortedRankings = rankings.sort((a, b) => b.totalViews - a.totalViews)
    }

    return NextResponse.json({
      rankings: sortedRankings,
      period,
      totalUsers: rankings.length,
      totalVisits: visits.length
    })
  } catch (error) {
    console.error('Error getting rankings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}