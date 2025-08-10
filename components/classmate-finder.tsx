"use client"

import { useState, useEffect } from "react"
// // Removed lucide-react import
// Temporary icon replacements
const Users = () => <span>👥</span>
const Search = () => <span>🔍</span>
const BookOpen = () => <span>📚</span>
const Clock = () => <span>⏰</span>
const MapPin = () => <span>📍</span>

import type { User, SelectedClass } from "@/types/user"

interface ClassmateFinderProps {
  user: User
  onClose: () => void
}

export default function ClassmateFinder({ user, onClose }: ClassmateFinderProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("All")
  const [classmates, setClassmates] = useState<{ user: User; sharedClasses: SelectedClass[] }[]>([])

  useEffect(() => {
    // Load other users and find classmates from API instead of localStorage
    const loadClassmates = async () => {
      try {
        const response = await fetch('/api/users/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: '' }) // Empty query to get all users
        })
        
        if (response.ok) {
          const data = await response.json()
          const otherUsers = data.users.filter((u: User) => u.id !== user.id && u.hasSharedSchedule && (u.selectedClasses || u.classes))

          const classmateData = otherUsers
            .map((otherUser: User) => {
              const userClasses = user.selectedClasses || user.classes || []
              const otherUserClasses = otherUser.selectedClasses || otherUser.classes || []
              
              const sharedClasses = userClasses.filter((userClass) =>
                otherUserClasses.some((otherClass) => otherClass.id === userClass.id),
              )

              return { user: otherUser, sharedClasses }
            })
            .filter(({ sharedClasses }) => sharedClasses.length > 0)

          setClassmates(classmateData)
        }
      } catch (error) {
        console.error('Error loading classmates:', error)
        // Fallback to empty array instead of localStorage
        setClassmates([])
      }
    }
    
    loadClassmates()
  }, [user])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const filteredClassmates = classmates.filter(({ user: classmate, sharedClasses }) => {
    const matchesSearch = classmate.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = selectedClass === "All" || sharedClasses.some((cls) => cls.id === selectedClass)
    return matchesSearch && matchesClass
  })

  const userClasses = user.selectedClasses || user.classes || []

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50 p-4 pt-20">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[70vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 mb-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-black" />
            <h3 className="text-2xl font-bold text-black">Find Classmates</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <span className="text-2xl text-gray-500">×</span>
          </button>
        </div>

        <div className="p-6">
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search classmates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
            >
              <option value="All">All Classes</option>
              {userClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.subject} {cls.courseNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Summary */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">
              Found {filteredClassmates.length} classmates in your courses
            </h4>
            <p className="text-sm text-blue-700">
              These students share at least one class with you and have made their schedules public.
            </p>
          </div>

          {/* Classmates List */}
          <div className="max-h-96 overflow-y-auto space-y-4">
            {filteredClassmates.length > 0 ? (
              filteredClassmates.map(({ user: classmate, sharedClasses }) => (
                <div key={classmate.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {classmate.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-black">{classmate.name}</h4>
                        <p className="text-gray-600 text-sm">{classmate.email}</p>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {sharedClasses.length} shared class{sharedClasses.length !== 1 ? "es" : ""}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Shared Classes:
                    </h5>
                    {sharedClasses.map((sharedClass) => (
                      <div key={sharedClass.id} className="ml-6 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h6 className="font-semibold text-black">{sharedClass.subject} {sharedClass.courseNumber}</h6>
                            <p className="text-sm text-gray-600">{sharedClass.title}</p>
                            <p className="text-sm text-gray-500">{sharedClass.instructor}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                          {sharedClass.meetingTimes.map((mt, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {mt.days.join(", ")} {formatTime(mt.startTime)}-{formatTime(mt.endTime)}
                            </div>
                          ))}
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {sharedClass.room}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-600 mb-2">No classmates found</h4>
                <p className="text-gray-500">
                  {searchTerm || selectedClass !== "All"
                    ? "Try adjusting your search filters"
                    : "No other students are sharing schedules with classes in common"}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
