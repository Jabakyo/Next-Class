"use client"

import React, { useState, useEffect } from "react"
// // Removed lucide-react import
// Temporary icon replacements
const X = () => <span>❌</span>
const Plus = () => <span>➕</span>
const Trash2 = () => <span>🗑️</span>
const Clock = () => <span>⏰</span>
const MapPin = () => <span>📍</span>
const Users = () => <span>👥</span>
const BookOpen = () => <span>📚</span>
const Search = () => <span>🔍</span>
const Edit3 = () => <span>✏️</span>

import type { SelectedClass, MeetingTime } from "@/types/user"
import { CourseSelection } from "@/components/course-selection"

interface EnhancedClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (classData: SelectedClass) => void
  onDelete?: (classId: string) => void
  existingClass?: SelectedClass | null
  mode: 'add' | 'edit'
  userId: string
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TERMS = ['Fall 2024', 'Spring 2025', 'Summer 2025', 'Fall 2025']

export default function EnhancedClassModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onDelete,
  existingClass, 
  mode,
  userId
}: EnhancedClassModalProps) {
  const [formData, setFormData] = useState<SelectedClass>({
    id: '',
    subject: '',
    courseNumber: '',
    section: '',
    crn: '',
    term: 'Fall 2024',
    title: '',
    instructor: '',
    meetingTimes: [],
    room: ''
  })

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [viewMode, setViewMode] = useState<'search' | 'manual'>('search')

  useEffect(() => {
    if (mode === 'edit' && existingClass) {
      setFormData(existingClass)
      setViewMode('manual') // When editing, always show manual form
    } else if (mode === 'add') {
      setFormData({
        id: `class-${Date.now()}`,
        subject: '',
        courseNumber: '',
        section: '',
        crn: '',
        term: 'Fall 2024',
        title: '',
        instructor: '',
        meetingTimes: [],
        room: ''
      })
      setViewMode('search') // When adding, show search by default
    }
  }, [mode, existingClass, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.subject || !formData.courseNumber || !formData.title) {
      alert('Please fill in all required fields (Subject, Course Number, and Title)')
      return
    }

    onSubmit(formData)
    onClose()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleAddMeetingTime = () => {
    setFormData(prev => ({
      ...prev,
      meetingTimes: [
        ...prev.meetingTimes,
        {
          days: [],
          startTime: '09:00',
          endTime: '10:00'
        }
      ]
    }))
  }

  const handleRemoveMeetingTime = (index: number) => {
    setFormData(prev => ({
      ...prev,
      meetingTimes: prev.meetingTimes.filter((_, i) => i !== index)
    }))
  }

  const handleMeetingTimeChange = (index: number, field: keyof MeetingTime, value: any) => {
    setFormData(prev => ({
      ...prev,
      meetingTimes: prev.meetingTimes.map((meeting, i) => 
        i === index ? { ...meeting, [field]: value } : meeting
      )
    }))
  }

  const handleDayToggle = (meetingIndex: number, day: string) => {
    const meeting = formData.meetingTimes[meetingIndex]
    const newDays = meeting.days.includes(day)
      ? meeting.days.filter(d => d !== day)
      : [...meeting.days, day]
    
    handleMeetingTimeChange(meetingIndex, 'days', newDays)
  }

  const handleDelete = () => {
    if (onDelete && existingClass) {
      onDelete(existingClass.id)
      onClose()
    }
  }

  const handleCourseAdded = (addedCourse: any) => {
    // Convert the added course format to SelectedClass format
    const selectedClass: SelectedClass = {
      id: addedCourse.id,
      subject: addedCourse.subject,
      courseNumber: addedCourse.courseNumber,
      section: addedCourse.section,
      crn: addedCourse.id, // Use course ID as CRN for now
      term: addedCourse.term || 'Fall 2025',
      title: addedCourse.title,
      instructor: addedCourse.instructor,
      meetingTimes: addedCourse.meetingTimes || [],
      room: addedCourse.room || ''
    }
    
    onSubmit(selectedClass)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl">
          <div>
            <h3 className="text-2xl font-bold text-black flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              {mode === 'add' ? 'Add New Class' : 'Edit Class'}
            </h3>
            {mode === 'add' && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setViewMode('search')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'search' 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Search className="w-4 h-4 inline mr-2" />
                  Search Catalog
                </button>
                <button
                  onClick={() => setViewMode('manual')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'manual' 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Edit3 className="w-4 h-4 inline mr-2" />
                  Manual Entry
                </button>
              </div>
            )}
            <p className="text-gray-600 text-sm mt-2">
              {mode === 'add' ? (
                viewMode === 'search' 
                  ? 'Search and add courses from the catalog' 
                  : 'Manually enter class information'
              ) : (
                'Update class information'
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Show course search for add mode when in search view */}
          {mode === 'add' && viewMode === 'search' && (
            <CourseSelection userId={userId} onCourseAdded={handleCourseAdded} />
          )}

          {/* Show manual form for edit mode or add mode when in manual view */}
          {(mode === 'edit' || viewMode === 'manual') && (
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="e.g., MATH, COMP, HIST"
              />
            </div>

            <div>
              <label htmlFor="courseNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                Course Number *
              </label>
              <input
                type="text"
                id="courseNumber"
                name="courseNumber"
                value={formData.courseNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="e.g., 151, 220"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="section" className="block text-sm font-semibold text-gray-700 mb-2">
                Section
              </label>
              <input
                type="text"
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="e.g., 01, 02A"
              />
            </div>

            <div>
              <label htmlFor="crn" className="block text-sm font-semibold text-gray-700 mb-2">
                CRN
              </label>
              <input
                type="text"
                id="crn"
                name="crn"
                value={formData.crn}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="e.g., 12345"
              />
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Course Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="e.g., Calculus I, Introduction to Computer Science"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="instructor" className="block text-sm font-semibold text-gray-700 mb-2">
                Instructor
              </label>
              <input
                type="text"
                id="instructor"
                name="instructor"
                value={formData.instructor}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="Professor name"
              />
            </div>

            <div>
              <label htmlFor="room" className="block text-sm font-semibold text-gray-700 mb-2">
                Room
              </label>
              <input
                type="text"
                id="room"
                name="room"
                value={formData.room}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="e.g., Room 204, Online"
              />
            </div>
          </div>

          <div>
            <label htmlFor="term" className="block text-sm font-semibold text-gray-700 mb-2">
              Term
            </label>
            <select
              id="term"
              name="term"
              value={formData.term}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            >
              {TERMS.map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>

          {/* Meeting Times */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Meeting Times
              </h4>
              <button
                type="button"
                onClick={handleAddMeetingTime}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Time
              </button>
            </div>

            {formData.meetingTimes.map((meeting, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">Meeting Time {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMeetingTime(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Days Selection */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(index, day)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          meeting.days.includes(day)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={meeting.startTime}
                      onChange={(e) => handleMeetingTimeChange(index, 'startTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={meeting.endTime}
                      onChange={(e) => handleMeetingTimeChange(index, 'endTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            ))}

            {formData.meetingTimes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No meeting times added yet</p>
                <p className="text-sm">Click "Add Time" to add class meeting times</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            {mode === 'edit' && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 border-2 border-red-200 text-red-600 rounded-full font-semibold hover:bg-red-50 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            
            <div className="flex-1 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-full font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                {mode === 'add' ? 'Add Class' : 'Save Changes'}
              </button>
            </div>
          </div>
            </form>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 rounded-3xl">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h4 className="text-lg font-bold text-gray-900 mb-3">Delete Class?</h4>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this class? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}