import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken, sanitizeUser } from '@/lib/auth'
import { signupSchema } from '@/lib/validations'
import { ZodError } from 'zod'
import { emailService } from '@/lib/email-service'
import { safeReadJson, safeWriteJson } from '@/lib/safe-file-ops'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import path from 'path'
import type { EmailVerificationToken } from '@/types/verification'
import { logger } from '@/lib/logger'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import { validatePassword } from '@/lib/password-security'
import { createErrorResponse } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  return withRateLimit(request, rateLimiters.auth, async () => {
    logger.debug('Signup API called')
    try {
    const body = await request.json()
    logger.debug('Request body received:', {
      email: body.email,
      name: body.name,
      studentId: body.studentId,
      selectedClassesCount: body.selectedClasses?.length || 0
    })
    
    // Validate input
    const validatedData = signupSchema.parse(body)
    const { 
      email, 
      password, 
      name, 
      studentId,
      year, 
      major,
      interests,
      bio,
      avatar,
      socialLinks,
      settings,
      selectedClasses
    } = validatedData

    // Validate password strength before proceeding
    const passwordValidation = validatePassword(password, {
      name,
      email,
      studentId
    })

    if (!passwordValidation.isValid) {
      return createErrorResponse(
        `Password does not meet security requirements: ${passwordValidation.errors.join(', ')}`,
        400
      )
    }

    const existingUser = await db.users.findByEmail(email)
    if (existingUser) {
      return createErrorResponse('An account with this email already exists', 409)
    }

    // Check if there's already a pending verification for this email
    const TOKENS_FILE = path.join(process.cwd(), 'data', 'email-verification-tokens.json')
    const tokens = await safeReadJson<EmailVerificationToken[]>(TOKENS_FILE, [])
    const existingToken = tokens.find(t => t.email === email && !t.used && new Date(t.expiresAt) > new Date())
    
    if (existingToken) {
      return NextResponse.json(
        { error: 'A verification email has already been sent to this address. Please check your email.' },
        { status: 409 }
      )
    }

    // Hash the password before storing in token with stronger salt rounds
    const hashedPassword = await bcrypt.hash(password, 14)

    // Generate verification token and store user data
    logger.debug('Creating email verification token for:', email)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenData: EmailVerificationToken = {
      id: Date.now().toString(),
      email,
      token: verificationToken,
      userData: {
        name,
        studentId,
        password: hashedPassword,
        year: year || 'Freshman',
        major: major || 'Undeclared',
        selectedClasses: selectedClasses || []
      },
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      used: false
    }

    // Save token
    tokens.push(tokenData)
    await safeWriteJson(TOKENS_FILE, tokens)
    logger.debug('Token saved:', verificationToken.substring(0, 10) + '...')

    // Send verification email
    let emailSent = false
    let emailError = null
    logger.debug('Sending verification email to:', email)
    
    try {
      const emailResult = await emailService.sendEmailVerification(email, verificationToken)
      logger.debug('Email service result:', emailResult)
      emailSent = emailResult.success
      if (emailSent) {
        logger.info('Verification email sent successfully to:', email)
        logger.debug('Message ID:', emailResult.messageId)
      } else {
        logger.error('Email sending failed:', emailResult)
        emailError = emailResult.error || 'Unknown email error'
      }
    } catch (error) {
      logger.error('Exception while sending verification email:', error)
      logger.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
      emailError = error instanceof Error ? error.message : 'Email service exception'
    }

    return NextResponse.json({
      message: emailSent 
        ? 'Verification email sent successfully. Please check your email to complete registration.'
        : 'Account prepared but verification email could not be sent. Please contact support.',
      email: email,
      requiresVerification: true,
      emailSent: emailSent,
      ...(emailError && { emailError: emailError })
    })
  } catch (error) {
    logger.error('Signup API Error:', error)
    logger.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    if (error instanceof ZodError) {
      logger.error('Validation error:', error.errors)
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
  })
}