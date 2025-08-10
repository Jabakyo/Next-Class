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

export function parseCourseDataV2(inputFile: string): Course[] {
  const content = fs.readFileSync(inputFile, 'utf8')
  const lines = content.split('\n')
  const courses: Course[] = []
  
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    
    // Look for lines with tabs (course header)
    if (line.includes('\t')) {
      const parts = line.split('\t')
      
      // Must have at least 6 parts for a valid course
      if (parts.length >= 6) {
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
        
        i++ // Move to next line
        
        // Look for instructor (next non-empty line)
        while (i < lines.length) {
          const nextLine = lines[i].trim()
          if (!nextLine) {
            i++
            continue
          }
          if (nextLine.includes('(Primary)')) {
            course.instructor = nextLine
            i++
            break
          }
          i++
        }
        
        // Look for meeting days
        let meetingDays = ''
        while (i < lines.length) {
          const nextLine = lines[i].trim()
          if (!nextLine) {
            i++
            continue
          }
          if (nextLine.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/)) {
            meetingDays = nextLine
            i++
            break
          }
          i++
        }
        
        // Skip single letter days
        while (i < lines.length && lines[i].trim().match(/^[SMTWTFS]$/)) {
          i++
        }
        
        // Look for meeting times
        while (i < lines.length) {
          const nextLine = lines[i].trim()
          if (nextLine.includes('Type:') && nextLine.includes('Building:')) {
            course.meetingTimes = meetingDays + ' ' + nextLine
            i++
            break
          }
          i++
        }
        
        // Collect attributes until we hit a number (credits) or next course
        const attributes: string[] = []
        
        // Look for schedule type (it's right after the meeting times line)
        if (i < lines.length) {
          const nextLine = lines[i].trim()
          if (nextLine && !nextLine.includes('\t')) {
            // First word is usually the schedule type
            const firstWord = nextLine.split(/\s+/)[0]
            if (['Class', 'Lecture', 'Lab', 'Seminar', 'Discussion'].includes(firstWord)) {
              course.scheduleType = firstWord
              // The rest after tab (if exists) are attributes
              const tabIndex = lines[i].indexOf('\t')
              if (tabIndex > -1) {
                const afterTab = lines[i].substring(tabIndex + 1).trim()
                if (afterTab) {
                  attributes.push(afterTab)
                }
              }
            }
            i++
          }
        }
        while (i < lines.length) {
          const nextLine = lines[i].trim()
          
          // Stop if we hit an empty line followed by a new course
          if (!nextLine) {
            i++
            continue
          }
          
          // Stop if we hit credits (number)
          if (nextLine.match(/^[0-9]+(\.[0-9]+)?(\s+OR\s+[0-9]+(\.[0-9]+)?)?$/)) {
            i++
            break
          }
          
          // Stop if we hit a new course (line with tabs)
          if (nextLine.includes('\t')) {
            break
          }
          
          // Add to attributes
          if (nextLine && !nextLine.match(/^[SMTWTFS]$/)) {
            attributes.push(nextLine)
          }
          i++
        }
        
        course.attribute = attributes.join(', ')
        courses.push(course)
      } else {
        i++
      }
    } else {
      i++
    }
  }
  
  return courses
}

// Save courses to JSON
export function saveCoursesToJson(courses: Course[], outputFile: string) {
  fs.writeFileSync(outputFile, JSON.stringify(courses, null, 2))
  console.log(`Saved ${courses.length} courses to ${outputFile}`)
}

// Main execution
if (require.main === module) {
  const inputFile = process.argv[2]
  
  if (!inputFile) {
    console.log('Usage: npx tsx scripts/parse-course-data-v2.ts <input-file>')
    process.exit(1)
  }
  
  console.log('Parsing course data...')
  const courses = parseCourseDataV2(inputFile)
  
  console.log(`Parsed ${courses.length} courses`)
  if (courses.length > 0) {
    console.log('\nFirst course:')
    console.log(JSON.stringify(courses[0], null, 2))
  }
  
  const outputFile = path.join(process.cwd(), 'data', 'courses', 'courses.json')
  saveCoursesToJson(courses, outputFile)
}