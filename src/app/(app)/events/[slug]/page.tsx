import { fetchRaceEventBySlug, type RaceEventWithRaces, type Race } from '@/app/lib/api'
import { AdminEditButton } from '@/components/admin-edit-button'
import { BackLink } from '@/components/back-link'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Divider } from '@/components/divider'
import { FavoriteButton } from '@/components/favorite-button'
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
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

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
      return 'bg-[#1877F2] hover:bg-[#166FE5] text-white border-[#1877F2]'
    case 'instagram':
      return 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white border-transparent'
    case 'strava':
      return 'bg-[#FC4C02] hover:bg-[#E34402] text-white border-[#FC4C02]'
    case 'twitter':
      return 'bg-black hover:bg-zinc-800 text-white border-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:border-white'
    case 'youtube':
      return 'bg-[#FF0000] hover:bg-[#CC0000] text-white border-[#FF0000]'
    case 'tiktok':
      return 'bg-black hover:bg-zinc-800 text-white border-black'
    default:
      return 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700'
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = await fetchRaceEventBySlug(slug)

  if (!event) {
    return { title: 'Događaj nije pronađen' }
  }

  const eventType = event.type === 'TRAIL' ? 'Trail' : 'Ulična'
  const description =
    event.description ??
    `${event.eventName} - ${eventType} trka u Srbiji. Prijavite se i učestvujte!`

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
    notFound()
  }

  const races = event.races ?? []
  const sortedRaces = [...races].sort((a, b) => {
    const da = new Date(a.startDateTime).getTime()
    const db = new Date(b.startDateTime).getTime()
    return da - db
  })

  const earliestRace = sortedRaces[0]

  // Parse date components for sidebar display
  const eventDateObj = earliestRace ? new Date(earliestRace.startDateTime) : null
  const latestRace = sortedRaces[sortedRaces.length - 1]
  const latestDateObj = latestRace ? new Date(latestRace.startDateTime) : null

  // Check if all races are on the same day
  const raceDates = sortedRaces.map((r) => {
    const d = new Date(r.startDateTime)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  })
  const uniqueDates = new Set(raceDates)
  const allSameDay = uniqueDates.size === 1 && sortedRaces.length > 0

  // Date display logic
  const formatDateDisplay = (date: Date) => {
    const day = date.getDate()
    const month = date.toLocaleDateString('sr-Latn-RS', { month: 'long' })
    const year = date.getFullYear()
    return `${day}. ${month} ${year}.`
  }

  const formatShortDate = (date: Date) => {
    const day = date.getDate()
    const month = date.toLocaleDateString('sr-Latn-RS', { month: 'short' })
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
  const eventWeekday = eventDateObj?.toLocaleDateString('sr-Latn-RS', { weekday: 'long' }) ?? ''
  const latestWeekday = latestDateObj?.toLocaleDateString('sr-Latn-RS', { weekday: 'long' }) ?? ''
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

  return (
    <>
      <BackLink href="/events">Događaji</BackLink>

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
                event.type === 'TRAIL'
                  ? 'bg-gradient-to-r from-emerald-700/60 to-emerald-900/50'
                  : 'bg-gradient-to-r from-sky-700/60 to-sky-900/50'
              }`}
            />
            {/* Content */}
            <div className="relative z-10 px-5 py-8 md:px-6 md:py-10">
              <div className="text-sm font-medium text-white/80 mb-2">
                {eventDateDisplay}
              </div>
              <h1 className="text-xl font-bold text-white md:text-2xl">
                {event.eventName}
              </h1>
            </div>
          </div>

          {/* 2. Races Table */}
          <div>
            <Subheading>Trke ({races.length})</Subheading>

            {races.length === 0 ? (
              <div className="mt-4 rounded-lg border border-zinc-200 p-6 text-sm/6 dark:border-zinc-700">
                <div className="font-medium">Još nema trka</div>
                <div className="mt-1 text-zinc-500">Ovaj događaj još nema konfiguriranih trka.</div>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <Table striped>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Trka</TableHeader>
                      <TableHeader>Distanca</TableHeader>
                      <TableHeader>Vis. razlika</TableHeader>
                      <TableHeader>Start</TableHeader>
                      <TableHeader className="text-right">Akcije</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedRaces.map((race) => (
                      <TableRow key={race.id}>
                        <TableCell>
                          <Link
                            href={`/races/${race.slug}`}
                            className="font-medium text-zinc-900 hover:text-emerald-600 dark:text-zinc-100 dark:hover:text-emerald-400"
                          >
                            {race.raceName ?? 'Trka'}
                          </Link>
                          {!allSameLocation && race.startLocation && (
                            <div className="text-sm text-zinc-500">
                              {race.startLocation.startsWith('http') ? (
                                <a
                                  href={race.startLocation}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
                                >
                                  Lokacija
                                </a>
                              ) : (
                                race.startLocation
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{race.length > 0 ? `${race.length} km` : '–'}</TableCell>
                        <TableCell>{race.elevation != null && race.elevation > 0 ? `${race.elevation} m` : '–'}</TableCell>
                        <TableCell>{formatTime(race.startDateTime)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <RegisterRaceButton raceId={race.id} raceSlug={race.slug} size="sm" />
                            <FavoriteButton raceId={race.id} initialIsFavorite={false} size="sm" />
                            <Link
                              href={`/races/${race.slug}`}
                              className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
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

          {/* 3. Social Media Links - clearly labeled with platform colors */}
          {event.socialMedia && event.socialMedia.length > 0 && (
            <div>
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Pratite nas</div>
              <div className="flex flex-wrap gap-2">
                {event.socialMedia.map((url) => (
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

          {/* 4. Organizer Info */}
          {event.organizer && (
            <div>
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Organizator</div>
              <div className="text-sm/6 text-zinc-700 dark:text-zinc-300 space-y-1">
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
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">O događaju</div>
              <p className="text-sm/6 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {event.description}
              </p>
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
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50">
              {/* Info redovi sa ikonama */}
              <div className="space-y-3">
                {/* 1. Datum */}
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <CalendarIcon className="size-5 shrink-0 text-zinc-400" />
                  <span className="font-medium text-zinc-950 dark:text-white">{eventDateDisplay}</span>
                </div>

                {/* 2. Dan u nedelji */}
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <CalendarIcon className="size-5 shrink-0 text-zinc-400" />
                  <span className="capitalize">{weekdayDisplay}</span>
                </div>

                {/* 3. Vreme (prva trka) */}
                {earliestRaceTime && (
                  <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <ClockIcon className="size-5 shrink-0 text-zinc-400" />
                    <span>
                      {earliestRaceTime}
                      {races.length > 1 ? ' (prva trka)' : ''}
                    </span>
                  </div>
                )}

                {/* 4. Lokacija */}
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <MapPinIcon className="size-5 shrink-0 text-zinc-400" />
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

                {/* External registration link */}
                {event.registrationSite && (
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
              </div>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Kategorije</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {event.tags.map((tag) => (
                    <Badge key={tag} color="zinc">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
