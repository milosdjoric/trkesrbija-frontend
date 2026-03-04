import { gql } from '@/app/lib/api'
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

export const revalidate = 300 // ISR: revalidate svakih 5 minuta

export const metadata: Metadata = {
  title: 'Lista trail i uličnih trka',
  description:
    'Pronađite sve predstojeće trail i ulične trke u Srbiji. Online prijava, rezultati, GPX analizator ruta i još mnogo toga.',
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
    raceEvents(limit: $limit, orderBy: CREATED_AT_DESC, isTraining: false) {
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
          ? sameStartDateTime.value.toLocaleTimeString('sr-Latn-RS', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Belgrade' })
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

  // Stats za kategorije (svi događaji, uključujući protekle)
  const trailCount = allEvents.filter((ev) => ev.type === 'TRAIL').length
  const roadCount = allEvents.filter((ev) => ev.type === 'ROAD').length
  const ocrCount = allEvents.filter((ev) => ev.type === 'OCR').length

  return (
    <>
      {/* Hero sekcija sa pretragom */}
      <div className="mb-12 pt-8 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-dark-border bg-dark-surface px-4 py-1.5 text-sm font-medium text-brand-green">
          <span>🏃</span>
          <span>Sezona 2026 je počela</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
          Sve trke u Srbiji.
        </h1>
        <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-400 sm:text-5xl md:text-6xl">
          Na jednom mestu.
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-base text-gray-400">
          Pronađi trku, prijavi se online, prati rezultate uživo. Od 5k fun run-ova do ultramaratona.
        </p>

        {/* Search bar */}
        <form action="/events" className="mx-auto mt-10 max-w-2xl">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="q"
                placeholder="Pretraži trke, gradove..."
                className="w-full rounded-xl border border-dark-border bg-dark-surface py-4 pl-12 pr-4 text-base text-white placeholder:text-gray-400 focus:border-dark-border-light focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-brand-green px-8 py-4 text-base font-bold text-black transition-colors hover:bg-brand-green-dark"
            >
              Traži
            </button>
          </div>
        </form>
      </div>

      {/* Kategorije */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <Link
          href="/events?eventType=TRAIL"
          className="group relative overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
        >
          <div className="aspect-[16/9] bg-gradient-to-br from-emerald-600 to-emerald-900" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6">
            <span className="inline-flex w-fit items-center rounded-md bg-white/20 px-1.5 py-0.5 text-sm/5 font-medium text-white sm:text-xs/5">Trail trke</span>
            <h3 className="mt-2 text-2xl font-bold text-white">Trail</h3>
            <p className="text-sm text-emerald-100">Planinske i brdske staze • {trailCount} događaja</p>
          </div>
        </Link>

        <Link
          href="/events?eventType=ROAD"
          className="group relative overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
        >
          <div className="aspect-[16/9] bg-gradient-to-br from-sky-600 to-sky-900" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6">
            <span className="inline-flex w-fit items-center rounded-md bg-white/20 px-1.5 py-0.5 text-sm/5 font-medium text-white sm:text-xs/5">Ulične trke</span>
            <h3 className="mt-2 text-2xl font-bold text-white">Ulična</h3>
            <p className="text-sm text-sky-100">Gradske i ulične staze • {roadCount} događaja</p>
          </div>
        </Link>

        <Link
          href="/events?eventType=OCR"
          className="group relative overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
        >
          <div className="aspect-[16/9] bg-gradient-to-br from-orange-600 to-orange-900" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6">
            <span className="inline-flex w-fit items-center rounded-md bg-white/20 px-1.5 py-0.5 text-sm/5 font-medium text-white sm:text-xs/5">OCR trke</span>
            <h3 className="mt-2 text-2xl font-bold text-white">OCR</h3>
            <p className="text-sm text-orange-100">Trke sa preprekama • {ocrCount} događaja</p>
          </div>
        </Link>
      </div>

      {/* Nadolazeći događaji */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <Subheading>Nadolazeći događaji</Subheading>
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300"
          >
            Svi događaji
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>

        {processedEvents.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dark-border p-6 text-center text-sm text-gray-400">
            Nema nadolazećih događaja
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {/* Ove nedelje */}
            {thisWeekEvents.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span className="rounded-full bg-dark-surface px-3 py-1 text-xs font-semibold text-gray-300">Ove nedelje</span>
                  <div className="h-px flex-1 bg-dark-border" />
                </div>
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
                <div className="mb-3 flex items-center gap-3">
                  <span className="rounded-full bg-dark-surface px-3 py-1 text-xs font-semibold text-gray-300">Sledeće nedelje</span>
                  <div className="h-px flex-1 bg-dark-border" />
                </div>
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
                <div className="mb-3 flex items-center gap-3">
                  <span className="rounded-full bg-dark-surface px-3 py-1 text-xs font-semibold text-gray-300">Kasnije</span>
                  <div className="h-px flex-1 bg-dark-border" />
                </div>
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
            icon={<CalendarIcon className="size-5 text-gray-400" />}
            title="Svi događaji"
            description="Pregledaj kalendar trka"
          />
          <QuickLinkCard
            href="/favorites"
            icon={<TrophyIcon className="size-5 text-gray-400" />}
            title="Omiljene trke"
            description="Tvoje sačuvane trke"
          />
          <QuickLinkCard
            href="/my-registrations"
            icon={<UserGroupIcon className="size-5 text-gray-400" />}
            title="Moje prijave"
            description="Tvoje registracije"
          />
        </div>
      </div>
    </>
  )
}
