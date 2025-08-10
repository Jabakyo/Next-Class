import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { ApiErrors } from './api-error'

// Get JWT secret with proper validation
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set. Application cannot start without proper authentication configuration.')
  }
  return secret
}

// Owner JWT secret - separate from user JWT for additional security
const getOwnerJWTSecret = () => {
  const secret = process.env.OWNER_JWT_SECRET || process.env.JWT_SECRET
  if (!secret) {
    throw new Error('OWNER_JWT_SECRET or JWT_SECRET environment variable is not set. Application cannot start without proper authentication configuration.')
  }
  return secret
}

// Get owner credentials from environment
const getOwnerCredentials = () => {
  const username = process.env.OWNER_USERNAME
  const password = process.env.OWNER_PASSWORD
  
  if (!username || !password) {
    throw new Error('OWNER_USERNAME and OWNER_PASSWORD environment variables must be set for owner authentication')
  }
  
  return { username, password }
}

interface OwnerTokenPayload {
  type: 'owner'
  username: string
  iat: number
  exp: number
}

/**
 * Generate a secure owner authentication token
 */
export function generateOwnerToken(username: string): string {
  const payload: Omit<OwnerTokenPayload, 'iat' | 'exp'> = {
    type: 'owner',
    username
  }
  
  return jwt.sign(payload, getOwnerJWTSecret(), {
    expiresIn: '24h' // Owner tokens expire after 24 hours
  })
}

/**
 * Verify owner credentials
 */
export function verifyOwnerCredentials(username: string, password: string): boolean {
  const { username: validUsername, password: validPassword } = getOwnerCredentials()
  return username === validUsername && password === validPassword
}

/**
 * Get owner from JWT token in request
 */
export async function getOwnerFromToken(request: NextRequest): Promise<OwnerTokenPayload | null> {
  try {
    const authHeader = request.headers.get('authorization')
    const ownerToken = request.headers.get('x-owner-token')
    
    // Support both Authorization Bearer and x-owner-token headers
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : ownerToken
    
    if (!token) {
      return null
    }
    
    const payload = jwt.verify(token, getOwnerJWTSecret()) as OwnerTokenPayload
    
    // Verify this is an owner token
    if (payload.type !== 'owner') {
      return null
    }
    
    return payload
  } catch (error) {
    return null
  }
}

/**
 * Middleware helper to require owner authentication
 */
export async function requireOwner(request: NextRequest) {
  const owner = await getOwnerFromToken(request)
  
  if (!owner) {
    return ApiErrors.UNAUTHORIZED
  }
  
  return null // No error, user is authenticated as owner
}

/**
 * Login endpoint for owner authentication
 */
export async function ownerLogin(username: string, password: string) {
  if (!verifyOwnerCredentials(username, password)) {
    return { error: 'Invalid credentials' }
  }
  
  const token = generateOwnerToken(username)
  return { token }
}