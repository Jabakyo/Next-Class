import { NextRequest } from 'next/server'
import { getUserFromToken } from './auth'
import { ApiErrors } from './api-error'

// Define admin user IDs and emails from environment variables only
const getAdminUsers = (): string[] => {
  const adminUsers = process.env.ADMIN_USERS
  if (!adminUsers) {
    throw new Error('ADMIN_USERS environment variable is not set. Please set it with comma-separated admin emails/IDs.')
  }
  return adminUsers.split(',').map(u => u.trim()).filter(u => u.length > 0)
}

const ADMIN_USERS = getAdminUsers()

/**
 * Check if a user is an admin
 */
export function isUserAdmin(user: { id: string; email: string }): boolean {
  return ADMIN_USERS.includes(user.id) || ADMIN_USERS.includes(user.email)
}

/**
 * Get admin user from request token
 * Returns user if authenticated and is admin, null otherwise
 */
export async function getAdminFromToken(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return null
    }

    if (!isUserAdmin(user)) {
      console.warn(`Non-admin user ${user.email} attempted to access admin endpoint`)
      return null
    }

    return user
  } catch (error) {
    console.error('Admin authentication error:', error)
    return null
  }
}

/**
 * Middleware helper to check admin access
 * Returns error object if not admin, null if admin
 */
export async function requireAdmin(request: NextRequest) {
  const admin = await getAdminFromToken(request)
  
  if (!admin) {
    return ApiErrors.FORBIDDEN
  }

  return null // No error, user is admin
}