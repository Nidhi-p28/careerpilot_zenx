"use client"

// Define the specific interface for this component
interface AgentStatusProps {
  nextAgent: string | undefined | null;
}

export default function AgentStatus({ nextAgent }: AgentStatusProps) {
  // If no agent is running or system is at END
  if (!nextAgent || nextAgent === "END") {
    return (
      <span className="cp-status idle">
        SYSTEM_IDLE
        <style jsx>{`
          .cp-status {
            font-size: 9px;
            padding: 4px 10px;
            border-radius: 2px;
            font-family: monospace;
            letter-spacing: 1px;
            color: #525252;
            background: #171717;
            border: 1px solid #262626;
          }
        `}</style>
      </span>
    );
  }

  // If an agent is active
  return (
    <span className="cp-status active">
      {nextAgent.replace("_", " ").toUpperCase()} _RUNNING
      <style jsx>{`
        .cp-status {
          font-size: 9px;
          padding: 4px 10px;
          border-radius: 2px;
          font-family: monospace;
          letter-spacing: 1px;
        }
        .cp-status.active {
          color: #f97316;
          background: rgba(249, 115, 22, 0.1);
          border: 1px solid #f97316;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </span>
  );
}