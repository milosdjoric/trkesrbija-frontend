'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Button } from '@/components/button'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type RaceInput = {
  tempId: string
  raceName: string
  length: string
  elevation: string
  startDateTime: string
  startLocation: string
}

const CREATE_EVENT_MUTATION = `
  mutation CreateRaceEvent($input: CreateRaceEventInput!) {
    createRaceEvent(input: $input) {
      id
      slug
    }
  }
`

const CREATE_RACE_MUTATION = `
  mutation CreateRace($input: CreateRaceInput!) {
    createRace(input: $input) {
      id
    }
  }
`

function generateSlug(name: string, year: number): string {
  return (
    name
      .toLowerCase()
      .replace(/[čć]/g, 'c')
      .replace(/[šś]/g, 's')
      .replace(/[žź]/g, 'z')
      .replace(/đ/g, 'dj')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${year}`
  )
}

export default function NewEventPage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)

  // Event fields
  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState<'TRAIL' | 'ROAD'>('TRAIL')
  const [description, setDescription] = useState('')
  const [mainImage, setMainImage] = useState('')
  const [slug, setSlug] = useState('')
  const [autoSlug, setAutoSlug] = useState(true)

  // Races
  const [races, setRaces] = useState<RaceInput[]>([])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
    }
  }, [authLoading, user, router])

  // Auto-generate slug when name changes
  useEffect(() => {
    if (autoSlug && eventName) {
      const year = new Date().getFullYear()
      setSlug(generateSlug(eventName, year))
    }
  }, [eventName, autoSlug])

  function addRace() {
    const defaultDate = new Date()
    defaultDate.setMonth(defaultDate.getMonth() + 1)
    defaultDate.setHours(9, 0, 0, 0)

    setRaces((prev) => [
      ...prev,
      {
        tempId: Math.random().toString(36).slice(2),
        raceName: '',
        length: '',
        elevation: '',
        startDateTime: defaultDate.toISOString().slice(0, 16),
        startLocation: '',
      },
    ])
  }

  function updateRace(tempId: string, field: keyof RaceInput, value: string) {
    setRaces((prev) => prev.map((r) => (r.tempId === tempId ? { ...r, [field]: value } : r)))
  }

  function removeRace(tempId: string) {
    setRaces((prev) => prev.filter((r) => r.tempId !== tempId))
  }

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

    setLoading(true)
    try {
      // 1. Create the event
      const eventData = await gql<{ createRaceEvent: { id: string; slug: string } }>(
        CREATE_EVENT_MUTATION,
        {
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

      const eventId = eventData.createRaceEvent.id

      // 2. Create races
      for (const race of races) {
        if (!race.raceName.trim() || !race.length) continue

        await gql(
          CREATE_RACE_MUTATION,
          {
            input: {
              raceEventId: eventId,
              raceName: race.raceName.trim(),
              length: parseFloat(race.length),
              elevation: race.elevation ? parseFloat(race.elevation) : null,
              startDateTime: new Date(race.startDateTime).toISOString(),
              startLocation: race.startLocation.trim() || 'TBD',
            },
          },
          { accessToken }
        )
      }

      toast('Događaj kreiran uspešno!', 'success')
      router.push('/admin/events')
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri kreiranju', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return <LoadingState />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
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

      <Heading>Novi događaj</Heading>

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
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value)
                    setAutoSlug(false)
                  }}
                  placeholder="avala-trail-2024"
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                  required
                />
                {!autoSlug && (
                  <button
                    type="button"
                    onClick={() => {
                      setAutoSlug(true)
                      const year = new Date().getFullYear()
                      setSlug(generateSlug(eventName, year))
                    }}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                  >
                    Auto
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                URL: /events/{slug || 'slug'}
              </p>
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
                <option value="ROAD">Ulična</option>
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

        {/* Races */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <Subheading>Trke ({races.length})</Subheading>
            <button
              type="button"
              onClick={addRace}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
            >
              <PlusIcon className="size-4" />
              Dodaj trku
            </button>
          </div>

          {races.length === 0 ? (
            <p className="mt-4 text-center text-sm text-zinc-500">
              Nema trka. Kliknite &quot;Dodaj trku&quot; da dodate prvu trku.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {races.map((race, index) => (
                <div
                  key={race.tempId}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium">Trka #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeRace(race.tempId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Naziv trke *
                      </label>
                      <input
                        type="text"
                        value={race.raceName}
                        onChange={(e) => updateRace(race.tempId, 'raceName', e.target.value)}
                        placeholder="npr. Avala 18K"
                        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Datum i vreme *
                      </label>
                      <input
                        type="datetime-local"
                        value={race.startDateTime}
                        onChange={(e) => updateRace(race.tempId, 'startDateTime', e.target.value)}
                        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Dužina (km) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={race.length}
                        onChange={(e) => updateRace(race.tempId, 'length', e.target.value)}
                        placeholder="18"
                        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Visinska razlika (m)
                      </label>
                      <input
                        type="number"
                        value={race.elevation}
                        onChange={(e) => updateRace(race.tempId, 'elevation', e.target.value)}
                        placeholder="520"
                        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Startna lokacija
                      </label>
                      <input
                        type="text"
                        value={race.startLocation}
                        onChange={(e) => updateRace(race.tempId, 'startLocation', e.target.value)}
                        placeholder="Adresa ili Google Maps link"
                        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" color="blue" disabled={loading}>
            {loading ? 'Kreiranje...' : 'Kreiraj događaj'}
          </Button>
          <Button href="/admin/events" outline>
            Odustani
          </Button>
        </div>
      </form>
    </>
  )
}
