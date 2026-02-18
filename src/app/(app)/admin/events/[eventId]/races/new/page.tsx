'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Button } from '@/components/button'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import { toTitleCase, toDateTimeLocalString, toISOPreservingLocalTime } from '@/lib/formatters'
import { ChevronLeftIcon } from '@heroicons/react/16/solid'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type EventData = {
  id: string
  eventName: string
  slug: string
}

const EVENT_BY_ID_QUERY = `
  query RaceEventById($id: ID!) {
    raceEvent(id: $id) {
      id
      eventName
      slug
    }
  }
`

const CREATE_RACE_MUTATION = `
  mutation CreateRace($input: CreateRaceInput!) {
    createRace(input: $input) {
      id
      raceName
    }
  }
`

export default function NewRacePage() {
  const params = useParams()
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const eventId = params.eventId as string

  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const loadedRef = useRef(false)

  // Form state
  const [raceName, setRaceName] = useState('')
  const [length, setLength] = useState('')
  const [elevation, setElevation] = useState('')
  const [startDateTime, setStartDateTime] = useState('')
  const [startLocation, setStartLocation] = useState('')
  const [registrationEnabled, setRegistrationEnabled] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
      return
    }

    if (accessToken && !loadedRef.current) {
      loadedRef.current = true

      // Set default date/time to 1 month from now at 9:00
      const defaultDate = new Date()
      defaultDate.setMonth(defaultDate.getMonth() + 1)
      defaultDate.setHours(9, 0, 0, 0)
      setStartDateTime(toDateTimeLocalString(defaultDate))

      // Load event data
      gql<{ raceEvent: EventData | null }>(EVENT_BY_ID_QUERY, { id: eventId }, { accessToken })
        .then((data) => {
          if (data.raceEvent) {
            setEvent(data.raceEvent)
          }
        })
        .catch((err) => {
          console.error('Failed to load event:', err)
          toast('Greška pri učitavanju događaja', 'error')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [authLoading, user, accessToken, eventId, router, toast])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!raceName.trim()) {
      toast('Unesite naziv trke', 'error')
      return
    }

    if (!length || parseFloat(length) <= 0) {
      toast('Unesite validnu dužinu trke', 'error')
      return
    }

    if (!startDateTime) {
      toast('Unesite datum i vreme starta', 'error')
      return
    }

    setSaving(true)
    try {
      await gql(
        CREATE_RACE_MUTATION,
        {
          input: {
            raceEventId: eventId,
            raceName: raceName.trim(),
            length: parseFloat(length),
            elevation: elevation ? parseFloat(elevation) : null,
            startDateTime: toISOPreservingLocalTime(startDateTime),
            startLocation: startLocation.trim() || 'TBD',
            registrationEnabled,
          },
        },
        { accessToken }
      )

      toast('Trka kreirana uspešno!', 'success')
      router.push(`/admin/events/${eventId}/edit`)
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri kreiranju', 'error')
    } finally {
      setSaving(false)
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
          href={`/admin/events/${eventId}/edit`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4" />
          {event.eventName}
        </Link>
      </div>

      <Heading>Nova trka</Heading>
      <p className="mt-1 text-sm text-zinc-500">
        Dodajete trku za događaj: <strong>{event.eventName}</strong>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <Subheading>Informacije o trci</Subheading>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Race name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Naziv trke *
              </label>
              <input
                type="text"
                value={raceName}
                onChange={(e) => setRaceName(toTitleCase(e.target.value))}
                placeholder="npr. Avala 18K"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                required
              />
            </div>

            {/* Start date/time */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Datum i vreme starta *
              </label>
              <input
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                required
              />
            </div>

            {/* Length */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Dužina (km) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="18"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                required
              />
            </div>

            {/* Elevation */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Visinska razlika (m)
              </label>
              <input
                type="number"
                min="0"
                value={elevation}
                onChange={(e) => setElevation(e.target.value)}
                placeholder="520"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>

            {/* Start location */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Startna lokacija
              </label>
              <input
                type="text"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="Adresa ili Google Maps link"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>

            {/* Registration enabled */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={registrationEnabled}
                  onChange={(e) => setRegistrationEnabled(e.target.checked)}
                  className="size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Omogući prijave za ovu trku
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" color="blue" disabled={saving}>
            {saving ? 'Kreiranje...' : 'Kreiraj trku'}
          </Button>
          <Button href={`/admin/events/${eventId}/edit`} outline>
            Odustani
          </Button>
        </div>
      </form>
    </>
  )
}
