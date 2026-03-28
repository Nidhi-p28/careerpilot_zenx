"use client"

interface Props { log: any[] }

export default function ReasoningLog({ log }: Props) {
  if (!log?.length) return (
    <div className="cp-log-empty">
      AWAITING_AGENT_COGNITION // LOG_BUFFER_EMPTY
      <style jsx>{`
        .cp-log-empty { padding: 40px; color: #404040; font-family: monospace; font-size: 11px; text-align: center; border: 1px dashed #1a1a1a; }
      `}</style>
    </div>
  )

  return (
    <div className="cp-reasoning-shell">
      
      <div className="cp-log-stream">
        {log.map((entry: any, i: number) => (
          <div key={i} className="cp-log-entry">
            {/* Timestamp & Agent Name */}
            <div className="cp-entry-meta">
              <span className="cp-timestamp">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
              <span className="cp-agent-id">{entry.agent?.toUpperCase() || "CORE_AGENT"}</span>
              <span className="cp-summary">// {entry.output_summary}</span>
            </div>

            {/* The Decision Context */}
            <div className="cp-decision-box">
              <span className="cp-prompt-char">&gt;</span>
              <p className="cp-decision-text">{entry.decision}</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .cp-reasoning-shell { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
        .cp-log-header { font-size: 10px; color: #404040; letter-spacing: 3px; margin-bottom: 25px; border-bottom: 1px solid #1a1a1a; padding-bottom: 10px; }
        
        .cp-log-stream { display: flex; flex-direction: column; gap: 20px; }
        
        .cp-log-entry { 
          position: relative; 
          padding-left: 15px;
          border-left: 1px solid #1a1a1a;
        }
        .cp-log-entry:hover { border-left: 1px solid #f97316; }

        .cp-entry-meta { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; font-size: 11px; }
        .cp-timestamp { color: #404040; }
        .cp-agent-id { color: #f97316; font-weight: 800; background: rgba(249, 115, 22, 0.05); padding: 2px 6px; border-radius: 2px; }
        .cp-summary { color: #737373; font-style: italic; }

        .cp-decision-box { 
          display: flex; 
          gap: 12px; 
          background: #080808; 
          padding: 15px; 
          border: 1px solid #121212;
          border-radius: 4px;
        }
        .cp-prompt-char { color: #f97316; font-weight: bold; }
        .cp-decision-text { 
          color: #a3a3a3; 
          font-size: 13px; 
          line-height: 1.6; 
          margin: 0; 
          letter-spacing: 0.2px;
        }

        /* Hover effect to make it feel alive */
        .cp-log-entry:hover .cp-decision-box { border-color: #262626; background: #0a0a0a; }
        .cp-log-entry:hover .cp-timestamp { color: #737373; }
      `}</style>
    </div>
  )
}