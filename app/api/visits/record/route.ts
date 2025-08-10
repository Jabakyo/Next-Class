import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import path from 'path'
import type { ProfileVisit } from '@/types/visits'
import { safeReadJson, safeWriteJson } from '@/lib/safe-file-ops'

const VISITS_FILE = path.join(process.cwd(), 'data', 'profile-visits.json')

export async function POST(request: NextRequest) {
  try {
    const { visitedUserId } = await request.json()
    
    if (!visitedUserId) {
      return NextResponse.json(
        { error: 'visitedUserId is required' },
        { status: 400 }
      )
    }

    // Get visitor info (optional - could be anonymous)
    let visitorUserId: string | undefined
    const authHeader = request.headers.get('authorization')
    let token: string | undefined
    
    // Try Authorization header first (Bearer token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      // Fallback to cookie
      token = request.cookies.get('auth-token')?.value
    }
    
    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        visitorUserId = payload.userId
        
        // Don't record self-visits
        if (visitorUserId === visitedUserId) {
          return NextResponse.json({ message: 'Self-visit not recorded' })
        }
      }
    }

    // Get visitor IP for anonymous tracking
    const visitorIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'

    // Load existing visits with safe file operations
    const visits = await safeReadJson<ProfileVisit[]>(VISITS_FILE, [])

    // Check for duplicate visits (same visitor to same profile within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const isDuplicate = visits.some(visit => 
      visit.visitedUserId === visitedUserId &&
      ((visitorUserId && visit.visitorUserId === visitorUserId) ||
       (!visitorUserId && visit.visitorIP === visitorIP)) &&
      new Date(visit.timestamp) > oneHourAgo
    )

    if (isDuplicate) {
      return NextResponse.json({ message: 'Duplicate visit within 1 hour, not recorded' })
    }

    // Create new visit record
    const newVisit: ProfileVisit = {
      id: Date.now().toString(),
      visitedUserId,
      visitorUserId,
      timestamp: new Date().toISOString(),
      visitorIP: visitorUserId ? undefined : visitorIP
    }

    visits.push(newVisit)
    await safeWriteJson(VISITS_FILE, visits)

    return NextResponse.json({
      message: 'Visit recorded successfully',
      visitId: newVisit.id
    })
  } catch (error) {
    console.error('Error recording visit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}