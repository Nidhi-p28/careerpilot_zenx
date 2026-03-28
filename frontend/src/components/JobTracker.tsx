"use client"

interface Props { jobs: any[] }

export default function JobTracker({ jobs }: Props) {
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
            {/* Top Row: Identification */}
            <div className="cp-entry-top">
              <div className="cp-id-group">
                <div className="cp-job-title">{job.title.toUpperCase()}</div>
                <div className="cp-job-loc">{job.company} // {job.location.toUpperCase()}</div>
              </div>
              <div className="cp-match-dial">
                <span className="cp-match-val">{job.match_pct}%</span>
                <span className="cp-match-label">MATCH_INDEX</span>
              </div>
            </div>

            {/* AI Analysis Message */}
            <div className="cp-analysis-strip">
              <span className="cp-ai-tag">AI_INSIGHT:</span> {job.why_good_match}
            </div>

            {/* Skill Matrix */}
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

            {/* Bottom Action */}
            <div className="cp-entry-footer">
              <span className="cp-ref">REF_ID: JOB_SCAN_{i}</span>
              <button className="cp-view-btn">ACCESS_LISTING</button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .cp-job-shell { font-family: monospace; }
        .cp-job-header { font-size: 10px; color: #404040; letter-spacing: 3px; margin-bottom: 25px; }
        
        .cp-job-list { display: flex; flex-direction: column; gap: 20px; }
        
        .cp-job-entry { 
          background: #080808; 
          border: 1px solid #1a1a1a; 
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        /* Top Identification Section */
        .cp-entry-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .cp-job-title { color: #fff; font-size: 15px; font-weight: 900; letter-spacing: 1px; }
        .cp-job-loc { color: #525252; font-size: 10px; margin-top: 4px; }
        
        .cp-match-dial { text-align: right; }
        .cp-match-val { display: block; color: #f97316; font-size: 18px; font-weight: 900; }
        .cp-match-label { color: #404040; font-size: 8px; font-weight: bold; }

        /* AI Analysis Message */
        .cp-analysis-strip { 
          font-size: 11px; 
          color: #d4d4d4; 
          padding: 10px; 
          background: rgba(249, 115, 22, 0.03); 
          border-left: 2px solid #f97316;
          margin-bottom: 15px;
          line-height: 1.4;
        }
        .cp-ai-tag { color: #f97316; font-weight: 900; margin-right: 8px; }

        /* Skill Matrix */
        .cp-skill-matrix { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
        .cp-skill-tag { 
          font-size: 9px; 
          padding: 4px 8px; 
          border: 1px solid #1a1a1a; 
          display: flex; 
          align-items: center; 
          gap: 6px; 
        }
        .cp-skill-tag.has { color: #a3a3a3; background: #111; }
        .cp-skill-tag.has .cp-status-bit { color: #f97316; font-weight: 900; }
        
        .cp-skill-tag.lacks { color: #525252; background: #0a0a0a; border-style: dashed; }
        .cp-skill-tag.lacks .cp-status-bit { color: #404040; }

        /* Footer */
        .cp-entry-footer { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding-top: 15px; 
          border-top: 1px solid #141414;
        }
        .cp-ref { color: #262626; font-size: 8px; }
        .cp-view-btn { 
          background: transparent; 
          border: 1px solid #262626; 
          color: #737373; 
          font-size: 9px; 
          padding: 6px 12px; 
          cursor: pointer;
          font-weight: bold;
        }
        .cp-view-btn:hover { color: #fff; border-color: #f97316; background: rgba(249, 115, 22, 0.1); }
      `}</style>
    </div>
  )
}