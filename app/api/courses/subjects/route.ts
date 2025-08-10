import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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

export async function GET() {
  try {
    // Read courses from the JSON file
    const coursesPath = path.join(process.cwd(), 'data', 'courses', 'courses.json')
    const coursesData = fs.readFileSync(coursesPath, 'utf8')
    const courses: Course[] = JSON.parse(coursesData)

    // Get unique subjects
    const subjects = [...new Set(courses.map(course => course.subjectDescription))]
      .sort()
      .map(subject => ({
        value: subject,
        label: subject
      }))

    return NextResponse.json({ subjects })

  } catch (error) {
    console.error('Error getting subjects:', error)
    return NextResponse.json(
      { error: 'Failed to get subjects' },
      { status: 500 }
    )
  }
}