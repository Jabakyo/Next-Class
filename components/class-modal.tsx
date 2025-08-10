"use client"

import type React from "react"

import { useState } from "react"
// Temporary icon replacements
const X = () => <span>❌</span>


interface ClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (classData: { name: string; room: string; professor: string }) => void
}

export default function ClassModal({ isOpen, onClose, onSubmit }: ClassModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    room: "",
    professor: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({ name: "", room: "", professor: "" })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-2xl font-bold text-black">Add Class</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Class Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              placeholder="e.g., MATH 151"
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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              placeholder="e.g., Room 204"
            />
          </div>

          <div>
            <label htmlFor="professor" className="block text-sm font-semibold text-gray-700 mb-2">
              Professor
            </label>
            <input
              type="text"
              id="professor"
              name="professor"
              value={formData.professor}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              placeholder="Professor name"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-full font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Add Class
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
