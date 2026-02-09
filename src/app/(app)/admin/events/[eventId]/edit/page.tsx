'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Button } from '@/components/button'
import { useConfirm } from '@/components/confirm-dialog'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type RaceData = {
  id: string
  raceName: string | null
  length: number
  elevation: number | null
  startDateTime: string
  startLocation: string | null
  registrationEnabled: boolean
}

type EventData = {
  id: string
  eventName: string
  slug: string
  type: 'TRAIL' | 'ROAD'
  description: string | null
  mainImage: string | null
  races: RaceData[]
}

const EVENT_QUERY = `
  query RaceEvent($slug: String!) {
    raceEvent(slug: $slug) {
      id
      eventName
      slug
      type
      description
      mainImage
      races {
        id
        raceName
        length
        elevation
        startDateTime
        startLocation
        registrationEnabled
      }
    }
  }
`

const EVENT_BY_ID_QUERY = `
  query RaceEvents {
    raceEvents(limit: 1000) {
      id
      eventName
      slug
      type
      description
      mainImage
      races {
        id
        raceName
        length
        elevation
        startDateTime
        startLocation
        registrationEnabled
      }
    }
  }
`

const UPDATE_EVENT_MUTATION = `
  mutation UpdateRaceEvent($eventId: ID!, $input: UpdateRaceEventInput!) {
    updateRaceEvent(eventId: $eventId, input: $input) {
      id
      eventName
      slug
    }
  }
`

const DELETE_RACE_MUTATION = `
  mutation DeleteRace($raceId: ID!) {
    deleteRace(raceId: $raceId)
  }
`

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const eventId = params.eventId as string

  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState<'TRAIL' | 'ROAD'>('TRAIL')
  const [description, setDescription] = useState('')
  const [mainImage, setMainImage] = useState('')
  const [slug, setSlug] = useState('')

  const loadEvent = useCallback(async () => {
    if (!accessToken) return

    try {
      // Find event by ID
      const data = await gql<{
        raceEvents: EventData[]
      }>(EVENT_BY_ID_QUERY, {}, { accessToken })

      const foundEvent = data.raceEvents.find((e) => e.id === eventId)
      if (foundEvent) {
        setEvent(foundEvent)
        setEventName(foundEvent.eventName)
        setEventType(foundEvent.type)
        setDescription(foundEvent.description || '')
        setMainImage(foundEvent.mainImage || '')
        setSlug(foundEvent.slug)
      }
    } catch (err) {
      console.error('Failed to load event:', err)
      toast('Greška pri učitavanju događaja', 'error')
    } finally {
      setLoading(false)
    }
  }, [accessToken, eventId, toast])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
      return
    }

    if (accessToken) {
      loadEvent()
    }
  }, [authLoading, user, accessToken, loadEvent, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!eventName.trim()) {
      toast('Unesite naziv događaja', 'error')
      return
    }

    if (!slug.trim()) {
      toast('Unesite slug', 'error')
      return
    }

    setSaving(true)
    try {
      await gql(
        UPDATE_EVENT_MUTATION,
        {
          eventId,
          input: {
            eventName: eventName.trim(),
            slug: slug.trim(),
            type: eventType,
            description: description.trim() || null,
            mainImage: mainImage.trim() || null,
          },
        },
        { accessToken }
      )

      toast('Događaj sačuvan uspešno!', 'success')
      router.push('/admin/events')
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri čuvanju', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteRace(raceId: string, raceName: string | null) {
    const confirmed = await confirm({
      title: 'Obriši trku',
      message: `Da li ste sigurni da želite da obrišete trku "${raceName || 'Bez imena'}"? Ova akcija se ne može poništiti.`,
      confirmText: 'Obriši',
      cancelText: 'Otkaži',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      await gql(DELETE_RACE_MUTATION, { raceId }, { accessToken })
      toast('Trka obrisana', 'success')
      await loadEvent()
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri brisanju', 'error')
    }
  }

  if (authLoading || loading) {
    return <LoadingState />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  if (!event) {
    return (
      <div className="py-12 text-center">
        <Heading>Događaj nije pronađen</Heading>
      </div>
    )
  }

  return (
    <>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4" />
          Događaji
        </Link>
      </div>

      <Heading>Izmeni događaj</Heading>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        {/* Event details */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <Subheading>Osnovne informacije</Subheading>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Event name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Naziv događaja *
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="npr. Avala Trail"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                required
              />
            </div>

            {/* Slug */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Slug (URL) *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="avala-trail-2024"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                required
              />
              <p className="mt-1 text-xs text-zinc-500">URL: /events/{slug || 'slug'}</p>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Tip događaja *
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              >
                <option value="TRAIL">Trail</option>
                <option value="ROAD">Asfalt</option>
              </select>
            </div>

            {/* Main image */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Slika (URL)
              </label>
              <input
                type="url"
                value={mainImage}
                onChange={(e) => setMainImage(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Opis
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Kratki opis događaja..."
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" color="blue" disabled={saving}>
            {saving ? 'Čuvanje...' : 'Sačuvaj izmene'}
          </Button>
          <Button href="/admin/events" outline>
            Odustani
          </Button>
        </div>
      </form>

      {/* Races section */}
      <div className="mt-8 max-w-2xl">
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <Subheading>Trke ({event.races.length})</Subheading>
            <Button href={`/admin/events/${eventId}/races/new`} outline>
              <PlusIcon className="size-4" />
              Dodaj trku
            </Button>
          </div>

          {event.races.length === 0 ? (
            <p className="mt-4 text-center text-sm text-zinc-500">
              Nema trka za ovaj događaj.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {event.races.map((race) => (
                <div
                  key={race.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
                >
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {race.raceName || 'Bez naziva'}
                    </div>
                    <div className="mt-1 text-sm text-zinc-500">
                      {race.length} km
                      {race.elevation && ` • ${race.elevation}m D+`}
                      {' • '}
                      {new Date(race.startDateTime).toLocaleDateString('sr-Latn-RS', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="mt-1">
                      {race.registrationEnabled ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Prijave otvorene
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          Prijave zatvorene
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button href={`/admin/races/${race.id}/registrations`} outline>
                      Prijave
                    </Button>
                    <button
                      onClick={() => handleDeleteRace(race.id, race.raceName)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      title="Obriši trku"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
