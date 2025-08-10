import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Get current user to check verification status
    const currentUser = await db.users.findById(payload.userId)
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only include fields that are actually provided (not undefined)
    const updates: any = {}
    if (body.hasSharedSchedule !== undefined) {
      // Check if user is trying to share schedule without verification
      if (body.hasSharedSchedule && currentUser.scheduleVerificationStatus !== 'verified') {
        return NextResponse.json(
          { error: 'You must verify your schedule before sharing it with others' },
          { status: 403 }
        )
      }
      updates.hasSharedSchedule = body.hasSharedSchedule
    }
    if (body.classes !== undefined) updates.classes = body.classes
    if (body.name !== undefined) updates.name = body.name
    if (body.bio !== undefined) updates.bio = body.bio
    if (body.interests !== undefined) updates.interests = body.interests
    if (body.settings !== undefined) updates.settings = body.settings
    if (body.socialLinks !== undefined) updates.socialLinks = body.socialLinks

    const updatedUser = await db.users.update(payload.userId, updates)

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        studentId: updatedUser.studentId,
        year: updatedUser.year,
        major: updatedUser.major,
        interests: updatedUser.interests,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        socialLinks: updatedUser.socialLinks,
        settings: updatedUser.settings,
        classes: updatedUser.classes,
        points: updatedUser.points,
        achievements: updatedUser.achievements,
        hasSharedSchedule: updatedUser.hasSharedSchedule
      }
    })
  } catch (error) {
    logger.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}