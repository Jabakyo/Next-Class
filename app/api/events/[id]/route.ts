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

// GET /api/events/[id] - Get specific event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const events = getEvents()
    const event = events.find((e: any) => e.id === parseInt(params.id))

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if user has access to this event
    const hasAccess = event.createdBy === user.id || 
                     event.invitees?.includes(user.id) ||
                     event.attendees?.some((a: any) => a.userId === user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ 
      event,
      success: true 
    })
  } catch (error) {
    logger.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

// PUT /api/events/[id] - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updateData = await request.json()
    const events = getEvents()
    const eventIndex = events.findIndex((e: any) => e.id === parseInt(params.id))

    if (eventIndex === -1) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = events[eventIndex]

    // Only event creator can update
    if (event.createdBy !== user.id) {
      return NextResponse.json({ error: 'Only event creator can update' }, { status: 403 })
    }

    // Update event data
    const updatedEvent = {
      ...event,
      title: updateData.title || event.title,
      date: updateData.date || event.date,
      time: updateData.time || event.time,
      location: updateData.location || event.location,
      description: updateData.description !== undefined ? updateData.description : event.description,
      invitees: updateData.invitees || event.invitees,
      updatedAt: new Date().toISOString()
    }

    events[eventIndex] = updatedEvent
    saveEvents(events)

    return NextResponse.json({ 
      event: updatedEvent,
      success: true,
      message: 'Event updated successfully'
    })
  } catch (error) {
    logger.error('Error updating event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

// DELETE /api/events/[id] - Cancel/Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const events = getEvents()
    const eventIndex = events.findIndex((e: any) => e.id === parseInt(params.id))

    if (eventIndex === -1) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = events[eventIndex]

    // Only event creator can delete
    if (event.createdBy !== user.id) {
      return NextResponse.json({ error: 'Only event creator can delete' }, { status: 403 })
    }

    // Mark as cancelled instead of deleting
    const cancelledEvent = {
      ...event,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelReason: 'Cancelled by creator'
    }

    events[eventIndex] = cancelledEvent
    saveEvents(events)

    return NextResponse.json({ 
      event: cancelledEvent,
      success: true,
      message: 'Event cancelled successfully'
    })
  } catch (error) {
    logger.error('Error cancelling event:', error)
    return NextResponse.json({ error: 'Failed to cancel event' }, { status: 500 })
  }
}