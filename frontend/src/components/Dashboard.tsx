"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import RoadmapView from "./RoadmapView"
import Approvals from "./Approvals"
import ReasoningLog from "./ReasoningLog"
import JobTracker from "./JobTracker"
import AgentStatus from "./AgentStatus"

const API = "http://localhost:8000"

interface Props {
  userId: string
  profile: any
}

export default function Dashboard({ userId, profile }: Props) {
  const [state, setState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("roadmap")

  // Start the agent graph on mount
  useEffect(() => {
    const startAgents = async () => {
      try {
        const res = await axios.post(`${API}/api/start`, {
          user_id: userId,
          profile
        })
        setState(res.data.state)
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    startAgents()
  }, [])

  // Poll state every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/api/state/${userId}`)
        if (res.data.state) setState(res.data.state)
      } catch {}
    }, 10000)
    return () => clearInterval(interval)
  }, [userId])

  const handleApprove = async (itemType: string, approved: boolean, itemData: any) => {
    const res = await axios.post(`${API}/api/approve`, {
      user_id: userId,
      item_type: itemType,
      approved,
      item_data: itemData
    })
    if (res.data.state) setState(res.data.state)
  }

  const tabs = ["roadmap", "courses", "schedule", "jobs", "reasoning", "approvals"]

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-blue-400 text-xl mb-2">Launching agents...</div>
        <div className="text-gray-400 text-sm">Researching job market, building your roadmap</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-400">CareerPilot</h1>
        <div className="flex items-center gap-4">
          <AgentStatus nextAgent={state?.next_agent} />
          <div className="text-sm text-gray-400">
            {profile.career_goal} • {profile.current_level}
          </div>
        </div>
      </div>

      {/* Job readiness bar */}
      {state?.evaluation?.readiness_score && (
        <div className="bg-gray-900 px-6 py-3 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Job Readiness</span>
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${state.evaluation.readiness_score}%` }}
              />
            </div>
            <span className="text-sm font-medium text-blue-400">
              {state.evaluation.readiness_score}%
            </span>
            {state.job_ready && (
              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                Job Ready!
              </span>
            )}
          </div>
        </div>
      )}

      {/* Approval banner */}
      {state?.pending_approvals?.length > 0 && (
        <div className="bg-yellow-900 border-b border-yellow-700 px-6 py-2 text-yellow-200 text-sm">
          ⏳ {state.pending_approvals.length} item(s) waiting for your approval
          <button
            onClick={() => setActiveTab("approvals")}
            className="ml-2 underline"
          >
            Review now
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-6">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
            {tab === "approvals" && state?.pending_approvals?.length > 0 && (
              <span className="ml-1 bg-yellow-600 text-white text-xs px-1.5 rounded-full">
                {state.pending_approvals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === "roadmap" && <RoadmapView roadmap={state?.roadmap} progress={state?.progress} />}
        {activeTab === "courses" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state?.courses?.map((c: any, i: number) => (
              <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="font-medium">{c.title}</div>
                <div className="text-sm text-gray-400 mt-1">{c.platform} • ⭐ {c.rating}</div>
                <div className="text-sm text-gray-400">{c.duration_hours} hrs • {c.cost}</div>
                <div className="text-sm text-blue-400 mt-2">{c.why_recommended}</div>
              </div>
            ))}
          </div>
        )}
        {activeTab === "schedule" && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="font-semibold mb-4">Weekly Schedule</h2>
            {state?.schedule?.weekly_schedule && Object.entries(state.schedule.weekly_schedule).map(([day, info]: any) => (
              <div key={day} className="flex items-center gap-4 py-3 border-b border-gray-800">
                <span className="w-24 text-gray-400 text-sm">{day}</span>
                <span className="flex-1">{info.task}</span>
                <span className="text-sm text-gray-400">{info.duration_hrs}h • {info.time}</span>
              </div>
            ))}
          </div>
        )}
        {activeTab === "jobs" && <JobTracker jobs={state?.job_listings} />}
        {activeTab === "reasoning" && <ReasoningLog log={state?.reasoning_log} />}
        {activeTab === "approvals" && (
          <Approvals
            approvals={state?.pending_approvals || []}
            onApprove={handleApprove}
          />
        )}
      </div>
    </div>
  )
}


