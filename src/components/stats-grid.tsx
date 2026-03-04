import type { ReactNode } from 'react'

export type StatItem = {
  label: string
  value: string | number
  color?: string
  icon?: ReactNode
}

type StatsGridProps = {
  items: StatItem[]
  columns?: 2 | 3 | 4 | 5 | 6
  className?: string
}

export function StatsGrid({ items, columns = 4, className = '' }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }[columns]

  return (
    <div className={`grid ${gridCols} gap-3 ${className}`}>
      {items.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-dark-border px-4 py-3"
        >
          <div className="flex items-center gap-1.5 text-gray-400">
            {stat.icon && <span>{stat.icon}</span>}
            <span className={`text-xl font-semibold text-white ${stat.color ?? ''}`}>{stat.value}</span>
          </div>
          <div className="mt-0.5 text-xs text-gray-400">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
