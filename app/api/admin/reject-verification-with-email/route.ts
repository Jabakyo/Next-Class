import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { emailService } from '@/lib/email-service'
import fs from 'fs'
import path from 'path'
import { logger } from '@/lib/logger'

const VERIFICATION_REQUESTS_FILE = path.join(process.cwd(), 'data', 'verification-requests.json')
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

function getVerificationRequests() {
  if (!fs.existsSync(VERIFICATION_REQUESTS_FILE)) {
    return []
  }
  const data = fs.readFileSync(VERIFICATION_REQUESTS_FILE, 'utf8')
  return JSON.parse(data)
}

function saveVerificationRequests(requests: any[]) {
  const dataDir = path.dirname(VERIFICATION_REQUESTS_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  fs.writeFileSync(VERIFICATION_REQUESTS_FILE, JSON.stringify(requests, null, 2))
}

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

// POST /api/admin/reject-verification-with-email - Reject verification and send email
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication and get admin user
    const adminError = await requireAdmin(request)
    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: adminError.status })
    }

    // Get admin user info
    const { getAdminFromToken } = await import('@/lib/admin-auth')
    const adminUser = await getAdminFromToken(request)
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin authentication failed' }, { status: 401 })
    }

    const { requestId, reason } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // Get verification request
    const requests = getVerificationRequests()
    const requestIndex = requests.findIndex((req: any) => req.id === requestId)

    if (requestIndex === -1) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 })
    }

    const verificationRequest = requests[requestIndex]

    // Update request status
    verificationRequest.status = 'rejected'
    verificationRequest.rejectedBy = adminUser.id
    verificationRequest.rejectedAt = new Date().toISOString()
    verificationRequest.rejectionReason = reason || 'No reason provided'

    // Update user verification status
    const users = getUsers()
    const userIndex = users.findIndex((u: any) => u.id === verificationRequest.userId)

    if (userIndex !== -1) {
      users[userIndex].scheduleVerificationStatus = 'rejected'
      users[userIndex].verificationRejectedAt = new Date().toISOString()
      users[userIndex].rejectionReason = reason
      saveUsers(users)

      // Send rejection email
      try {
        const emailResult = await emailService.sendVerificationRejected(
          users[userIndex].email, 
          reason
        )
        logger.info('Rejection email sent:', emailResult)
      } catch (emailError) {
        logger.error('Failed to send rejection email:', emailError)
        // Continue with rejection even if email fails
      }
    }

    // Save updated request
    requests[requestIndex] = verificationRequest
    saveVerificationRequests(requests)

    return NextResponse.json({
      success: true,
      message: 'Verification rejected and email sent',
      request: verificationRequest
    })
  } catch (error) {
    logger.error('Error rejecting verification:', error)
    return NextResponse.json({ error: 'Failed to reject verification' }, { status: 500 })
  }
}