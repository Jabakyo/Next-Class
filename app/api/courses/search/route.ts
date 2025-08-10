import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''
    const subject = searchParams.get('subject')?.toLowerCase() || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Read courses from the JSON file
    const coursesPath = path.join(process.cwd(), 'data', 'courses', 'courses.json')
    const coursesData = fs.readFileSync(coursesPath, 'utf8')
    const courses: Course[] = JSON.parse(coursesData)

    // Enhanced search logic for better keyword matching
    let filteredCourses = courses.filter(course => {
      if (query === '') {
        // If no query, just filter by subject
        const matchesSubject = subject === '' || 
          course.subjectDescription.toLowerCase().includes(subject)
        return matchesSubject
      }

      // Split query into individual words for better matching
      const queryWords = query.split(' ').filter(word => word.length > 0)
      
      // Check if any query word matches any of these fields
      const matchesQuery = queryWords.some(word => {
        return (
          // Subject/department name (e.g., "math" matches "Mathematics")
          course.subjectDescription.toLowerCase().includes(word) ||
          // Course title (e.g., "calculus" matches "Calculus I")
          course.title.toLowerCase().includes(word) ||
          // Course number (e.g., "151" matches "151")
          course.courseNumber.toLowerCase().includes(word) ||
          // Instructor name (e.g., "smith" matches "Dr. Smith")
          course.instructor.toLowerCase().includes(word) ||
          // Section (e.g., "01" matches "01")
          course.section.toLowerCase().includes(word) ||
          // Meeting times (e.g., "mwf" or "monday" matches meeting patterns)
          course.meetingTimes.toLowerCase().includes(word) ||
          // Schedule type (e.g., "lecture" matches "Lecture")
          course.scheduleType.toLowerCase().includes(word) ||
          // Attributes (e.g., "lab" matches laboratory courses)
          course.attribute.toLowerCase().includes(word)
        )
      })
      
      const matchesSubject = subject === '' || 
        course.subjectDescription.toLowerCase().includes(subject)
      
      return matchesQuery && matchesSubject
    })

    // Enhanced sorting for better relevance
    filteredCourses.sort((a, b) => {
      if (query) {
        const queryLower = query.toLowerCase()
        
        // Prioritize exact subject matches
        const aSubjectMatch = a.subjectDescription.toLowerCase().includes(queryLower)
        const bSubjectMatch = b.subjectDescription.toLowerCase().includes(queryLower)
        
        if (aSubjectMatch && !bSubjectMatch) return -1
        if (!aSubjectMatch && bSubjectMatch) return 1
        
        // Then prioritize title matches
        const aTitleMatch = a.title.toLowerCase().includes(queryLower)
        const bTitleMatch = b.title.toLowerCase().includes(queryLower)
        
        if (aTitleMatch && !bTitleMatch) return -1
        if (!aTitleMatch && bTitleMatch) return 1
      }
      
      // Finally, sort by subject and course number
      if (a.subjectDescription !== b.subjectDescription) {
        return a.subjectDescription.localeCompare(b.subjectDescription)
      }
      return a.courseNumber.localeCompare(b.courseNumber)
    })

    // Paginate results
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex)

    return NextResponse.json({
      courses: paginatedCourses,
      totalCount: filteredCourses.length,
      page,
      limit,
      totalPages: Math.ceil(filteredCourses.length / limit)
    })

  } catch (error) {
    console.error('Error searching courses:', error)
    return NextResponse.json(
      { error: 'Failed to search courses' },
      { status: 500 }
    )
  }
}