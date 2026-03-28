"use client"

import React, { useState } from 'react';
import axios from 'axios';

interface Props { 
  jobs: any[]; 
  userId: string; 
}

export default function JobTracker({ jobs, userId }: Props) {
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);

  const handleAutoApply = async (job: any, index: number) => {
    // Safety check: Ensure userId exists before calling the backend
    if (!userId) {
      alert("SYSTEM_ERROR: USER_ID_MISSING. Please refresh the session.");
      return;
    }

    setApplyingIndex(index);
    
    try {
      // Using 127.0.0.1:8000 for maximum reliability on local Windows setups
      const response = await axios.post('http://127.0.0.1:8000/api/apply-now', {
        user_id: userId,
        job: job
      });

      if (response.data.status === 'SUCCESS') {
        alert(`SUCCESS: Outreach dispatched for ${job.title} at ${job.company}`);
      } else {
        // This handles cases like 'RESUME_NOT_FOUND' or SMTP errors
        alert(`DISPATCH_REJECTED: ${response.data.message}`);
      }
    } catch (err: any) {
      console.error("Application Error Detail:", err);
      
      if (!err.response) {
        alert("OFFLINE: Backend unreachable. Verify Uvicorn is running on port 8000.");
      } else {
        alert(`CRITICAL_ERROR: ${err.response.data.detail || "SERVER_CRASH"}`);
      }
    } finally {
      setApplyingIndex(null);
    }
  };

  if (!jobs?.length) return (
    <div className="cp-job-empty">
      <div className="cp-warning-icon">⚠</div>
      MARKET_SCAN_NULL // COMPLETE_ROADMAP_PHASES_TO_UNLOCK
      <style jsx>{`
        .cp-job-empty { padding: 60px; text-align: center; color: #404040; font-family: monospace; font-size: 11px; letter-spacing: 2px; }
        .cp-warning-icon { font-size: 20px; margin-bottom: 10px; color: #262626; }
      `}</style>
    </div>
  )

  return (
    <div className="cp-job-shell">
      <h2 className="cp-job-header">LIVE_MARKET_MATCH_DATA</h2>
      
      <div className="cp-job-list">
        {jobs.map((job: any, i: number) => (
          <div key={i} className="cp-job-entry">
            <div className="cp-entry-top">
              <div className="cp-id-group">
                <div className="cp-job-title">{job.title?.toUpperCase() || "UNKNOWN_ROLE"}</div>
                <div className="cp-job-loc">{job.company} // {job.location?.toUpperCase() || "REMOTE"}</div>
              </div>
              <div className="cp-match-dial">
                <span className="cp-match-val">{job.match_pct || 0}%</span>
                <span className="cp-match-label">MATCH_INDEX</span>
              </div>
            </div>

            <div className="cp-analysis-strip">
              <span className="cp-ai-tag">AI_INSIGHT:</span> {job.why_good_match || "Analyzing fit..."}
            </div>

            <div className="cp-skill-matrix">
              {job.user_has?.map((s: string) => (
                <div key={s} className="cp-skill-tag has">
                  <span className="cp-status-bit">OK</span> {s.toUpperCase()}
                </div>
              ))}
              {job.user_missing?.map((s: string) => (
                <div key={s} className="cp-skill-tag lacks">
                  <span className="cp-status-bit">GAP</span> {s.toUpperCase()}
                </div>
              ))}
            </div>

            <div className="cp-entry-footer">
              <span className="cp-ref">REF_ID: JOB_SCAN_{i}</span>
              <div className="cp-action-buttons">
                <button 
                  className={`cp-apply-btn ${applyingIndex === i ? 'loading' : ''}`}
                  onClick={() => handleAutoApply(job, i)}
                  disabled={applyingIndex !== null}
                >
                  {applyingIndex === i ? "DISPATCHING..." : "INITIALIZE_AUTO_APPLY"}
                </button>
                <button className="cp-view-btn">VIEW_LISTING</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .cp-job-shell { font-family: monospace; }
        .cp-job-header { font-size: 10px; color: #404040; letter-spacing: 3px; margin-bottom: 25px; }
        .cp-job-list { display: flex; flex-direction: column; gap: 20px; }
        .cp-job-entry { background: #080808; border: 1px solid #1a1a1a; padding: 20px; }
        .cp-entry-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .cp-job-title { color: #fff; font-size: 15px; font-weight: 900; letter-spacing: 1px; }
        .cp-job-loc { color: #525252; font-size: 10px; margin-top: 4px; }
        .cp-match-dial { text-align: right; }
        .cp-match-val { display: block; color: #f97316; font-size: 18px; font-weight: 900; }
        .cp-match-label { color: #404040; font-size: 8px; font-weight: bold; }
        .cp-analysis-strip { font-size: 11px; color: #d4d4d4; padding: 10px; background: rgba(249, 115, 22, 0.03); border-left: 2px solid #f97316; margin-bottom: 15px; }
        .cp-ai-tag { color: #f97316; font-weight: 900; margin-right: 8px; }
        .cp-skill-matrix { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
        .cp-skill-tag { font-size: 9px; padding: 4px 8px; border: 1px solid #1a1a1a; display: flex; align-items: center; gap: 6px; }
        .cp-skill-tag.has { color: #a3a3a3; background: #111; }
        .cp-skill-tag.has .cp-status-bit { color: #f97316; font-weight: 900; }
        .cp-skill-tag.lacks { color: #525252; background: #0a0a0a; border-style: dashed; }
        .cp-entry-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #141414; }
        .cp-ref { color: #262626; font-size: 8px; }
        .cp-action-buttons { display: flex; gap: 10px; }
        .cp-apply-btn { 
          background: #f97316; 
          color: #000; 
          border: none; 
          padding: 8px 16px; 
          font-family: monospace; 
          font-weight: 900; 
          font-size: 9px; 
          cursor: pointer;
          transition: 0.2s;
        }
        .cp-apply-btn:hover { background: #fff; }
        .cp-apply-btn.loading { background: #404040; color: #111; cursor: not-allowed; animation: pulse 1s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        .cp-view-btn { background: transparent; border: 1px solid #262626; color: #737373; font-size: 9px; padding: 8px 12px; cursor: pointer; }
        .cp-view-btn:hover { color: #fff; border-color: #f97316; }
      `}</style>
    </div>
  )
}
