"use client"

import { useEffect } from "react"
// Temporary icon replacements
const CheckCircle = () => <span>✅</span>
const XCircle = () => <span>⭐</span>
const X = () => <span>❌</span>


interface NotificationProps {
  message: string
  type: "success" | "error"
  onClose: () => void
}

export default function Notification({ message, type, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-4 duration-300">
      <div
        className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-lg backdrop-blur-md ${
          type === "success" ? "bg-black text-white" : "bg-gray-800 text-white"
        }`}
      >
        {type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
