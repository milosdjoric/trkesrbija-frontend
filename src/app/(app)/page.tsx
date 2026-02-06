import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Heading, Subheading } from '@/components/heading'
import { IconText } from '@/components/icon-text'
import { Link } from '@/components/link'
import { QuickLinkCard } from '@/components/quick-link-card'
import { Text } from '@/components/text'
import { formatDate, formatTime, formatMonth, formatDay } from '@/lib/formatters'
import {
  CalendarIcon,
  ArrowRightIcon,
  TrophyIcon,
  UserGroupIcon,
  FlagIcon,
} from '@heroicons/react/16/solid'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trke Srbija - Početna',
}

type BackendRace = {
  id: string
  raceName: string | null
  length: number
  elevation: number | null
  startLocation: string
  startDateTime: string
  raceEvent: {
    id: string
    eventName: string
    slug: string
    type: 'TRAIL' | 'ROAD'
  }
}

type BackendRaceEvent = {
  id: string
  eventName: string
  slug: string
  type: 'TRAIL' | 'ROAD'
  races: { id: string }[]
}

const UPCOMING_RACES_QUERY = `
  query UpcomingRaces($limit: Int!) {
    races(limit: $limit, orderBy: START_DATE_ASC) {
      id
      raceName
      length
      elevation
      startLocation
      startDateTime
      raceEvent {
        id
        eventName
        slug
        type
      }
    }
  }
`

const STATS_QUERY = `
  query Stats {
    raceEvents(limit: 1000) {
      id
      eventName
      type
      races {
        id
      }
    }
  }
`

function daysUntil(iso: string): number {
  const d = new Date(iso)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default async function HomePage() {
  // Fetch upcoming races
  const racesData = await gql<{ races: BackendRace[] }>(UPCOMING_RACES_QUERY, { limit: 50 })

  // Filter only future races
  const now = new Date()
  const upcomingRaces = (racesData.races ?? [])
    .filter((r) => new Date(r.startDateTime) > now)
    .slice(0, 6)

  // Fetch stats
  const eventsData = await gql<{ raceEvents: BackendRaceEvent[] }>(STATS_QUERY)
  const allEvents = eventsData.raceEvents ?? []

  const totalEvents = allEvents.length
  const totalRaces = allEvents.reduce((sum, ev) => sum + (ev.races?.length ?? 0), 0)
  const trailEvents = allEvents.filter((ev) => ev.type === 'TRAIL').length
  const roadEvents = allEvents.filter((ev) => ev.type === 'ROAD').length

  return (
    <>
      {/* Hero sekcija */}
      <div className="mb-10">
        <Heading>Dobrodošli na Trke Srbija</Heading>
        <Text className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Pronađite i prijavite se za trail i asfaltne trke širom Srbije. Pratite rezultate i
          otkrijte nove izazove.
        </Text>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <CalendarIcon className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Događaji</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalEvents}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <FlagIcon className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Trke</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalRaces}</div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <TrophyIcon className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Trail</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{trailEvents}</div>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-900/20">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <UserGroupIcon className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Asfalt</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-700 dark:text-sky-300">{roadEvents}</div>
        </div>
      </div>

      {/* Nadolazeće trke */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <Subheading>Nadolazeće trke</Subheading>
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            Sve trke
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>

        {upcomingRaces.length === 0 ? (
          <div className="mt-4 rounded-lg border border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Nema nadolazećih trka
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {upcomingRaces.map((race) => {
              const days = daysUntil(race.startDateTime)
              const isTrail = race.raceEvent.type === 'TRAIL'
              const details = [
                `${race.length}km`,
                race.elevation != null ? `${race.elevation}m` : '',
              ]
                .filter(Boolean)
                .join(' / ')

              return (
                <Link
                  key={race.id}
                  href={`/events/${race.raceEvent.slug}`}
                  className="flex items-center gap-4 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
                >
                  {/* Datum */}
                  <div className="flex w-16 shrink-0 flex-col items-center rounded-lg bg-zinc-100 py-2 text-center dark:bg-zinc-800">
                    <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                      {formatMonth(race.startDateTime)}
                    </span>
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {formatDay(race.startDateTime)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {race.raceEvent.eventName}
                      </span>
                      <Badge color={isTrail ? 'emerald' : 'sky'}>
                        {race.raceName ?? (isTrail ? 'Trail' : 'Asfalt')}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                      <IconText icon={<CalendarIcon className="size-3.5" />}>
                        {formatDate(race.startDateTime, 'short')} · {formatTime(race.startDateTime)}
                      </IconText>
                      <span>{details}</span>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="hidden shrink-0 text-right sm:block">
                    {days <= 0 ? (
                      <Badge color="red">Danas</Badge>
                    ) : days === 1 ? (
                      <Badge color="amber">Sutra</Badge>
                    ) : days <= 7 ? (
                      <Badge color="lime">{days} dana</Badge>
                    ) : (
                      <span className="text-sm text-zinc-500">{days} dana</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Brzi linkovi */}
      <div className="mt-10">
        <Subheading>Brzi pristup</Subheading>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <QuickLinkCard
            href="/events"
            icon={<CalendarIcon className="size-5 text-zinc-600 dark:text-zinc-400" />}
            title="Svi događaji"
            description="Pregledaj kalendar trka"
          />
          <QuickLinkCard
            href="/favorites"
            icon={<TrophyIcon className="size-5 text-zinc-600 dark:text-zinc-400" />}
            title="Omiljene trke"
            description="Tvoje sačuvane trke"
          />
          <QuickLinkCard
            href="/my-registrations"
            icon={<UserGroupIcon className="size-5 text-zinc-600 dark:text-zinc-400" />}
            title="Moje prijave"
            description="Tvoje registracije"
          />
        </div>
      </div>
    </>
  )
}
