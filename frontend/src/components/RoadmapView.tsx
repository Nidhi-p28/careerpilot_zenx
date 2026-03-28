"use client"

import React from 'react';

type Props = {
  roadmap: any;
  progress: any;
};

export default function RoadmapView({ roadmap, progress }: Props) {
  // 1. Data Parsing Safety Logic
  const roadmapData = typeof roadmap === 'string' ? JSON.parse(roadmap) : roadmap;
  const phases = roadmapData?.phases || [];
  const currentStepId = progress?.current_step || "";
  const completedIds = progress?.completed_steps || [];

  if (phases.length === 0) {
    return (
      <div className="cp-empty-log">
        &gt; NO_STRATEGIC_PLAN_FOUND // AWAITING_GENERATION...
        <style jsx>{`
          .cp-empty-log { padding: 40px; color: #404040; font-family: monospace; font-size: 11px; border: 1px dashed #1a1a1a; text-align: center; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cp-roadmap-shell">
      {/* Header Info */}
      <div className="cp-header">
        <span className="cp-label">PROJECT_TRAJECTORY_MAP</span>
      </div>

      <div className="cp-timeline">
        {phases.map((phase: any, idx: number) => {
          // Determine status based on completion or ID
          const isCompleted = phase.completion_pct === 100 || completedIds.includes(phase.id);
          const isCurrent = phase.id === currentStepId || (!currentStepId && !isCompleted && idx === 0);

          return (
            <div key={idx} className={`cp-phase-gate ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
              
              {/* Visual Node Column */}
              <div className="cp-gate-sidebar">
                <div className="cp-gate-node"></div>
                <div className="cp-gate-line"></div>
              </div>

              {/* Content Area */}
              <div className="cp-gate-content">
                <div className="cp-gate-header">
                  <span className="cp-phase-id">PHASE_0{phase.phase || idx + 1}</span>
                  <div className="cp-status-pill">
                    {isCompleted ? "STABILIZED" : isCurrent ? "SYNCING..." : "PENDING"}
                    <span className="cp-pct-value">{phase.completion_pct}%</span>
                  </div>
                </div>

                <h3 className="cp-phase-name">{phase.name?.toUpperCase() || "UNDEFINED_SECTOR"}</h3>
                
                {/* Skill Matrix Grid */}
                <div className="cp-skill-grid">
                  {phase.skills?.map((s: any, sIdx: number) => (
                    <div 
                      key={sIdx} 
                      className={`cp-skill-item ${s.priority || 'must_have'}`}
                      title={s.reason || ""}
                    >
                      <div className="cp-skill-main">
                        <span className="cp-priority-icon">
                          {s.priority === 'must_have' ? '▲' : '◆'}
                        </span>
                        <span className="cp-skill-name">{s.skill}</span>
                      </div>
                      <span className="cp-skill-duration">{s.weeks}W</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .cp-roadmap-shell { font-family: 'JetBrains Mono', monospace; color: #d4d4d4; }
        
        .cp-header { 
          display: flex; justify-content: space-between; 
          margin-bottom: 30px; border-bottom: 1px solid #1a1a1a; padding-bottom: 10px; 
        }
        .cp-label { font-size: 10px; color: #404040; letter-spacing: 2px; font-weight: bold; }
        .cp-version { font-size: 9px; color: #262626; }

        .cp-timeline { display: flex; flex-direction: column; }

        /* Gate and Timeline Visuals */
        .cp-phase-gate { display: flex; gap: 24px; }
        .cp-gate-sidebar { display: flex; flex-direction: column; align-items: center; width: 14px; }
        .cp-gate-node { 
          width: 10px; height: 10px; background: #000; border: 2px solid #262626; 
          border-radius: 2px; z-index: 2; margin-top: 5px; transition: 0.4s;
        }
        .cp-gate-line { flex: 1; width: 1px; background: #1a1a1a; margin-bottom: -5px; }
        .cp-phase-gate:last-child .cp-gate-line { display: none; }

        /* Content Area */
        .cp-gate-content { flex: 1; padding-bottom: 45px; }
        .cp-gate-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .cp-phase-id { font-size: 9px; color: #525252; letter-spacing: 1px; }
        
        .cp-status-pill { 
          font-size: 9px; font-weight: 900; background: #111; padding: 2px 8px; 
          border: 1px solid #1a1a1a; color: #404040; display: flex; gap: 10px;
        }
        .cp-pct-value { color: #525252; border-left: 1px solid #262626; padding-left: 8px; }

        .cp-phase-name { margin: 0 0 20px 0; font-size: 16px; color: #525252; font-weight: 800; letter-spacing: 1px; }

        /* Skill Grid */
        .cp-skill-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        
        .cp-skill-item { 
          background: rgba(10, 10, 10, 0.5); border: 1px solid #1a1a1a; 
          padding: 10px 14px; display: flex; justify-content: space-between; 
          align-items: center; position: relative; transition: 0.3s;
        }
        .cp-skill-main { display: flex; align-items: center; gap: 10px; }
        .cp-priority-icon { font-size: 8px; transition: 0.3s; }
        .cp-skill-name { font-size: 11px; color: #737373; font-weight: 600; }
        .cp-skill-duration { font-size: 9px; color: #262626; font-weight: bold; }

        /* Active State Enhancements */
        .cp-phase-gate.current .cp-gate-node { border-color: #f97316; box-shadow: 0 0 10px rgba(249, 115, 22, 0.4); }
        .cp-phase-gate.current .cp-phase-name { color: #fff; }
        .cp-phase-gate.current .cp-status-pill { border-color: #f97316; color: #f97316; animation: blink 2s infinite; }
        .cp-phase-gate.current .cp-pct-value { color: #f97316; border-left-color: rgba(249, 115, 22, 0.3); }

        /* Completed State Enhancements */
        .cp-phase-gate.completed .cp-gate-node { background: #f97316; border-color: #f97316; }
        .cp-phase-gate.completed .cp-gate-line { background: #f97316; opacity: 0.2; }
        .cp-phase-gate.completed .cp-phase-name { color: #d4d4d4; }
        .cp-phase-gate.completed .cp-status-pill { color: #525252; }

        /* Priority Logic */
        .cp-skill-item.must_have { border-left: 2px solid #f97316; }
        .cp-skill-item.must_have .cp-priority-icon { color: #f97316; }
        
        .cp-phase-gate.current .cp-skill-item.must_have .cp-skill-name { color: #d4d4d4; }
        .cp-phase-gate.current .cp-skill-item.must_have .cp-skill-duration { color: #525252; }

        .cp-skill-item:hover { background: #111; border-color: #f97316; cursor: help; }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
