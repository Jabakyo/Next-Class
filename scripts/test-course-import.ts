import { importCourse, getAllCourses } from '../lib/course-import'

// Test with the first course data
const testCourse = {
  subjectDescription: "Women's, Gender & Sexuality St",
  title: "Introduction to Women's, Gender and Sexuality Studies",
  courseNumber: "100",
  section: "01",
  term: "Fall 2025",
  linkedSections: "",
  instructor: "Fox, Charity (Primary)",
  meetingTimes: "Monday,Wednesday,Friday 12:30 PM - 01:20 PM Type: Class Building: Denny Hall Room: 104 Start Date: 09/01/2025 End Date: 12/20/2025",
  scheduleType: "Class",
  attribute: "AMST Struct & Instit Elective, Social Sciences, Appropriate for First-Year, Sustainability Connections, US Diversity"
}

// Import the course
console.log('Importing course...')
importCourse(testCourse)

// Verify it was saved
const allCourses = getAllCourses()
console.log('Total courses saved:', allCourses.length)
console.log('Last course:', allCourses[allCourses.length - 1])