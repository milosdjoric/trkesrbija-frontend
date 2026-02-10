import { gql } from '@/app/lib/api'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { QuickLinkCard } from '@/components/quick-link-card'
import { RaceListCard } from '@/components/race-list-card'
import { Text } from '@/components/text'
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

function getWeekCategory(iso: string): 'this-week' | 'next-week' | 'later' {
  const d = new Date(iso)
  const now = new Date()

  // Get start of this week (Monday)
  const startOfThisWeek = new Date(now)
  const dayOfWeek = now.getDay()
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday = 0
  startOfThisWeek.setDate(now.getDate() - diff)
  startOfThisWeek.setHours(0, 0, 0, 0)

  // Get end of this week (Sunday 23:59:59)
  const endOfThisWeek = new Date(startOfThisWeek)
  endOfThisWeek.setDate(startOfThisWeek.getDate() + 6)
  endOfThisWeek.setHours(23, 59, 59, 999)

  // Get end of next week
  const endOfNextWeek = new Date(endOfThisWeek)
  endOfNextWeek.setDate(endOfThisWeek.getDate() + 7)

  if (d <= endOfThisWeek) {
    return 'this-week'
  } else if (d <= endOfNextWeek) {
    return 'next-week'
  } else {
    return 'later'
  }
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
          Pronađite i prijavite se za trail i ulične trke širom Srbije. Pratite rezultate i
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
            <span className="text-xs font-medium uppercase tracking-wide">Ulična</span>
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
          <div className="mt-4 space-y-6">
            {/* Ove nedelje */}
            {(() => {
              const thisWeekRaces = upcomingRaces.filter((r) => getWeekCategory(r.startDateTime) === 'this-week')
              if (thisWeekRaces.length === 0) return null
              return (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">Ove nedelje</h3>
                  <div className="space-y-2">
                    {thisWeekRaces.map((race) => (
                      <RaceListCard
                        key={race.id}
                        raceId={race.id}
                        raceName={race.raceName}
                        eventName={race.raceEvent.eventName}
                        eventSlug={race.raceEvent.slug}
                        type={race.raceEvent.type}
                        length={race.length}
                        elevation={race.elevation}
                        startDateTime={race.startDateTime}
                      />
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Sledeće nedelje */}
            {(() => {
              const nextWeekRaces = upcomingRaces.filter((r) => getWeekCategory(r.startDateTime) === 'next-week')
              if (nextWeekRaces.length === 0) return null
              return (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">Sledeće nedelje</h3>
                  <div className="space-y-2">
                    {nextWeekRaces.map((race) => (
                      <RaceListCard
                        key={race.id}
                        raceId={race.id}
                        raceName={race.raceName}
                        eventName={race.raceEvent.eventName}
                        eventSlug={race.raceEvent.slug}
                        type={race.raceEvent.type}
                        length={race.length}
                        elevation={race.elevation}
                        startDateTime={race.startDateTime}
                      />
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Kasnije */}
            {(() => {
              const laterRaces = upcomingRaces.filter((r) => getWeekCategory(r.startDateTime) === 'later')
              if (laterRaces.length === 0) return null
              return (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">Kasnije</h3>
                  <div className="space-y-2">
                    {laterRaces.map((race) => (
                      <RaceListCard
                        key={race.id}
                        raceId={race.id}
                        raceName={race.raceName}
                        eventName={race.raceEvent.eventName}
                        eventSlug={race.raceEvent.slug}
                        type={race.raceEvent.type}
                        length={race.length}
                        elevation={race.elevation}
                        startDateTime={race.startDateTime}
                      />
                    ))}
                  </div>
                </div>
              )
            })()}
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
