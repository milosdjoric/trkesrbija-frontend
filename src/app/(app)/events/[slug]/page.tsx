import { fetchRaceEventBySlug } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { FavoriteButton } from '@/components/favorite-button'
import { RegisterRaceButton } from '@/components/register-race-button'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { CalendarIcon, ChevronLeftIcon, ClockIcon, MapPinIcon } from '@heroicons/react/16/solid'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = await fetchRaceEventBySlug(slug)

  return {
    title: event?.eventName ?? 'Događaj',
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
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
  const eventLocation = earliestRace?.startLocation ?? 'TBD'

  return (
    <>
      <div className="max-lg:hidden">
        <Link href="/events" className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          Događaji
        </Link>
      </div>

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
                {event.type === 'TRAIL' ? 'Trail' : 'Asfalt'}
              </Badge>
            </div>
            {event.description && (
              <p className="max-w-2xl text-sm/6 text-zinc-600 dark:text-zinc-400">{event.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm/6 text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="size-4" />
                {eventDate}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="size-4" />
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
              </span>
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
        <div className="mt-4 flex flex-col gap-3">
          {sortedRaces.map((race) => (
            <div
              key={race.id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 dark:border-zinc-700"
            >
              <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-6">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">{race.raceName ?? 'Neimenovana trka'}</div>
                <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  <ClockIcon className="size-4 shrink-0" />
                  <span>{formatDateTime(race.startDateTime)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  <MapPinIcon className="size-4 shrink-0" />
                  {race.startLocation.startsWith('http') ? (
                    <a
                      href={race.startLocation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      Prikaži lokaciju
                    </a>
                  ) : (
                    <span>{race.startLocation}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm lg:shrink-0">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{race.length} km</span>
                {race.elevation != null && <span className="text-zinc-500 dark:text-zinc-400">{race.elevation} m</span>}
                <RegisterRaceButton raceId={race.id} size="sm" />
                <FavoriteButton raceId={race.id} initialIsFavorite={false} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
