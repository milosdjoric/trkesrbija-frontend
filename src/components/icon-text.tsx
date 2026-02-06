import type { ReactNode } from 'react'

type IconTextProps = {
  icon: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Simple icon + text inline display
 * Used for showing info like dates, locations, distances
 */
export function IconText({ icon, children, className = '' }: IconTextProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="size-4 shrink-0">{icon}</span>
      {children}
    </span>
  )
}
