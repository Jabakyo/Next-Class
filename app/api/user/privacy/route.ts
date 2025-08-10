import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return []
  }
  const data = fs.readFileSync(USERS_FILE, 'utf8')
  return JSON.parse(data)
}

function saveUsers(users: any[]) {
  const dataDir = path.dirname(USERS_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

// GET /api/user/privacy - Get user privacy settings
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = getUsers()
    const currentUser = users.find((u: any) => u.id === user.id)

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const privacy = currentUser.settings?.privacy || {
      showEmail: false,
      showSchedule: true,
      showSocialLinks: true
    }

    return NextResponse.json({
      success: true,
      privacy
    })
  } catch (error) {
    console.error('Error fetching privacy settings:', error)
    return NextResponse.json({ error: 'Failed to fetch privacy settings' }, { status: 500 })
  }
}

// PUT /api/user/privacy - Update user privacy settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const privacyUpdates = await request.json()

    const users = getUsers()
    const userIndex = users.findIndex((u: any) => u.id === user.id)

    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentUser = users[userIndex]

    // Initialize settings if they don't exist
    if (!currentUser.settings) {
      currentUser.settings = {}
    }
    if (!currentUser.settings.privacy) {
      currentUser.settings.privacy = {
        showEmail: false,
        showSchedule: true,
        showSocialLinks: true
      }
    }

    // Update privacy settings
    currentUser.settings.privacy = {
      ...currentUser.settings.privacy,
      ...privacyUpdates
    }

    currentUser.updatedAt = new Date().toISOString()
    users[userIndex] = currentUser
    saveUsers(users)

    return NextResponse.json({
      success: true,
      message: 'Privacy settings updated successfully',
      privacy: currentUser.settings.privacy
    })
  } catch (error) {
    console.error('Error updating privacy settings:', error)
    return NextResponse.json({ error: 'Failed to update privacy settings' }, { status: 500 })
  }
}