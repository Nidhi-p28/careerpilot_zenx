"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import RoadmapView from "./RoadmapView"
import Approvals from "./Approvals"
import ReasoningLog from "./ReasoningLog"
import JobTracker from "./JobTracker"
import AgentStatus from "./AgentStatus"

const API = "http://localhost:8000"

export default function Dashboard({ userId, profile }: { userId: string, profile: any }) {
  const [state, setState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("roadmap")
  
  // Loading Sequence State
  const [loadingStep, setLoadingStep] = useState(0)
  const steps = [
    "INITIALIZING_CORE_AGENTS",
    "ESTABLISHING_MARKET_CONNECTION",
    "RESEARCHING_JOB_TRAJECTORY",
    "SYNTHESIZING_ROADMAP",
    "SYSTEM_READY"
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 1200)

    const startAgents = async () => {
      try {
        const res = await axios.post(`${API}/api/start`, { user_id: userId, profile })
        setState(res.data.state)
        // Keep boot screen visible for a moment for the "effect"
        setTimeout(() => setLoading(false), 5000) 
      } catch (e) {
        console.error(e)
        setLoading(false)
      }
    }
    startAgents()
    return () => clearInterval(interval)
  }, [userId, profile])

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
      user_id: userId, item_type: itemType, approved, item_data: itemData
    })
    if (res.data.state) setState(res.data.state)
  }

  if (loading) return (
    <div className="cp-boot-shell">
      <div className="cp-grid" />
      <div className="cp-boot-container">
        <div className="cp-loader-box">
          <h1 className="cp-boot-title">CAREERPILOT_OS_v3.0</h1>
          
          <div className="cp-step-display">
            <span className="cp-step-text">{steps[loadingStep]}</span>
          </div>

          <div className="cp-progress-container">
            <div 
              className="cp-progress-bar" 
              style={{ width: `${((loadingStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="cp-boot-footer">
            RUNNING_PROFILER // STATION_0x442 // {loadingStep + 1}/{steps.length}
          </div>
        </div>
      </div>
      <style jsx>{`
        .cp-boot-shell { height: 100vh; width: 100vw; background: #000; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; font-family: monospace; }
        .cp-grid { position: absolute; inset: 0; background-image: linear-gradient(to right, rgba(249, 115, 22, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(249, 115, 22, 0.05) 1px, transparent 1px); background-size: 50px 50px; opacity: 0.3; }
        .cp-boot-container { z-index: 10; width: 100%; max-width: 400px; padding: 20px; }
        .cp-loader-box { border: 1px solid #262626; background: #0a0a0a; padding: 30px; border-radius: 4px; }
        .cp-boot-title { font-size: 11px; color: #fff; letter-spacing: 2px; margin-bottom: 40px; text-align: center; font-weight: 900; }
        .cp-step-display { height: 20px; margin-bottom: 10px; }
        .cp-step-text { color: #f97316; font-size: 10px; letter-spacing: 1px; display: block; }
        .cp-progress-container { width: 100%; height: 2px; background: #1a1a1a; margin-bottom: 15px; }
        .cp-progress-bar { height: 100%; background: #f97316; transition: width 0.5s ease-in-out; }
        .cp-boot-footer { font-size: 8px; color: #404040; letter-spacing: 1px; display: flex; justify-content: space-between; }
      `}</style>
    </div>
  )

  const tabs = ["roadmap", "courses", "schedule", "jobs", "reasoning", "approvals"]

  return (
    <div className="cp-dashboard-shell">
      <div className="cp-grid" />
      <div className="cp-main-layout">
        <header className="cp-nav">
          <div className="cp-logo-sec">
             <div className="cp-square-icon">⚡</div>
             <div className="cp-title-wrap">
                <h1>CAREERPILOT <span className="cp-orange">DASHBOARD</span></h1>
                <p>TARGET: {profile.career_goal?.toUpperCase() || "NOT_SET"}</p>
             </div>
          </div>
          <div className="cp-meta">
             {/* Passed nextAgent correctly here */}
             <AgentStatus nextAgent={state?.next_agent} />
          </div>
        </header>

        <div className="cp-readiness-strip">
           <span className="cp-label">READINESS_INDEX</span>
           <div className="cp-bar-bg">
             <div className="cp-bar-fill" style={{ width: `${state?.evaluation?.readiness_score || 0}%` }} />
           </div>
           <span className="cp-value">{state?.evaluation?.readiness_score || 0}%</span>
        </div>

        <div className="cp-window">
          <nav className="cp-tab-bar">
            {tabs.map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`cp-tab ${activeTab === tab ? 'active' : ''}`}
              >
                {tab.toUpperCase()}
                {tab === "approvals" && state?.pending_approvals?.length > 0 && (
                  <span className="cp-count">{state.pending_approvals.length}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="cp-content">
             {activeTab === "roadmap" && <RoadmapView roadmap={state?.roadmap} progress={state?.progress} />}
             {activeTab === "courses" && (
                <div className="cp-grid-courses">
                  {state?.courses?.map((c: any, i: number) => (
                    <div key={i} className="cp-course-card">
                      <div className="cp-c-header">{c.title}</div>
                      <div className="cp-c-meta">{c.platform} // {c.cost}</div>
                      <p className="cp-c-why">{c.why_recommended}</p>
                    </div>
                  ))}
                </div>
             )}
             {activeTab === "schedule" && (
                <div className="cp-schedule-box">
                  {state?.schedule?.weekly_schedule && Object.entries(state.schedule.weekly_schedule).map(([day, info]: any) => (
                    <div key={day} className="cp-s-row">
                      <span className="cp-s-day">{day}</span>
                      <span className="cp-s-task">{info.task}</span>
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
      </div>
      <style jsx>{`
        .cp-dashboard-shell { height: 100vh; width: 100vw; background: #050505; color: #d4d4d4; position: relative; overflow: hidden; font-family: monospace; display: flex; justify-content: center; align-items: center; }
        .cp-grid { position: absolute; inset: 0; background-image: linear-gradient(to right, rgba(249, 115, 22, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(249, 115, 22, 0.03) 1px, transparent 1px); background-size: 60px 60px; }
        .cp-main-layout { width: 95%; height: 90vh; z-index: 10; display: flex; flex-direction: column; gap: 15px; }
        .cp-nav { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #0c0c0c; border: 1px solid #1a1a1a; }
        .cp-logo-sec { display: flex; gap: 12px; align-items: center; }
        .cp-square-icon { background: #1a1a1a; border: 1px solid #f97316; color: #f97316; padding: 5px 8px; font-weight: bold; }
        .cp-title-wrap h1 { font-size: 12px; margin: 0; color: #fff; letter-spacing: 2px; }
        .cp-orange { color: #f97316; }
        .cp-title-wrap p { font-size: 9px; color: #525252; margin: 0; }
        .cp-readiness-strip { display: flex; align-items: center; gap: 15px; background: #0c0c0c; border: 1px solid #1a1a1a; padding: 10px 20px; }
        .cp-label { font-size: 9px; color: #525252; font-weight: 800; }
        .cp-bar-bg { flex: 1; height: 2px; background: #1a1a1a; }
        .cp-bar-fill { height: 100%; background: #f97316; transition: width 1s; }
        .cp-value { font-size: 10px; color: #f97316; font-weight: bold; }
        .cp-window { flex: 1; background: #0c0c0c; border: 1px solid #1a1a1a; display: flex; flex-direction: column; overflow: hidden; }
        .cp-tab-bar { display: flex; border-bottom: 1px solid #1a1a1a; background: #080808; }
        .cp-tab { background: transparent; border: none; border-right: 1px solid #1a1a1a; color: #525252; padding: 12px 20px; font-size: 10px; font-weight: 800; cursor: pointer; }
        .cp-tab.active { color: #f97316; background: #0c0c0c; border-bottom: 1px solid #f97316; }
        .cp-count { margin-left: 8px; background: #f97316; color: #000; padding: 1px 4px; font-size: 8px; }
        .cp-content { flex: 1; overflow-y: auto; padding: 25px; }
        .cp-grid-courses { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
        .cp-course-card { background: #111; border: 1px solid #1a1a1a; padding: 15px; }
        .cp-c-header { font-size: 13px; font-weight: bold; color: #fff; margin-bottom: 5px; }
        .cp-c-meta { font-size: 10px; color: #525252; margin-bottom: 10px; }
        .cp-c-why { font-size: 11px; color: #f97316; font-style: italic; }
        .cp-s-row { display: flex; gap: 20px; padding: 10px 0; border-bottom: 1px solid #1a1a1a; font-size: 12px; }
        .cp-s-day { width: 80px; color: #f97316; font-weight: bold; }
      `}</style>
    </div>
  )
}