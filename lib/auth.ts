import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { User } from '@/types/user'
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

// Get JWT secret with proper validation
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set. Application cannot start without proper authentication configuration.')
  }
  return secret
}

const JWT_SECRET = getJWTSecret()
const SALT_ROUNDS = 14

export interface TokenValidationError {
  type: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'MALFORMED_TOKEN' | 'USER_NOT_FOUND'
  message: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    if (!decoded.userId || typeof decoded.userId !== 'string') {
      logger.warn('Invalid token payload structure')
      return null
    }
    
    return decoded
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('JWT verification failed', { 
        name: error.name,
        message: error.message
      })
    } else if (error instanceof jwt.TokenExpiredError) {
      logger.info('Token expired', { expiredAt: error.expiredAt })
    } else if (error instanceof jwt.NotBeforeError) {
      logger.warn('Token not active', { date: error.date })
    } else {
      logger.error('Unexpected token verification error', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    return null
  }
}

export function sanitizeUser(user: User & { password?: string }): User {
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

// Helper function to extract token from request (supports both Bearer and Cookie)
export function getTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Fallback to cookie
  const cookieToken = request.cookies.get('auth-token')?.value
  return cookieToken || null
}

// Helper function to get user from JWT token in request
export async function getUserFromToken(request: NextRequest): Promise<User | null> {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return null
    }
    
    if (token.length < 10 || token.length > 1000) {
      logger.warn('Token length outside expected range')
      return null
    }
    
    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }

    // Load users from file with better error handling
    const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')
    if (!fs.existsSync(USERS_FILE)) {
      logger.error('Users file does not exist')
      return null
    }

    const usersData = fs.readFileSync(USERS_FILE, 'utf8')
    const users = JSON.parse(usersData)
    
    if (!Array.isArray(users)) {
      logger.error('Users data is not an array')
      return null
    }
    
    const user = users.find((u: any) => u.id === decoded.userId)
    
    if (!user) {
      logger.warn('User not found for token', { userId: decoded.userId })
      return null
    }
    
    return sanitizeUser(user)
  } catch (error) {
    logger.error('Error getting user from token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    })
    return null
  }
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashTokenWithTimestamp(token: string): string {
  const timestamp = Date.now()
  return crypto.createHash('sha256').update(`${token}:${timestamp}`).digest('hex')
}

export function isValidTokenFormat(token: string): boolean {
  const tokenPattern = /^[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+$/
  return tokenPattern.test(token)
}