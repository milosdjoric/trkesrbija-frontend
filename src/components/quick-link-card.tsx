import { Link } from '@/components/link'
import type { ReactNode } from 'react'

type QuickLinkCardProps = {
  href: string
  icon: ReactNode
  title: string
  description: string
}

/**
 * Card with icon for quick navigation
 * Used on homepage for main sections
 */
export function QuickLinkCard({ href, icon, title, description }: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border-primary p-4 transition-colors hover:border-border-secondary hover:bg-card-hover"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-surface p-2">{icon}</div>
        <div>
          <div className="font-medium text-text-primary">{title}</div>
          <div className="text-sm text-text-secondary">{description}</div>
        </div>
      </div>
    </Link>
  )
}
