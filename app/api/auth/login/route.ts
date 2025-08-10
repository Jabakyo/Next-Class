import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, generateToken, sanitizeUser } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { ZodError } from 'zod'
import { logger } from '@/lib/logger'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  return withRateLimit(request, rateLimiters.auth, async () => {
    logger.debug('Login API called')
    try {
    const body = await request.json()
    logger.debug('Login request:', { email: body.email, hasPassword: !!body.password })
    
    // Validate input
    const validatedData = loginSchema.parse(body)
    const { email, password } = validatedData

    logger.debug('Looking for user:', email)
    const user = await db.users.findByEmail(email)

    if (!user) {
      logger.debug('User not found:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    logger.debug('User found:', { id: user.id, email: user.email })
    logger.debug('Verifying password...')
    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      logger.debug('Invalid password for user:', email)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    logger.debug('Password verified successfully')

    // Track login activity
    const loginActivity = {
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true
    }

    // Update user's activity data
    const updatedUser = {
      ...user,
      activity: {
        ...user.activity,
        lastLogin: loginActivity.timestamp,
        loginHistory: [
          loginActivity,
          ...(user.activity?.loginHistory || []).slice(0, 99) // Keep last 100 logins
        ],
        profileViews: user.activity?.profileViews || [],
        profileViewedBy: user.activity?.profileViewedBy || []
      }
    }

    // Save updated user data
    await db.users.update(user.id, updatedUser)

    const token = generateToken(user.id)
    const sanitizedUser = sanitizeUser(updatedUser)

    logger.debug('Generated token for user:', user.id)
    const response = NextResponse.json({
      user: sanitizedUser,
      token,
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }
    logger.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
  })
}