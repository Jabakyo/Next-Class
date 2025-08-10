import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const NOTIFICATIONS_FILE = path.join(process.cwd(), 'data', 'notifications-status.json')

interface NotificationStatus {
  [userId: string]: string[] // Array of read notification IDs
}

// Ensure notifications status file exists
function ensureNotificationsFile() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  if (!fs.existsSync(NOTIFICATIONS_FILE)) {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify({}))
  }
}

function getNotificationStatus(): NotificationStatus {
  ensureNotificationsFile()
  const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf8')
  return JSON.parse(data)
}

function saveNotificationStatus(status: NotificationStatus) {
  ensureNotificationsFile()
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(status, null, 2))
}

// POST /api/notifications/mark-read - Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationIds, markAll = false } = await request.json()
    
    if (!markAll && (!notificationIds || !Array.isArray(notificationIds))) {
      return NextResponse.json({ error: 'notificationIds array is required' }, { status: 400 })
    }

    const notificationStatus = getNotificationStatus()
    
    if (!notificationStatus[user.id]) {
      notificationStatus[user.id] = []
    }

    if (markAll) {
      // Mark all current notifications as read
      // This would typically be called with the current notification IDs from the frontend
      const allNotificationIds = notificationIds || []
      notificationStatus[user.id] = [...new Set([...notificationStatus[user.id], ...allNotificationIds])]
    } else {
      // Mark specific notifications as read
      const newReadIds = notificationIds.filter((id: string) => 
        !notificationStatus[user.id].includes(id)
      )
      notificationStatus[user.id] = [...notificationStatus[user.id], ...newReadIds]
    }

    // Limit to last 1000 read notifications to prevent unbounded growth
    if (notificationStatus[user.id].length > 1000) {
      notificationStatus[user.id] = notificationStatus[user.id].slice(-1000)
    }

    saveNotificationStatus(notificationStatus)

    return NextResponse.json({
      success: true,
      message: markAll ? 'All notifications marked as read' : 'Notifications marked as read',
      readNotifications: notificationStatus[user.id]
    })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
  }
}

// GET /api/notifications/mark-read - Get read notification status
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notificationStatus = getNotificationStatus()
    const userReadNotifications = notificationStatus[user.id] || []

    return NextResponse.json({
      success: true,
      readNotifications: userReadNotifications
    })
  } catch (error) {
    console.error('Error fetching notification status:', error)
    return NextResponse.json({ error: 'Failed to fetch notification status' }, { status: 500 })
  }
}