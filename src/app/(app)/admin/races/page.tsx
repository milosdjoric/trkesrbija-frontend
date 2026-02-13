'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import {
  ChevronLeftIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type Race = {
  id: string
  slug: string
  raceName: string | null
  length: number
  elevation: number | null
  startDateTime: string
  registrationEnabled: boolean
  registrationCount: number
  raceEvent: {
    id: string
    eventName: string
    slug: string
    type: 'TRAIL' | 'ROAD'
  }
}

const RACES_QUERY = `
  query AdminRaces {
    races(limit: 1000) {
      id
      slug
      raceName
      length
      elevation
      startDateTime
      registrationEnabled
      registrationCount
      raceEvent {
        id
        eventName
        slug
        type
      }
    }
  }
`

const TOGGLE_REGISTRATION_MUTATION = `
  mutation ToggleRaceRegistration($raceId: ID!, $enabled: Boolean!) {
    updateRace(raceId: $raceId, input: { registrationEnabled: $enabled }) {
      id
      registrationEnabled
    }
  }
`

export default function AdminRacesPage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [races, setRaces] = useState<Race[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'TRAIL' | 'ROAD'>('ALL')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!accessToken) return

    try {
      const data = await gql<{ races: Race[] }>(RACES_QUERY, {}, { accessToken })
      // Sort by date
      const sorted = [...(data.races ?? [])].sort(
        (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      )
      setRaces(sorted)
    } catch (err) {
      console.error('Failed to load races:', err)
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

  async function handleToggleRegistration(raceId: string, currentEnabled: boolean) {
    setTogglingId(raceId)
    try {
      await gql(
        TOGGLE_REGISTRATION_MUTATION,
        { raceId, enabled: !currentEnabled },
        { accessToken }
      )

      // Update local state
      setRaces((prev) =>
        prev.map((r) => (r.id === raceId ? { ...r, registrationEnabled: !currentEnabled } : r))
      )

      toast(
        currentEnabled ? 'Registracija zatvorena' : 'Registracija otvorena',
        'success'
      )
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri promeni statusa', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  if (authLoading || loading) {
    return <LoadingState />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  // Filter races
  const filteredRaces = races.filter((race) => {
    // Search filter
    const searchLower = search.toLowerCase()
    const matchesSearch =
      !search ||
      (race.raceName ?? '').toLowerCase().includes(searchLower) ||
      race.raceEvent.eventName.toLowerCase().includes(searchLower)

    // Type filter
    const matchesType = filterType === 'ALL' || race.raceEvent.type === filterType

    // Status filter
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'OPEN' && race.registrationEnabled) ||
      (filterStatus === 'CLOSED' && !race.registrationEnabled)

    return matchesSearch && matchesType && matchesStatus
  })

  function formatDate(iso: string) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return 'TBD'
    const day = d.getDate()
    const month = d.toLocaleDateString('sr-Latn-RS', { month: 'short' }).replace('.', '')
    const year = d.getFullYear()
    return `${day}. ${month} ${year}.`
  }

  const openCount = races.filter((r) => r.registrationEnabled).length
  const closedCount = races.filter((r) => !r.registrationEnabled).length

  return (
    <>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4" />
          Admin Panel
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading>Upravljanje trkama</Heading>
        <div className="flex gap-2 text-sm">
          <Badge color="green">{openCount} otvoreno</Badge>
          <Badge color="zinc">{closedCount} zatvoreno</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Pretraži trke..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="ALL">Svi tipovi</option>
          <option value="TRAIL">Trail</option>
          <option value="ROAD">Asfalt</option>
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="ALL">Svi statusi</option>
          <option value="OPEN">Otvorene prijave</option>
          <option value="CLOSED">Zatvorene prijave</option>
        </select>
      </div>

      {/* Races table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Trka
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Datum
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Detalji
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-zinc-500">
                Prijave
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-zinc-500">
                Registracija
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
            {filteredRaces.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                  {search || filterType !== 'ALL' || filterStatus !== 'ALL'
                    ? 'Nema trka koje odgovaraju filterima'
                    : 'Nema trka'}
                </td>
              </tr>
            ) : (
              filteredRaces.map((race) => (
                <tr key={race.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge color={race.raceEvent.type === 'TRAIL' ? 'emerald' : 'sky'} className="shrink-0">
                        {race.raceEvent.type === 'TRAIL' ? 'Trail' : 'Ulična'}
                      </Badge>
                      <div>
                        <Link href={`/races/${race.slug}`} className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
                          {race.raceName ?? 'Neimenovana'}
                        </Link>
                        <div className="text-sm text-zinc-500">{race.raceEvent.eventName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {formatDate(race.startDateTime)}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {race.length}km
                    {race.elevation != null && ` / ${race.elevation}m`}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono font-medium">{race.registrationCount}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleRegistration(race.id, race.registrationEnabled)}
                      disabled={togglingId === race.id}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                        race.registrationEnabled
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                      } ${togglingId === race.id ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`size-2 rounded-full ${
                          race.registrationEnabled ? 'bg-green-500' : 'bg-zinc-400'
                        }`}
                      />
                      {togglingId === race.id
                        ? '...'
                        : race.registrationEnabled
                          ? 'Otvoreno'
                          : 'Zatvoreno'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/races/${race.id}/edit`}
                        className="rounded border border-blue-300 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                      >
                        Izmeni
                      </Link>
                      <Link
                        href={`/admin/races/${race.id}/registrations`}
                        className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                      >
                        Prijave
                      </Link>
                      <Link
                        href={`/admin/races/${race.id}/checkpoints`}
                        className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                      >
                        CP
                      </Link>
                    </div>
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
