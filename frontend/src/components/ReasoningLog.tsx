interface Props { log: any[] }

export default function ReasoningLog({ log }: Props) {
  if (!log?.length) return <div className="text-gray-400">No agent decisions yet.</div>

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Why Did Agents Decide This?</h2>
      <div className="space-y-3">
        {log.map((entry: any, i: number) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-800 text-blue-200 text-xs px-2 py-1 rounded-full">
                {entry.agent}
              </span>
              <span className="text-gray-400 text-sm">{entry.output_summary}</span>
            </div>
            <p className="text-sm text-gray-300">{entry.decision}</p>
          </div>
        ))}
      </div>
    </div>
  )
}