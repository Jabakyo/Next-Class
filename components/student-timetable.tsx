"use client"

import type { SelectedClass } from "@/types/user"
// // Removed lucide-react import
// Temporary icon replacements
const Clock = () => <span>⏰</span>
const MapPin = () => <span>📍</span>
const BookOpen = () => <span>📚</span>
const GraduationCap = () => <span>🎓</span>
const User = () => <span>👤</span>


interface StudentTimetableProps {
  selectedClasses: SelectedClass[]
  studentName: string
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const timeSlots = [
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
]

export default function StudentTimetable({ selectedClasses, studentName }: StudentTimetableProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getClassAtTime = (day: string, time: string) => {
    for (const selectedClass of selectedClasses) {
      for (const meetingTime of selectedClass.meetingTimes) {
        if (meetingTime.days.includes(day) && time >= meetingTime.startTime && time < meetingTime.endTime) {
          return selectedClass
        }
      }
    }
    return null
  }

  const getClassDuration = (selectedClass: SelectedClass, day: string, startTime: string) => {
    const meetingTime = selectedClass.meetingTimes.find(
      (mt) => mt.days.includes(day) && startTime >= mt.startTime && startTime < mt.endTime,
    )
    if (!meetingTime) return 1

    const startIndex = timeSlots.indexOf(meetingTime.startTime)
    const endIndex = timeSlots.findIndex((time) => time >= meetingTime.endTime)
    return endIndex - startIndex
  }

  const shouldShowClass = (selectedClass: SelectedClass, day: string, time: string) => {
    const meetingTime = selectedClass.meetingTimes.find(
      (mt) => mt.days.includes(day) && time >= mt.startTime && time < mt.endTime,
    )
    return meetingTime && time === meetingTime.startTime
  }


  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-black">{studentName}'s Schedule</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span>
              {selectedClasses.length} class{selectedClasses.length !== 1 ? "es" : ""}
            </span>
            <span>•</span>
            <span>Fall 2024</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-6 gap-1 bg-gray-200 rounded-2xl p-1 min-w-[1000px]">
          {/* Header row */}
          <div className="bg-gray-100 rounded-xl p-4 text-center font-semibold text-gray-600">Time</div>
          {days.map((day) => (
            <div key={day} className="bg-black text-white rounded-xl p-4 text-center font-bold">
              {day}
            </div>
          ))}

          {/* Time slots */}
          {timeSlots.map((time) => (
            <>
              <div
                key={time}
                className="bg-white rounded-xl p-2 text-center font-semibold text-black flex flex-col justify-center min-h-[60px]"
              >
                <div className="text-sm">{formatTime(time)}</div>
              </div>
              {days.map((day) => {
                const classAtTime = getClassAtTime(day, time)
                if (classAtTime && shouldShowClass(classAtTime, day, time)) {
                  const duration = getClassDuration(classAtTime, day, time)
                  return (
                    <div
                      key={`${day}-${time}`}
                      className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-3 min-h-[60px] flex flex-col justify-center hover:from-blue-100 hover:to-blue-150 transition-colors"
                      style={{ gridRow: `span ${duration}` }}
                    >
                      <div className="text-center">
                        <div className="font-bold text-blue-800 text-sm">
                          {classAtTime.subject} {classAtTime.courseNumber}-{classAtTime.section}
                        </div>
                        <div className="text-xs text-blue-700 mt-1 font-medium">{classAtTime.title}</div>
                        <div className="text-xs text-blue-600 mt-1">{classAtTime.room}</div>
                        <div className="text-xs text-blue-500 mt-1">
                          {formatTime(classAtTime.meetingTimes.find((mt) => mt.days.includes(day))?.startTime || "")} -{" "}
                          {formatTime(classAtTime.meetingTimes.find((mt) => mt.days.includes(day))?.endTime || "")}
                        </div>
                      </div>
                    </div>
                  )
                } else if (!classAtTime) {
                  return (
                    <div key={`${day}-${time}`} className="bg-gray-50 rounded-xl min-h-[60px] border border-gray-200" />
                  )
                } else {
                  // This slot is part of a class that started earlier
                  return null
                }
              })}
            </>
          ))}
        </div>
      </div>

      {selectedClasses.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-black mb-4">Class Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedClasses.map((selectedClass) => (
              <div
                key={selectedClass.id}
                className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="mb-3">
                  <h4 className="font-bold text-lg text-black">
                    {selectedClass.subject} {selectedClass.courseNumber}-{selectedClass.section}
                  </h4>
                  <p className="text-base text-gray-800 font-medium">{selectedClass.title}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      <span className="font-medium">Instructor:</span> {selectedClass.instructor}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      <span className="font-medium">CRN:</span> {selectedClass.crn}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      <span className="font-medium">Term:</span> {selectedClass.term}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 mt-3">
                    <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Meeting Times:</div>
                      {selectedClass.meetingTimes.map((mt, index) => (
                        <div key={index} className="text-gray-600 text-xs">
                          {mt.days.join(", ")} • {formatTime(mt.startTime)} - {formatTime(mt.endTime)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      <span className="font-medium">Location:</span> {selectedClass.room}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
