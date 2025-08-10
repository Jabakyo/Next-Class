import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'
import { requireOwner } from '@/lib/owner-auth'
import { logger } from '@/lib/logger'

export async function DELETE(request: NextRequest) {
  try {
    // Check owner authentication
    const authError = await requireOwner(request)
    if (authError) {
      return NextResponse.json(
        authError,
        { status: authError.status }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user data before deletion to clean up files
    const user = await db.users.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Clean up user's verification screenshot if exists
    if (user.verificationScreenshot) {
      try {
        const screenshotPath = path.join(process.cwd(), 'public', user.verificationScreenshot)
        await fs.unlink(screenshotPath)
      } catch (error) {
        logger.warn('Failed to delete verification screenshot:', error)
      }
    }

    // Delete user from database
    await db.users.delete(userId)

    // Also clean up verification requests for this user
    try {
      const verificationsPath = path.join(process.cwd(), 'data', 'verification-requests.json')
      const verificationsData = await fs.readFile(verificationsPath, 'utf8')
      const verifications = JSON.parse(verificationsData)
      
      const updatedVerifications = verifications.filter((v: any) => v.userId !== userId)
      await fs.writeFile(verificationsPath, JSON.stringify(updatedVerifications, null, 2))
    } catch (error) {
      logger.warn('Failed to clean up verification requests:', error)
    }

    return NextResponse.json({
      success: true,
      message: `User ${user.name} (${user.email}) has been deleted successfully`
    })
  } catch (error) {
    logger.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}