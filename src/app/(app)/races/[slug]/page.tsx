import { gql } from '@/app/lib/api'
import { AdminEditButton } from '@/components/admin-edit-button'
import { BackLink } from '@/components/back-link'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { TagList } from '@/components/clickable-tag'
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
  ArrowTopRightOnSquareIcon,
  FlagIcon,
} from '@heroicons/react/16/solid'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

type Competition = {
  id: string
  name: string
  description: string | null
}

type Organizer = {
  id: string
  name: string
  contactPhone: string | null
  contactEmail: string | null
  organizerSite: string | null
}

type RaceCheckpoint = {
  id: string
  orderIndex: number
  distance: number | null
  checkpoint: {
    id: string
    name: string
  }
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
  raceCheckpoints: RaceCheckpoint[]
  raceEvent: {
    id: string
    eventName: string
    slug: string
    type: 'TRAIL' | 'ROAD' | 'OCR'
    description: string | null
    mainImage: string | null
    registrationSite: string | null
    socialMedia: string[]
    tags: string[]
    organizer: Organizer | null
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
        description
      }
      raceCheckpoints {
        id
        orderIndex
        distance
        checkpoint {
          id
          name
        }
      }
      raceEvent {
        id
        eventName
        slug
        type
        description
        mainImage
        registrationSite
        socialMedia
        tags
        organizer {
          id
          name
          contactPhone
          contactEmail
          organizerSite
        }
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

// Social media helpers
function getSocialMediaName(url: string) {
  const lower = url.toLowerCase()
  if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'Facebook'
  if (lower.includes('instagram.com')) return 'Instagram'
  if (lower.includes('strava.com')) return 'Strava'
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'X / Twitter'
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube'
  if (lower.includes('tiktok.com')) return 'TikTok'
  return 'Link'
}

function getSocialMediaStyles(url: string) {
  const lower = url.toLowerCase()
  if (lower.includes('facebook.com') || lower.includes('fb.com'))
    return 'bg-[#1877F2] hover:bg-[#166FE5] text-white border-[#1877F2]'
  if (lower.includes('instagram.com'))
    return 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white border-transparent'
  if (lower.includes('strava.com'))
    return 'bg-[#FC4C02] hover:bg-[#E34402] text-white border-[#FC4C02]'
  if (lower.includes('twitter.com') || lower.includes('x.com'))
    return 'bg-black hover:bg-zinc-800 text-white border-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:border-white'
  if (lower.includes('youtube.com') || lower.includes('youtu.be'))
    return 'bg-[#FF0000] hover:bg-[#CC0000] text-white border-[#FF0000]'
  if (lower.includes('tiktok.com'))
    return 'bg-black hover:bg-zinc-800 text-white border-black'
  return 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700'
}

export default async function RacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const race = await fetchRaceBySlug(slug)

  if (!race) {
    notFound()
  }

  const isTrail = race.raceEvent.type === 'TRAIL'
  const eventType = race.raceEvent.type
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
                eventType === 'TRAIL'
                  ? 'bg-gradient-to-r from-emerald-700/60 to-emerald-900/50'
                  : eventType === 'OCR'
                    ? 'bg-gradient-to-r from-orange-700/60 to-orange-900/50'
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

          {/* 4. Competition */}
          {race.competition && (
            <div>
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Takmičenje / Serija</div>
              <div className="text-sm/6 text-zinc-700 dark:text-zinc-300 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge color="violet">{race.competition.name}</Badge>
                </div>
                {race.competition.description && (
                  <p className="text-zinc-500 dark:text-zinc-400 mt-1">{race.competition.description}</p>
                )}
              </div>
            </div>
          )}

          {/* 5. Checkpoints */}
          {race.raceCheckpoints && race.raceCheckpoints.length > 0 && (
            <div>
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Checkpoint-ovi</div>
              <div className="space-y-1">
                {[...race.raceCheckpoints]
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((rc, idx) => (
                    <div key={rc.id} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <FlagIcon className={`size-4 ${idx === 0 ? 'text-green-500' : idx === race.raceCheckpoints.length - 1 ? 'text-red-500' : 'text-zinc-400'}`} />
                      <span className="font-medium">{rc.checkpoint.name}</span>
                      {rc.distance != null && rc.distance > 0 && (
                        <span className="text-zinc-500">({rc.distance} km)</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 6. Event Description */}
          {race.raceEvent.description && (
            <div>
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">O događaju</div>
              <p className="text-sm/6 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {race.raceEvent.description}
              </p>
            </div>
          )}

          {/* 7. Social Media */}
          {race.raceEvent.socialMedia && race.raceEvent.socialMedia.length > 0 && (
            <div>
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Pratite nas</div>
              <div className="flex flex-wrap gap-2">
                {race.raceEvent.socialMedia.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${getSocialMediaStyles(url)}`}
                  >
                    {getSocialMediaName(url)}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 8. Organizer */}
          {race.raceEvent.organizer && (
            <div>
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Organizator</div>
              <div className="text-sm/6 text-zinc-700 dark:text-zinc-300 space-y-1">
                <div>{race.raceEvent.organizer.name}</div>
                {race.raceEvent.organizer.contactPhone && (
                  <div>
                    <a href={`tel:${race.raceEvent.organizer.contactPhone}`} className="hover:underline">
                      {race.raceEvent.organizer.contactPhone}
                    </a>
                  </div>
                )}
                {race.raceEvent.organizer.contactEmail && (
                  <div>
                    <a href={`mailto:${race.raceEvent.organizer.contactEmail}`} className="hover:underline">
                      {race.raceEvent.organizer.contactEmail}
                    </a>
                  </div>
                )}
                {race.raceEvent.organizer.organizerSite && (
                  <div>
                    <a
                      href={race.raceEvent.organizer.organizerSite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {race.raceEvent.organizer.organizerSite}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 9. Event link */}
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

          {/* 10. GPX Map */}
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
              <div className="rounded-lg overflow-hidden">
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
                    Prijavi se za trku
                  </Button>
                )}
                {!isPast && !race.registrationEnabled && race.raceEvent.registrationSite && (
                  <Button href={race.raceEvent.registrationSite} target="_blank" color="emerald" className="w-full">
                    <ArrowTopRightOnSquareIcon data-slot="icon" />
                    Prijavi se na sajtu organizatora
                  </Button>
                )}
                {!isPast && !race.registrationEnabled && !race.raceEvent.registrationSite && (
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
                <Badge color={eventType === 'TRAIL' ? 'emerald' : eventType === 'OCR' ? 'orange' : 'sky'}>
                  {eventType === 'TRAIL' ? 'Trail' : eventType === 'OCR' ? 'OCR' : 'Ulična'}
                </Badge>
                {race.competition && <Badge color="violet">{race.competition.name}</Badge>}
              </div>
            </div>

            {/* Event tags */}
            {race.raceEvent.tags && race.raceEvent.tags.length > 0 && (
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Kategorije</div>
                <div className="mt-3">
                  <TagList tags={race.raceEvent.tags} />
                </div>
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
