import type { ReactNode } from 'react'

export type StatItem = {
  label: string
  value: string | number
  color?: string
  icon?: ReactNode
}

type StatsGridProps = {
  items: StatItem[]
  columns?: 2 | 3 | 4
  className?: string
}

export function StatsGrid({ items, columns = 4, className = '' }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns]

  return (
    <div className={`grid ${gridCols} gap-4 ${className}`}>
      {items.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
        >
          <div className="flex items-center gap-2">
            {stat.icon && <span className="text-zinc-400">{stat.icon}</span>}
            <span className={`text-2xl font-semibold ${stat.color ?? ''}`}>{stat.value}</span>
          </div>
          <div className="mt-1 text-sm text-zinc-500">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
