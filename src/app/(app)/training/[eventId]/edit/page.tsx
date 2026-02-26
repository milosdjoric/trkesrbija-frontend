'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Button } from '@/components/button'
import { useConfirm } from '@/components/confirm-dialog'
import { GpxUpload } from '@/components/gpx-upload'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import { toTitleCase, toDateTimeLocalString } from '@/lib/formatters'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type ExistingRace = {
  id: string
  raceName: string
  gpsFile: string | null
  startLocation: string
  startDateTime: string
  isNew?: false
}

type NewRace = {
  id: string
  raceName: string
  gpsFile: string
  startLocation: string
  startDateTime: string
  isNew: true
}

type RaceForm = ExistingRace | NewRace

type TrainingEvent = {
  id: string
  eventName: string
  slug: string
  type: 'TRAIL' | 'ROAD' | 'OCR'
  description: string | null
  races: Array<{
    id: string
    raceName: string | null
    gpsFile: string | null
    startLocation: string
    startDateTime: string
  }>
}

const TRAINING_EVENT_QUERY = `
  query RaceEvent($id: ID!) {
    raceEvent(id: $id) {
      id
      eventName
      slug
      type
      description
      isTraining
      createdById
      races {
        id
        raceName
        gpsFile
        startLocation
        startDateTime
      }
    }
  }
`

const UPDATE_TRAINING_EVENT_MUTATION = `
  mutation UpdateTrainingEvent($eventId: ID!, $input: UpdateTrainingEventInput!) {
    updateTrainingEvent(eventId: $eventId, input: $input) {
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

const UPDATE_TRAINING_RACE_MUTATION = `
  mutation UpdateTrainingRace($raceId: ID!, $raceName: String, $gpsFile: String, $startLocation: String, $startDateTime: DateTime) {
    updateTrainingRace(raceId: $raceId, raceName: $raceName, gpsFile: $gpsFile, startLocation: $startLocation, startDateTime: $startDateTime) {
      id
    }
  }
`

const DELETE_TRAINING_RACE_MUTATION = `
  mutation DeleteTrainingRace($raceId: ID!) {
    deleteTrainingRace(raceId: $raceId)
  }
`

let raceIdCounter = 0

function newRaceDefaults(index: number): NewRace {
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
    isNew: true,
  }
}

function toLocalDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return toDateTimeLocalString(d)
}

export default function EditTrainingPage() {
  const params = useParams()
  const eventId = params.eventId as string
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState<'TRAIL' | 'ROAD' | 'OCR'>('TRAIL')
  const [description, setDescription] = useState('')
  const [races, setRaces] = useState<RaceForm[]>([])
  const [deletedRaceIds, setDeletedRaceIds] = useState<string[]>([])
  const loadedRef = useRef(false)

  const loadEvent = useCallback(async () => {
    if (!accessToken) return

    try {
      const data = await gql<{ raceEvent: TrainingEvent & { isTraining: boolean; createdById: string | null } }>(
        TRAINING_EVENT_QUERY,
        { id: eventId },
        { accessToken }
      )

      const event = data.raceEvent
      if (!event || !event.isTraining) {
        toast('Trening nije pronađen', 'error')
        router.push('/training')
        return
      }

      if (event.createdById !== user?.id) {
        toast('Nemate dozvolu za izmenu ovog treninga', 'error')
        router.push('/training')
        return
      }

      setEventName(event.eventName)
      setEventType(event.type)
      setDescription(event.description ?? '')
      setRaces(
        event.races.map((r, i) => ({
          id: r.id,
          raceName: r.raceName ?? `Staza ${i + 1}`,
          gpsFile: r.gpsFile,
          startLocation: r.startLocation,
          startDateTime: toLocalDateTime(r.startDateTime),
        }))
      )
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri učitavanju', 'error')
      router.push('/training')
    } finally {
      setLoading(false)
    }
  }, [accessToken, eventId, user?.id, toast, router])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/training')
      return
    }

    if (accessToken && !loadedRef.current) {
      loadedRef.current = true
      loadEvent()
    }
  }, [authLoading, user, accessToken, loadEvent, router])

  function addRace() {
    setRaces((prev) => [...prev, newRaceDefaults(prev.length)])
  }

  async function removeRace(race: RaceForm) {
    if (!race.isNew) {
      const confirmed = await confirm({
        title: 'Obriši stazu',
        message: 'Da li ste sigurni da želite da obrišete ovu stazu? Ova akcija se ne može poništiti.',
        confirmText: 'Obriši',
        cancelText: 'Otkaži',
        variant: 'danger',
      })
      if (!confirmed) return
      setDeletedRaceIds((prev) => [...prev, race.id])
    }
    setRaces((prev) => prev.filter((r) => r.id !== race.id))
  }

  function updateRace(id: string, field: string, value: string | null) {
    setRaces((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
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
      // 1. Update event metadata
      const result = await gql<{ updateTrainingEvent: { id: string; slug: string } }>(
        UPDATE_TRAINING_EVENT_MUTATION,
        {
          eventId,
          input: {
            eventName: eventName.trim(),
            type: eventType,
            description: description.trim() || null,
          },
        },
        { accessToken }
      )

      // 2. Delete removed races
      for (const raceId of deletedRaceIds) {
        await gql(DELETE_TRAINING_RACE_MUTATION, { raceId }, { accessToken })
      }

      // 3. Update existing races & create new ones
      for (const race of races) {
        if (race.isNew) {
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
        } else {
          await gql(
            UPDATE_TRAINING_RACE_MUTATION,
            {
              raceId: race.id,
              raceName: race.raceName.trim() || null,
              gpsFile: race.gpsFile,
              startLocation: race.startLocation.trim(),
              startDateTime: new Date(race.startDateTime).toISOString(),
            },
            { accessToken }
          )
        }
      }

      toast('Trening ažuriran!', 'success')
      router.push(`/events/${result.updateTrainingEvent.slug}`)
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri čuvanju', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
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

      <Heading>Izmeni trening</Heading>

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
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={race.raceName}
                      onChange={(e) => updateRace(race.id, 'raceName', e.target.value)}
                      placeholder={`Staza ${index + 1}`}
                      className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                    />
                    {race.isNew && (
                      <span className="text-xs text-blue-500">(nova)</span>
                    )}
                  </div>
                  {races.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRace(race)}
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
            {saving ? 'Čuvanje...' : 'Sačuvaj izmene'}
          </Button>
          <Button href="/training" outline>
            Odustani
          </Button>
        </div>
      </form>
    </>
  )
}
