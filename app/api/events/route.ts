import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { emailService } from '@/lib/email-service'
import { safeReadJsonFile, safeWriteJsonFile, ensureDataDirectory } from '@/lib/file-lock'
import path from 'path'
import { logger } from '@/lib/logger'
import { createEventSchema, validateRequestBody } from '@/lib/api-validations'

const EVENTS_FILE = path.join(process.cwd(), 'data', 'events.json')
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

// Safe file operations using locking
async function getEvents() {
  ensureDataDirectory()
  return await safeReadJsonFile(EVENTS_FILE, [])
}

async function saveEvents(events: any[]) {
  ensureDataDirectory()
  await safeWriteJsonFile(EVENTS_FILE, events)
}

async function getUsers() {
  return await safeReadJsonFile(USERS_FILE, [])
}

// GET /api/events - Get all events for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    logger.debug('User from token in events API:', user)
    
    if (!user) {
      logger.debug('No user found, returning unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allEvents = await getEvents()
    logger.debug('All events loaded:', allEvents.length)
    
    // Return events where user is creator, invitee, or attendee
    const userEvents = allEvents.filter((event: any) => 
      event.createdBy === user.id || 
      event.invitees?.includes(user.id) ||
      event.attendees?.some((a: any) => a.userId === user.id)
    )

    logger.debug('Filtered user events:', userEvents.length, 'for user:', user.id)

    return NextResponse.json({ 
      events: userEvents,
      success: true 
    })
  } catch (error) {
    logger.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    const { data: eventData, error } = await validateRequestBody(request, createEventSchema)
    if (error) {
      return NextResponse.json({ error: 'Invalid input', details: error }, { status: 400 })
    }
    const events = await getEvents()

    // Generate new event ID
    const newId = events.length > 0 ? Math.max(...events.map((e: any) => e.id)) + 1 : 1

    const newEvent = {
      id: newId,
      title: eventData.title,
      date: eventData.date,
      time: eventData.time,
      endTime: eventData.endTime || '',
      duration: eventData.duration || 1,
      location: eventData.location,
      description: eventData.description || '',
      invitees: eventData.invitees || [],
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      attendees: [],
      status: 'active'
    }

    events.push(newEvent)
    await saveEvents(events)

    // Send invitation emails to invitees
    if (eventData.invitees && eventData.invitees.length > 0) {
      try {
        const users = await getUsers()
        const inviteeEmails = eventData.invitees
          .map((inviteeId: string) => {
            const invitee = users.find((u: any) => u.id === inviteeId)
            return invitee ? invitee.email : null
          })
          .filter((email: string | null) => email !== null)

        if (inviteeEmails.length > 0) {
          const emailResults = await emailService.sendEventInvitation(
            inviteeEmails, 
            newEvent, 
            user.name
          )
          logger.info('Event invitation emails sent:', emailResults)
        }
      } catch (emailError) {
        logger.error('Failed to send invitation emails:', emailError)
        // Continue with event creation even if emails fail
      }
    }

    return NextResponse.json({ 
      event: newEvent,
      success: true,
      message: 'Event created successfully'
    })
  } catch (error) {
    logger.error('Error creating event:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}