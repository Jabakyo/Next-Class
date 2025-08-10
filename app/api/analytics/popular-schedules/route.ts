import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const ANALYTICS_FILE = path.join(process.cwd(), 'data', 'analytics.json')
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

interface AnalyticsData {
  scheduleViews: any[]
  viewCounts: { [userId: string]: number }
  viewHistory: { [userId: string]: string[] }
}

function getAnalyticsData(): AnalyticsData {
  if (!fs.existsSync(ANALYTICS_FILE)) {
    return {
      scheduleViews: [],
      viewCounts: {},
      viewHistory: {}
    }
  }
  const data = fs.readFileSync(ANALYTICS_FILE, 'utf8')
  return JSON.parse(data)
}

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return []
  }
  const data = fs.readFileSync(USERS_FILE, 'utf8')
  return JSON.parse(data)
}

// GET /api/analytics/popular-schedules - Get most viewed schedules
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // 'week', 'month', 'all'
    const limit = parseInt(searchParams.get('limit') || '10')

    const analyticsData = getAnalyticsData()
    const users = getUsers()

    // Calculate time-filtered view counts
    const now = new Date()
    const cutoffDate = new Date()
    
    if (period === 'week') {
      cutoffDate.setDate(now.getDate() - 7)
    } else if (period === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1)
    }

    const userRankings = []

    // Get eligible users (exclude current user, include only those with shared schedules)
    const eligibleUsers = users.filter((u: any) => 
      u.id !== user.id && u.hasSharedSchedule
    )

    for (const targetUser of eligibleUsers) {
      let viewCount = 0
      
      if (period === 'all') {
        viewCount = analyticsData.viewCounts[targetUser.id] || 0
      } else {
        // Count views within time period
        const viewHistory = analyticsData.viewHistory[targetUser.id] || []
        viewCount = viewHistory.filter(timestamp => 
          new Date(timestamp) >= cutoffDate
        ).length
      }

      userRankings.push({
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          year: targetUser.year,
          major: targetUser.major,
          classes: targetUser.classes || [],
          scheduleVerificationStatus: targetUser.scheduleVerificationStatus
        },
        viewCount: viewCount,
        rank: 0, // Will be set after sorting
        trend: Math.random() > 0.5 ? "up" : Math.random() > 0.3 ? "down" : "same" // Mock trend data
      })
    }

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

    // Apply limit
    const limitedRankings = userRankings.slice(0, limit)

    return NextResponse.json({
      success: true,
      period: period,
      rankings: limitedRankings,
      total: userRankings.length,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching popular schedules:', error)
    return NextResponse.json({ error: 'Failed to fetch popular schedules' }, { status: 500 })
  }
}