import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    // Load verification requests
    const verificationRequestsFile = path.join(process.cwd(), 'data', 'verification-requests.json')
    let requests = []
    
    if (fs.existsSync(verificationRequestsFile)) {
      const data = fs.readFileSync(verificationRequestsFile, 'utf8')
      requests = JSON.parse(data)
    }

    // Find the request
    const request_index = requests.findIndex((r: any) => r.id === requestId)
    if (request_index === -1) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    const verificationRequest = requests[request_index]

    // Update the request status
    requests[request_index] = {
      ...verificationRequest,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'admin' // In a real app, you'd use the actual admin user
    }

    // Save updated requests
    fs.writeFileSync(verificationRequestsFile, JSON.stringify(requests, null, 2))

    // Update user verification status in database
    await db.users.update(verificationRequest.userId, {
      scheduleVerificationStatus: 'verified'
    })

    return NextResponse.json({
      message: 'Verification approved successfully'
    })
  } catch (error) {
    logger.error('Error approving verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}