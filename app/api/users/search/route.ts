import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireOwner } from '@/lib/owner-auth'
import { userSearchSchema, validateRequestBody } from '@/lib/api-validations'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const { data, error } = await validateRequestBody(request, userSearchSchema)
    if (error) {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    
    const { query } = data
    
    // Get all users from database
    const allUsers = await db.users.findAll()
    
    // Filter users based on search query
    const filteredUsers = allUsers
      .filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      )
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        hasSharedSchedule: user.hasSharedSchedule,
        scheduleVerificationStatus: user.scheduleVerificationStatus,
        year: user.year,
        major: user.major
      }))

    return NextResponse.json({
      users: filteredUsers
    })
  } catch (error) {
    logger.error('Error searching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check owner authentication
    const authError = await requireOwner(request)
    if (authError) {
      return NextResponse.json(
        authError,
        { status: authError.status }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all')
    
    // Get all users from database
    const allUsers = await db.users.findAll()
    
    // Return full user data for owner
    const users = allUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      year: user.year,
      major: user.major,
      classes: user.classes || [],
      hasSharedSchedule: user.hasSharedSchedule,
      scheduleVerificationStatus: user.scheduleVerificationStatus,
      verificationSubmittedAt: user.verificationSubmittedAt,
      verificationScreenshot: user.verificationScreenshot,
      points: user.points || 0,
      achievements: user.achievements || [],
      interests: user.interests || [],
      bio: user.bio || '',
      avatar: user.avatar || '',
      socialLinks: user.socialLinks || {},
      settings: user.settings || {},
      activity: user.activity || {
        lastLogin: null,
        loginHistory: [],
        profileViews: [],
        profileViewedBy: []
      }
    }))

    return NextResponse.json({
      users: users
    })
  } catch (error) {
    logger.error('Error getting all users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}