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
    { role: "assistant", content: "System initialized. I'm CareerPilot. To build your autonomous profile, I need to understand your trajectory. What career path are we targeting?" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
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
        setTimeout(() => onComplete(res.data.profile), 1500)
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Signal interrupted. Re-establishing connection..."
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cp-shell">
      {/* High-Visibility Industrial Grid */}
      <div className="cp-industrial-grid" />

      <div className="cp-container">
        {/* Header */}
        <header className="cp-header">
          <div className="cp-brand">
            <div className="cp-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="cp-text">
              <h1 className="cp-title">CAREERPILOT <span className="cp-ver"></span></h1>
            </div>
          </div>
        </header>

        {/* Broad Terminal Window */}
        <div className="cp-window">
          <div className="cp-log">
            {messages.map((m, i) => (
              <div key={i} className={`cp-row ${m.role === "user" ? "user" : "ai"}`}>
                <div className="cp-bubble">
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="cp-row ai">
                <div className="cp-bubble loading-state">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Interface */}
          <div className="cp-input-zone">
            <input
              className="cp-main-input"
              placeholder="AWAITING INPUT..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
            />
            <button className="cp-enter-btn" onClick={send} disabled={loading}>
              ENTER
            </button>
          </div>
          <footer className="cp-sub-footer">
            
          </footer>
        </div>
      </div>

      <style jsx>{`
        .cp-shell {
          height: 100vh;
          width: 100vw;
          background-color: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        /* The Moving Background Grid */
        .cp-industrial-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(249, 115, 22, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(249, 115, 22, 0.07) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: moveGrid 30s linear infinite;
          z-index: 1;
        }

        @keyframes moveGrid {
          from { background-position: 0 0; }
          to { background-position: 60px 60px; }
        }

        .cp-container {
          width: 92%;
          max-width: 1100px;
          height: 85vh;
          display: flex;
          flex-direction: column;
          z-index: 10;
        }

        .cp-header {
          margin-bottom: 12px;
          padding: 0 4px;
        }

        .cp-brand { display: flex; align-items: center; gap: 14px; }
        .cp-logo {
          background: #171717;
          border: 1px solid #404040;
          padding: 10px;
          border-radius: 4px;
        }

        .cp-title { font-size: 14px; font-weight: 900; margin: 0; letter-spacing: 2px; color: #fff; }
        .cp-ver { color: #f97316; font-size: 10px; }
        .cp-status { font-size: 9px; color: #737373; margin: 4px 0 0 0; font-family: monospace; letter-spacing: 1px; }

        .cp-window {
          flex: 1;
          background: #111111;
          border: 1px solid #262626;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .cp-log {
          flex: 1;
          overflow-y: auto;
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .cp-row { display: flex; width: 100%; }
        .cp-row.ai { justify-content: flex-start; }
        .cp-row.user { justify-content: flex-end; }

        .cp-bubble {
          max-width: 75%;
          padding: 16px 20px;
          font-size: 14px;
          line-height: 1.6;
        }

        .ai .cp-bubble {
          background: #1a1a1a;
          border-left: 3px solid #f97316;
          color: #d4d4d4;
        }

        .user .cp-bubble {
          background: #f97316;
          color: #000;
          font-weight: 700;
          border-radius: 2px;
        }

        .cp-input-zone {
          padding: 24px 40px;
          background: #0d0d0d;
          border-top: 1px solid #262626;
          display: flex;
          gap: 16px;
        }

        .cp-main-input {
          flex: 1;
          background: #000;
          border: 1px solid #404040;
          padding: 14px 20px;
          color: #fff;
          outline: none;
          font-family: monospace;
          font-size: 14px;
        }

        .cp-main-input:focus { border-color: #f97316; }

        .cp-enter-btn {
          background: #f97316;
          color: #000;
          border: none;
          padding: 0 30px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .cp-enter-btn:hover { background: #fb923c; }
        .cp-enter-btn:disabled { background: #404040; color: #737373; cursor: not-allowed; }

        .cp-sub-footer {
          background: #0a0a0a;
          font-size: 8px;
          color: #404040;
          letter-spacing: 2px;
          text-align: center;
          padding: 10px;
          font-family: monospace;
          border-top: 1px solid #1a1a1a;
        }

        .loading-state { display: flex; gap: 6px; }
        .loading-state span { 
          width: 5px; height: 5px; background: #f97316; border-radius: 50%; 
          animation: blink 1s infinite alternate; 
        }
        .loading-state span:nth-child(2) { animation-delay: 0.2s; }
        .loading-state span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes blink { from { opacity: 0.2; } to { opacity: 1; } }

        .cp-log::-webkit-scrollbar { width: 4px; }
        .cp-log::-webkit-scrollbar-thumb { background: #262626; }
      `}</style>
    </div>
  )
}
