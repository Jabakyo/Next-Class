import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

interface CourseInput {
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

// Function to import courses from CSV
export function importCoursesFromCSV(csvPath: string) {
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf8')
    
    // Parse CSV with headers
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })
    
    const courses: CourseInput[] = records.map((record: any) => ({
      subjectDescription: record['Subject Description'] || record.subjectDescription || '',
      title: record['Title'] || record.title || '',
      courseNumber: record['Course Number'] || record.courseNumber || '',
      section: record['Section'] || record.section || '',
      term: record['Term'] || record.term || '',
      linkedSections: record['Linked Sections'] || record.linkedSections || '',
      instructor: record['Instructor'] || record.instructor || '',
      meetingTimes: record['Meeting Times'] || record.meetingTimes || '',
      scheduleType: record['Schedule Type'] || record.scheduleType || '',
      attribute: record['Attribute'] || record.attribute || ''
    }))
    
    // Save to courses.json
    const coursesFile = path.join(process.cwd(), 'data', 'courses', 'courses.json')
    fs.writeFileSync(coursesFile, JSON.stringify(courses, null, 2))
    
    console.log(`Successfully imported ${courses.length} courses`)
    return courses
  } catch (error) {
    console.error('Error importing courses:', error)
    throw error
  }
}

// Function to import courses from JSON
export function importCoursesFromJSON(jsonPath: string) {
  try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf8')
    const courses = JSON.parse(jsonContent)
    
    // Validate and transform if needed
    const validatedCourses = courses.map((course: any) => ({
      subjectDescription: course.subjectDescription || '',
      title: course.title || '',
      courseNumber: course.courseNumber || '',
      section: course.section || '',
      term: course.term || '',
      linkedSections: course.linkedSections || '',
      instructor: course.instructor || '',
      meetingTimes: course.meetingTimes || '',
      scheduleType: course.scheduleType || '',
      attribute: course.attribute || ''
    }))
    
    // Save to courses.json
    const coursesFile = path.join(process.cwd(), 'data', 'courses', 'courses.json')
    fs.writeFileSync(coursesFile, JSON.stringify(validatedCourses, null, 2))
    
    console.log(`Successfully imported ${validatedCourses.length} courses`)
    return validatedCourses
  } catch (error) {
    console.error('Error importing courses:', error)
    throw error
  }
}

// Function to import from raw text (tab or comma separated)
export function importCoursesFromText(content: string, delimiter: string = '\t') {
  try {
    // Parse text content
    const records = parse(content, {
      columns: [
        'subjectDescription',
        'title', 
        'courseNumber',
        'section',
        'crn', // Will be ignored
        'term',
        'linkedSections',
        'instructor',
        'meetingTimes',
        'scheduleType',
        'attribute'
      ],
      delimiter: delimiter,
      skip_empty_lines: true,
      from_line: 2, // Skip header if present
      relax_quotes: true,
      relax_column_count: true
    })
    
    const courses = records.map((record: any) => ({
      subjectDescription: record.subjectDescription || '',
      title: record.title || '',
      courseNumber: record.courseNumber || '',
      section: record.section || '',
      term: record.term || '',
      linkedSections: record.linkedSections || '',
      instructor: record.instructor || '',
      meetingTimes: record.meetingTimes || '',
      scheduleType: record.scheduleType || '',
      attribute: record.attribute || ''
    }))
    
    // Save to courses.json
    const coursesFile = path.join(process.cwd(), 'data', 'courses', 'courses.json')
    fs.writeFileSync(coursesFile, JSON.stringify(courses, null, 2))
    
    console.log(`Successfully imported ${courses.length} courses`)
    return courses
  } catch (error) {
    console.error('Error importing courses:', error)
    throw error
  }
}

// If run directly
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Usage: npx tsx scripts/bulk-import-courses.ts <format> <file-path>')
    console.log('Formats: csv, json, text')
    console.log('Example: npx tsx scripts/bulk-import-courses.ts csv data/courses-input.csv')
    process.exit(1)
  }
  
  const [format, filePath] = args
  
  switch (format.toLowerCase()) {
    case 'csv':
      importCoursesFromCSV(filePath)
      break
    case 'json':
      importCoursesFromJSON(filePath)
      break
    case 'text':
      const content = fs.readFileSync(filePath, 'utf8')
      importCoursesFromText(content)
      break
    default:
      console.error('Unknown format. Use: csv, json, or text')
      process.exit(1)
  }
}