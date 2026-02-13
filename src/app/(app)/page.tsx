import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Divider } from '@/components/divider'
import { EventCard } from '@/components/event-card'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { QuickLinkCard } from '@/components/quick-link-card'
import { Text } from '@/components/text'
import { formatDate as formatDateUtil } from '@/lib/formatters'
import {
  CalendarIcon,
  ArrowRightIcon,
  TrophyIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/16/solid'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trke Srbija - Početna',
}

type BackendRace = {
  id: string
  slug: string
  raceName: string | null
  length: number
  elevation: number | null
  startLocation: string
  startDateTime: string
}

type BackendRaceEvent = {
  id: string
  eventName: string
  slug: string
  type: 'TRAIL' | 'ROAD' | 'OCR'
  races: BackendRace[]
}

const UPCOMING_EVENTS_QUERY = `
  query UpcomingEvents($limit: Int!) {
    raceEvents(limit: $limit, orderBy: CREATED_AT_DESC) {
      id
      eventName
      slug
      type
      races {
        id
        slug
        raceName
        length
        elevation
        startLocation
        startDateTime
      }
    }
  }
`

function getWeekCategory(iso: string): 'this-week' | 'next-week' | 'later' | 'past' {
  const d = new Date(iso)
  const now = new Date()

  // Check if in the past
  if (d < now) {
    return 'past'
  }

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

function allSameString(values: Array<string | null | undefined>) {
  const normalized = values.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean)
  if (!normalized.length) return { allSame: false as const, value: null as string | null }
  const first = normalized[0]
  const allSame = normalized.every((v) => v === first)
  return { allSame, value: allSame ? first : null }
}

function allSameDateTime(values: Array<string | null | undefined>) {
  const normalized = values.map((v) => (typeof v === 'string' ? v : null)).filter(Boolean) as string[]

  if (!normalized.length) return { allSame: false as const, value: null as Date | null }

  const first = new Date(normalized[0])
  if (Number.isNaN(first.getTime())) return { allSame: false as const, value: null as Date | null }

  const allSame = normalized.every((v) => {
    const d = new Date(v)
    return !Number.isNaN(d.getTime()) && d.getTime() === first.getTime()
  })

  return { allSame, value: allSame ? first : null }
}

export default async function HomePage() {
  // Fetch upcoming events with races
  const eventsData = await gql<{ raceEvents: BackendRaceEvent[] }>(UPCOMING_EVENTS_QUERY, { limit: 100 })
  const allEvents = eventsData.raceEvents ?? []

  // Process events with computed fields
  const now = new Date()
  const processedEvents = allEvents
    .map((ev) => {
      const races = ev.races ?? []

      // Get earliest race date for this event
      const earliestTs = races
        .map((r) => new Date(r.startDateTime).getTime())
        .filter((t) => Number.isFinite(t))
        .reduce((min, t) => Math.min(min, t), Number.POSITIVE_INFINITY)

      // Compute shared fields
      const sameLocation = allSameString(races.map((r) => r.startLocation))
      const sameStartDateTime = allSameDateTime(races.map((r) => r.startDateTime))

      const dateKeys = races
        .map((r) => (typeof r.startDateTime === 'string' ? r.startDateTime : null))
        .filter(Boolean)
        .map((iso) => {
          const d = new Date(iso as string)
          return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
        })
        .filter(Boolean)

      const hasSharedDate = dateKeys.length > 0 && dateKeys.every((k) => k === dateKeys[0])

      const sharedDateBase = (() => {
        const firstIso = races.find((r) => typeof r.startDateTime === 'string' && r.startDateTime)?.startDateTime
        if (!firstIso) return null
        const d = new Date(firstIso)
        return Number.isNaN(d.getTime()) ? null : d
      })()

      const sharedDate =
        sharedDateBase && hasSharedDate
          ? formatDateUtil(sharedDateBase, 'short')
          : 'TBD'

      const sharedTime =
        sameStartDateTime.allSame && sameStartDateTime.value
          ? sameStartDateTime.value.toLocaleTimeString('sr-Latn-RS', { hour: '2-digit', minute: '2-digit', hour12: false })
          : ''

      const sharedLocation = sameLocation.allSame && sameLocation.value ? sameLocation.value : 'TBD'

      return {
        ...ev,
        _earliestTs: earliestTs,
        date: sharedDate,
        time: sharedTime,
        location: sharedLocation,
        hasSharedStart: sameStartDateTime.allSame,
        hasSharedDate: hasSharedDate,
        hasSharedLocation: sameLocation.allSame,
      }
    })
    // Filter only future events
    .filter((ev) => ev._earliestTs > now.getTime())
    // Sort by earliest race date
    .sort((a, b) => a._earliestTs - b._earliestTs)

  // Group events by week category
  const getEventCategory = (ev: typeof processedEvents[0]) => {
    if (!Number.isFinite(ev._earliestTs)) return 'later'
    return getWeekCategory(new Date(ev._earliestTs).toISOString())
  }

  const thisWeekEvents = processedEvents.filter((ev) => getEventCategory(ev) === 'this-week')
  const nextWeekEvents = processedEvents.filter((ev) => getEventCategory(ev) === 'next-week')
  const laterEvents = processedEvents.filter((ev) => getEventCategory(ev) === 'later').slice(0, 5)

  // Stats za kategorije
  const trailCount = allEvents.filter((ev) => ev.type === 'TRAIL').length
  const roadCount = allEvents.filter((ev) => ev.type === 'ROAD').length
  const ocrCount = allEvents.filter((ev) => ev.type === 'OCR').length

  return (
    <>
      {/* Hero sekcija sa pretragom */}
      <div className="mb-8">
        <Heading>Dobrodošli na Trke Srbija</Heading>
        <Text className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Pronađite i prijavite se za trail i ulične trke širom Srbije.
        </Text>

        {/* Search bar */}
        <form action="/events" className="mt-6 max-full">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              name="q"
              placeholder="Pretraži događaje ili trke..."
              className="w-full rounded-lg border border-zinc-300 bg-white py-3 pl-10 pr-4 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
            />
          </div>
        </form>
      </div>

      {/* Kategorije */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <Link
          href="/events?eventType=TRAIL"
          className="group relative overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
        >
          <div className="aspect-[16/9] bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-900" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6">
            <Badge color="emerald" className="w-fit">Trail trke</Badge>
            <h3 className="mt-2 text-2xl font-bold text-white">Trail</h3>
            <p className="text-sm text-emerald-100">Planinske i brdske staze • {trailCount} događaja</p>
          </div>
        </Link>

        <Link
          href="/events?eventType=ROAD"
          className="group relative overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
        >
          <div className="aspect-[16/9] bg-gradient-to-br from-sky-500 to-sky-700 dark:from-sky-600 dark:to-sky-900" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6">
            <Badge color="sky" className="w-fit">Ulične trke</Badge>
            <h3 className="mt-2 text-2xl font-bold text-white">Ulična</h3>
            <p className="text-sm text-sky-100">Gradske i ulične staze • {roadCount} događaja</p>
          </div>
        </Link>

        <Link
          href="/events?eventType=OCR"
          className="group relative overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
        >
          <div className="aspect-[16/9] bg-gradient-to-br from-orange-500 to-orange-700 dark:from-orange-600 dark:to-orange-900" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6">
            <Badge color="orange" className="w-fit">OCR trke</Badge>
            <h3 className="mt-2 text-2xl font-bold text-white">OCR</h3>
            <p className="text-sm text-orange-100">Preponske trke • {ocrCount} događaja</p>
          </div>
        </Link>
      </div>

      {/* Nadolazeći događaji */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <Subheading>Nadolazeći događaji</Subheading>
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            Svi događaji
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>

        {processedEvents.length === 0 ? (
          <div className="mt-4 rounded-lg border border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Nema nadolazećih događaja
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {/* Ove nedelje */}
            {thisWeekEvents.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Ove nedelje</h3>
                <ul>
                  {thisWeekEvents.map((event, index) => (
                    <li key={event.id}>
                      {index > 0 && <Divider soft />}
                      <EventCard
                        name={event.eventName}
                        url={`/events/${event.slug}`}
                        type={event.type}
                        date={event.date}
                        time={event.time}
                        location={event.location}
                        hasSharedStart={event.hasSharedStart}
                        hasSharedDate={event.hasSharedDate}
                        hasSharedLocation={event.hasSharedLocation}
                        races={event.races}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sledeće nedelje */}
            {nextWeekEvents.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Sledeće nedelje</h3>
                <ul>
                  {nextWeekEvents.map((event, index) => (
                    <li key={event.id}>
                      {index > 0 && <Divider soft />}
                      <EventCard
                        name={event.eventName}
                        url={`/events/${event.slug}`}
                        type={event.type}
                        date={event.date}
                        time={event.time}
                        location={event.location}
                        hasSharedStart={event.hasSharedStart}
                        hasSharedDate={event.hasSharedDate}
                        hasSharedLocation={event.hasSharedLocation}
                        races={event.races}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Kasnije */}
            {laterEvents.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Kasnije</h3>
                <ul>
                  {laterEvents.map((event, index) => (
                    <li key={event.id}>
                      {index > 0 && <Divider soft />}
                      <EventCard
                        name={event.eventName}
                        url={`/events/${event.slug}`}
                        type={event.type}
                        date={event.date}
                        time={event.time}
                        location={event.location}
                        hasSharedStart={event.hasSharedStart}
                        hasSharedDate={event.hasSharedDate}
                        hasSharedLocation={event.hasSharedLocation}
                        races={event.races}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
