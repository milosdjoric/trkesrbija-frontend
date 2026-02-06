'use client'

import { useAuth } from '@/app/auth/auth-context'
import { Badge } from '@/components/badge'
import { ClipboardDocumentListIcon, FlagIcon } from '@heroicons/react/16/solid'
import NextLink from 'next/link'

type RaceCardProps = {
  raceId: string
  /** Race name to display */
  name: string
  /** Details string (e.g., "12km / 520m") - already formatted */
  details?: string
  /** Badge color variant */
  color?: 'emerald' | 'sky' | 'zinc'
  /** If true, show dimmed (for filtered out races) */
  dimmed?: boolean
  /** Show admin links (registrations, checkpoints) */
  showAdminLinks?: boolean
  /** Additional elements to render after the badge */
  children?: React.ReactNode
}

export function RaceCard({
  raceId,
  name,
  details,
  color = 'sky',
  dimmed = false,
  showAdminLinks = true,
  children,
}: RaceCardProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const badgeColor = dimmed ? 'zinc' : color

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge color={badgeColor} className={dimmed ? 'line-through opacity-50' : ''}>
        {name}
        {details && ` · ${details}`}
      </Badge>

      {children}

      {showAdminLinks && isAdmin && (
        <>
          <NextLink
            href={`/admin/races/${raceId}/registrations`}
            className="inline-flex items-center gap-1 rounded border border-zinc-300 px-2 py-0.5 text-xs text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
            title="Prijave"
          >
            <ClipboardDocumentListIcon className="size-3" />
            Prijave
          </NextLink>
          <NextLink
            href={`/admin/races/${raceId}/checkpoints`}
            className="inline-flex items-center gap-1 rounded border border-zinc-300 px-2 py-0.5 text-xs text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
            title="Checkpoint-i"
          >
            <FlagIcon className="size-3" />
            Checkpoint-i
          </NextLink>
        </>
      )}
    </span>
  )
}
