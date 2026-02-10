'use client'

import { Badge } from '@/components/badge'
import { IconText } from '@/components/icon-text'
import { Link } from '@/components/link'
import { formatDate, formatTime, formatMonth, formatDay } from '@/lib/formatters'
import { CalendarIcon } from '@heroicons/react/16/solid'

type RaceListCardProps = {
  /** Unique race ID */
  raceId: string
  /** Race name (e.g., "10km") */
  raceName: string | null
  /** Event name (e.g., "Belgrade Marathon") */
  eventName: string
  /** Event slug for URL */
  eventSlug: string
  /** Race type: TRAIL or ROAD */
  type: 'TRAIL' | 'ROAD'
  /** Race length in km */
  length: number
  /** Elevation in meters (optional) */
  elevation?: number | null
  /** ISO date string for race start */
  startDateTime: string
  /** Show countdown badge (days until race) */
  showCountdown?: boolean
  /** Additional elements (e.g., FavoriteButton, Cancel button) */
  children?: React.ReactNode
}

function daysUntil(iso: string): number {
  const d = new Date(iso)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getBadgeColor(days: number) {
  if (days <= 0) return 'red'
  if (days === 1) return 'amber'
  if (days <= 7) return 'lime'
  if (days <= 14) return 'cyan'
  return 'zinc'
}

function getBadgeText(days: number) {
  if (days <= 0) return 'Danas'
  if (days === 1) return 'Sutra'
  return `${days} dana`
}

export function RaceListCard({
  raceId,
  raceName,
  eventName,
  eventSlug,
  type,
  length,
  elevation,
  startDateTime,
  showCountdown = true,
  children,
}: RaceListCardProps) {
  const days = daysUntil(startDateTime)
  const isTrail = type === 'TRAIL'
  const details = [`${length}km`, elevation != null ? `${elevation}m` : ''].filter(Boolean).join(' / ')

  return (
    <Link
      href={`/events/${eventSlug}`}
      className="flex items-center gap-4 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
    >
      {/* Date box */}
      <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-zinc-100 py-2 text-center dark:bg-zinc-800">
        <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
          {formatMonth(startDateTime)}
        </span>
        <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{formatDay(startDateTime)}</span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{eventName}</span>
          <Badge color={isTrail ? 'emerald' : 'sky'}>{raceName ?? (isTrail ? 'Trail' : 'Ulična')}</Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
          <IconText icon={<CalendarIcon className="size-3.5" />}>
            {formatDate(startDateTime, 'short')} · {formatTime(startDateTime)}
          </IconText>
          <span>{details}</span>
        </div>
      </div>

      {/* Countdown Badge */}
      {showCountdown && (
        <div className="hidden shrink-0 sm:block">
          <Badge color={getBadgeColor(days)}>{getBadgeText(days)}</Badge>
        </div>
      )}

      {/* Additional actions */}
      {children && (
        <div
          className="shrink-0"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          {children}
        </div>
      )}
    </Link>
  )
}
