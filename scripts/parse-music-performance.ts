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

export function parseMusicPerformanceCourses(text: string): Course[] {
  const courses: Course[] = []
  const lines = text.split('\n').map(line => line.trim()).filter(line => line)
  
  let i = 0
  while (i < lines.length) {
    // Look for course header pattern (contains tabs)
    const line = lines[i]
    if (line.includes('\t')) {
      const parts = line.split('\t')
      
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
          scheduleType: '',
          attribute: ''
        }
        
        i++
        
        // Collect instructors and parse meeting times
        const instructors: string[] = []
        let meetingTimes = ''
        let scheduleType = ''
        let attribute = ''
        
        while (i < lines.length) {
          const nextLine = lines[i].trim()
          
          // Stop if we hit credits (number line)
          if (nextLine.match(/^[0-9]+(\.[0-9]+)?$/)) {
            break
          }
          
          // Stop if we hit another course
          if (nextLine.includes('\t') && nextLine.split('\t').length >= 6) {
            i--
            break
          }
          
          // Handle "None" (no meeting times for individual lessons)
          if (nextLine === 'None') {
            meetingTimes = 'None'
            i++
            // Skip single letter days
            while (i < lines.length && lines[i].trim().match(/^[SMTWTFS]$/)) {
              i++
            }
            
            // Skip building info line
            if (i < lines.length && lines[i].includes('Type: Class Building:')) {
              i++
            }
            
            // Get schedule type and attribute
            if (i < lines.length && lines[i].includes('\t')) {
              const typeLineParts = lines[i].split('\t')
              scheduleType = typeLineParts[0].trim()
              attribute = typeLineParts[1] ? typeLineParts[1].trim() : ''
              i++
            }
            break
          }
          
          // Handle meeting days (like "Tuesday,Thursday")
          if (nextLine.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/)) {
            const meetingDays = nextLine
            i++
            
            // Skip single letter days
            while (i < lines.length && lines[i].trim().match(/^[SMTWTFS]$/)) {
              i++
            }
            
            // Collect meeting time details
            const timeDetails: string[] = []
            while (i < lines.length) {
              const timeLine = lines[i].trim()
              if (timeLine.includes('Type: Class Building:')) {
                timeDetails.push(timeLine)
                i++
              } else if (timeLine.includes('\t')) {
                // Schedule type and attribute line
                const typeLineParts = timeLine.split('\t')
                scheduleType = typeLineParts[0].trim()
                attribute = typeLineParts[1] ? typeLineParts[1].trim() : ''
                i++
                break
              } else {
                break
              }
            }
            
            meetingTimes = meetingDays + (timeDetails.length > 0 ? ' ' + timeDetails[0] : '')
            break
          }
          
          // Skip single letter days and building info
          if (!nextLine.match(/^[SMTWTFS]$/) && 
              !nextLine.includes('Type: Class Building:') &&
              nextLine !== '') {
            instructors.push(nextLine)
          }
          
          i++
        }
        
        course.instructor = instructors.join(', ')
        course.meetingTimes = meetingTimes
        course.scheduleType = scheduleType || 'Individual'
        course.attribute = attribute || 'Can\'t be taken pass/fail'
        
        // Skip to credits or next course
        while (i < lines.length) {
          const nextLine = lines[i].trim()
          
          // If we find credits, we're done with this course
          if (nextLine.match(/^[0-9]+(\.[0-9]+)?$/)) {
            i++
            break
          }
          
          // If we find another course header, go back one line
          if (nextLine.includes('\t') && nextLine.split('\t').length >= 6) {
            break
          }
          
          i++
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

export function importMusicPerformanceCourses(inputPath: string) {
  console.log('Importing music performance courses from:', inputPath)
  
  try {
    const content = fs.readFileSync(inputPath, 'utf8')
    const courses = parseMusicPerformanceCourses(content)
    
    console.log(`Parsed ${courses.length} music performance courses`)
    
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
    console.error('Error importing music performance courses:', error)
    throw error
  }
}

// CLI execution
if (require.main === module) {
  const inputFile = process.argv[2]
  
  if (!inputFile) {
    console.log('Usage: npx tsx scripts/parse-music-performance.ts <input-file>')
    console.log('Example: npx tsx scripts/parse-music-performance.ts data/courses-batch4.txt')
    process.exit(1)
  }
  
  importMusicPerformanceCourses(inputFile)
}