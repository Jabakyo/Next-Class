import fs from 'fs'
import path from 'path'

export interface Course {
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

export function importCourse(courseData: Course): void {
  const coursesFile = path.join(process.cwd(), 'data', 'courses', 'courses.json')
  
  // Read existing courses
  let courses: Course[] = []
  if (fs.existsSync(coursesFile)) {
    const data = fs.readFileSync(coursesFile, 'utf8')
    courses = JSON.parse(data)
  }
  
  // Add new course
  courses.push(courseData)
  
  // Save updated courses
  fs.writeFileSync(coursesFile, JSON.stringify(courses, null, 2))
}

export function getAllCourses(): Course[] {
  const coursesFile = path.join(process.cwd(), 'data', 'courses', 'courses.json')
  
  if (!fs.existsSync(coursesFile)) {
    return []
  }
  
  const data = fs.readFileSync(coursesFile, 'utf8')
  return JSON.parse(data)
}