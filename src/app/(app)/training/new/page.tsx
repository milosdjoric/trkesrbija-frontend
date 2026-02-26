'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Button } from '@/components/button'
import { GpxUpload } from '@/components/gpx-upload'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import { toTitleCase, toDateTimeLocalString } from '@/lib/formatters'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type TrainingRaceForm = {
  id: string
  raceName: string
  gpsFile: string
  startLocation: string
  startDateTime: string
}

const CREATE_TRAINING_EVENT_MUTATION = `
  mutation CreateTrainingEvent($input: CreateTrainingEventInput!) {
    createTrainingEvent(input: $input) {
      id
      slug
    }
  }
`

const CREATE_TRAINING_RACE_MUTATION = `
  mutation CreateTrainingRace($eventId: ID!, $raceName: String, $gpsFile: String, $startLocation: String!, $startDateTime: DateTime!) {
    createTrainingRace(eventId: $eventId, raceName: $raceName, gpsFile: $gpsFile, startLocation: $startLocation, startDateTime: $startDateTime) {
      id
    }
  }
`

let raceIdCounter = 0

function defaultRace(index: number): TrainingRaceForm {
  raceIdCounter++
  const defaultDate = new Date()
  defaultDate.setMonth(defaultDate.getMonth() + 1)
  defaultDate.setHours(9, 0, 0, 0)

  return {
    id: `new-${raceIdCounter}`,
    raceName: `Staza ${index + 1}`,
    gpsFile: '',
    startLocation: '',
    startDateTime: toDateTimeLocalString(defaultDate),
  }
}

export default function NewTrainingPage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState<'TRAIL' | 'ROAD' | 'OCR'>('TRAIL')
  const [description, setDescription] = useState('')
  const [races, setRaces] = useState<TrainingRaceForm[]>([defaultRace(0)])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/training/new')
    }
  }, [authLoading, user, router])

  function addRace() {
    setRaces((prev) => [...prev, defaultRace(prev.length)])
  }

  function removeRace(id: string) {
    setRaces((prev) => prev.filter((r) => r.id !== id))
  }

  function updateRace(id: string, field: keyof TrainingRaceForm, value: string) {
    setRaces((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!eventName.trim()) {
      toast('Unesite naziv treninga', 'error')
      return
    }

    if (races.length === 0) {
      toast('Dodajte bar jednu stazu', 'error')
      return
    }

    for (const race of races) {
      if (!race.startDateTime) {
        toast('Unesite vreme za svaku stazu', 'error')
        return
      }
      if (!race.startLocation.trim()) {
        toast('Unesite lokaciju za svaku stazu', 'error')
        return
      }
    }

    setSaving(true)
    try {
      // Create the training event
      const eventResult = await gql<{ createTrainingEvent: { id: string; slug: string } }>(
        CREATE_TRAINING_EVENT_MUTATION,
        {
          input: {
            eventName: eventName.trim(),
            type: eventType,
            description: description.trim() || null,
          },
        },
        { accessToken }
      )

      const eventId = eventResult.createTrainingEvent.id
      const eventSlug = eventResult.createTrainingEvent.slug

      // Create races
      for (const race of races) {
        await gql(
          CREATE_TRAINING_RACE_MUTATION,
          {
            eventId,
            raceName: race.raceName.trim() || null,
            gpsFile: race.gpsFile.trim() || null,
            startLocation: race.startLocation.trim(),
            startDateTime: new Date(race.startDateTime).toISOString(),
          },
          { accessToken }
        )
      }

      toast('Trening kreiran!', 'success')
      router.push(`/events/${eventSlug}`)
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri kreiranju', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return <LoadingState />
  }

  if (!user) {
    return null
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/training"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4" />
          Moji treninzi
        </Link>
      </div>

      <Heading>Kreiraj trening</Heading>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        {/* Basic info */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <Subheading>Osnovne informacije</Subheading>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Naziv treninga *
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(toTitleCase(e.target.value))}
                placeholder="npr. Nedeljni trening Avala"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Tip *
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              >
                <option value="TRAIL">Trail</option>
                <option value="ROAD">Ulična</option>
                <option value="OCR">OCR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Opis
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Kratak opis treninga..."
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>
          </div>
        </div>

        {/* Races/Routes */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <Subheading>Staze ({races.length})</Subheading>
            <Button type="button" outline onClick={addRace}>
              <PlusIcon className="size-4" />
              Dodaj stazu
            </Button>
          </div>

          <div className="mt-4 space-y-4">
            {races.map((race, index) => (
              <div
                key={race.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={race.raceName}
                    onChange={(e) => updateRace(race.id, 'raceName', e.target.value)}
                    placeholder={`Staza ${index + 1}`}
                    className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                  />
                  {races.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRace(race.id)}
                      className="rounded-lg p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  )}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Datum i vreme *
                    </label>
                    <input
                      type="datetime-local"
                      value={race.startDateTime}
                      onChange={(e) => updateRace(race.id, 'startDateTime', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Lokacija *
                    </label>
                    <input
                      type="text"
                      value={race.startLocation}
                      onChange={(e) => updateRace(race.id, 'startLocation', e.target.value)}
                      placeholder="Adresa ili Google Maps link"
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <GpxUpload
                      value={race.gpsFile || null}
                      onChange={(url) => updateRace(race.id, 'gpsFile', url || '')}
                      label="GPX staza"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" color="blue" disabled={saving}>
            {saving ? 'Kreiranje...' : 'Kreiraj trening'}
          </Button>
          <Button href="/training" outline>
            Odustani
          </Button>
        </div>
      </form>
    </>
  )
}
