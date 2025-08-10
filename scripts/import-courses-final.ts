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

export function parseCoursesFromFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8')
  
  // Split by double newline to separate course blocks
  const courseBlocks = content.split(/\n\s*\n/).filter(block => block.trim())
  
  const courses: Course[] = []
  
  for (const block of courseBlocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(line => line)
    
    // First line should contain tab-separated course info
    const firstLine = lines[0]
    if (!firstLine.includes('\t')) continue
    
    const parts = firstLine.split('\t')
    if (parts.length < 6) continue
    
    const course: Course = {
      subjectDescription: parts[0],
      title: parts[1],
      courseNumber: parts[2],
      section: parts[3],
      // Skip CRN (parts[4])
      term: parts[5],
      linkedSections: parts[6] || '',
      instructor: '',
      meetingTimes: '',
      scheduleType: 'Class',
      attribute: ''
    }
    
    // Parse remaining lines
    let currentIndex = 1
    
    // Find instructor
    while (currentIndex < lines.length) {
      if (lines[currentIndex].includes('(Primary)')) {
        course.instructor = lines[currentIndex]
        currentIndex++
        break
      }
      currentIndex++
    }
    
    // Find meeting days
    let meetingDays = ''
    while (currentIndex < lines.length) {
      if (lines[currentIndex].match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/)) {
        meetingDays = lines[currentIndex]
        currentIndex++
        break
      }
      currentIndex++
    }
    
    // Skip single letter days
    while (currentIndex < lines.length && lines[currentIndex].match(/^[SMTWTFS]$/)) {
      currentIndex++
    }
    
    // Find meeting times
    while (currentIndex < lines.length) {
      if (lines[currentIndex].includes('Type:') && lines[currentIndex].includes('Building:')) {
        course.meetingTimes = meetingDays + ' ' + lines[currentIndex]
        currentIndex++
        break
      }
      currentIndex++
    }
    
    // Find schedule type and attributes
    let foundScheduleType = false
    const attributes: string[] = []
    
    while (currentIndex < lines.length) {
      const line = lines[currentIndex]
      
      // Check if line contains tab (schedule type + first attribute)
      if (!foundScheduleType && line.includes('\t')) {
        const [scheduleType, firstAttribute] = line.split('\t')
        if (['Class', 'Lecture', 'Lab', 'Seminar', 'Discussion'].includes(scheduleType)) {
          course.scheduleType = scheduleType
          foundScheduleType = true
          if (firstAttribute && firstAttribute.trim()) {
            attributes.push(firstAttribute.trim())
          }
        }
      }
      // If it's just a schedule type without tab
      else if (!foundScheduleType && ['Class', 'Lecture', 'Lab', 'Seminar', 'Discussion'].includes(line)) {
        course.scheduleType = line
        foundScheduleType = true
      }
      // Skip credit lines
      else if (line.match(/^[0-9]+(\.[0-9]+)?(\s+OR\s+[0-9]+(\.[0-9]+)?)?$/)) {
        // This is credits, skip it
        break
      }
      // Everything else is an attribute
      else if (foundScheduleType && line && !line.match(/^[SMTWTFS]$/)) {
        attributes.push(line)
      }
      
      currentIndex++
    }
    
    course.attribute = attributes.join(', ')
    courses.push(course)
  }
  
  return courses
}

// Main function to import all courses
export function importAllCourses(inputPath: string) {
  console.log('Importing courses from:', inputPath)
  
  try {
    const courses = parseCoursesFromFile(inputPath)
    console.log(`Parsed ${courses.length} courses`)
    
    // Save to courses.json
    const outputPath = path.join(process.cwd(), 'data', 'courses', 'courses.json')
    fs.writeFileSync(outputPath, JSON.stringify(courses, null, 2))
    
    console.log(`Successfully saved ${courses.length} courses to courses.json`)
    
    // Show sample
    if (courses.length > 0) {
      console.log('\nSample course:')
      console.log(JSON.stringify(courses[0], null, 2))
    }
    
    return courses
  } catch (error) {
    console.error('Error importing courses:', error)
    throw error
  }
}

// CLI execution
if (require.main === module) {
  const inputFile = process.argv[2]
  
  if (!inputFile) {
    console.log('Usage: npx tsx scripts/import-courses-final.ts <input-file>')
    console.log('Example: npx tsx scripts/import-courses-final.ts data/all-courses.txt')
    process.exit(1)
  }
  
  importAllCourses(inputFile)
}