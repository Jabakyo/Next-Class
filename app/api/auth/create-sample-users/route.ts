import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Create a sample user for testing
    const sampleUser = await db.users.create({
      email: 'test@dickinson.edu',
      password: 'password123',
      name: 'Test User',
      studentId: '123456789',
      year: 'Senior',
      major: 'Computer Science',
      interests: ['Programming', 'AI', 'Web Development'],
      bio: 'A test user for the authentication system',
      avatar: '',
      socialLinks: {
        twitter: '',
        linkedin: '',
        github: '',
        instagram: ''
      },
      settings: {
        privacy: {
          showEmail: false,
          showSchedule: true,
          showInterests: true,
          showSocialLinks: true
        },
        notifications: {
          classUpdates: true,
          classmateRequests: true,
          scheduleChanges: true,
          newFeatures: false
        }
      },
      classes: [],
      points: 0,
      achievements: [],
    })

    return NextResponse.json({
      message: 'Sample user created successfully',
      email: sampleUser.email
    })
  } catch (error) {
    logger.error('Error creating sample user:', error)
    return NextResponse.json(
      { error: 'Failed to create sample user' },
      { status: 500 }
    )
  }
}