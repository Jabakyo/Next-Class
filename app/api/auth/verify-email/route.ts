import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken, sanitizeUser } from '@/lib/auth'
import { safeReadJson, safeWriteJson } from '@/lib/safe-file-ops'
import path from 'path'
import type { EmailVerificationToken } from '@/types/verification'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Load tokens
    const TOKENS_FILE = path.join(process.cwd(), 'data', 'email-verification-tokens.json')
    const tokens = await safeReadJson<EmailVerificationToken[]>(TOKENS_FILE, [])
    
    // Find the token
    const tokenData = tokens.find(t => t.token === token && !t.used)
    
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date(tokenData.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Verification token has expired. Please sign up again.' },
        { status: 400 }
      )
    }

    // Check if user already exists (in case of race condition)
    const existingUser = await db.users.findByEmail(tokenData.email)
    if (existingUser) {
      // Mark token as used
      tokenData.used = true
      await safeWriteJson(TOKENS_FILE, tokens)
      
      return NextResponse.json(
        { error: 'This email has already been registered' },
        { status: 409 }
      )
    }

    // Create the user account
    const user = await db.users.create({
      email: tokenData.email,
      password: tokenData.userData.password, // Already hashed
      name: tokenData.userData.name,
      studentId: tokenData.userData.studentId,
      year: tokenData.userData.year,
      major: tokenData.userData.major,
      interests: [],
      bio: '',
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
      classes: tokenData.userData.selectedClasses || [],
      points: 0,
      achievements: [],
      hasSharedSchedule: tokenData.userData.selectedClasses && tokenData.userData.selectedClasses.length > 0
    })

    // Mark token as used
    tokenData.used = true
    await safeWriteJson(TOKENS_FILE, tokens)

    // Generate auth token for immediate login
    const authToken = generateToken(user.id)
    const sanitizedUser = sanitizeUser(user)

    const response = NextResponse.json({
      message: 'Email verified successfully. Your account has been created.',
      user: sanitizedUser,
      token: authToken,
    })

    // Set auth cookie
    response.cookies.set('auth-token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    logger.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}