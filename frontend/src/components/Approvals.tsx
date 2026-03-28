"use client"

interface Props {
  approvals: any[]
  onApprove: (type: string, approved: boolean, data: any) => void
}

export default function Approvals({ approvals, onApprove }: Props) {
  if (approvals.length === 0) return (
    <div className="cp-empty-state">
      <div className="cp-empty-icon">✓</div>
      <p>ALL_SYSTEMS_AUTHORIZED // NO_PENDING_ACTIONS</p>
      <style jsx>{`
        .cp-empty-state { text-align: center; padding: 60px; color: #404040; font-family: monospace; letter-spacing: 2px; }
        .cp-empty-icon { font-size: 24px; margin-bottom: 10px; color: #1a1a1a; }
      `}</style>
    </div>
  )

  return (
    <div className="cp-approvals-shell">
      <h2 className="cp-section-header">PENDING_AUTHORIZATIONS</h2>
      
      <div className="cp-list">
        {approvals.map((item: any, i: number) => (
          <div key={i} className="cp-approval-card">
            {/* Header / Type */}
            <div className="cp-card-top">
              <span className="cp-type-tag">{item.type.toUpperCase()}</span>
              <span className="cp-status-pulse">AWAITING_USER_INPUT</span>
            </div>

            <div className="cp-message">{item.message}</div>

            {/* Specialized Data Views */}
            <div className="cp-data-preview">
              {item.type === "courses" && item.data?.map((c: any, j: number) => (
                <div key={j} className="cp-nested-item">
                  <div className="cp-n-title">{c.title}</div>
                  <div className="cp-n-meta">{c.platform} // {c.duration_hours}H // {c.cost}</div>
                  <div className="cp-n-why">{c.why_recommended}</div>
                </div>
              ))}

              {item.type === "job_application" && (
                <div className="cp-email-preview">
                  <div className="cp-email-field"><span>TO:</span> {item.data?.to}</div>
                  <div className="cp-email-field"><span>SUB:</span> {item.data?.subject}</div>
                  <div className="cp-email-body">{item.data?.body}</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="cp-actions">
              <button
                onClick={() => onApprove(item.type, true, item.data)}
                className="cp-btn cp-btn-approve"
              >
                EXECUTE_AUTHORIZATION
              </button>
              <button
                onClick={() => onApprove(item.type, false, item.data)}
                className="cp-btn cp-btn-reject"
              >
                TERMINATE_REQUEST
              </button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .cp-approvals-shell { font-family: monospace; }
        .cp-section-header { font-size: 10px; color: #404040; letter-spacing: 3px; margin-bottom: 20px; }
        
        .cp-approval-card { 
          background: #080808; 
          border: 1px solid #1a1a1a; 
          border-left: 3px solid #f97316; 
          margin-bottom: 20px; 
          padding: 20px; 
        }

        .cp-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .cp-type-tag { font-size: 11px; font-weight: 900; color: #f97316; background: rgba(249, 115, 22, 0.1); padding: 2px 8px; border: 1px solid #f97316; }
        .cp-status-pulse { font-size: 9px; color: #525252; animation: blink 1.5s infinite; }
        
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .cp-message { font-size: 13px; color: #d4d4d4; margin-bottom: 20px; line-height: 1.4; }

        /* Nested Previews */
        .cp-data-preview { background: #0c0c0c; border: 1px solid #1a1a1a; padding: 15px; margin-bottom: 20px; }
        .cp-nested-item { border-bottom: 1px solid #1a1a1a; padding: 10px 0; }
        .cp-nested-item:last-child { border: none; }
        .cp-n-title { color: #fff; font-size: 12px; font-weight: bold; }
        .cp-n-meta { color: #525252; font-size: 10px; margin: 4px 0; }
        .cp-n-why { color: #f97316; font-size: 10px; font-style: italic; }

        .cp-email-preview { font-size: 11px; }
        .cp-email-field { color: #737373; margin-bottom: 4px; }
        .cp-email-field span { color: #f97316; font-weight: bold; }
        .cp-email-body { margin-top: 15px; color: #a3a3a3; white-space: pre-line; line-height: 1.5; border-top: 1px solid #1a1a1a; padding-top: 15px; }

        /* Buttons */
        .cp-actions { display: flex; gap: 10px; }
        .cp-btn { 
          flex: 1; border: 1px solid #262626; padding: 12px; font-size: 10px; 
          font-weight: 900; letter-spacing: 1px; cursor: pointer; transition: 0.2s; 
          background: #111; color: #d4d4d4;
        }
        .cp-btn-approve:hover { background: #f97316; color: #000; border-color: #f97316; box-shadow: 0 0 15px rgba(249, 115, 22, 0.2); }
        .cp-btn-reject:hover { background: #7f1d1d; color: #fff; border-color: #ef4444; }
      `}</style>
    </div>
  )
}