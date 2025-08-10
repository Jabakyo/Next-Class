import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { emailService } from '@/lib/email-service'
import fs from 'fs'
import path from 'path'
import { logger } from '@/lib/logger'
import { 
  validateImageFile, 
  secureFileWrite, 
  generateSecureFileName 
} from '@/lib/file-security'
import { createErrorResponse } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const user = await db.users.findById(payload.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified or pending
    if (user.scheduleVerificationStatus === 'verified') {
      return NextResponse.json(
        { error: 'Schedule already verified' },
        { status: 400 }
      )
    }

    if (user.scheduleVerificationStatus === 'pending') {
      return NextResponse.json(
        { error: 'Verification already pending' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('screenshot') as File
    
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
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'verifications')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 })
    }

    // Generate secure filename
    const secureFilename = generateSecureFileName(user.id, validationResult.sanitizedName || file.name)
    const filepath = path.join(uploadsDir, secureFilename)
    
    // Save file securely
    await secureFileWrite(filepath, buffer)
    const screenshotUrl = `/uploads/verifications/${secureFilename}`

    // Update user verification status
    await db.users.update(user.id, {
      scheduleVerificationStatus: 'pending',
      verificationSubmittedAt: new Date().toISOString(),
      verificationScreenshot: screenshotUrl
    })

    // Create verification request for admin
    const verificationRequestsFile = path.join(process.cwd(), 'data', 'verification-requests.json')
    let requests = []
    
    if (fs.existsSync(verificationRequestsFile)) {
      const data = fs.readFileSync(verificationRequestsFile, 'utf8')
      requests = JSON.parse(data)
    }

    const newRequest = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      studentId: user.studentId,
      screenshotUrl: screenshotUrl,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      // Include current classes for comparison
      currentClasses: user.classes || [],
      previousClasses: user.previousClasses || [],
      classesChangedAt: user.classesChangedAt || null
    }

    requests.push(newRequest)
    fs.writeFileSync(verificationRequestsFile, JSON.stringify(requests, null, 2))

    // Send email notification to admin
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'
        : 'http://localhost:3000'
      
      const dashboardLink = `${baseUrl}/admin`
      
      await emailService.sendEmail(
        'tomimatk@dickinson.edu',
        'adminVerificationNotification',
        {
          userName: user.name,
          userEmail: user.email,
          studentId: user.studentId,
          submittedAt: newRequest.submittedAt,
          dashboardLink: dashboardLink
        }
      )
      
      logger.info('Admin notification email sent for verification request from:', user.email)
    } catch (emailError) {
      logger.error('Failed to send admin notification email:', emailError)
      // Continue with the request even if email fails
    }

    return NextResponse.json({
      message: 'Verification submitted successfully',
      status: 'pending'
    })
  } catch (error) {
    logger.error('Verification submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}