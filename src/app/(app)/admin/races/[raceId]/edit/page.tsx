'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Button } from '@/components/button'
import { GpxUpload } from '@/components/gpx-upload'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import { ChevronLeftIcon } from '@heroicons/react/16/solid'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type Competition = {
  id: string
  name: string
}

type RaceData = {
  id: string
  raceName: string | null
  length: number
  elevation: number | null
  gpsFile: string | null
  startDateTime: string
  endDateTime: string | null
  startLocation: string | null
  registrationEnabled: boolean
  competitionId: string | null
  competition: Competition | null
  raceEvent: {
    id: string
    eventName: string
    slug: string
  }
}

const RACE_BY_ID_QUERY = `
  query RaceById($id: ID!) {
    race(id: $id) {
      id
      raceName
      length
      elevation
      gpsFile
      startDateTime
      endDateTime
      startLocation
      registrationEnabled
      competitionId
      competition {
        id
        name
      }
      raceEvent {
        id
        eventName
        slug
      }
    }
  }
`

const COMPETITIONS_QUERY = `
  query Competitions {
    competitions {
      id
      name
    }
  }
`

const UPDATE_RACE_MUTATION = `
  mutation UpdateRace($raceId: ID!, $input: UpdateRaceInput!) {
    updateRace(raceId: $raceId, input: $input) {
      id
      raceName
      length
      elevation
      startDateTime
      endDateTime
      startLocation
      registrationEnabled
      competitionId
    }
  }
`

export default function EditRacePage() {
  const params = useParams()
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const raceId = params.raceId as string

  const [race, setRace] = useState<RaceData | null>(null)
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const loadedRef = useRef(false)

  // Form state
  const [raceName, setRaceName] = useState('')
  const [length, setLength] = useState('')
  const [elevation, setElevation] = useState('')
  const [gpsFile, setGpsFile] = useState('')
  const [startDateTime, setStartDateTime] = useState('')
  const [endDateTime, setEndDateTime] = useState('')
  const [startLocation, setStartLocation] = useState('')
  const [registrationEnabled, setRegistrationEnabled] = useState(true)
  const [competitionId, setCompetitionId] = useState('')

  const loadRace = useCallback(async () => {
    if (!accessToken) return

    try {
      // Load race and competitions in parallel
      const [raceData, competitionsData] = await Promise.all([
        gql<{ race: RaceData | null }>(RACE_BY_ID_QUERY, { id: raceId }, { accessToken }),
        gql<{ competitions: Competition[] }>(COMPETITIONS_QUERY, {}, { accessToken }),
      ])

      if (competitionsData.competitions) {
        setCompetitions(competitionsData.competitions)
      }

      if (raceData.race) {
        setRace(raceData.race)
        setRaceName(raceData.race.raceName || '')
        setLength(raceData.race.length.toString())
        setElevation(raceData.race.elevation?.toString() || '')
        setGpsFile(raceData.race.gpsFile || '')
        // Convert ISO to datetime-local format
        const dt = new Date(raceData.race.startDateTime)
        setStartDateTime(dt.toISOString().slice(0, 16))
        if (raceData.race.endDateTime) {
          const endDt = new Date(raceData.race.endDateTime)
          setEndDateTime(endDt.toISOString().slice(0, 16))
        }
        setStartLocation(raceData.race.startLocation || '')
        setRegistrationEnabled(raceData.race.registrationEnabled)
        setCompetitionId(raceData.race.competitionId || '')
      }
    } catch (err) {
      console.error('Failed to load race:', err)
      toast('Greška pri učitavanju trke', 'error')
    } finally {
      setLoading(false)
    }
  }, [accessToken, raceId, toast])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
      return
    }

    if (accessToken && !loadedRef.current) {
      loadedRef.current = true
      loadRace()
    }
  }, [authLoading, user, accessToken, loadRace, router])

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
        UPDATE_RACE_MUTATION,
        {
          raceId,
          input: {
            raceName: raceName.trim(),
            length: parseFloat(length),
            elevation: elevation ? parseFloat(elevation) : null,
            gpsFile: gpsFile.trim() || null,
            startDateTime: new Date(startDateTime).toISOString(),
            endDateTime: endDateTime ? new Date(endDateTime).toISOString() : null,
            startLocation: startLocation.trim() || null,
            registrationEnabled,
            competitionId: competitionId || null,
          },
        },
        { accessToken }
      )

      toast('Trka sačuvana uspešno!', 'success')
      router.push('/admin/races')
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri čuvanju', 'error')
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

  if (!race) {
    return (
      <div className="py-12 text-center">
        <Heading>Trka nije pronađena</Heading>
      </div>
    )
  }

  return (
    <>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/admin/races"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4" />
          Sve trke
        </Link>
      </div>

      <Heading>Izmeni trku</Heading>
      <p className="mt-1 text-sm text-zinc-500">
        Događaj: <strong>{race.raceEvent.eventName}</strong>
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
                onChange={(e) => setRaceName(e.target.value)}
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

            {/* End date/time (cut-off) */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Cut-off vreme
              </label>
              <input
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <p className="mt-1 text-xs text-zinc-500">Opciono - krajnje vreme za završetak trke</p>
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

            {/* GPX file */}
            <div className="sm:col-span-2">
              <GpxUpload
                value={gpsFile || null}
                onChange={(url) => setGpsFile(url || '')}
                label="GPX staza"
              />
            </div>

            {/* Competition */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Takmičenje / Serija
              </label>
              <select
                value={competitionId}
                onChange={(e) => setCompetitionId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              >
                <option value="">Bez takmičenja</option>
                {competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-500">
                Opciono - ako trka pripada nekoj seriji ili ligi
              </p>
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
            {saving ? 'Čuvanje...' : 'Sačuvaj izmene'}
          </Button>
          <Button href="/admin/races" outline>
            Odustani
          </Button>
        </div>
      </form>

      {/* Quick links */}
      <div className="mt-8 max-w-2xl rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
        <Subheading>Brzi linkovi</Subheading>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href={`/admin/races/${raceId}/registrations`} outline>
            Prijave
          </Button>
          <Button href={`/admin/races/${raceId}/checkpoints`} outline>
            Checkpoint-ovi
          </Button>
          <Button href={`/admin/events/${race.raceEvent.id}/edit`} outline>
            Događaj
          </Button>
          <Button href={`/events/${race.raceEvent.slug}`} outline target="_blank">
            Prikaži na sajtu
          </Button>
        </div>
      </div>
    </>
  )
}
