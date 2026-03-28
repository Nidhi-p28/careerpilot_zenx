interface Props {
  approvals: any[]
  onApprove: (type: string, approved: boolean, data: any) => void
}

export default function Approvals({ approvals, onApprove }: Props) {
  if (approvals.length === 0) return (
    <div className="text-gray-400">No pending approvals.</div>
  )

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Pending Approvals</h2>
      {approvals.map((item: any, i: number) => (
        <div key={i} className="bg-gray-900 border border-yellow-700 rounded-xl p-5">
          <div className="font-medium text-yellow-300 mb-2 capitalize">{item.type}</div>
          <div className="text-sm text-gray-300 mb-4">{item.message}</div>

          {item.type === "courses" && item.data?.map((c: any, j: number) => (
            <div key={j} className="bg-gray-800 rounded-lg p-3 mb-2 text-sm">
              <div className="font-medium">{c.title}</div>
              <div className="text-gray-400">{c.platform} • {c.duration_hours}h • {c.cost}</div>
              <div className="text-blue-400 mt-1">{c.why_recommended}</div>
            </div>
          ))}

          {item.type === "job_application" && (
            <div className="bg-gray-800 rounded-lg p-3 mb-2 text-sm">
              <div className="font-medium">To: {item.data?.to}</div>
              <div className="text-gray-400">Subject: {item.data?.subject}</div>
              <div className="text-gray-300 mt-2 whitespace-pre-line">{item.data?.body}</div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => onApprove(item.type, true, item.data)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              ✅ Approve
            </button>
            <button
              onClick={() => onApprove(item.type, false, item.data)}
              className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg text-sm font-medium"
            >
              ❌ Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}