import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import fs from 'fs'
import path from 'path'
import { logger } from '@/lib/logger'

interface User {
  id: string
  email: string
  name: string
  classes: any[]
  [key: string]: any
}

interface Course {
  subjectDescription: string
  title: string
  courseNumber: string
  section: string
  term: string
  linkedSections: string
  instructor: string
  meetingTimes: string
  scheduleType: string
  attribute: string
}

// Parse meeting times to extract days and times
function parseMeetingTimes(meetingTimes: string) {
  try {
    // Extract days and time from meeting times string
    // Example: "Monday,Wednesday,Friday 09:30 AM - 10:20 AM Type: Class Building: Denny Hall Room: 110"
    const parts = meetingTimes.split(' ')
    const daysPart = parts[0] // "Monday,Wednesday,Friday"
    const days = daysPart.split(',').map(day => day.trim())
    
    // Find time pattern (HH:MM AM/PM - HH:MM AM/PM)
    const timeMatch = meetingTimes.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/)
    
    if (timeMatch) {
      const startTime = timeMatch[1].replace(/\s/g, '')
      const endTime = timeMatch[2].replace(/\s/g, '')
      
      // Convert to 24-hour format for internal storage
      const convert12to24 = (time12h: string) => {
        const [time, modifier] = time12h.split(/([AP]M)/)
        let [hours, minutes] = time.split(':')
        if (hours === '12') {
          hours = '00'
        }
        if (modifier === 'PM') {
          hours = (parseInt(hours, 10) + 12).toString()
        }
        return `${hours.padStart(2, '0')}:${minutes}`
      }
      
      return [{
        days,
        startTime: convert12to24(startTime),
        endTime: convert12to24(endTime)
      }]
    }
    
    return []
  } catch (error) {
    logger.error('Error parsing meeting times:', error)
    return []
  }
}

// Extract room information from meeting times
function extractRoom(meetingTimes: string) {
  const roomMatch = meetingTimes.match(/Building:\s*([^,]+)\s*Room:\s*([^\s]+)/)
  if (roomMatch) {
    return `${roomMatch[1].trim()} ${roomMatch[2].trim()}`
  }
  return 'TBA'
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is trying to modify their own courses or if they're an admin
    if (user.id !== params.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { courseData } = body as { courseData: Course }

    // Read current users
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    const usersData = fs.readFileSync(usersPath, 'utf8')
    const users: User[] = JSON.parse(usersData)

    // Find the user
    const userIndex = users.findIndex(u => u.id === params.userId)
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create course entry for user's classes
    const courseId = `${courseData.subjectDescription.toLowerCase().replace(/[^a-z0-9]/g, '')}-${courseData.courseNumber}-${courseData.section}`
    
    // Check if course is already added
    const existingCourse = users[userIndex].classes.find(c => c.id === courseId)
    if (existingCourse) {
      return NextResponse.json({ error: 'Course already added' }, { status: 400 })
    }

    const newCourse = {
      id: courseId,
      subject: courseData.subjectDescription,
      courseNumber: courseData.courseNumber,
      section: courseData.section,
      crn: '', // We don't have CRN in our data
      term: courseData.term,
      title: courseData.title,
      instructor: courseData.instructor,
      meetingTimes: parseMeetingTimes(courseData.meetingTimes),
      room: extractRoom(courseData.meetingTimes),
      scheduleType: courseData.scheduleType,
      attribute: courseData.attribute
    }

    // Add course to user's classes
    users[userIndex].classes.push(newCourse)
    
    // If user was verified, reset verification status since schedule changed
    if (users[userIndex].scheduleVerificationStatus === 'verified') {
      // Store previous classes before changing
      users[userIndex].previousClasses = [...users[userIndex].classes]
      users[userIndex].classesChangedAt = new Date().toISOString()
      users[userIndex].scheduleVerificationStatus = 'none'
      users[userIndex].verificationScreenshot = null
      users[userIndex].verificationSubmittedAt = null
    }

    // Write back to file
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2))

    return NextResponse.json({ 
      message: 'Course added successfully',
      course: newCourse
    })

  } catch (error) {
    logger.error('Error adding course:', error)
    return NextResponse.json(
      { error: 'Failed to add course' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is trying to modify their own courses
    if (user.id !== params.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
    }

    // Read current users
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    const usersData = fs.readFileSync(usersPath, 'utf8')
    const users: User[] = JSON.parse(usersData)

    // Find the user
    const userIndex = users.findIndex(u => u.id === params.userId)
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove course from user's classes
    const courseIndex = users[userIndex].classes.findIndex(c => c.id === courseId)
    if (courseIndex === -1) {
      return NextResponse.json({ error: 'Course not found in user schedule' }, { status: 404 })
    }

    users[userIndex].classes.splice(courseIndex, 1)
    
    // If user was verified, reset verification status since schedule changed
    if (users[userIndex].scheduleVerificationStatus === 'verified') {
      // Store previous classes before changing
      users[userIndex].previousClasses = [...users[userIndex].classes]
      users[userIndex].classesChangedAt = new Date().toISOString()
      users[userIndex].scheduleVerificationStatus = 'none'
      users[userIndex].verificationScreenshot = null
      users[userIndex].verificationSubmittedAt = null
    }

    // Write back to file
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2))

    return NextResponse.json({ message: 'Course removed successfully' })

  } catch (error) {
    logger.error('Error removing course:', error)
    return NextResponse.json(
      { error: 'Failed to remove course' },
      { status: 500 }
    )
  }
}