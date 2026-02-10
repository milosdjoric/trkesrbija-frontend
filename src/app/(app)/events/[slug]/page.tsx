import { fetchRaceEventBySlug } from '@/app/lib/api'
import { BackLink } from '@/components/back-link'
import { Badge } from '@/components/badge'
import { FavoriteButton } from '@/components/favorite-button'
import { RegisterRaceButton } from '@/components/register-race-button'
import { RaceCard } from '@/components/race-card'
import { RaceResults } from '@/components/race-results'
import { Heading, Subheading } from '@/components/heading'
import { IconText } from '@/components/icon-text'
import { CalendarIcon, MapPinIcon } from '@heroicons/react/16/solid'
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

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  const day = d.getDate()
  const month = d.toLocaleDateString('sr-Latn-RS', { month: 'long' })
  const year = d.getFullYear()
  const weekday = d.toLocaleDateString('sr-Latn-RS', { weekday: 'long' })
  return `${weekday}, ${day}. ${month} ${year}.`
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

function formatDateTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  return `${formatDate(iso)} u ${formatTime(iso)}`
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
  const eventDate = earliestRace ? formatDate(earliestRace.startDateTime) : 'TBD'

  // Check if all races have the same location
  const raceLocations = sortedRaces.map((r) => r.startLocation ?? '').filter(Boolean)
  const uniqueLocations = new Set(raceLocations)
  const allSameLocation = uniqueLocations.size <= 1
  const eventLocation = allSameLocation && raceLocations.length > 0 ? raceLocations[0] : null

  return (
    <>
      <BackLink href="/events">Događaji</BackLink>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="flex flex-wrap items-start gap-6">
          {event.mainImage && (
            <div className="w-40 shrink-0">
              <img
                className="aspect-3/2 rounded-lg object-cover shadow-sm"
                src={event.mainImage}
                alt={event.eventName}
              />
            </div>
          )}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Heading>{event.eventName}</Heading>
              <Badge color={event.type === 'TRAIL' ? 'amber' : 'sky'}>
                {event.type === 'TRAIL' ? 'Trail' : 'Ulična'}
              </Badge>
            </div>
            {event.description && (
              <p className="max-w-2xl text-sm/6 text-zinc-600 dark:text-zinc-400">{event.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm/6 text-zinc-500 dark:text-zinc-400">
              <IconText icon={<CalendarIcon className="size-4" />}>{eventDate}</IconText>
              {eventLocation && (
                <IconText icon={<MapPinIcon className="size-4" />}>
                  {eventLocation.startsWith('http') ? (
                    <a
                      href={eventLocation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      Prikaži lokaciju
                    </a>
                  ) : (
                    eventLocation
                  )}
                </IconText>
              )}
            </div>
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {event.tags.map((tag) => (
                  <Badge key={tag} color="zinc">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Subheading className="mt-10">Trke ({races.length})</Subheading>

      {races.length === 0 ? (
        <div className="mt-4 rounded-lg border border-zinc-200 p-6 text-sm/6 dark:border-zinc-700">
          <div className="font-medium">Još nema trka</div>
          <div className="mt-1 text-zinc-500">Ovaj događaj još nema konfiguriranih trka.</div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {sortedRaces.map((race) => {
            const time = formatTime(race.startDateTime)
            const length = `${race.length}km`
            const elevation = race.elevation != null ? `${race.elevation}m` : ''
            const details = [time, length, elevation].filter(Boolean).join(' / ')

            return (
              <RaceCard
                key={race.id}
                raceId={race.id}
                name={race.raceName ?? 'Trka'}
                details={details}
                startLocation={race.startLocation}
                color={event.type === 'TRAIL' ? 'emerald' : 'sky'}
              >
                <RegisterRaceButton raceId={race.id} size="sm" />
                <FavoriteButton raceId={race.id} initialIsFavorite={false} size="sm" />
              </RaceCard>
            )
          })}
        </div>
      )}

      {/* Results for each race */}
      {sortedRaces.map((race) => (
        <RaceResults key={race.id} raceId={race.id} raceName={race.raceName} />
      ))}
    </>
  )
}
