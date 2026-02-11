import { fetchRaceEventBySlug } from '@/app/lib/api'
import { BackLink } from '@/components/back-link'
import { Badge } from '@/components/badge'
import { Divider } from '@/components/divider'
import { FavoriteButton } from '@/components/favorite-button'
import { RegisterRaceButton } from '@/components/register-race-button'
import { RaceResults } from '@/components/race-results'
import { Heading, Subheading } from '@/components/heading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

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

  return (
    <>
      <BackLink href="/events">Događaji</BackLink>

      {/* Two-column layout */}
      <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-[1fr_320px]">
        {/* LEFT COLUMN - Main Content */}
        <div className="space-y-8">
          {/* Header */}
          <div>
            <Heading>{event.eventName}</Heading>
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
              <div className="mt-2 text-zinc-950 dark:text-white">Informacije uskoro</div>
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
                      <TableHeader>Visinska</TableHeader>
                      <TableHeader>Start</TableHeader>
                      <TableHeader className="text-right">Akcije</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedRaces.map((race) => (
                      <TableRow key={race.id}>
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
                        <TableCell>{race.length} km</TableCell>
                        <TableCell>{race.elevation != null ? `${race.elevation} m` : '–'}</TableCell>
                        <TableCell>{formatTime(race.startDateTime)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <RegisterRaceButton raceId={race.id} size="sm" />
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
              {/* Date Display */}
              <div className="text-center">
                <div className="text-4xl font-bold tabular-nums text-zinc-950 dark:text-white">
                  {eventDay}
                </div>
                <div className="mt-1 text-lg font-medium capitalize text-zinc-600 dark:text-zinc-400">
                  {eventMonth}
                </div>
                <div className="text-sm capitalize text-zinc-500">{eventWeekday}, {eventYear}</div>
              </div>

              <Divider soft className="my-4" />

              {/* Event Type */}
              <div className="flex justify-center">
                <Badge color={event.type === 'TRAIL' ? 'amber' : 'sky'}>
                  {event.type === 'TRAIL' ? 'Trail' : 'Ulična'}
                </Badge>
              </div>

              {/* Race count */}
              <div className="mt-4 text-center text-sm text-zinc-500">
                {races.length} {races.length === 1 ? 'trka' : races.length < 5 ? 'trke' : 'trka'}
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
