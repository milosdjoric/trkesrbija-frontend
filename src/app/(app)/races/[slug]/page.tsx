import { gql } from '@/app/lib/api'
import { AdminEditButton } from '@/components/admin-edit-button'
import { BackLink } from '@/components/back-link'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Divider } from '@/components/divider'
import { FavoriteButtonServer } from '@/components/favorite-button-server'
import { GpxMapWrapper } from '@/components/gpx-map-wrapper'
import { Subheading } from '@/components/heading'
import { RaceResults } from '@/components/race-results'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ArrowTrendingUpIcon,
  MapIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
} from '@heroicons/react/16/solid'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

type Competition = {
  id: string
  name: string
}

type RaceWithEvent = {
  id: string
  slug: string
  raceName: string | null
  length: number
  elevation: number | null
  gpsFile: string | null
  startLocation: string
  startDateTime: string
  endDateTime: string | null
  registrationEnabled: boolean
  registrationCount: number
  competitionId: string | null
  competition: Competition | null
  raceEvent: {
    id: string
    eventName: string
    slug: string
    type: 'TRAIL' | 'ROAD'
    description: string | null
    mainImage: string | null
  }
}

const RACE_BY_SLUG_QUERY = `
  query RaceBySlug($slug: String!) {
    race(slug: $slug) {
      id
      slug
      raceName
      length
      elevation
      gpsFile
      startLocation
      startDateTime
      endDateTime
      registrationEnabled
      registrationCount
      competitionId
      competition {
        id
        name
      }
      raceEvent {
        id
        eventName
        slug
        type
        description
        mainImage
      }
    }
  }
`

async function fetchRaceBySlug(slug: string): Promise<RaceWithEvent | null> {
  try {
    const data = await gql<{ race: RaceWithEvent | null }>(RACE_BY_SLUG_QUERY, { slug })
    return data.race
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const race = await fetchRaceBySlug(slug)

  if (!race) {
    return { title: 'Trka nije pronađena' }
  }

  const title = race.raceName
    ? `${race.raceName} - ${race.raceEvent.eventName}`
    : race.raceEvent.eventName

  const description = `${title} - ${race.length}km${race.elevation ? `, ${race.elevation}m D+` : ''}. Prijavite se i učestvujte!`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(race.raceEvent.mainImage && { images: [{ url: race.raceEvent.mainImage }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(race.raceEvent.mainImage && { images: [race.raceEvent.mainImage] }),
    },
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  const day = d.getDate()
  const month = d.toLocaleDateString('sr-Latn-RS', { month: 'long' })
  const year = d.getFullYear()
  return `${day}. ${month} ${year}.`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('sr-Latn-RS', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatWeekday(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('sr-Latn-RS', { weekday: 'long' })
}

function daysUntil(iso: string): number {
  const d = new Date(iso)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getCountdownText(days: number) {
  if (days < 0) return 'Završeno'
  if (days === 0) return 'Danas!'
  if (days === 1) return 'Sutra!'
  return `Za ${days} dana`
}

function getCountdownColor(days: number) {
  if (days < 0) return 'zinc'
  if (days === 0) return 'red'
  if (days === 1) return 'amber'
  if (days <= 7) return 'lime'
  return 'cyan'
}

// Google Maps navigation URL
function getGoogleMapsUrl(location: string) {
  if (location.startsWith('http')) return location
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

export default async function RacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const race = await fetchRaceBySlug(slug)

  if (!race) {
    notFound()
  }

  const isTrail = race.raceEvent.type === 'TRAIL'
  const days = daysUntil(race.startDateTime)
  const isPast = days < 0

  const title = race.raceName ?? race.raceEvent.eventName

  return (
    <>
      <BackLink href={`/events/${race.raceEvent.slug}`}>{race.raceEvent.eventName}</BackLink>

      {/* Two-column layout */}
      <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-[1fr_320px]">
        {/* LEFT COLUMN - Main Content */}
        <div className="space-y-8">
          {/* 1. Hero Section - Date + Name with background image */}
          <div
            className="relative overflow-hidden rounded-xl"
            style={
              race.raceEvent.mainImage
                ? {
                    backgroundImage: `url(${race.raceEvent.mainImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            {/* Color overlay based on event type */}
            <div
              className={`absolute inset-0 ${
                isTrail
                  ? 'bg-gradient-to-r from-emerald-700/60 to-emerald-900/50'
                  : 'bg-gradient-to-r from-sky-700/60 to-sky-900/50'
              }`}
            />
            {/* Content */}
            <div className="relative z-10 px-5 py-8 md:px-6 md:py-10">
              <div className="text-sm font-medium text-white/80 mb-2">{formatDate(race.startDateTime)}</div>
              <h1 className="text-xl font-bold text-white md:text-2xl">{title}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge color={getCountdownColor(days)}>{getCountdownText(days)}</Badge>
                {race.competition && <Badge color="violet">{race.competition.name}</Badge>}
              </div>
            </div>
          </div>

          {/* 2. Race Info - similar style to event page */}
          <div>
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Informacije o trci</div>
            <div className="text-sm/6 text-zinc-700 dark:text-zinc-300 space-y-1">
              <div className="flex items-center gap-2">
                <MapIcon className="size-4 text-zinc-400" />
                <span>Distanca: {race.length > 0 ? `${race.length} km` : 'Nije definisano'}</span>
              </div>
              {race.elevation != null && race.elevation > 0 && (
                <div className="flex items-center gap-2">
                  <ArrowTrendingUpIcon className="size-4 text-zinc-400" />
                  <span>Visinska razlika: {race.elevation} m</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <ClockIcon className="size-4 text-zinc-400" />
                <span>Start: {formatTime(race.startDateTime)}</span>
              </div>
              {race.endDateTime && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="size-4 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">Cut-off: {formatTime(race.endDateTime)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <UserGroupIcon className="size-4 text-zinc-400" />
                <span>Prijavljenih: {race.registrationCount}</span>
              </div>
            </div>
          </div>

          {/* 3. Location */}
          {race.startLocation && (
            <div>
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Lokacija starta</div>
              <div className="text-sm/6 text-zinc-700 dark:text-zinc-300">
                {race.startLocation.startsWith('http') ? (
                  <a
                    href={race.startLocation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Prikaži na mapi
                  </a>
                ) : (
                  race.startLocation
                )}
              </div>
            </div>
          )}

          {/* 4. Event link */}
          <div>
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Događaj</div>
            <div className="text-sm/6 text-zinc-700 dark:text-zinc-300">
              <a
                href={`/events/${race.raceEvent.slug}`}
                className="hover:underline"
              >
                {race.raceEvent.eventName}
              </a>
            </div>
          </div>

          {/* 5. GPX Map */}
          {race.gpsFile && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Subheading>GPS staza</Subheading>
                <a
                  href={race.gpsFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  <ArrowDownTrayIcon className="size-4" />
                  Preuzmi GPX
                </a>
              </div>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <GpxMapWrapper gpxUrl={race.gpsFile} />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50">
              {/* Info rows with icons */}
              <div className="space-y-3">
                {/* Date */}
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <CalendarIcon className="size-5 shrink-0 text-zinc-400" />
                  <span className="font-medium text-zinc-950 dark:text-white">{formatDate(race.startDateTime)}</span>
                </div>

                {/* Weekday */}
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <CalendarIcon className="size-5 shrink-0 text-zinc-400" />
                  <span className="capitalize">{formatWeekday(race.startDateTime)}</span>
                </div>

                {/* Time */}
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <ClockIcon className="size-5 shrink-0 text-zinc-400" />
                  <span>Start u {formatTime(race.startDateTime)}</span>
                </div>

                {/* Location */}
                {race.startLocation && (
                  <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <MapPinIcon className="size-5 shrink-0 text-zinc-400" />
                    <span>
                      {race.startLocation.startsWith('http') ? 'Lokacija na mapi' : race.startLocation}
                    </span>
                  </div>
                )}
              </div>

              <Divider soft className="my-4" />

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Admin edit button */}
                <AdminEditButton href={`/admin/races/${race.id}/edit`} label="Izmeni trku" />

                {/* Navigate to start - only if location exists */}
                {race.startLocation && (
                  <Button href={getGoogleMapsUrl(race.startLocation)} target="_blank" outline className="w-full">
                    <MapPinIcon data-slot="icon" />
                    Vodi me do starta
                  </Button>
                )}

                {/* Registration or Results button */}
                {!isPast && race.registrationEnabled && (
                  <Button href={`/races/${race.slug}/register`} color="emerald" className="w-full">
                    Prijavi se
                  </Button>
                )}
                {!isPast && !race.registrationEnabled && (
                  <Button disabled className="w-full">
                    Prijave zatvorene
                  </Button>
                )}
                {isPast && (
                  <Button href={`/races/${race.slug}/results`} outline className="w-full">
                    Pogledaj rezultate
                  </Button>
                )}

                {/* Favorite button */}
                <FavoriteButtonServer raceId={race.id} />
              </div>
            </div>

            {/* Tags - type badge */}
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tip trke</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge color={isTrail ? 'emerald' : 'sky'}>{isTrail ? 'Trail' : 'Ulična'}</Badge>
                {race.competition && <Badge color="violet">{race.competition.name}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section - Full Width */}
      <RaceResults raceId={race.id} raceName={race.raceName} />
    </>
  )
}
