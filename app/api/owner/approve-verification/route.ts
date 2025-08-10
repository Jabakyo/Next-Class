import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { requireOwner } from '@/lib/owner-auth'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Check owner authentication
    const authError = await requireOwner(request)
    if (authError) {
      return NextResponse.json(
        authError,
        { status: authError.status }
      )
    }
    
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
    const requestIndex = requests.findIndex((r: any) => r.id === requestId)
    if (requestIndex === -1) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Update request status
    requests[requestIndex] = {
      ...requests[requestIndex],
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'admin'
    }

    // Save updated requests
    fs.writeFileSync(verificationRequestsFile, JSON.stringify(requests, null, 2))

    // Update user's verification status
    const usersFile = path.join(process.cwd(), 'data', 'users.json')
    const usersData = fs.readFileSync(usersFile, 'utf8')
    const users = JSON.parse(usersData)
    
    const userIndex = users.findIndex((u: any) => u.id === requests[requestIndex].userId)
    if (userIndex !== -1) {
      users[userIndex].scheduleVerificationStatus = 'verified'
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2))
    }

    return NextResponse.json({ 
      message: 'Verification approved successfully',
      request: requests[requestIndex]
    })
  } catch (error) {
    logger.error('Error approving verification:', error)
    return NextResponse.json(
      { error: 'Failed to approve verification' },
      { status: 500 }
    )
  }
}