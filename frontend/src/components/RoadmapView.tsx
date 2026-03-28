'use client'

type Props = {
  roadmap: any
  progress: any
}

export default function RoadmapView({ roadmap, progress }: Props) {
  if (!roadmap && !progress) {
    return (
      <div className='text-gray-400'>
        No roadmap/progress data available yet. Please wait for the agent to generate the plan.
      </div>
    )
  }

  const roadmapItems = Array.isArray(roadmap) ? roadmap : [roadmap]

  return (
    <div className='space-y-4'>
      <div className='bg-gray-900 rounded-xl p-4 border border-gray-800'>
        <h2 className='text-lg font-semibold text-blue-300'>Roadmap</h2>
        <div className='mt-2 text-sm text-gray-300'>
          {roadmapItems.length > 0 ? (
            <ul className='list-disc list-inside space-y-2'>
              {roadmapItems.map((item: any, idx: number) => (
                <li key={idx} className='text-gray-300'>
                  {typeof item === 'string' ? item : JSON.stringify(item)}
                </li>
              ))}
            </ul>
          ) : (
            <p>No roadmap entries found.</p>
          )}
        </div>
      </div>

      <div className='bg-gray-900 rounded-xl p-4 border border-gray-800'>
        <h2 className='text-lg font-semibold text-blue-300'>Progress</h2>
        <pre className='mt-2 text-sm text-gray-300 whitespace-pre-wrap'>
          {JSON.stringify(progress, null, 2)}
        </pre>
      </div>
    </div>
  )
}
