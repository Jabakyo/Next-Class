"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Plus, Check } from "lucide-react"
import { toast } from "sonner"

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

interface Subject {
  value: string
  label: string
}

interface CourseSelectionProps {
  userId: string
  onCourseAdded?: (course: any) => void
}

export function CourseSelection({ userId, onCourseAdded }: CourseSelectionProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [addingCourse, setAddingCourse] = useState<string | null>(null)

  // Load subjects on component mount
  useEffect(() => {
    loadSubjects()
  }, [])

  // Load courses when search parameters change
  useEffect(() => {
    loadCourses()
  }, [searchQuery, selectedSubject, currentPage])

  const loadSubjects = async () => {
    try {
      const response = await fetch('/api/courses/subjects')
      const data = await response.json()
      setSubjects(data.subjects || [])
    } catch (error) {
      console.error('Error loading subjects:', error)
      toast.error('Failed to load subjects')
    }
  }

  const loadCourses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: currentPage.toString(),
        limit: '10'
      })
      
      // Only add subject filter if it's not "all" or empty
      if (selectedSubject && selectedSubject !== 'all') {
        params.append('subject', selectedSubject)
      }
      
      const response = await fetch(`/api/courses/search?${params}`)
      const data = await response.json()
      
      setCourses(data.courses || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error loading courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const addCourse = async (course: Course) => {
    const courseKey = `${course.subjectDescription}-${course.courseNumber}-${course.section}`
    setAddingCourse(courseKey)
    
    try {
      const response = await fetch(`/api/users/${userId}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({ courseData: course })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add course')
      }

      const result = await response.json()
      toast.success(`${course.title} added to your schedule!`)
      
      if (onCourseAdded) {
        onCourseAdded(result.course)
      }
    } catch (error: any) {
      console.error('Error adding course:', error)
      if (error.message === 'Course already added') {
        toast.error('This course is already in your schedule')
      } else {
        toast.error('Failed to add course to your schedule')
      }
    } finally {
      setAddingCourse(null)
    }
  }

  const formatMeetingTimes = (meetingTimes: string) => {
    // Extract days and time from the meeting times string
    const parts = meetingTimes.split(' ')
    if (parts.length < 4) return meetingTimes
    
    const days = parts[0].replace(/,/g, ', ')
    const timeMatch = meetingTimes.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/)
    const timeRange = timeMatch ? `${timeMatch[1]} - ${timeMatch[2]}` : ''
    
    return `${days} ${timeRange}`
  }

  const extractBuilding = (meetingTimes: string) => {
    const buildingMatch = meetingTimes.match(/Building:\s*([^,\s]+[^,]*?)(?:\s+Room:|$)/)
    return buildingMatch ? buildingMatch[1].trim() : ''
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Try: math, calculus, smith, 151, mwf, lecture..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Search by subject, course title, instructor, course number, meeting days, or schedule type
          </p>
        </div>
        <Select
          value={selectedSubject}
          onValueChange={(value) => {
            setSelectedSubject(value)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.value} value={subject.value}>
                {subject.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading courses...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No courses found. Try adjusting your search criteria.
            </div>
          ) : (
            courses.map((course, index) => {
              const courseKey = `${course.subjectDescription}-${course.courseNumber}-${course.section}`
              const isAdding = addingCourse === courseKey
              
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {course.subjectDescription} {course.courseNumber}-{course.section}
                        </CardTitle>
                        <CardDescription className="text-base font-medium text-foreground mt-1">
                          {course.title}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => addCourse(course)}
                        disabled={isAdding}
                        size="sm"
                        className="shrink-0 ml-4"
                      >
                        {isAdding ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {isAdding ? 'Adding...' : 'Add Course'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span><strong>Instructor:</strong> {course.instructor || 'TBA'}</span>
                        <span><strong>Term:</strong> {course.term}</span>
                      </div>
                      
                      {course.meetingTimes && course.meetingTimes !== 'None' && (
                        <div className="text-sm">
                          <span className="text-muted-foreground"><strong>Schedule:</strong> </span>
                          {formatMeetingTimes(course.meetingTimes)}
                          {extractBuilding(course.meetingTimes) && (
                            <span className="text-muted-foreground ml-2">
                              • {extractBuilding(course.meetingTimes)}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">{course.scheduleType}</Badge>
                        {course.attribute && course.attribute.split(',').map((attr, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {attr.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}