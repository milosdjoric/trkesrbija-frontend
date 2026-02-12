import { gql } from '@/app/lib/api'
import { BackLink } from '@/components/back-link'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Divider } from '@/components/divider'
import { FavoriteButtonServer } from '@/components/favorite-button-server'
import { GpxMapWrapper } from '@/components/gpx-map-wrapper'
import { Heading, Subheading } from '@/components/heading'
import { RaceResults } from '@/components/race-results'
import { Text } from '@/components/text'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ArrowTrendingUpIcon,
  MapIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/16/solid'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

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
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Heading>{title}</Heading>
              <Badge color={isTrail ? 'emerald' : 'sky'}>{isTrail ? 'Trail' : 'Ulična'}</Badge>
              <Badge color={getCountdownColor(days)}>{getCountdownText(days)}</Badge>
            </div>
            <Text className="mt-2">
              Deo događaja{' '}
              <a
                href={`/events/${race.raceEvent.slug}`}
                className="font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
              >
                {race.raceEvent.eventName}
              </a>
            </Text>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <MapIcon className="size-4" />
                Distanca
              </div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
                {race.length > 0 ? `${race.length} km` : 'Nema info'}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <ArrowTrendingUpIcon className="size-4" />
                Vis. razlika
              </div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
                {race.elevation != null && race.elevation > 0 ? `${race.elevation} m` : 'Nema info'}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <ClockIcon className="size-4" />
                Start
              </div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
                {formatTime(race.startDateTime)}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <CalendarIcon className="size-4" />
                Prijavljenih
              </div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
                {race.registrationCount}
              </div>
            </div>
          </div>

          {/* Location */}
          {race.startLocation && (
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <Subheading>Lokacija starta</Subheading>
              <div className="mt-2 flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <MapPinIcon className="size-5 text-zinc-400" />
                {race.startLocation.startsWith('http') ? (
                  <a
                    href={race.startLocation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-white"
                  >
                    Prikaži na mapi
                  </a>
                ) : (
                  race.startLocation
                )}
              </div>
            </div>
          )}

          {/* GPX Map */}
          {race.gpsFile && (
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="flex items-center justify-between">
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
              <div className="mt-4">
                <GpxMapWrapper gpxUrl={race.gpsFile} />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="space-y-6">
            {/* Action Card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50">
              {/* Date */}
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Datum</div>
              <div className="mt-2 text-2xl font-bold text-zinc-950 dark:text-white">
                {formatDate(race.startDateTime)}
              </div>

              <Divider soft className="my-4" />

              {/* Info rows */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <CalendarIcon className="size-5 text-zinc-400" />
                  <span className="capitalize">{formatWeekday(race.startDateTime)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <ClockIcon className="size-5 text-zinc-400" />
                  <span>Start u {formatTime(race.startDateTime)}</span>
                </div>
              </div>

              <Divider soft className="my-4" />

              {/* Actions */}
              <div className="space-y-2">
                {!isPast && race.registrationEnabled && (
                  <Button href={`/races/${race.slug}/register`} className="w-full">
                    Prijavi se
                  </Button>
                )}
                {!isPast && !race.registrationEnabled && (
                  <Button disabled className="w-full">
                    Prijave zatvorene
                  </Button>
                )}
                {isPast && (
                  <Button href={`/races/${race.slug}/results`} className="w-full">
                    Pogledaj rezultate
                  </Button>
                )}
                <FavoriteButtonServer raceId={race.id} />
              </div>
            </div>

            {/* Event Image */}
            {race.raceEvent.mainImage && (
              <div className="overflow-hidden rounded-lg">
                <img
                  src={race.raceEvent.mainImage}
                  alt={race.raceEvent.eventName}
                  className="aspect-video w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section - Full Width */}
      <RaceResults raceId={race.id} raceName={race.raceName} />
    </>
  )
}
