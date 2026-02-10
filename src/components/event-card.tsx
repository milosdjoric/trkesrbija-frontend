'use client'

import { Badge } from '@/components/badge'
import { Link } from '@/components/link'
import { RaceCard } from '@/components/race-card'

type Race = {
  id: string
  raceName: string | null
  length: number
  elevation: number | null
  startDateTime: string
  startLocation?: string
}

type EventCardProps = {
  /** Event name */
  name: string
  /** Event URL (e.g., /events/slug) */
  url: string
  /** Event type: TRAIL or ROAD */
  type: 'TRAIL' | 'ROAD'
  /** Shared date string (if all races on same date) */
  date?: string
  /** Shared time string (if all races at same time) */
  time?: string
  /** Shared location (if all races at same location) */
  location?: string
  /** Whether all races share the same start time */
  hasSharedStart?: boolean
  /** Whether all races share the same date */
  hasSharedDate?: boolean
  /** Whether all races share the same location */
  hasSharedLocation?: boolean
  /** List of races in this event */
  races: Race[]
  /** Show dimmed races that don't match filters */
  showDimmed?: boolean
  /** Function to check if race matches filter (for dimming) */
  raceMatchesFilter?: (race: Race) => boolean
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('sr-Latn-RS', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function EventCard({
  name,
  url,
  type,
  date,
  time,
  location,
  hasSharedStart = false,
  hasSharedDate = false,
  hasSharedLocation = false,
  races,
  showDimmed = true,
  raceMatchesFilter,
}: EventCardProps) {
  const isTrail = type === 'TRAIL'

  return (
    <div className="flex w-full gap-6 py-6 md:w-fit">
      <div className="w-full space-y-1.5 md:w-fit">
        {/* Event name */}
        <div className="text-lg font-semibold md:text-base/6">
          <Link href={url}>{name}</Link>
        </div>

        <div className="flex flex-col flex-wrap gap-2 md:flex-row">
          {/* Date/Time/Location info */}
          <div className="flex flex-wrap items-center gap-1 text-sm/6 text-zinc-500">
            {hasSharedStart && date && time ? (
              <>
                {date} u {time}
              </>
            ) : hasSharedDate && date ? (
              <>{date}</>
            ) : (
              <>Različiti datumi</>
            )}{' '}
            <span aria-hidden="true">/</span>{' '}
            {hasSharedLocation && location ? (
              typeof location === 'string' && location.startsWith('http') ? (
                <a
                  href={location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Startna lokacija
                </a>
              ) : (
                <>{location}</>
              )
            ) : (
              <>Različite lokacije</>
            )}
          </div>

          {/* Race badges */}
          <div className="flex flex-wrap items-center gap-1">
            {races.length > 0 ? (
              races.map((r) => {
                const raceName = r.raceName ?? 'Trka'
                const matches = raceMatchesFilter ? raceMatchesFilter(r) : true
                const dt = r.startDateTime ? new Date(r.startDateTime) : null
                const raceTime =
                  dt && !Number.isNaN(dt.getTime())
                    ? hasSharedStart
                      ? ''
                      : formatTime(dt)
                    : ''
                const length = typeof r.length === 'number' ? `${r.length}km` : ''
                const elevation = r.elevation != null ? `${r.elevation}m` : ''
                const parts = [raceTime, length, elevation].filter(Boolean).join(' / ')

                if (!showDimmed && !matches) return null

                return (
                  <RaceCard
                    key={r.id}
                    raceId={r.id}
                    name={raceName}
                    details={parts}
                    color={isTrail ? 'emerald' : 'sky'}
                    dimmed={!matches}
                    showAdminLinks={false}
                  />
                )
              })
            ) : (
              <span className="text-xs text-zinc-400">Još nema trka</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
