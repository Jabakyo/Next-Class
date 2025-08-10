import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import fs from 'fs'
import path from 'path'
import { logger } from '@/lib/logger'

const EVENTS_FILE = path.join(process.cwd(), 'data', 'events.json')

function getEvents() {
  if (!fs.existsSync(EVENTS_FILE)) {
    return []
  }
  const data = fs.readFileSync(EVENTS_FILE, 'utf8')
  return JSON.parse(data)
}

function saveEvents(events: any[]) {
  const dataDir = path.dirname(EVENTS_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2))
}

// POST /api/events/[id]/respond - Accept/Decline event invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json() // 'accepted', 'declined', 'pending'
    
    if (!['accepted', 'declined', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const events = getEvents()
    const eventIndex = events.findIndex((e: any) => e.id === parseInt(params.id))

    if (eventIndex === -1) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = events[eventIndex]

    // Check if user is invited
    if (!event.invitees?.includes(user.id)) {
      return NextResponse.json({ error: 'User not invited to this event' }, { status: 403 })
    }

    // Initialize attendees array if it doesn't exist
    if (!event.attendees) {
      event.attendees = []
    }

    // Find existing response or create new one
    const existingResponseIndex = event.attendees.findIndex((a: any) => a.userId === user.id)
    
    const responseData = {
      userId: user.id,
      status: status,
      respondedAt: new Date().toISOString()
    }

    if (existingResponseIndex >= 0) {
      // Update existing response
      event.attendees[existingResponseIndex] = responseData
    } else {
      // Add new response
      event.attendees.push(responseData)
    }

    events[eventIndex] = event
    saveEvents(events)

    return NextResponse.json({ 
      event,
      success: true,
      message: `Event invitation ${status}`
    })
  } catch (error) {
    logger.error('Error responding to event:', error)
    return NextResponse.json({ error: 'Failed to respond to event' }, { status: 500 })
  }
}