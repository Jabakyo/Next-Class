import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email-service'
import fs from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'
import { logger } from '@/lib/logger'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import { forgotPasswordSchema, validateRequestBody } from '@/lib/api-validations'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')
const RESET_TOKENS_FILE = path.join(process.cwd(), 'data', 'reset-tokens.json')

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return []
  }
  const data = fs.readFileSync(USERS_FILE, 'utf8')
  return JSON.parse(data)
}

function getResetTokens() {
  if (!fs.existsSync(RESET_TOKENS_FILE)) {
    return []
  }
  const data = fs.readFileSync(RESET_TOKENS_FILE, 'utf8')
  return JSON.parse(data)
}

function saveResetTokens(tokens: any[]) {
  const dataDir = path.dirname(RESET_TOKENS_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  fs.writeFileSync(RESET_TOKENS_FILE, JSON.stringify(tokens, null, 2))
}

// POST /api/auth/forgot-password - Send password reset email
export async function POST(request: NextRequest) {
  return withRateLimit(request, rateLimiters.passwordReset, async () => {
    try {
      // Validate request body
      const { data, error } = await validateRequestBody(request, forgotPasswordSchema)
      if (error) {
        return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
      }
      
      const { email } = data

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user exists
    const users = getUsers()
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      })
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store reset token
    const resetTokens = getResetTokens()
    
    // Remove any existing tokens for this user
    const filteredTokens = resetTokens.filter((token: any) => token.userId !== user.id)
    
    filteredTokens.push({
      token: resetToken,
      userId: user.id,
      email: user.email,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      used: false
    })

    saveResetTokens(filteredTokens)

    // Send reset email
    try {
      const emailResult = await emailService.sendPasswordReset(user.email, resetToken)
      logger.info('Password reset email sent:', emailResult)
      
      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to send email')
      }
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError)
      return NextResponse.json({ 
        error: 'Failed to send password reset email. Please try again later.' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    })
  } catch (error) {
    logger.error('Error in forgot password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  })
}