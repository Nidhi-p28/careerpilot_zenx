"use client"
import { useState, useRef, useEffect } from "react"
import axios from "axios"

const API = "http://localhost:8000"

interface Props {
  userId: string
  onComplete: (profile: any) => void
}

export default function Wizard({ userId, onComplete }: Props) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm CareerPilot. Let's set up your career profile. What career are you aiming for?" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    try {
      const res = await axios.post(`${API}/wizard/chat`, {
        user_id: userId,
        message: userMsg
      })

      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.data.reply
      }])

      if (res.data.profile_complete) {
        setTimeout(() => onComplete(res.data.profile), 1000)
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Something went wrong. Please try again."
      }])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400">CareerPilot</h1>
          <p className="text-gray-400 mt-2">Your Autonomous Career Intelligence System</p>
        </div>

        {/* Chat */}
        <div className="bg-gray-900 rounded-2xl p-4 h-96 overflow-y-auto flex flex-col gap-3 mb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-100"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 px-4 py-2 rounded-2xl text-gray-400 text-sm">
                Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your answer..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
          />
          <button
            onClick={send}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-medium disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}