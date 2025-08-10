import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Get the auth token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the token and get viewer info
    const viewerId = verifyToken(token)
    if (!viewerId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { targetUserId } = await request.json()
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      )
    }

    // Don't track if user is viewing their own profile
    if (viewerId === targetUserId) {
      return NextResponse.json({ success: true })
    }

    // Get both users
    const [viewer, targetUser] = await Promise.all([
      db.users.findById(viewerId),
      db.users.findById(targetUserId)
    ])

    if (!viewer || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const timestamp = new Date().toISOString()

    // Update target user's profileViewedBy
    const updatedTargetUser = {
      ...targetUser,
      activity: {
        ...targetUser.activity,
        lastLogin: targetUser.activity?.lastLogin,
        loginHistory: targetUser.activity?.loginHistory || [],
        profileViews: targetUser.activity?.profileViews || [],
        profileViewedBy: [
          {
            viewedUserId: viewer.id,
            viewedUserName: viewer.name,
            viewedUserEmail: viewer.email,
            timestamp
          },
          ...(targetUser.activity?.profileViewedBy || []).slice(0, 99) // Keep last 100 views
        ]
      }
    }

    // Update viewer's profileViews
    const updatedViewer = {
      ...viewer,
      activity: {
        ...viewer.activity,
        lastLogin: viewer.activity?.lastLogin,
        loginHistory: viewer.activity?.loginHistory || [],
        profileViews: [
          {
            viewerId: targetUser.id,
            viewerName: targetUser.name,
            viewerEmail: targetUser.email,
            timestamp,
            duration: 0
          },
          ...(viewer.activity?.profileViews || []).slice(0, 99) // Keep last 100 views
        ],
        profileViewedBy: viewer.activity?.profileViewedBy || []
      }
    }

    // Save both updates
    await Promise.all([
      db.users.update(targetUser.id, updatedTargetUser),
      db.users.update(viewer.id, updatedViewer)
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error tracking profile view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}