import { fetchRaceEventBySlug, type RaceEventWithRaces, type Race } from '@/app/lib/api'
import { BackLink } from '@/components/back-link'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Divider } from '@/components/divider'
import { FavoriteButton } from '@/components/favorite-button'
import { RegisterRaceButton } from '@/components/register-race-button'
import { RaceResults } from '@/components/race-results'
import { Heading, Subheading } from '@/components/heading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { CalendarIcon, ClockIcon, MapPinIcon, GlobeAltIcon, LinkIcon } from '@heroicons/react/16/solid'
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
  const eventDay = eventDateObj?.getDate() ?? '?'
  const eventMonth = eventDateObj?.toLocaleDateString('sr-Latn-RS', { month: 'long' }) ?? ''
  const eventYear = eventDateObj?.getFullYear() ?? ''
  const eventWeekday = eventDateObj?.toLocaleDateString('sr-Latn-RS', { weekday: 'long' }) ?? ''

  // Check if all races have the same location
  const raceLocations = sortedRaces.map((r) => r.startLocation ?? '').filter(Boolean)
  const uniqueLocations = new Set(raceLocations)
  const allSameLocation = uniqueLocations.size <= 1
  const eventLocation = allSameLocation && raceLocations.length > 0 ? raceLocations[0] : null

  // Check if all races are on the same day
  const raceDates = sortedRaces.map((r) => {
    const d = new Date(r.startDateTime)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  })
  const uniqueDates = new Set(raceDates)
  const allSameDay = uniqueDates.size === 1 && sortedRaces.length > 0

  // Vreme prve trke
  const earliestRaceTime = earliestRace ? formatTime(earliestRace.startDateTime) : ''

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
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Heading>{event.eventName}</Heading>
              <Badge color={event.type === 'TRAIL' ? 'emerald' : 'sky'}>
                {event.type === 'TRAIL' ? 'Trail' : 'Ulična'}
              </Badge>
            </div>
            {event.description && (
              <p className="mt-2 max-w-2xl text-sm/6 text-zinc-600 dark:text-zinc-400">
                {event.description}
              </p>
            )}
          </div>

          {/* Metadata Boxes */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Organizator box */}
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Organizator</div>
              {event.organizer ? (
                <div className="mt-2">
                  <div className="font-medium text-zinc-950 dark:text-white">{event.organizer.name}</div>
                  {event.organizer.organizerSite && (
                    <a
                      href={event.organizer.organizerSite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      Sajt organizatora
                    </a>
                  )}
                </div>
              ) : (
                <div className="mt-2 text-zinc-500 dark:text-zinc-400">Nije navedeno</div>
              )}
            </div>

            {/* Lokacija box */}
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Lokacija</div>
              <div className="mt-2 text-zinc-950 dark:text-white">
                {eventLocation ? (
                  eventLocation.startsWith('http') ? (
                    <a
                      href={eventLocation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      Prikaži na mapi
                    </a>
                  ) : (
                    eventLocation
                  )
                ) : (
                  'Različite lokacije'
                )}
              </div>
            </div>
          </div>

          {/* Social Media & Registration */}
          {(event.socialMedia?.length > 0 || event.registrationSite) && (
            <div className="flex flex-wrap items-center gap-3">
              {event.registrationSite && (
                <a
                  href={event.registrationSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <GlobeAltIcon className="size-4" />
                  Sajt za prijave
                </a>
              )}
              {event.socialMedia?.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <LinkIcon className="size-4" />
                  {getSocialMediaName(url)}
                </a>
              ))}
            </div>
          )}

          {/* Gallery */}
          {event.gallery && event.gallery.length > 0 && (
            <div>
              <Subheading>Galerija</Subheading>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {event.gallery.map((url, index) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-lg"
                  >
                    <img
                      src={url}
                      alt={`${event.eventName} - slika ${index + 1}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Races Table */}
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
                      <TableRow key={race.id} href={`/races/${race.slug}`}>
                        <TableCell>
                          <div className="font-medium">{race.raceName ?? 'Trka'}</div>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50">
              {/* Labela */}
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Datum</div>

              {/* Datum - prominentno */}
              <div className="mt-2 text-2xl font-bold text-zinc-950 dark:text-white">
                {eventDay}. {eventMonth} {eventYear}.
              </div>

              <Divider soft className="my-4" />

              {/* Info redovi sa ikonama */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <CalendarIcon className="size-5 text-zinc-400" />
                  <span className="capitalize">{eventWeekday}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <ClockIcon className="size-5 text-zinc-400" />
                  <span>
                    {earliestRaceTime}
                    {races.length > 1 ? ' (prva trka)' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <MapPinIcon className="size-5 text-zinc-400" />
                  <span>
                    {eventLocation ? (
                      eventLocation.startsWith('http') ? (
                        <a
                          href={eventLocation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                          Prikaži na mapi
                        </a>
                      ) : (
                        eventLocation
                      )
                    ) : (
                      'Različite lokacije'
                    )}
                  </span>
                </div>
              </div>

              {/* Kalendar dugmad - samo ako su sve trke istog dana */}
              {allSameDay && (
                <>
                  <Divider soft className="my-4" />
                  <div className="space-y-2">
                    <Button outline href={googleCalendarUrl} target="_blank" className="w-full">
                      <CalendarIcon data-slot="icon" />
                      Dodaj u Google Calendar
                    </Button>
                    <Button outline href={appleCalendarUrl} className="w-full">
                      <CalendarIcon data-slot="icon" />
                      Dodaj u Apple Calendar
                    </Button>
                  </div>
                </>
              )}
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

            {/* Event Image */}
            {event.mainImage && (
              <div className="overflow-hidden rounded-lg">
                <img
                  src={event.mainImage}
                  alt={event.eventName}
                  className="aspect-video w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results for each race - Full Width */}
      {sortedRaces.map((race) => (
        <RaceResults key={race.id} raceId={race.id} raceName={race.raceName} />
      ))}
    </>
  )
}
