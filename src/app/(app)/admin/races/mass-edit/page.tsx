'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { EditableCell } from '@/components/editable-cell'
import { Heading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import { ChevronLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type Competition = {
  id: string
  name: string
}

type RaceRow = {
  id: string
  slug: string
  raceName: string | null
  length: number
  elevation: number | null
  startDateTime: string
  endDateTime: string | null
  startLocation: string | null
  registrationEnabled: boolean
  competitionId: string | null
  raceEvent: {
    id: string
    eventName: string
  }
}

const RACES_QUERY = `
  query RacesForMassEdit {
    races(limit: 1000) {
      id
      slug
      raceName
      length
      elevation
      startDateTime
      endDateTime
      startLocation
      registrationEnabled
      competitionId
      raceEvent {
        id
        eventName
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
      slug
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

export default function RacesMassEditPage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const [races, setRaces] = useState<RaceRow[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showPast, setShowPast] = useState(false)

  const loadData = useCallback(async () => {
    if (!accessToken) return
    try {
      const [racesData, competitionsData] = await Promise.all([
        gql<{ races: RaceRow[] }>(RACES_QUERY, {}, { accessToken }),
        gql<{ competitions: Competition[] }>(COMPETITIONS_QUERY, {}, { accessToken }),
      ])
      setRaces(racesData.races ?? [])
      setCompetitions(competitionsData.competitions ?? [])
    } catch (err) {
      console.error('Failed to load data:', err)
      toast('Greska pri ucitavanju', 'error')
    } finally {
      setLoading(false)
    }
  }, [accessToken, toast])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
      return
    }

    if (accessToken) {
      loadData()
    }
  }, [authLoading, user, accessToken, router, loadData])

  async function handleUpdateField(
    raceId: string,
    field: string,
    value: string | number | boolean | null
  ) {
    try {
      await gql(UPDATE_RACE_MUTATION, { raceId, input: { [field]: value } }, { accessToken })

      // Update local state
      setRaces((prev) => prev.map((r) => (r.id === raceId ? { ...r, [field]: value } : r)))

      toast('Sacuvano', 'success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Greska pri cuvanju'
      toast(message, 'error')
      throw err // Re-throw so EditableCell knows it failed
    }
  }

  if (authLoading || loading) return <LoadingState />
  if (!user || user.role !== 'ADMIN') return null

  // Build competition options
  const competitionOptions = competitions.map((c) => ({ value: c.id, label: c.name }))

  // Filter races
  const now = Date.now()
  const filteredRaces = races.filter((race) => {
    const matchesSearch =
      !search ||
      (race.raceName?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
      race.slug.toLowerCase().includes(search.toLowerCase()) ||
      race.raceEvent.eventName.toLowerCase().includes(search.toLowerCase())

    const raceTs = new Date(race.startDateTime).getTime()
    const isPast = raceTs < now
    const matchesPast = showPast || !isPast

    return matchesSearch && matchesPast
  })

  return (
    <>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/admin/races"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ChevronLeftIcon className="size-4" />
          Nazad na trke
        </Link>
      </div>

      <Heading>Masovna izmena trka</Heading>
      <p className="mt-1 text-sm text-zinc-500">
        Dupli klik na celiju za izmenu. Enter za cuvanje, Escape za otkaz.
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Pretrazi po nazivu, slug-u ili dogadjaju..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={showPast}
            onChange={(e) => setShowPast(e.target.checked)}
            className="size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
          />
          Prikazi istekle
        </label>
      </div>

      {/* Results count */}
      <p className="mt-4 text-sm text-zinc-500">
        Prikazano {filteredRaces.length} od {races.length} trka
      </p>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Dogadjaj
              </th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Naziv
              </th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Slug
              </th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Duzina (km)
              </th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Visinska (m)
              </th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Start
              </th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Kraj
              </th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Lokacija
              </th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Prijave
              </th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Takmicenje
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
            {filteredRaces.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-zinc-500">
                  {search ? 'Nema rezultata pretrage' : 'Nema trka'}
                </td>
              </tr>
            ) : (
              filteredRaces.map((race) => (
                <tr key={race.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="min-w-[150px] px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {race.raceEvent.eventName}
                  </td>
                  <td className="min-w-[180px] px-3 py-2">
                    <EditableCell
                      value={race.raceName}
                      type="text"
                      onSave={(v) => handleUpdateField(race.id, 'raceName', v)}
                      placeholder="Koristi naziv dogadjaja"
                    />
                  </td>
                  <td className="min-w-[150px] px-3 py-2">
                    <EditableCell
                      value={race.slug}
                      type="text"
                      onSave={(v) => handleUpdateField(race.id, 'slug', v)}
                    />
                  </td>
                  <td className="min-w-[80px] px-3 py-2">
                    <EditableCell
                      value={race.length}
                      type="number"
                      onSave={(v) => handleUpdateField(race.id, 'length', v)}
                    />
                  </td>
                  <td className="min-w-[80px] px-3 py-2">
                    <EditableCell
                      value={race.elevation}
                      type="number"
                      onSave={(v) => handleUpdateField(race.id, 'elevation', v)}
                      placeholder="-"
                    />
                  </td>
                  <td className="min-w-[180px] px-3 py-2">
                    <EditableCell
                      value={race.startDateTime}
                      type="datetime"
                      onSave={(v) => handleUpdateField(race.id, 'startDateTime', v)}
                    />
                  </td>
                  <td className="min-w-[180px] px-3 py-2">
                    <EditableCell
                      value={race.endDateTime}
                      type="datetime"
                      onSave={(v) => handleUpdateField(race.id, 'endDateTime', v)}
                      placeholder="Cut-off"
                    />
                  </td>
                  <td className="min-w-[150px] px-3 py-2">
                    <EditableCell
                      value={race.startLocation}
                      type="text"
                      onSave={(v) => handleUpdateField(race.id, 'startLocation', v)}
                      placeholder="-"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <EditableCell
                      value={race.registrationEnabled}
                      type="boolean"
                      onSave={(v) => handleUpdateField(race.id, 'registrationEnabled', v)}
                    />
                  </td>
                  <td className="min-w-[150px] px-3 py-2">
                    <EditableCell
                      value={race.competitionId}
                      type="select"
                      options={competitionOptions}
                      onSave={(v) => handleUpdateField(race.id, 'competitionId', v)}
                      placeholder="Bez takmicenja"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
