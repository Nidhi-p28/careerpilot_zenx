interface Props { nextAgent: string }

export default function AgentStatus({ nextAgent }: Props) {
  if (!nextAgent || nextAgent === "END") return (
    <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">Idle</span>
  )

  return (
    <span className="text-xs text-blue-300 bg-blue-950 border border-blue-800 px-3 py-1 rounded-full animate-pulse">
      ⚡ {nextAgent.replace("_", " ")} running
    </span>
  )
}