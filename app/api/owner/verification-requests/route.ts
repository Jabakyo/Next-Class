import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { requireOwner } from '@/lib/owner-auth'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Check owner authentication
    const authError = await requireOwner(request)
    if (authError) {
      return NextResponse.json(
        authError,
        { status: authError.status }
      )
    }
    
    const verificationRequestsFile = path.join(process.cwd(), 'data', 'verification-requests.json')
    let requests = []
    
    if (fs.existsSync(verificationRequestsFile)) {
      const data = fs.readFileSync(verificationRequestsFile, 'utf8')
      requests = JSON.parse(data)
    }

    // Sort by most recent first
    requests.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

    return NextResponse.json({ requests })
  } catch (error) {
    logger.error('Error loading verification requests:', error)
    return NextResponse.json(
      { error: 'Failed to load verification requests' },
      { status: 500 }
    )
  }
}