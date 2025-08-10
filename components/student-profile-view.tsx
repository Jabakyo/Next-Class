"use client"

import { Calendar, Clock, MapPin, User, BookOpen, Users, Mail, GraduationCap, Instagram } from "lucide-react"
import type { SelectedClass } from "@/types/user"

interface StudentProfileViewProps {
  selectedClasses: SelectedClass[]
  studentName: string
  studentEmail: string
  studentInstagram?: string
}

// Helper function to format time
const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":")
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${minutes} ${ampm}`
}

// Helper function to get day abbreviation
const getDayAbbr = (day: string) => {
  const abbr: { [key: string]: string } = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun"
  }
  return abbr[day] || day.substring(0, 3)
}

export default function StudentProfileView({ selectedClasses, studentName, studentEmail, studentInstagram }: StudentProfileViewProps) {
  // Group classes by day for a quick overview
  const classesByDay: { [key: string]: SelectedClass[] } = {}
  selectedClasses.forEach(cls => {
    cls.meetingTimes.forEach(mt => {
      mt.days.forEach(day => {
        if (!classesByDay[day]) classesByDay[day] = []
        classesByDay[day].push(cls)
      })
    })
  })

  // Sort days
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const sortedDays = Object.keys(classesByDay).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">{selectedClasses.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-100 rounded-full">
              <Instagram className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Instagram</p>
              {studentInstagram ? (
                studentInstagram.startsWith('http') ? (
                  <a 
                    href={studentInstagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-pink-600 hover:text-pink-700 underline break-all"
                  >
                    {studentInstagram.length > 20 ? `${studentInstagram.substring(0, 20)}...` : studentInstagram}
                  </a>
                ) : (
                  <p className="text-sm font-semibold text-pink-600 break-all">{studentInstagram}</p>
                )
              ) : (
                <p className="text-sm text-gray-400">Not provided</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Overview */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          Weekly Schedule Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {dayOrder.slice(0, 5).map(day => (
            <div key={day} className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{getDayAbbr(day)}</h4>
              {classesByDay[day] ? (
                <div className="space-y-2">
                  {[...new Set(classesByDay[day].map(cls => cls.id))].map(classId => {
                    const cls = classesByDay[day].find(c => c.id === classId)!
                    const timeSlot = cls.meetingTimes.find(mt => mt.days.includes(day))!
                    return (
                      <div key={`${day}-${classId}`} className="text-xs">
                        <p className="font-medium text-gray-700">{cls.subject} {cls.courseNumber}</p>
                        <p className="text-gray-500">
                          {formatTime(timeSlot.startTime)} - {formatTime(timeSlot.endTime)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No classes</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Class Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-gray-600" />
          Course Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedClasses.map((cls) => (
            <div key={cls.id} className="bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow">
              <div className="mb-3">
                <h4 className="font-bold text-gray-900 text-lg">
                  {cls.subject} {cls.courseNumber}-{cls.section}
                </h4>
                <p className="text-gray-700 font-medium">{cls.title}</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{cls.instructor}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <div>
                    {cls.meetingTimes.map((mt, idx) => (
                      <div key={idx}>
                        {mt.days.map(d => getDayAbbr(d)).join(", ")} • {formatTime(mt.startTime)} - {formatTime(mt.endTime)}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{cls.room}</span>
                </div>
                
                {cls.crn && (
                  <div className="flex items-center gap-2 text-gray-500 text-xs mt-2">
                    <span className="font-medium">CRN:</span>
                    <span>{cls.crn}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}