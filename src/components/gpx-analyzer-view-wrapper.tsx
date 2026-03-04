'use client'

import dynamic from 'next/dynamic'
import type { ClimbSegment, GpxStats, TrackPoint } from '@/lib/gpx-parser'

const GpxAnalyzerView = dynamic(() => import('./gpx-analyzer-view').then((mod) => mod.GpxAnalyzerView), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-dark-border bg-dark-surface"
          />
        ))}
      </div>
      {/* Map skeleton */}
      <div className="h-[400px] animate-pulse rounded-lg border border-dark-border bg-dark-surface" />
      {/* Profile skeleton */}
      <div className="h-40 animate-pulse rounded-lg border border-dark-border bg-dark-surface" />
    </div>
  ),
})

type Props = {
  stats: GpxStats
  points: TrackPoint[]
  topClimbs: ClimbSegment[]
}

export function GpxAnalyzerViewWrapper({ stats, points, topClimbs }: Props) {
  return <GpxAnalyzerView stats={stats} points={points} topClimbs={topClimbs} />
}
