'use client'

import dynamic from 'next/dynamic'
import type { GpxStats, TrackPoint } from '@/lib/gpx-parser'

const GpxAnalyzerView = dynamic(() => import('./gpx-analyzer-view').then((mod) => mod.GpxAnalyzerView), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
          />
        ))}
      </div>
      {/* Map skeleton */}
      <div className="h-[400px] animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800" />
      {/* Profile skeleton */}
      <div className="h-40 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800" />
    </div>
  ),
})

type Props = {
  stats: GpxStats
  points: TrackPoint[]
}

export function GpxAnalyzerViewWrapper({ stats, points }: Props) {
  return <GpxAnalyzerView stats={stats} points={points} />
}
