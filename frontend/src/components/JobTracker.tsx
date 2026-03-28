interface Props { jobs: any[] }

export default function JobTracker({ jobs }: Props) {
  if (!jobs?.length) return (
    <div className="text-gray-400">No jobs found yet. Complete more of your roadmap first.</div>
  )

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Matched Jobs</h2>
      <div className="space-y-4">
        {jobs.map((job: any, i: number) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{job.title}</div>
                <div className="text-gray-400 text-sm">{job.company} • {job.location}</div>
              </div>
              <span className="bg-blue-800 text-blue-200 text-sm px-3 py-1 rounded-full">
                {job.match_pct}% match
              </span>
            </div>
            <div className="mt-3 text-sm text-blue-400">{job.why_good_match}</div>
            <div className="mt-2 flex gap-2 flex-wrap">
              {job.user_has?.map((s: string) => (
                <span key={s} className="bg-green-900 text-green-300 text-xs px-2 py-1 rounded">✓ {s}</span>
              ))}
              {job.user_missing?.map((s: string) => (
                <span key={s} className="bg-red-900 text-red-300 text-xs px-2 py-1 rounded">✗ {s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}