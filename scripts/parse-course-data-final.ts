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

export function parseCoursesFromText(text: string): Course[] {
  const courses: Course[] = []
  const lines = text.split('\n')
  
  let i = 0
  while (i < lines.length) {
    // Look for course header (contains tabs)
    if (lines[i].includes('\t')) {
      const parts = lines[i].split('\t')
      
      if (parts.length >= 6 && parts[0] && parts[1]) {
        const course: Course = {
          subjectDescription: parts[0].trim(),
          title: parts[1].trim(),
          courseNumber: parts[2].trim(),
          section: parts[3].trim(),
          // Skip CRN (parts[4])
          term: parts[5].trim(),
          linkedSections: parts[6] ? parts[6].trim() : '',
          instructor: '',
          meetingTimes: '',
          scheduleType: 'Class',
          attribute: ''
        }
        
        i++
        
        // Look for instructor
        while (i < lines.length && !lines[i].includes('(Primary)')) {
          i++
        }
        if (i < lines.length) {
          course.instructor = lines[i].trim()
          i++
        }
        
        // Look for meeting days
        let meetingDays = ''
        while (i < lines.length) {
          if (lines[i].match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/)) {
            meetingDays = lines[i].trim()
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
          if (lines[i].includes('Type:') && lines[i].includes('Building:')) {
            course.meetingTimes = meetingDays + ' ' + lines[i].trim()
            i++
            break
          }
          i++
        }
        
        // Look for schedule type line (contains tab)
        if (i < lines.length && lines[i].includes('\t')) {
          const typeLineParts = lines[i].split('\t')
          if (typeLineParts[0]) {
            course.scheduleType = typeLineParts[0].trim()
          }
          // First attribute is after the tab
          const attributes: string[] = []
          if (typeLineParts[1]) {
            attributes.push(typeLineParts[1].trim())
          }
          i++
          
          // Collect remaining attributes until we hit a number or new course
          while (i < lines.length) {
            const line = lines[i].trim()
            
            // Stop conditions
            if (!line || 
                line.match(/^[0-9]+(\.[0-9]+)?(\s+OR\s+[0-9]+(\.[0-9]+)?)?$/) ||
                lines[i].includes('\t')) {
              break
            }
            
            attributes.push(line)
            i++
          }
          
          course.attribute = attributes.filter(a => a).join(', ')
        }
        
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

export function importAllCourses(inputPath: string) {
  console.log('Importing courses from:', inputPath)
  
  try {
    const content = fs.readFileSync(inputPath, 'utf8')
    const courses = parseCoursesFromText(content)
    
    console.log(`Parsed ${courses.length} courses`)
    
    // Load existing courses
    const outputPath = path.join(process.cwd(), 'data', 'courses', 'courses.json')
    let existingCourses: Course[] = []
    
    if (fs.existsSync(outputPath)) {
      const existingContent = fs.readFileSync(outputPath, 'utf8')
      existingCourses = JSON.parse(existingContent)
      console.log(`Found ${existingCourses.length} existing courses`)
    }
    
    // Append new courses to existing ones
    const allCourses = [...existingCourses, ...courses]
    fs.writeFileSync(outputPath, JSON.stringify(allCourses, null, 2))
    
    console.log(`Successfully saved ${allCourses.length} total courses (${courses.length} new) to courses.json`)
    
    // Show samples
    if (courses.length > 0) {
      console.log('\nFirst course:')
      console.log(JSON.stringify(courses[0], null, 2))
      
      if (courses.length > 1) {
        console.log('\nSecond course:')
        console.log(JSON.stringify(courses[1], null, 2))
      }
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
    console.log('Usage: npx tsx scripts/parse-course-data-final.ts <input-file>')
    console.log('Example: npx tsx scripts/parse-course-data-final.ts data/all-courses.txt')
    process.exit(1)
  }
  
  importAllCourses(inputFile)
}