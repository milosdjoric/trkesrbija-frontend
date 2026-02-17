'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { EditableCell } from '@/components/editable-cell'
import { Heading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import { toTitleCase } from '@/lib/formatters'
import { ChevronLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

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
  const loadedRef = useRef(false)

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkField, setBulkField] = useState<string>('')
  const [bulkValue, setBulkValue] = useState<string>('')
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  const loadData = useCallback(async () => {
    if (!accessToken || loadedRef.current) return
    loadedRef.current = true
    try {
      const [racesData, competitionsData] = await Promise.all([
        gql<{ races: RaceRow[] }>(RACES_QUERY, {}, { accessToken }),
        gql<{ competitions: Competition[] }>(COMPETITIONS_QUERY, {}, { accessToken }),
      ])
      setRaces(racesData.races ?? [])
      setCompetitions(competitionsData.competitions ?? [])
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

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

  // Selection handlers
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleSelectAll(filteredIds: string[]) {
    const allSelected = filteredIds.every((id) => selectedIds.has(id))
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredIds))
    }
  }

  // Bulk update handler
  async function handleBulkUpdate() {
    if (!bulkField || selectedIds.size === 0) return

    setIsBulkUpdating(true)
    let successCount = 0
    let errorCount = 0

    // Parse bulk value based on field type
    let parsedValue: string | number | boolean | null = bulkValue
    if (bulkField === 'registrationEnabled') {
      parsedValue = bulkValue === 'true'
    } else if (bulkField === 'length' || bulkField === 'elevation') {
      parsedValue = bulkValue ? parseFloat(bulkValue) : null
    } else if (bulkField === 'competitionId' && bulkValue === '') {
      parsedValue = null
    }

    for (const raceId of selectedIds) {
      try {
        await gql(UPDATE_RACE_MUTATION, { raceId, input: { [bulkField]: parsedValue } }, { accessToken })
        setRaces((prev) => prev.map((r) => (r.id === raceId ? { ...r, [bulkField]: parsedValue } : r)))
        successCount++
      } catch (err) {
        console.error(`Failed to update race ${raceId}:`, err)
        errorCount++
      }
    }

    setIsBulkUpdating(false)
    setSelectedIds(new Set())
    setBulkField('')
    setBulkValue('')

    if (errorCount === 0) {
      toast(`Azurirano ${successCount} trka`, 'success')
    } else {
      toast(`Azurirano ${successCount}, greske: ${errorCount}`, 'error')
    }
  }

  // Normalize all race names to Title Case
  async function handleNormalizeNames() {
    const racesToNormalize = races.filter((r) => {
      if (!r.raceName) return false
      const normalized = toTitleCase(r.raceName)
      return normalized !== r.raceName
    })

    if (racesToNormalize.length === 0) {
      toast('Svi nazivi su već normalizovani', 'success')
      return
    }

    const confirmed = window.confirm(
      `Da li želite da normalizujete ${racesToNormalize.length} naziva trka u Title Case format?`
    )
    if (!confirmed) return

    setIsBulkUpdating(true)
    let successCount = 0
    let errorCount = 0

    for (const race of racesToNormalize) {
      const normalizedName = toTitleCase(race.raceName)
      try {
        await gql(UPDATE_RACE_MUTATION, { raceId: race.id, input: { raceName: normalizedName } }, { accessToken })
        setRaces((prev) => prev.map((r) => (r.id === race.id ? { ...r, raceName: normalizedName } : r)))
        successCount++
      } catch (err) {
        console.error(`Failed to normalize race ${race.id}:`, err)
        errorCount++
      }
    }

    setIsBulkUpdating(false)
    if (errorCount === 0) {
      toast(`Normalizovano ${successCount} naziva`, 'success')
    } else {
      toast(`Normalizovano ${successCount}, greške: ${errorCount}`, 'error')
    }
  }

  if (authLoading || loading) return <LoadingState />
  if (!user || user.role !== 'ADMIN') return null

  // Build competition options
  const competitionOptions = competitions.map((c) => ({ value: c.id, label: c.name }))

  // Bulk update field options
  const bulkFieldOptions = [
    { value: 'registrationEnabled', label: 'Registracija' },
    { value: 'competitionId', label: 'Takmičenje' },
    { value: 'startLocation', label: 'Lokacija' },
    { value: 'startDateTime', label: 'Startno vreme' },
  ]

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

      <div className="flex items-center justify-between">
        <div>
          <Heading>Masovna izmena trka</Heading>
          <p className="mt-1 text-sm text-zinc-500">
            Dupli klik na celiju za izmenu. Enter za cuvanje, Escape za otkaz.
          </p>
        </div>
        <button
          onClick={handleNormalizeNames}
          disabled={isBulkUpdating}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isBulkUpdating ? 'Normalizujem...' : 'Normalizuj nazive (Title Case)'}
        </button>
      </div>

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
        {selectedIds.size > 0 && ` • Selektovano: ${selectedIds.size}`}
      </p>

      {/* Bulk action toolbar */}
      {selectedIds.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Bulk akcija:
          </span>
          <select
            value={bulkField}
            onChange={(e) => {
              setBulkField(e.target.value)
              setBulkValue('')
            }}
            className="rounded border border-blue-300 bg-white px-2 py-1 text-sm dark:border-blue-600 dark:bg-zinc-800"
          >
            <option value="">Izaberi polje...</option>
            {bulkFieldOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {bulkField === 'registrationEnabled' && (
            <select
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              className="rounded border border-blue-300 bg-white px-2 py-1 text-sm dark:border-blue-600 dark:bg-zinc-800"
            >
              <option value="">Izaberi...</option>
              <option value="true">Otvoreno</option>
              <option value="false">Zatvoreno</option>
            </select>
          )}

          {bulkField === 'competitionId' && (
            <select
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              className="rounded border border-blue-300 bg-white px-2 py-1 text-sm dark:border-blue-600 dark:bg-zinc-800"
            >
              <option value="">Bez takmičenja</option>
              {competitionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {bulkField === 'startLocation' && (
            <input
              type="text"
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              placeholder="Nova lokacija..."
              className="rounded border border-blue-300 bg-white px-2 py-1 text-sm dark:border-blue-600 dark:bg-zinc-800"
            />
          )}

          {bulkField === 'startDateTime' && (
            <input
              type="datetime-local"
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              className="rounded border border-blue-300 bg-white px-2 py-1 text-sm dark:border-blue-600 dark:bg-zinc-800"
            />
          )}

          <button
            onClick={handleBulkUpdate}
            disabled={!bulkField || isBulkUpdating}
            className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isBulkUpdating ? 'Ažuriranje...' : `Primeni na ${selectedIds.size}`}
          </button>

          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Poništi selekciju
          </button>
        </div>
      )}

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="w-[30px] px-1 py-2">
                <input
                  type="checkbox"
                  checked={filteredRaces.length > 0 && filteredRaces.every((r) => selectedIds.has(r.id))}
                  onChange={() => toggleSelectAll(filteredRaces.map((r) => r.id))}
                  className="size-3 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Događaj
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Naziv
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Slug
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                km
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                D+
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Start
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Kraj
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Lok.
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Reg
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Takm.
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
            {filteredRaces.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-sm text-zinc-500">
                  {search ? 'Nema rezultata pretrage' : 'Nema trka'}
                </td>
              </tr>
            ) : (
              filteredRaces.map((race) => (
                <tr
                  key={race.id}
                  className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${selectedIds.has(race.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <td className="w-[30px] px-1 py-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(race.id)}
                      onChange={() => toggleSelect(race.id)}
                      className="size-3 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="w-[100px] overflow-hidden truncate px-1 py-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {race.raceEvent.eventName}
                  </td>
                  <td className="w-[120px] overflow-hidden px-1 py-1">
                    <EditableCell
                      value={race.raceName}
                      type="text"
                      onSave={(v) => handleUpdateField(race.id, 'raceName', v)}
                      placeholder="-"
                    />
                  </td>
                  <td className="w-[100px] overflow-hidden px-1 py-1">
                    <EditableCell
                      value={race.slug}
                      type="text"
                      onSave={(v) => handleUpdateField(race.id, 'slug', v)}
                    />
                  </td>
                  <td className="w-[45px] overflow-hidden px-1 py-1">
                    <EditableCell
                      value={race.length}
                      type="number"
                      onSave={(v) => handleUpdateField(race.id, 'length', v)}
                    />
                  </td>
                  <td className="w-[45px] overflow-hidden px-1 py-1">
                    <EditableCell
                      value={race.elevation}
                      type="number"
                      onSave={(v) => handleUpdateField(race.id, 'elevation', v)}
                      placeholder="-"
                    />
                  </td>
                  <td className="w-[120px] overflow-hidden px-1 py-1">
                    <EditableCell
                      value={race.startDateTime}
                      type="datetime"
                      onSave={(v) => handleUpdateField(race.id, 'startDateTime', v)}
                    />
                  </td>
                  <td className="w-[120px] overflow-hidden px-1 py-1">
                    <EditableCell
                      value={race.endDateTime}
                      type="datetime"
                      onSave={(v) => handleUpdateField(race.id, 'endDateTime', v)}
                      placeholder="-"
                    />
                  </td>
                  <td className="w-[100px] overflow-hidden px-1 py-1">
                    <EditableCell
                      value={race.startLocation}
                      type="text"
                      onSave={(v) => handleUpdateField(race.id, 'startLocation', v)}
                      placeholder="-"
                    />
                  </td>
                  <td className="w-[35px] overflow-hidden px-1 py-1">
                    <EditableCell
                      value={race.registrationEnabled}
                      type="boolean"
                      onSave={(v) => handleUpdateField(race.id, 'registrationEnabled', v)}
                    />
                  </td>
                  <td className="w-[80px] overflow-hidden px-1 py-1">
                    <EditableCell
                      value={race.competitionId}
                      type="select"
                      options={competitionOptions}
                      onSave={(v) => handleUpdateField(race.id, 'competitionId', v)}
                      placeholder="-"
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
