"use client"

import { useState, useEffect } from "react"
// import { Plus, Calendar, Clock, User } from "lucide-react"
// Temporary icon replacements
const Plus = () => <span>➕</span>
const Calendar = () => <span>📅</span>
const Clock = () => <span>⏰</span>
const User = () => <span>👤</span>

import type { SelectedClass, User as UserType } from "@/types/user"

interface TimetableProps {
  selectedClasses: SelectedClass[]
  onAddClass: () => void
  user: UserType
}

// Generate time slots for New York timezone display
const generateTimeSlots = () => {
  const slots = []
  // Start from 6 AM and go to 11 PM to cover typical class hours
  for (let hour = 6; hour <= 23; hour++) {
    // Create time string in 12-hour format
    let displayHour = hour
    let period = 'AM'
    
    if (hour === 0) {
      displayHour = 12
    } else if (hour === 12) {
      period = 'PM'
    } else if (hour > 12) {
      displayHour = hour - 12
      period = 'PM'
    }
    
    const timeString = `${displayHour}:00 ${period}`
    slots.push(timeString)
  }
  return slots
}

const timeSlots = generateTimeSlots()

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

export default function Timetable({ selectedClasses, onAddClass, user }: TimetableProps) {
  const [hoveredClass, setHoveredClass] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/New_York'
    }
    return date.toLocaleDateString('en-US', options)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York'
    })
  }

  const getCurrentTimeSlot = () => {
    // Get current time in New York timezone
    const nyTime = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit"
    })
    
    const [hourStr, minuteStr] = nyTime.split(':')
    const hour = parseInt(hourStr)
    const minutes = parseInt(minuteStr)
    const totalMinutes = hour * 60 + minutes
    
    // Check which time slot we're currently in
    for (let i = 0; i < timeSlots.length; i++) {
      const [slotHour, slotPeriod] = timeSlots[i].split(' ')
      const [slotHourStr] = slotHour.split(':')
      let hour24 = parseInt(slotHourStr)
      
      if (slotPeriod === 'PM' && hour24 !== 12) hour24 += 12
      if (slotPeriod === 'AM' && hour24 === 12) hour24 = 0
      
      const slotMinutes = hour24 * 60
      
      if (totalMinutes >= slotMinutes && totalMinutes < slotMinutes + 60) {
        return i
      }
    }
    return -1
  }

  // Get current day in New York timezone (0 = Monday, 4 = Friday)
  const getCurrentDayIndex = () => {
    const today = new Date()
    // Get the day name in NY timezone
    const nyDayName = today.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      weekday: "long"
    })
    
    // Map day names to indices (Monday = 0, Friday = 4)
    const dayMap: { [key: string]: number } = {
      'Monday': 0,
      'Tuesday': 1, 
      'Wednesday': 2,
      'Thursday': 3,
      'Friday': 4,
      'Saturday': -1, // Weekend
      'Sunday': -1    // Weekend
    }
    
    return dayMap[nyDayName] || -1
  }

  // Convert 24-hour time to 12-hour format for display
  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${period}`
  }
  
  const currentDayIndex = getCurrentDayIndex()
  const currentTimeSlotIndex = getCurrentTimeSlot()

  // Helper functions for time conversion
  const convert12to24 = (time12: string) => {
    const [time, period] = time12.split(' ')
    const [hours, minutes] = time.split(':')
    let hour24 = parseInt(hours)
    
    if (period === 'AM') {
      if (hour24 === 12) hour24 = 0
    } else if (period === 'PM') {
      if (hour24 !== 12) hour24 += 12
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`
  }

  const timeToMinutes = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Get classes that start in a specific time slot
  const getClassesForTimeSlot = (day: string, timeSlot: string) => {
    const slotTime24 = convert12to24(timeSlot)
    const slotStartMinutes = timeToMinutes(slotTime24)
    const slotEndMinutes = slotStartMinutes + 60

    return selectedClasses.filter((cls) => {
      if (!cls.meetingTimes || cls.meetingTimes.length === 0) return false

      return cls.meetingTimes.some(meetingTime => {
        const classDays = meetingTime.days || []
        const startTime = meetingTime.startTime
        const endTime = meetingTime.endTime

        if (!classDays.includes(day) || !startTime || !endTime) return false

        const classStartMinutes = timeToMinutes(startTime)
        
        // Only show class in the slot where it starts
        return classStartMinutes >= slotStartMinutes && classStartMinutes < slotEndMinutes
      })
    }).map(cls => {
      // Add calculated properties for rendering
      const relevantMeetingTime = cls.meetingTimes.find(mt => 
        mt.days.includes(day) && mt.startTime && mt.endTime
      )
      
      if (relevantMeetingTime) {
        const startMinutes = timeToMinutes(relevantMeetingTime.startTime)
        const endMinutes = timeToMinutes(relevantMeetingTime.endTime)
        const durationMinutes = endMinutes - startMinutes
        
        // Calculate position within the hour slot
        const slotStartMinutes = timeToMinutes(slotTime24)
        const offsetMinutes = startMinutes - slotStartMinutes
        
        return {
          ...cls,
          _renderInfo: {
            durationMinutes,
            offsetMinutes,
            startTime: relevantMeetingTime.startTime,
            endTime: relevantMeetingTime.endTime
          }
        }
      }
      return cls
    })
  }



  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Class Schedule</h2>
            <p className="text-sm text-gray-600">
              {selectedClasses.length} {selectedClasses.length === 1 ? "class" : "classes"}
            </p>
          </div>
        </div>
        
        {/* Date and Time Display */}
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">{formatDate(currentTime)}</p>
          <p className="text-sm text-gray-600 flex items-center justify-end gap-1">
            <Clock className="w-4 h-4" />
            {formatTime(currentTime)}
          </p>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header Row */}
          <div className="grid grid-cols-6 gap-2 mb-4">
            <div className="py-3 px-3 text-center text-sm font-bold text-gray-800 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg shadow-sm border border-gray-300">Time</div>
            {days.map((day, index) => (
              <div 
                key={day} 
                className={`py-3 px-3 text-center text-sm font-bold rounded-lg shadow-sm border transition-all ${
                  index === currentDayIndex && currentDayIndex >= 0 && currentDayIndex <= 4
                    ? "text-white bg-gradient-to-r from-blue-600 to-blue-700 border-blue-800 shadow-md"
                    : "text-white bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 hover:from-gray-700 hover:to-gray-800"
                }`}
              >
                {day.substring(0, 3)}
              </div>
            ))}
          </div>

          {/* Continuous Schedule Grid */}
          <div className="grid grid-cols-6 gap-2" style={{ gridTemplateRows: `repeat(${timeSlots.length}, 80px)` }}>
            {/* Time Column */}
            <div className="col-span-1">
              {timeSlots.map((timeSlot, timeIndex) => (
                <div key={timeSlot} className={`h-20 flex items-center justify-center text-sm font-semibold transition-all ${
                  timeIndex === currentTimeSlotIndex
                    ? "text-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg"
                    : "text-gray-700"
                }`}>
                  {timeSlot}
                </div>
              ))}
            </div>
            
            {/* Schedule Columns for each day */}
            {days.map((day, dayIndex) => {
              // Get all classes for this day
              const dayClasses = selectedClasses.filter((cls) => {
                if (!cls.meetingTimes || cls.meetingTimes.length === 0) return false
                return cls.meetingTimes.some(meetingTime => {
                  const classDays = meetingTime.days || []
                  return classDays.includes(day) && meetingTime.startTime && meetingTime.endTime
                })
              }).map(cls => {
                const relevantMeetingTime = cls.meetingTimes.find(mt => 
                  mt.days.includes(day) && mt.startTime && mt.endTime
                )
                
                if (relevantMeetingTime) {
                  const startMinutes = timeToMinutes(relevantMeetingTime.startTime)
                  const endMinutes = timeToMinutes(relevantMeetingTime.endTime)
                  const durationMinutes = endMinutes - startMinutes
                  
                  // Calculate position from the start of the schedule (6 AM = 360 minutes)
                  const scheduleStartMinutes = 6 * 60 // 6 AM
                  const offsetFromScheduleStart = startMinutes - scheduleStartMinutes
                  
                  return {
                    ...cls,
                    _renderInfo: {
                      durationMinutes,
                      offsetFromScheduleStart,
                      startTime: relevantMeetingTime.startTime,
                      endTime: relevantMeetingTime.endTime
                    }
                  }
                }
                return cls
              })
              
              const isCurrentDay = dayIndex === currentDayIndex
              
              return (
                <div key={day} className={`relative col-span-1 ${
                  isCurrentDay ? "bg-gradient-to-b from-blue-50/30 to-blue-100/30 rounded-lg" : ""
                }`} style={{ height: `${timeSlots.length * 80}px` }}>
                  {/* Grid lines for time slots */}
                  {timeSlots.map((_, timeIndex) => (
                    <div 
                      key={timeIndex} 
                      className="absolute left-0 right-0 border-t border-gray-200" 
                      style={{ top: `${timeIndex * 80}px` }}
                    />
                  ))}
                  
                  {/* Class cards positioned absolutely */}
                  {dayClasses.map((cls) => {
                    const renderInfo = cls._renderInfo
                    if (!renderInfo) return null

                    // Calculate position and height
                    const topPx = (renderInfo.offsetFromScheduleStart / 60) * 80 // 80px per hour
                    const heightPx = Math.max(32, (renderInfo.durationMinutes / 60) * 80)

                    return (
                      <div
                        key={`${cls.id}-${day}`}
                        className={`absolute left-1 right-1 p-2 rounded-lg font-medium transition-all cursor-pointer z-10 border overflow-hidden ${
                          hoveredClass === cls.id
                            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg transform scale-[1.02] border-blue-800"
                            : "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md border-blue-400 hover:shadow-lg"
                        }`}
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx}px`,
                          minHeight: '32px'
                        }}
                        onMouseEnter={() => setHoveredClass(cls.id)}
                        onMouseLeave={() => setHoveredClass(null)}
                      >
                        <div className="font-bold text-white truncate text-sm leading-tight">
                          {cls.subject} {cls.courseNumber}
                        </div>
                        <div className="text-blue-100 truncate text-xs font-medium">
                          {cls.room}
                        </div>
                        <div className="text-blue-200 text-xs font-medium">
                          {formatTime12Hour(renderInfo.startTime)}-{formatTime12Hour(renderInfo.endTime)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {selectedClasses.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Classes Added</h3>
          <p className="text-gray-600 mb-6">Start building your schedule by adding your first class</p>
          <button
            onClick={onAddClass}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Add Your First Class
          </button>
        </div>
      )}


    </div>
  )
}
