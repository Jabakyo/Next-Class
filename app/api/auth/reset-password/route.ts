import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { logger } from '@/lib/logger'
import { validatePassword } from '@/lib/password-security'
import { createErrorResponse } from '@/lib/api-error'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')
const RESET_TOKENS_FILE = path.join(process.cwd(), 'data', 'reset-tokens.json')

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

// GET /api/auth/reset-password?token=xxx - Verify reset token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 })
    }

    // Find and validate token
    const resetTokens = getResetTokens()
    const resetToken = resetTokens.find((t: any) => t.token === token && !t.used)

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    // Check if token is expired (24 hours)
    const tokenExpiry = new Date(resetToken.expiresAt)
    if (tokenExpiry < new Date()) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
    }

    // Token is valid
    return NextResponse.json({
      success: true,
      email: resetToken.email,
      message: 'Token is valid'
    })
  } catch (error) {
    logger.error('Error verifying reset token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/auth/reset-password - Reset password with token
export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return createErrorResponse('Token and new password are required', 400)
    }

    if (!token || typeof token !== 'string' || token.length < 32) {
      return createErrorResponse('Invalid token format', 400)
    }

    // Find and validate token
    const resetTokens = getResetTokens()
    const resetTokenIndex = resetTokens.findIndex((t: any) => t.token === token && !t.used)

    if (resetTokenIndex === -1) {
      // Use consistent timing to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100))
      return createErrorResponse('Invalid or expired reset token', 400)
    }

    const resetToken = resetTokens[resetTokenIndex]

    // Check if token is expired (24 hours)
    const tokenExpiry = new Date(resetToken.expiresAt)
    if (tokenExpiry < new Date()) {
      return createErrorResponse('Reset token has expired', 400)
    }

    // Find user and get their info for validation
    const users = getUsers()
    const userIndex = users.findIndex((u: any) => u.id === resetToken.userId)

    if (userIndex === -1) {
      return createErrorResponse('User not found', 404)
    }

    const user = users[userIndex]

    // Comprehensive password validation
    const passwordValidation = validatePassword(newPassword, {
      name: user.name,
      email: user.email,
      studentId: user.studentId
    })

    if (!passwordValidation.isValid) {
      return createErrorResponse(
        `Password does not meet security requirements: ${passwordValidation.errors.join(', ')}`,
        400
      )
    }

    // Hash new password with stronger salt rounds
    const hashedPassword = await bcrypt.hash(newPassword, 14)

    // Update user password
    users[userIndex].password = hashedPassword
    users[userIndex].passwordResetAt = new Date().toISOString()
    users[userIndex].passwordStrength = passwordValidation.strength
    saveUsers(users)

    // Mark token as used
    resetTokens[resetTokenIndex].used = true
    resetTokens[resetTokenIndex].usedAt = new Date().toISOString()
    saveResetTokens(resetTokens)

    logger.info(`Password reset successfully completed for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
      passwordStrength: passwordValidation.strength
    })
  } catch (error) {
    logger.error('Error resetting password:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    })
    return createErrorResponse('Internal server error', 500)
  }
}