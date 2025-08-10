import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return []
  }
  const data = fs.readFileSync(USERS_FILE, 'utf8')
  return JSON.parse(data)
}

// GET /api/search/users - Search users with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q') || ''
    const selectedClass = searchParams.get('class') || 'All'
    const selectedTimeSlot = searchParams.get('timeSlot') || 'All'
    const selectedSubject = searchParams.get('subject') || 'All'
    const verificationFilter = searchParams.get('verification') || 'All'
    const limit = parseInt(searchParams.get('limit') || '50')

    const allUsers = getUsers()

    // Filter users based on criteria
    let filteredUsers = allUsers.filter((student: any) => {
      // Exclude current user and only include users with shared schedules
      if (student.id === user.id || !student.hasSharedSchedule) {
        return false
      }

      // Search term filter (name or email)
      const matchesSearch = searchTerm === '' ||
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      // Class filter
      if (selectedClass !== 'All') {
        const hasClass = student.classes?.some((cls: any) => 
          `${cls.subject} ${cls.courseNumber}-${cls.section}` === selectedClass
        )
        if (!hasClass) return false
      }

      // Subject filter
      if (selectedSubject !== 'All') {
        const hasSubject = student.classes?.some((cls: any) => cls.subject === selectedSubject)
        if (!hasSubject) return false
      }

      // Time slot filter
      if (selectedTimeSlot !== 'All') {
        const hasTimeSlot = student.classes?.some((cls: any) =>
          cls.meetingTimes?.some((meeting: any) => {
            const timeString = `${meeting.days.join(', ')} ${meeting.startTime}-${meeting.endTime}`
            return timeString === selectedTimeSlot
          })
        )
        if (!hasTimeSlot) return false
      }

      // Verification filter
      if (verificationFilter === 'Verified') {
        if (student.scheduleVerificationStatus !== 'verified') return false
      } else if (verificationFilter === 'Unverified') {
        if (student.scheduleVerificationStatus === 'verified') return false
      }

      return true
    })

    // Apply limit
    filteredUsers = filteredUsers.slice(0, limit)

    // Get available filter options
    const availableClasses = new Set<string>()
    const availableTimeSlots = new Set<string>()
    const availableSubjects = new Set<string>()

    allUsers.forEach((student: any) => {
      if (student.id !== user.id && student.hasSharedSchedule && student.classes) {
        student.classes.forEach((cls: any) => {
          availableSubjects.add(cls.subject)
          const classDisplay = `${cls.subject} ${cls.courseNumber}-${cls.section}`
          availableClasses.add(classDisplay)
          
          cls.meetingTimes?.forEach((meeting: any) => {
            const timeString = `${meeting.days.join(', ')} ${meeting.startTime}-${meeting.endTime}`
            availableTimeSlots.add(timeString)
          })
        })
      }
    })

    return NextResponse.json({
      success: true,
      users: filteredUsers,
      totalResults: filteredUsers.length,
      filters: {
        classes: Array.from(availableClasses).sort(),
        timeSlots: Array.from(availableTimeSlots).sort(),
        subjects: Array.from(availableSubjects).sort()
      },
      searchParams: {
        searchTerm,
        selectedClass,
        selectedTimeSlot,
        selectedSubject,
        verificationFilter
      }
    })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
  }
}