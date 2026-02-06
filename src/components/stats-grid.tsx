type StatItem = {
  label: string
  value: string | number
  color?: string
}

type StatsGridProps = {
  stats: StatItem[]
  columns?: 2 | 3 | 4
  className?: string
}

export function StatsGrid({ stats, columns = 4, className = '' }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns]

  return (
    <div className={`grid ${gridCols} gap-4 ${className}`}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
        >
          <div className={`text-2xl font-semibold ${stat.color ?? ''}`}>{stat.value}</div>
          <div className="text-sm text-zinc-500">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
