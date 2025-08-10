import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getUserFromToken } from '@/lib/auth'
import fs from 'fs'
import path from 'path'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import { 
  validateImageFile, 
  secureFileWrite, 
  secureFileDelete, 
  createUploadPath 
} from '@/lib/file-security'
import { createErrorResponse } from '@/lib/api-error'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return []
  }
  const data = fs.readFileSync(USERS_FILE, 'utf8')
  return JSON.parse(data)
}

function saveUsers(users: any[]) {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

export async function POST(request: NextRequest) {
  return withRateLimit(request, rateLimiters.upload, async () => {
    try {
      const user = await getUserFromToken(request)
      if (!user) {
        return createErrorResponse('Unauthorized', 401)
      }

      const formData = await request.formData()
      const file = formData.get('avatar') as File
      
      if (!file) {
        return createErrorResponse('No file uploaded', 400)
      }

      if (!file.name || file.name.length === 0) {
        return createErrorResponse('Invalid file name', 400)
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Comprehensive file validation
      const validationResult = await validateImageFile(buffer, file.name, file.type)
      if (!validationResult.isValid) {
        return createErrorResponse(validationResult.error || 'File validation failed', 400)
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 })
      }

      // Delete old avatar if exists
      const users = getUsers()
      const currentUser = users.find((u: any) => u.id === user.id)
      if (currentUser?.avatar && currentUser.avatar.startsWith('/uploads/avatars/')) {
        const oldAvatarPath = path.join(process.cwd(), 'public', currentUser.avatar)
        await secureFileDelete(oldAvatarPath)
      }

      // Generate secure file path
      const { relativePath, absolutePath } = createUploadPath(user.id, validationResult.sanitizedName || file.name)
      
      // Save file securely
      await secureFileWrite(absolutePath, buffer)

      // Update user avatar in database
      const updatedUsers = users.map((u: any) => 
        u.id === user.id ? { ...u, avatar: relativePath } : u
      )
      saveUsers(updatedUsers)

      logger.info(`Avatar updated successfully for user ${user.id}`)

      return NextResponse.json({
        message: 'Avatar uploaded successfully',
        avatarUrl: relativePath,
        success: true
      })
    } catch (error) {
      logger.error('Avatar upload error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      })
      return createErrorResponse('Failed to upload avatar', 500)
    }
  })
}

// DELETE method to remove avatar
export async function DELETE(request: NextRequest) {
  return withRateLimit(request, rateLimiters.upload, async () => {
    try {
      const user = await getUserFromToken(request)
      if (!user) {
        return createErrorResponse('Unauthorized', 401)
      }

      const users = getUsers()
      const currentUser = users.find((u: any) => u.id === user.id)
      
      // Delete avatar file if exists
      if (currentUser?.avatar && currentUser.avatar.startsWith('/uploads/avatars/')) {
        const avatarPath = path.join(process.cwd(), 'public', currentUser.avatar)
        await secureFileDelete(avatarPath)
      }

      // Update user avatar in database (reset to empty)
      const updatedUsers = users.map((u: any) => 
        u.id === user.id ? { ...u, avatar: '' } : u
      )
      saveUsers(updatedUsers)

      logger.info(`Avatar removed successfully for user ${user.id}`)

      return NextResponse.json({
        message: 'Avatar removed successfully',
        success: true
      })
    } catch (error) {
      logger.error('Avatar removal error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      })
      return createErrorResponse('Failed to remove avatar', 500)
    }
  })
}