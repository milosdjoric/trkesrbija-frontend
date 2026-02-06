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
      className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">{icon}</div>
        <div>
          <div className="font-medium text-zinc-900 dark:text-zinc-100">{title}</div>
          <div className="text-sm text-zinc-500">{description}</div>
        </div>
      </div>
    </Link>
  )
}
