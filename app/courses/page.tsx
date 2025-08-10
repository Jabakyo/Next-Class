"use client"

import { useState, useEffect } from 'react'
import { CourseSelection } from '@/components/course-selection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// // Removed lucide-react import
// // Removed sonner import

// Temporary replacements
const BookOpen = () => <span>📚</span>
const Calendar = () => <span>📅</span>
const Trash2 = () => <span>🗑️</span>
const Users = () => <span>👥</span>
const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.log('Error:', message)
}

interface UserCourse {
  id: string
  subject: string
  courseNumber: string
  section: string
  title: string
  instructor: string
  meetingTimes: Array<{
    days: string[]
    startTime: string
    endTime: string
  }>
  room: string
  scheduleType: string
  attribute: string
}

export default function CoursesPage() {
  const [user, setUser] = useState<any>(null)
  const [userCourses, setUserCourses] = useState<UserCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('No token found')
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load user data')
      }

      const userData = await response.json()
      setUser(userData)
      setUserCourses(userData.classes || [])
    } catch (error) {
      console.error('Error loading user data:', error)
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const removeCourse = async (courseId: string) => {
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(`/api/users/${user.id}/courses?courseId=${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to remove course')
      }

      setUserCourses(prev => prev.filter(course => course.id !== courseId))
      toast.success('Course removed from your schedule')
    } catch (error) {
      console.error('Error removing course:', error)
      toast.error('Failed to remove course')
    }
  }

  const formatTime = (time: string) => {
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDays = (days: string[]) => {
    return days.join(', ')
  }

  const onCourseAdded = (newCourse: UserCourse) => {
    setUserCourses(prev => [...prev, newCourse])
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access courses</h1>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Course Management</h1>
        <p className="text-muted-foreground">
          Browse and add courses to your schedule from Dickinson College's course catalog.
        </p>
      </div>

      <Tabs defaultValue="my-courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-courses" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            My Courses ({userCourses.length})
          </TabsTrigger>
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Browse Courses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Your Current Schedule
              </CardTitle>
              <CardDescription>
                Courses you've added to your schedule for Fall 2025
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userCourses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No courses added yet</p>
                  <p>Use the "Browse Courses" tab to add courses to your schedule.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userCourses.map((course) => (
                    <Card key={course.id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {course.subject} {course.courseNumber}-{course.section}
                            </CardTitle>
                            <CardDescription className="text-base font-medium text-foreground mt-1">
                              {course.title}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCourse(course.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span><strong>Instructor:</strong> {course.instructor || 'TBA'}</span>
                            <span><strong>Room:</strong> {course.room || 'TBA'}</span>
                          </div>
                          
                          {course.meetingTimes && course.meetingTimes.length > 0 && (
                            <div className="text-sm">
                              <span className="text-muted-foreground"><strong>Schedule:</strong> </span>
                              {course.meetingTimes.map((meeting, idx) => (
                                <span key={idx}>
                                  {formatDays(meeting.days)} {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                                  {idx < course.meetingTimes.length - 1 && ', '}
                                </span>
                              ))}
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Browse Course Catalog
              </CardTitle>
              <CardDescription>
                Search and add courses from Dickinson College's course catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseSelection userId={user.id} onCourseAdded={onCourseAdded} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}