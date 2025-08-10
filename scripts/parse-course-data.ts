import fs from 'fs'
import path from 'path'

interface ParsedCourse {
  subjectDescription: string
  title: string
  courseNumber: string
  section: string
  crn: string
  term: string
  linkedSections: string
  instructor: string
  meetingTimes: string
  scheduleType: string
  attribute: string
  credits?: string
}

export function parseCourseData(rawText: string): ParsedCourse[] {
  const courses: ParsedCourse[] = []
  const lines = rawText.split('\n').filter(line => line.trim())
  
  let currentCourse: Partial<ParsedCourse> | null = null
  let collectingMeetingTimes = false
  let collectingAttributes = false
  let meetingTimesBuffer: string[] = []
  let attributesBuffer: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Skip empty lines
    if (!line) continue
    
    // Check if this is a new course (contains tabs)
    if (line.includes('\t')) {
      // Save previous course if exists
      if (currentCourse && currentCourse.subjectDescription) {
        if (meetingTimesBuffer.length > 0) {
          currentCourse.meetingTimes = meetingTimesBuffer.join(' ')
        }
        if (attributesBuffer.length > 0) {
          currentCourse.attribute = attributesBuffer.join(', ')
        }
        
        // Remove CRN field and add to courses
        const { crn, ...courseWithoutCrn } = currentCourse
        courses.push(courseWithoutCrn as any)
      }
      
      // Reset buffers
      meetingTimesBuffer = []
      attributesBuffer = []
      collectingMeetingTimes = false
      collectingAttributes = false
      
      // Parse new course
      const parts = line.split('\t')
      currentCourse = {
        subjectDescription: parts[0] || '',
        title: parts[1] || '',
        courseNumber: parts[2] || '',
        section: parts[3] || '',
        crn: parts[4] || '', // Will be removed
        term: parts[5] || '',
        linkedSections: parts[6] || ''
      }
    } 
    // Handle instructor line (contains "Primary")
    else if (line.includes('(Primary)') || line.includes('Primary')) {
      if (currentCourse) {
        currentCourse.instructor = line
      }
    }
    // Handle days of week line
    else if (line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/)) {
      collectingMeetingTimes = true
      meetingTimesBuffer.push(line)
    }
    // Handle single letter days (S M T W T F S)
    else if (line === 'S' || (collectingMeetingTimes && line.match(/^[SMTWTFS]\s*$/))) {
      // Skip these lines
    }
    // Handle time and location line
    else if (line.includes('Type:') && line.includes('Building:')) {
      meetingTimesBuffer.push(line)
      collectingMeetingTimes = false
      collectingAttributes = true
    }
    // Handle schedule type (after time line and before attributes)
    else if (collectingAttributes && !attributesBuffer.length && 
             (line === 'Class' || line === 'Lecture' || line === 'Lab' || line === 'Seminar')) {
      if (currentCourse) {
        currentCourse.scheduleType = line
      }
    }
    // Handle credits (number at end)
    else if (line.match(/^[0-9]+(\.[0-9]+)?(\s+OR\s+[0-9]+(\.[0-9]+)?)?$/)) {
      if (currentCourse) {
        currentCourse.credits = line
      }
      collectingAttributes = false
    }
    // Handle attributes
    else if (collectingAttributes && line) {
      attributesBuffer.push(line)
    }
  }
  
  // Don't forget the last course
  if (currentCourse && currentCourse.subjectDescription) {
    if (meetingTimesBuffer.length > 0) {
      currentCourse.meetingTimes = meetingTimesBuffer.join(' ')
    }
    if (attributesBuffer.length > 0) {
      currentCourse.attribute = attributesBuffer.join(', ')
    }
    
    // Remove CRN field
    const { crn, ...courseWithoutCrn } = currentCourse
    courses.push(courseWithoutCrn as any)
  }
  
  return courses
}

// Function to save parsed courses
export function saveParsedCourses(courses: ParsedCourse[]) {
  const coursesFile = path.join(process.cwd(), 'data', 'courses', 'courses.json')
  
  // Transform to match our schema (without CRN)
  const transformedCourses = courses.map(course => ({
    subjectDescription: course.subjectDescription,
    title: course.title,
    courseNumber: course.courseNumber,
    section: course.section,
    term: course.term,
    linkedSections: course.linkedSections || '',
    instructor: course.instructor,
    meetingTimes: course.meetingTimes,
    scheduleType: course.scheduleType || 'Class',
    attribute: course.attribute || ''
  }))
  
  fs.writeFileSync(coursesFile, JSON.stringify(transformedCourses, null, 2))
  console.log(`Successfully saved ${transformedCourses.length} courses`)
}

// If run directly
if (require.main === module) {
  const inputFile = process.argv[2]
  
  if (!inputFile) {
    console.log('Usage: npx tsx scripts/parse-course-data.ts <input-file>')
    process.exit(1)
  }
  
  const rawText = fs.readFileSync(inputFile, 'utf8')
  const courses = parseCourseData(rawText)
  
  console.log(`Parsed ${courses.length} courses`)
  console.log('Sample course:', courses[0])
  
  saveParsedCourses(courses)
}