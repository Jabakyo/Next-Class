"use client"

import type React from "react"

import { useState, useEffect } from "react"
// // Removed lucide-react import
// Temporary icon replacements
const X = () => <span>❌</span>
const Search = () => <span>🔍</span>
const Clock = () => <span>⏰</span>
const Users = () => <span>👥</span>
const MapPin = () => <span>📍</span>
const BookOpen = () => <span>📚</span>
const GraduationCap = () => <span>🎓</span>
const ArrowRight = () => <span>⭐</span>
const Loader2 = () => <span>⏳</span>

import type { SelectedClass } from "@/types/user"

// Define course interface for API data
interface APICourse {
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

// Convert API course to AvailableClass format
interface AvailableClass {
  id: string
  subject: string
  courseNumber: string
  section: string
  crn: string
  term: string
  title: string
  instructor: string
  meetingTimes: {
    days: string[]
    startTime: string
    endTime: string
  }[]
  room: string
  description: string
  enrolled: number
  capacity: number
}

interface ClassSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (selectedClasses: SelectedClass[]) => void
  currentlySelected: SelectedClass[]
}

export default function ClassSelectionModal({
  isOpen,
  onClose,
  onSubmit,
  currentlySelected,
}: ClassSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClasses, setSelectedClasses] = useState<SelectedClass[]>(currentlySelected)
  const [selectedDepartment, setSelectedDepartment] = useState("All")
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([])
  const [departments, setDepartments] = useState<string[]>(["All"])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasSearched, setHasSearched] = useState(false)

  // Helper function to parse meeting times
  const parseMeetingTimes = (meetingTimesStr: string) => {
    if (!meetingTimesStr || meetingTimesStr === 'TBA') {
      return [{ days: ['TBA'], startTime: '00:00', endTime: '00:00' }]
    }

    try {
      // Parse format like "MWF 9:00 AM - 9:50 AM" or "TTh 2:00 PM - 3:15 PM"
      const parts = meetingTimesStr.split(' ')
      if (parts.length < 4) {
        return [{ days: ['TBA'], startTime: '00:00', endTime: '00:00' }]
      }

      const dayPattern = parts[0]
      const startTime = parts[1] + ' ' + parts[2]
      const endTime = parts[4] + ' ' + parts[5]

      // Convert day pattern to array
      const days = []
      if (dayPattern.includes('M')) days.push('Monday')
      if (dayPattern.includes('T') && !dayPattern.includes('Th')) days.push('Tuesday')
      if (dayPattern.includes('W')) days.push('Wednesday')
      if (dayPattern.includes('Th')) days.push('Thursday')
      if (dayPattern.includes('F')) days.push('Friday')
      if (dayPattern.includes('S') && !dayPattern.includes('Su')) days.push('Saturday')
      if (dayPattern.includes('Su')) days.push('Sunday')

      // Convert time to 24-hour format
      const convertTo24Hour = (timeStr: string) => {
        const [time, period] = timeStr.split(' ')
        const [hours, minutes] = time.split(':')
        let hour = parseInt(hours)
        
        if (period === 'PM' && hour !== 12) hour += 12
        if (period === 'AM' && hour === 12) hour = 0
        
        return `${hour.toString().padStart(2, '0')}:${minutes}`
      }

      return [{
        days,
        startTime: convertTo24Hour(startTime),
        endTime: convertTo24Hour(endTime)
      }]
    } catch (e) {
      return [{ days: ['TBA'], startTime: '00:00', endTime: '00:00' }]
    }
  }

  // Convert API course to AvailableClass
  const convertAPItoAvailableClass = (course: APICourse): AvailableClass => {
    return {
      id: `${course.subjectDescription}-${course.courseNumber}-${course.section}`,
      subject: course.subjectDescription,
      courseNumber: course.courseNumber,
      section: course.section,
      crn: course.section, // Using section as CRN for now
      term: course.term,
      title: course.title,
      instructor: course.instructor || 'TBA',
      meetingTimes: parseMeetingTimes(course.meetingTimes),
      room: course.meetingTimes.includes('TBA') ? 'TBA' : 'Various',
      description: `${course.scheduleType} ${course.attribute ? '• ' + course.attribute : ''}`.trim(),
      enrolled: Math.floor(Math.random() * 25) + 5, // Mock data
      capacity: Math.floor(Math.random() * 15) + 30 // Mock data
    }
  }

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/courses/subjects')
        const data = await response.json()
        if (data.subjects) {
          const deptNames = data.subjects.map((s: any) => s.value)
          setDepartments(['All', ...deptNames])
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error)
      }
    }

    if (isOpen) {
      fetchDepartments()
    }
  }, [isOpen])

  // Fetch courses based on search
  const fetchCourses = async (page = 1, reset = false) => {
    setLoading(true)
    setError("")
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (searchTerm) {
        params.append('q', searchTerm)
      }
      
      if (selectedDepartment !== 'All') {
        params.append('subject', selectedDepartment)
      }

      const response = await fetch(`/api/courses/search?${params}`)
      const data = await response.json()
      
      if (data.courses) {
        const convertedCourses = data.courses.map(convertAPItoAvailableClass)
        
        if (reset || page === 1) {
          setAvailableClasses(convertedCourses)
        } else {
          setAvailableClasses(prev => [...prev, ...convertedCourses])
        }
        
        setTotalPages(data.totalPages)
        setCurrentPage(page)
        setHasSearched(true)
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      setError('Failed to load courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen && !hasSearched) {
      fetchCourses(1, true)
    }
  }, [isOpen])

  // Search when search term or department changes
  useEffect(() => {
    if (hasSearched) {
      const timer = setTimeout(() => {
        fetchCourses(1, true)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [searchTerm, selectedDepartment])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Load more courses
  const loadMore = () => {
    if (currentPage < totalPages && !loading) {
      fetchCourses(currentPage + 1, false)
    }
  }

  const isClassSelected = (classId: string) => {
    return selectedClasses.some((cls) => cls.id === classId)
  }

  const hasTimeConflict = (newClass: AvailableClass) => {
    for (const selectedClass of selectedClasses) {
      for (const newMeeting of newClass.meetingTimes) {
        for (const existingMeeting of selectedClass.meetingTimes) {
          // Check if there's any day overlap
          const dayOverlap = newMeeting.days.some((day) => existingMeeting.days.includes(day))
          if (dayOverlap) {
            // Check if there's time overlap
            const newStart = newMeeting.startTime
            const newEnd = newMeeting.endTime
            const existingStart = existingMeeting.startTime
            const existingEnd = existingMeeting.endTime

            if (
              (newStart >= existingStart && newStart < existingEnd) ||
              (newEnd > existingStart && newEnd <= existingEnd) ||
              (newStart <= existingStart && newEnd >= existingEnd)
            ) {
              return true
            }
          }
        }
      }
    }
    return false
  }

  const toggleClass = (availableClass: AvailableClass) => {
    if (isClassSelected(availableClass.id)) {
      setSelectedClasses((prev) => prev.filter((cls) => cls.id !== availableClass.id))
    } else {
      if (hasTimeConflict(availableClass)) {
        alert("This class conflicts with your current schedule!")
        return
      }
      const newSelectedClass: SelectedClass = {
        id: availableClass.id,
        subject: availableClass.subject,
        courseNumber: availableClass.courseNumber,
        section: availableClass.section,
        crn: availableClass.crn,
        term: availableClass.term,
        title: availableClass.title,
        instructor: availableClass.instructor,
        meetingTimes: availableClass.meetingTimes,
        room: availableClass.room,
      }
      setSelectedClasses((prev) => [...prev, newSelectedClass])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(selectedClasses)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-2xl font-bold text-black">Select Classes - Fall 2025</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSubmit(selectedClasses)}
              className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Search and Filter */}
          <div className="space-y-4 mb-6">
            {/* Main Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by course code, title, instructor, or CRN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  disabled={loading}
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept === "All" ? "All Subjects" : dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDepartment("All")
                    setSearchTerm("")
                    setCurrentPage(1)
                    fetchCourses(1, true)
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all h-10"
                  disabled={loading}
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Classes List */}
          <div className="max-h-96 overflow-y-auto space-y-4">
            {loading && availableClasses.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin mr-2" />
                <span className="text-gray-600">Loading courses...</span>
              </div>
            )}
            
            {availableClasses.map((availableClass) => {
              const isSelected = isClassSelected(availableClass.id)
              const hasConflict = !isSelected && hasTimeConflict(availableClass)

              return (
                <div
                  key={availableClass.id}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "border-green-300 bg-green-50"
                      : hasConflict
                        ? "border-red-200 bg-red-50 opacity-60"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="mb-2">
                        <h4 className="font-bold text-xl text-black">
                          {availableClass.subject} {availableClass.courseNumber}-{availableClass.section}
                        </h4>
                      </div>
                      <h5 className="text-lg font-semibold text-gray-800 mb-1">{availableClass.title}</h5>
                      <p className="text-gray-600 mb-2">
                        <span className="font-medium">Instructor:</span> {availableClass.instructor}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>CRN: {availableClass.crn}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          <span>{availableClass.term}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {hasConflict && <div className="text-red-600 text-sm font-semibold mb-2">Time Conflict!</div>}
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                        <Users className="w-4 h-4" />
                        <span>
                          {availableClass.enrolled}/{availableClass.capacity} enrolled
                        </span>
                      </div>
                      <button
                        onClick={() => !hasConflict && toggleClass(availableClass)}
                        disabled={hasConflict}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          isSelected
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : hasConflict
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-black text-white hover:bg-gray-800"
                        }`}
                      >
                        {isSelected ? "Added ✓" : hasConflict ? "Conflict" : "Add Class"}
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{availableClass.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Meeting Times:</div>
                        {availableClass.meetingTimes.map((mt, index) => (
                          <div key={index} className="text-gray-600">
                            {mt.days.join(", ")} • {formatTime(mt.startTime)} - {formatTime(mt.endTime)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Location:</div>
                        <div className="text-gray-600">{availableClass.room}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {!loading && availableClasses.length === 0 && hasSearched && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-600 mb-2">No classes found</h4>
                <p className="text-gray-500">Try adjusting your search terms or department filter</p>
              </div>
            )}
            
            {/* Load More Button */}
            {currentPage < totalPages && (
              <div className="text-center py-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    `Load More (${currentPage}/${totalPages})`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 p-6 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedClasses.length === 0}
            className="flex-2 px-8 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add {selectedClasses.length} Class{selectedClasses.length !== 1 ? "es" : ""} to Schedule
          </button>
        </div>
      </div>
    </div>
  )
}
