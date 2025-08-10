import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const ANALYTICS_FILE = path.join(process.cwd(), 'data', 'analytics.json')

interface ScheduleView {
  viewerUserId: string
  viewedUserId: string
  timestamp: string
}

interface AnalyticsData {
  scheduleViews: ScheduleView[]
  viewCounts: { [userId: string]: number }
  viewHistory: { [userId: string]: string[] }
}

// Ensure analytics data file exists
function ensureAnalyticsFile() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  if (!fs.existsSync(ANALYTICS_FILE)) {
    const initialData: AnalyticsData = {
      scheduleViews: [],
      viewCounts: {},
      viewHistory: {}
    }
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(initialData, null, 2))
  }
}

function getAnalyticsData(): AnalyticsData {
  ensureAnalyticsFile()
  const data = fs.readFileSync(ANALYTICS_FILE, 'utf8')
  return JSON.parse(data)
}

function saveAnalyticsData(data: AnalyticsData) {
  ensureAnalyticsFile()
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2))
}

// POST /api/analytics/schedule-view - Record a schedule view
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { viewedUserId } = await request.json()
    
    if (!viewedUserId) {
      return NextResponse.json({ error: 'viewedUserId is required' }, { status: 400 })
    }

    // Don't track self-views
    if (user.id === viewedUserId) {
      return NextResponse.json({ 
        success: true, 
        message: 'Self-view not tracked' 
      })
    }

    const analyticsData = getAnalyticsData()
    const timestamp = new Date().toISOString()

    // Add to detailed view history
    const newView: ScheduleView = {
      viewerUserId: user.id,
      viewedUserId: viewedUserId,
      timestamp: timestamp
    }
    analyticsData.scheduleViews.push(newView)

    // Update view counts
    if (!analyticsData.viewCounts[viewedUserId]) {
      analyticsData.viewCounts[viewedUserId] = 0
    }
    analyticsData.viewCounts[viewedUserId]++

    // Update view history for time-based filtering
    if (!analyticsData.viewHistory[viewedUserId]) {
      analyticsData.viewHistory[viewedUserId] = []
    }
    analyticsData.viewHistory[viewedUserId].push(timestamp)

    // Clean up old views (keep only last 1000 views per user to prevent infinite growth)
    if (analyticsData.viewHistory[viewedUserId].length > 1000) {
      analyticsData.viewHistory[viewedUserId] = analyticsData.viewHistory[viewedUserId].slice(-1000)
    }

    saveAnalyticsData(analyticsData)

    return NextResponse.json({ 
      success: true,
      message: 'Schedule view recorded',
      totalViews: analyticsData.viewCounts[viewedUserId]
    })
  } catch (error) {
    console.error('Error recording schedule view:', error)
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 })
  }
}

// GET /api/analytics/schedule-view - Get view analytics
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')
    const period = searchParams.get('period') || 'all' // 'week', 'month', 'all'

    const analyticsData = getAnalyticsData()

    if (targetUserId) {
      // Get views for specific user
      let viewHistory = analyticsData.viewHistory[targetUserId] || []
      
      // Filter by time period
      if (period !== 'all') {
        const now = new Date()
        const cutoffDate = new Date()
        
        if (period === 'week') {
          cutoffDate.setDate(now.getDate() - 7)
        } else if (period === 'month') {
          cutoffDate.setMonth(now.getMonth() - 1)
        }
        
        viewHistory = viewHistory.filter(timestamp => 
          new Date(timestamp) >= cutoffDate
        )
      }

      return NextResponse.json({
        success: true,
        userId: targetUserId,
        period: period,
        viewCount: viewHistory.length,
        totalViews: analyticsData.viewCounts[targetUserId] || 0
      })
    } else {
      // Get all view counts
      return NextResponse.json({
        success: true,
        viewCounts: analyticsData.viewCounts,
        viewHistory: analyticsData.viewHistory
      })
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}