'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { StatsGrid, type StatItem } from '@/components/stats-grid'
import { useToast } from '@/components/toast'
import {
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  FlagIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
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
  const [filterType, setFilterType] = useState<'ALL' | 'TRAIL' | 'ROAD' | 'OCR'>('ALL')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL')
  const [showPast, setShowPast] = useState(false)
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

    // Past filter
    const now = new Date().getTime()
    const raceTs = new Date(race.startDateTime).getTime()
    const isPast = raceTs < now
    const matchesPast = showPast || !isPast

    return matchesSearch && matchesType && matchesStatus && matchesPast
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
  const totalRegistrations = races.reduce((sum, r) => sum + r.registrationCount, 0)

  const statItems: StatItem[] = [
    {
      label: 'Trke',
      value: races.length,
      icon: <FlagIcon className="size-5" />,
    },
    {
      label: 'Otvorene prijave',
      value: openCount,
      icon: <CheckCircleIcon className="size-5" />,
    },
    {
      label: 'Zatvorene prijave',
      value: closedCount,
      icon: <XCircleIcon className="size-5" />,
    },
    {
      label: 'Ukupno prijava',
      value: totalRegistrations,
      icon: <ClipboardDocumentListIcon className="size-5" />,
    },
  ]

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
        <Link
          href="/admin/races/mass-edit"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Masovna izmena
        </Link>
      </div>

      {/* Stats */}
      <StatsGrid items={statItems} className="mt-6" />

      {/* Filters - Full Width */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Search */}
        <div className="relative">
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
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="ALL">Svi tipovi</option>
          <option value="TRAIL">Trail</option>
          <option value="OCR">OCR</option>
          <option value="ROAD">Asfalt</option>
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="ALL">Svi statusi</option>
          <option value="OPEN">Otvorene prijave</option>
          <option value="CLOSED">Zatvorene prijave</option>
        </select>
      </div>

      {/* Show past toggle */}
      <div className="mt-4">
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={showPast}
            onChange={(e) => setShowPast(e.target.checked)}
            className="size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
          />
          Prikaži istekle trke
        </label>
      </div>

      {/* Races Table */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <Subheading>Sve trke ({filteredRaces.length})</Subheading>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
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
                  Prijave
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
              {filteredRaces.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                    {search || filterType !== 'ALL' || filterStatus !== 'ALL'
                      ? 'Nema trka koje odgovaraju filterima'
                      : 'Nema trka'}
                  </td>
                </tr>
              ) : (
                filteredRaces.map((race) => (
                  <tr key={race.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          href={`/races/${race.slug}`}
                          className="font-medium text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                        >
                          {race.raceName ?? 'Neimenovana'}
                        </Link>
                        <div className="text-sm text-zinc-500">{race.raceEvent.eventName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatDate(race.startDateTime)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{race.registrationCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleRegistration(race.id, race.registrationEnabled)}
                        disabled={togglingId === race.id}
                        className="cursor-pointer"
                      >
                        {race.registrationEnabled ? (
                          <Badge color="green">Otvoreno</Badge>
                        ) : (
                          <Badge color="zinc">Zatvoreno</Badge>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/races/${race.id}/registrations`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Prijave
                        </Link>
                        <Link
                          href={`/admin/races/${race.id}/checkpoints`}
                          className="text-sm text-blue-600 hover:text-blue-700"
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
      </div>
    </>
  )
}
