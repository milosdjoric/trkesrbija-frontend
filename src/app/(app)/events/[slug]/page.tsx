import { fetchRaceEventBySlug, type RaceEventWithRaces, type Race } from '@/app/lib/api'
import { AdminEditButton } from '@/components/admin-edit-button'
import { TrainingEditButton } from '@/components/training-edit-button'
import { ReportIssueButton } from '@/components/report-issue-button'
import { BackLink } from '@/components/back-link'
import { Badge } from '@/components/badge'
import { VerifiedBadge } from '@/lib/badges'
import { Button } from '@/components/button'
import { TagList } from '@/components/clickable-tag'
import { Divider } from '@/components/divider'
import { FavoriteButton } from '@/components/favorite-button'
import { ExpandableText } from '@/components/expandable-text'
import { ImageSlider } from '@/components/image-slider'
import { RegisterRaceButton } from '@/components/register-race-button'
import { Heading, Subheading } from '@/components/heading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  GlobeAltIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightIcon,
} from '@heroicons/react/16/solid'
import { EventJsonLd, BreadcrumbJsonLd } from '@/components/json-ld'
import { TrackPageView } from '@/components/track-page-view'
import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const revalidate = 60 // ISR: revalidate svaki minut

// Social media icon helper
function getSocialMediaIcon(url: string) {
  const lower = url.toLowerCase()
  if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'facebook'
  if (lower.includes('instagram.com')) return 'instagram'
  if (lower.includes('strava.com')) return 'strava'
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter'
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
  if (lower.includes('tiktok.com')) return 'tiktok'
  return 'link'
}

function getSocialMediaName(url: string) {
  const type = getSocialMediaIcon(url)
  switch (type) {
    case 'facebook':
      return 'Facebook'
    case 'instagram':
      return 'Instagram'
    case 'strava':
      return 'Strava'
    case 'twitter':
      return 'X / Twitter'
    case 'youtube':
      return 'YouTube'
    case 'tiktok':
      return 'TikTok'
    default:
      return 'Link'
  }
}

// Social media colors
function getSocialMediaStyles(url: string) {
  const type = getSocialMediaIcon(url)
  switch (type) {
    case 'facebook':
      return 'bg-[#1877F2] hover:bg-[#166FE5] text-white'
    case 'instagram':
      return 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white'
    case 'strava':
      return 'bg-[#FC4C02] hover:bg-[#E34402] text-white'
    case 'twitter':
      return 'bg-white hover:bg-zinc-200 text-black'
    case 'youtube':
      return 'bg-[#FF0000] hover:bg-[#CC0000] text-white'
    case 'tiktok':
      return 'bg-white hover:bg-zinc-200 text-black'
    default:
      return 'bg-dark-surface hover:bg-dark-surface-hover text-gray-300'
  }
}

function buildEventDescription(event: RaceEventWithRaces): string {
  if (event.description) {
    const text = event.description.trim()
    return text.length > 120 ? `${text.slice(0, 120).trimEnd()}…` : text
  }

  if (event.races.length === 0) return event.eventName

  const earliest = event.races.reduce((a, b) =>
    new Date(a.startDateTime).getTime() < new Date(b.startDateTime).getTime() ? a : b
  )

  const sentences: string[] = []
  const dateParts: string[] = []

  const d = new Date(earliest.startDateTime)
  if (!Number.isNaN(d.getTime())) {
    const day = parseInt(d.toLocaleDateString('sr-Latn-RS', { day: 'numeric', timeZone: 'Europe/Belgrade' }))
    const month = d.toLocaleDateString('sr-Latn-RS', { month: 'long', timeZone: 'Europe/Belgrade' })
    const year = parseInt(d.toLocaleDateString('sr-Latn-RS', { year: 'numeric', timeZone: 'Europe/Belgrade' }))
    dateParts.push(`${day}. ${month} ${year}.`)
  }

  const loc = earliest.startLocation
  if (loc && !loc.startsWith('http')) {
    dateParts.push(loc)
  }

  if (dateParts.length > 0) sentences.push(dateParts.join(', '))

  const distances = event.races
    .map((r) => r.length)
    .filter((l) => l > 0)
    .sort((a, b) => a - b)
  if (distances.length > 0) {
    const distStr =
      distances.length === 1
        ? `${distances[0]}km`
        : `${distances.slice(0, -1).join(', ')} i ${distances[distances.length - 1]}km`
    sentences.push(`Udaljenosti: ${distStr}.`)
  }

  return sentences.join(' ')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = await fetchRaceEventBySlug(slug)

  if (!event) {
    return { title: 'Događaj nije pronađen' }
  }

  const description = buildEventDescription(event)

  return {
    title: event.eventName,
    description,
    openGraph: {
      title: event.eventName,
      description,
      type: 'website',
      ...(event.mainImage && { images: [{ url: event.mainImage }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: event.eventName,
      description,
      ...(event.mainImage && { images: [event.mainImage] }),
    },
  }
}

function formatTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('sr-Latn-RS', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Belgrade',
  })
}

function formatGoogleDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  const start = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
  // Trajanje 4 sata za trku
  const end = new Date(d.getTime() + 4 * 60 * 60 * 1000)
  const endStr = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`
  return `${start}/${endStr}`
}

function generateICS(event: RaceEventWithRaces, race: Race) {
  const d = new Date(race.startDateTime)
  const pad = (n: number) => n.toString().padStart(2, '0')
  const dtstart = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
  const end = new Date(d.getTime() + 4 * 60 * 60 * 1000)
  const dtend = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`

  return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${event.eventName}
LOCATION:${race.startLocation ?? ''}
END:VEVENT
END:VCALENDAR`
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await fetchRaceEventBySlug(slug)

  if (!event) {
    redirect('/events?info=not-found')
  }

  const races = event.races ?? []
  const sortedRaces = [...races].sort((a, b) => a.length - b.length)

  const earliestRace = [...races].sort((a, b) =>
    new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  )[0]

  // Parse date components for sidebar display
  const eventDateObj = earliestRace ? new Date(earliestRace.startDateTime) : null
  const latestRace = [...races].sort((a, b) =>
    new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  )[races.length - 1]
  const latestDateObj = latestRace ? new Date(latestRace.startDateTime) : null

  // Check if all races are on the same day
  const raceDates = sortedRaces.map((r) => {
    const d = new Date(r.startDateTime)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  })
  const uniqueDates = new Set(raceDates)
  const allSameDay = uniqueDates.size === 1 && sortedRaces.length > 0

  // Date display logic
  const tz = 'Europe/Belgrade'
  const formatDateDisplay = (date: Date) => {
    const day = parseInt(date.toLocaleDateString('sr-Latn-RS', { day: 'numeric', timeZone: tz }))
    const month = date.toLocaleDateString('sr-Latn-RS', { month: 'long', timeZone: tz })
    const year = parseInt(date.toLocaleDateString('sr-Latn-RS', { year: 'numeric', timeZone: tz }))
    return `${day}. ${month} ${year}.`
  }

  const formatShortDate = (date: Date) => {
    const day = parseInt(date.toLocaleDateString('sr-Latn-RS', { day: 'numeric', timeZone: tz }))
    const month = date.toLocaleDateString('sr-Latn-RS', { month: 'short', timeZone: tz })
    return `${day}. ${month}`
  }

  const eventDateDisplay = eventDateObj
    ? allSameDay
      ? formatDateDisplay(eventDateObj)
      : latestDateObj
        ? `${formatShortDate(eventDateObj)} - ${formatShortDate(latestDateObj)}`
        : formatDateDisplay(eventDateObj)
    : 'Datum nije definisan'

  // Weekday display
  const eventWeekday = eventDateObj?.toLocaleDateString('sr-Latn-RS', { weekday: 'long', timeZone: tz }) ?? ''
  const latestWeekday = latestDateObj?.toLocaleDateString('sr-Latn-RS', { weekday: 'long', timeZone: tz }) ?? ''
  const weekdayDisplay = allSameDay
    ? eventWeekday
    : eventWeekday && latestWeekday
      ? `${eventWeekday} - ${latestWeekday}`
      : eventWeekday

  // Check if all races have the same location
  const raceLocations = sortedRaces.map((r) => r.startLocation ?? '').filter(Boolean)
  const uniqueLocations = new Set(raceLocations)
  const allSameLocation = uniqueLocations.size <= 1
  const eventLocation = allSameLocation && raceLocations.length > 0 ? raceLocations[0] : null

  // Vreme prve trke
  const earliestRaceTime = earliestRace ? formatTime(earliestRace.startDateTime) : ''
  const allSameTime = races.length > 1 && new Set(races.map((r) => formatTime(r.startDateTime))).size === 1

  // Google Maps navigation URL
  const getGoogleMapsUrl = (location: string) => {
    if (location.startsWith('http')) return location
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
  }

  // Calendar URLs
  const googleCalendarUrl =
    allSameDay && earliestRace
      ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.eventName)}&dates=${formatGoogleDate(earliestRace.startDateTime)}&location=${encodeURIComponent(eventLocation ?? '')}`
      : ''

  const appleCalendarUrl =
    allSameDay && earliestRace
      ? `data:text/calendar;charset=utf8,${encodeURIComponent(generateICS(event, earliestRace))}`
      : ''

  const firstNonUrlLocation =
    races.map((r) => r.startLocation).find((loc) => loc && !loc.startsWith('http')) ?? 'Srbija'

  return (
    <>
      {earliestRace && (
        <EventJsonLd
          name={event.eventName}
          description={buildEventDescription(event)}
          startDate={earliestRace.startDateTime}
          endDate={latestRace?.startDateTime}
          location={firstNonUrlLocation}
          url={`https://trkesrbija.rs/events/${slug}`}
          image={event.mainImage ?? undefined}
          organizer={event.organizer?.name ?? undefined}
        />
      )}
      <BreadcrumbJsonLd
        items={[
          { name: 'Početna', url: 'https://trkesrbija.rs' },
          { name: 'Svi događaji', url: 'https://trkesrbija.rs/events' },
          { name: event.eventName, url: `https://trkesrbija.rs/events/${slug}` },
        ]}
      />
      <TrackPageView entityId={event.id} entityType="EVENT" metadata={{ slug, name: event.eventName }} />
      <BackLink href={event.isTraining ? '/training' : '/events'}>
        {event.isTraining ? 'Moji treninzi' : 'Događaji'}
      </BackLink>

      {/* Two-column layout */}
      <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-[1fr_320px]">
        {/* LEFT COLUMN - Main Content */}
        <div className="space-y-8">
          {/* 1. Hero Section - Date + Name with background image */}
          <div
            className="relative overflow-hidden rounded-xl"
            style={event.mainImage ? { backgroundImage: `url(${event.mainImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          >
            {/* Color overlay based on event type */}
            <div
              className={`absolute inset-0 ${
                event.mainImage
                  ? event.type === 'TRAIL'
                    ? 'bg-gradient-to-r from-emerald-700/60 to-emerald-900/50'
                    : event.type === 'OCR'
                      ? 'bg-gradient-to-r from-orange-700/60 to-orange-900/50'
                      : 'bg-gradient-to-r from-sky-700/60 to-sky-900/50'
                  : event.type === 'TRAIL'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-100'
                    : event.type === 'OCR'
                      ? 'bg-gradient-to-r from-orange-500 to-orange-100'
                      : 'bg-gradient-to-r from-sky-600 to-sky-100'
              }`}
            />
            {/* Content */}
            <div className="relative z-10 px-5 py-8 md:px-6 md:py-10">
              <div className="text-sm font-medium text-white/80 mb-2">
                {eventDateDisplay}
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white md:text-2xl">
                  {event.eventName}
                </h1>
                {event.verified && <VerifiedBadge />}
                {event.isTraining && (
                  <Badge color="blue">Trening</Badge>
                )}
              </div>
            </div>
          </div>

          {/* 2. Races Table */}
          <div>
            <Subheading>{event.isTraining ? 'Staze' : 'Trke'} ({races.length})</Subheading>

            {races.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dark-border p-6 text-sm/6">
                <div className="font-medium text-white">Još nema trka</div>
                <div className="mt-1 text-gray-500">Ovaj događaj još nema konfiguriranih trka.</div>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <Table striped>
                  <TableHead>
                    <TableRow>
                      <TableHeader>{event.isTraining ? 'Staza' : 'Trka'}</TableHeader>
                      {!event.isTraining && <TableHeader>Distanca</TableHeader>}
                      {!event.isTraining && <TableHeader>Vis. razlika</TableHeader>}
                      <TableHeader>Start</TableHeader>
                      <TableHeader className="text-right">Akcije</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedRaces.map((race, index) => (
                      <TableRow key={race.id}>
                        <TableCell>
                          <Link
                            href={`/races/${race.slug}`}
                            className="font-medium text-white hover:text-brand-green"
                          >
                            {race.raceName ?? (event.isTraining ? `Staza ${index + 1}` : 'Trka')}
                          </Link>
                          {!allSameLocation && race.startLocation && (
                            <div className="text-sm text-gray-500">
                              {race.startLocation.startsWith('http') ? (
                                <a
                                  href={race.startLocation}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline underline-offset-2 hover:text-gray-300"
                                >
                                  Lokacija
                                </a>
                              ) : (
                                race.startLocation
                              )}
                            </div>
                          )}
                        </TableCell>
                        {!event.isTraining && <TableCell>{race.length > 0 ? `${race.length} km` : '–'}</TableCell>}
                        {!event.isTraining && <TableCell>{race.elevation != null && race.elevation > 0 ? `${race.elevation} m` : '–'}</TableCell>}
                        <TableCell>{formatTime(race.startDateTime)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <RegisterRaceButton raceId={race.id} raceSlug={race.slug} size="sm" />
                            <FavoriteButton raceId={race.id} initialIsFavorite={false} size="sm" />
                            <Link
                              href={`/races/${race.slug}`}
                              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-dark-surface hover:text-white"
                              title="Detalji trke"
                            >
                              <ArrowRightIcon className="size-4" />
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* 3. Social Media Links - clearly labeled with platform colors (hidden for trainings) */}
          {!event.isTraining && event.socialMedia && event.socialMedia.length > 0 && (
            <div>
              <div className="text-base font-medium underline text-gray-500 mb-3">Pratite nas</div>
              <div className="flex flex-wrap gap-2">
                {event.socialMedia.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 overflow-hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors ${getSocialMediaStyles(url)}`}
                  >
                    {getSocialMediaName(url)}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 4. Organizer Info (hidden for trainings) */}
          {!event.isTraining && event.organizer && (
            <div>
              <div className="text-base font-medium underline text-gray-500 mb-2">Organizator</div>
              <div className="text-sm/6 text-gray-300 space-y-1">
                <div>{event.organizer.name}</div>
                {event.organizer.contactPhone && (
                  <div>
                    <a href={`tel:${event.organizer.contactPhone}`} className="hover:underline">
                      {event.organizer.contactPhone}
                    </a>
                  </div>
                )}
                {event.organizer.contactEmail && (
                  <div>
                    <a href={`mailto:${event.organizer.contactEmail}`} className="hover:underline">
                      {event.organizer.contactEmail}
                    </a>
                  </div>
                )}
                {event.organizer.organizerSite && (
                  <div>
                    <a
                      href={event.organizer.organizerSite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {event.organizer.organizerSite}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Description */}
          {event.description && (
            <div>
              <div className="text-base font-medium underline text-gray-500 mb-2">
                {event.isTraining ? 'O treningu' : 'O događaju'}
              </div>
              <ExpandableText text={event.description} maxLines={5} buttonLabel={event.isTraining ? 'Pogledaj više o treningu' : 'Pogledaj više o događaju'} />
            </div>
          )}

          {/* 6. Gallery Slider */}
          {event.gallery && event.gallery.length > 0 && (
            <div>
              <Subheading>Galerija</Subheading>
              <div className="mt-4">
                <ImageSlider images={event.gallery} alt={event.eventName} />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="rounded-xl border border-dark-border bg-dark-card p-6">
              {/* Info redovi sa ikonama */}
              <div className="space-y-3">
                {/* 1. Datum */}
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <CalendarIcon className="size-5 shrink-0 text-gray-500" />
                  <span className="font-medium text-white">{eventDateDisplay}</span>
                </div>

                {/* 2. Dan u nedelji */}
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <CalendarIcon className="size-5 shrink-0 text-gray-500" />
                  <span className="capitalize">{weekdayDisplay}</span>
                </div>

                {/* 3. Vreme (prva trka) */}
                {earliestRaceTime && (
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <ClockIcon className="size-5 shrink-0 text-gray-500" />
                    <span>
                      {earliestRaceTime}
                      {races.length > 1 ? (allSameTime ? ' (sve trke)' : ' (prva trka)') : ''}
                    </span>
                  </div>
                )}

                {/* 4. Lokacija */}
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <MapPinIcon className="size-5 shrink-0 text-gray-500" />
                  <span>
                    {eventLocation ? (
                      eventLocation.startsWith('http') ? 'Lokacija na mapi' : eventLocation
                    ) : (
                      'Različite lokacije'
                    )}
                  </span>
                </div>
              </div>

              <Divider soft className="my-4" />

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Training owner edit button */}
                {event.isTraining && (
                  <TrainingEditButton eventId={event.id} createdById={event.createdById} />
                )}

                {/* Admin edit button */}
                <AdminEditButton href={`/admin/events/${event.id}/edit`} label="Izmeni događaj" />

                {/* 5. Vodi me do starta - only if all same location */}
                {allSameLocation && eventLocation && (
                  <Button
                    href={getGoogleMapsUrl(eventLocation)}
                    target="_blank"
                    outline
                    className="w-full"
                  >
                    <MapPinIcon data-slot="icon" />
                    Vodi me do starta
                  </Button>
                )}

                {/* Calendar buttons - only if all same day */}
                {allSameDay && (
                  <>
                    <Button outline href={googleCalendarUrl} target="_blank" className="w-full">
                      <CalendarIcon data-slot="icon" />
                      Google Calendar
                    </Button>
                    <Button outline href={appleCalendarUrl} className="w-full">
                      <CalendarIcon data-slot="icon" />
                      Apple Calendar
                    </Button>
                  </>
                )}

                {/* External registration link (hidden for trainings) */}
                {!event.isTraining && event.registrationSite && (
                  <Button
                    href={event.registrationSite}
                    target="_blank"
                    color="emerald"
                    className="w-full"
                  >
                    <ArrowTopRightOnSquareIcon data-slot="icon" />
                    Prijavi se na sajtu organizatora
                  </Button>
                )}

                <ReportIssueButton entityType="EVENT" entityId={event.id} entityName={event.eventName} />
              </div>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="rounded-lg border border-dark-border p-4">
                <div className="text-sm font-medium text-gray-500">Kategorije</div>
                <div className="mt-3">
                  <TagList tags={event.tags} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
