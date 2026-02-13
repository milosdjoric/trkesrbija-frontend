'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { StatsGrid, type StatItem } from '@/components/stats-grid'
import { useConfirm } from '@/components/confirm-dialog'
import { useToast } from '@/components/toast'
import {
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CalendarIcon,
  FlagIcon,
  MapIcon,
} from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type RaceEvent = {
  id: string
  eventName: string
  slug: string
  type: 'TRAIL' | 'ROAD' | 'OCR'
  description: string | null
  mainImage: string | null
  races: Array<{
    id: string
    raceName: string | null
    length: number
    startDateTime: string
  }>
  createdAt: string
}

const EVENTS_QUERY = `
  query AdminEvents {
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
        startDateTime
      }
      createdAt
    }
  }
`

const DELETE_EVENT_MUTATION = `
  mutation DeleteRaceEvent($eventId: ID!) {
    deleteRaceEvent(eventId: $eventId)
  }
`

export default function AdminEventsPage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<RaceEvent[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'TRAIL' | 'ROAD'>('ALL')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!accessToken) return

    try {
      const data = await gql<{ raceEvents: RaceEvent[] }>(EVENTS_QUERY, {}, { accessToken })
      // Sort by creation date, newest first
      const sorted = [...(data.raceEvents ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setEvents(sorted)
    } catch (err) {
      console.error('Failed to load events:', err)
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

  async function handleDelete(event: RaceEvent) {
    if (event.races.length > 0) {
      toast('Ne možete obrisati događaj koji ima trke. Prvo obrišite trke.', 'error')
      return
    }

    const confirmed = await confirm({
      title: 'Obriši događaj',
      message: `Da li ste sigurni da želite da obrišete događaj "${event.eventName}"? Ova akcija se ne može poništiti.`,
      confirmText: 'Obriši',
      variant: 'danger',
    })

    if (!confirmed) return

    setDeletingId(event.id)
    try {
      await gql(DELETE_EVENT_MUTATION, { eventId: event.id }, { accessToken })
      setEvents((prev) => prev.filter((e) => e.id !== event.id))
      toast('Događaj obrisan', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri brisanju', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (authLoading || loading) {
    return <LoadingState />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  // Filter events
  const filteredEvents = events.filter((event) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      !search ||
      event.eventName.toLowerCase().includes(searchLower) ||
      event.slug.toLowerCase().includes(searchLower)

    const matchesType = filterType === 'ALL' || event.type === filterType

    return matchesSearch && matchesType
  })

  function formatDate(iso: string) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '-'
    const day = d.getDate()
    const month = d.toLocaleDateString('sr-Latn-RS', { month: 'short' }).replace('.', '')
    const year = d.getFullYear()
    return `${day}. ${month} ${year}.`
  }

  const trailCount = events.filter((e) => e.type === 'TRAIL').length
  const roadCount = events.filter((e) => e.type === 'ROAD').length
  const totalRaces = events.reduce((sum, e) => sum + e.races.length, 0)

  const statItems: StatItem[] = [
    {
      label: 'Događaji',
      value: events.length,
      icon: <CalendarIcon className="size-5" />,
    },
    {
      label: 'Trail',
      value: trailCount,
      icon: <MapIcon className="size-5" />,
    },
    {
      label: 'Ulične',
      value: roadCount,
      icon: <FlagIcon className="size-5" />,
    },
    {
      label: 'Trke ukupno',
      value: totalRaces,
      icon: <FlagIcon className="size-5" />,
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
        <Heading>Upravljanje događajima</Heading>
        <Button href="/admin/events/new" color="blue">
          <PlusIcon className="size-4" />
          Novi događaj
        </Button>
      </div>

      {/* Stats */}
      <StatsGrid items={statItems} className="mt-6" />

      {/* Filters - Full Width */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Pretraži događaje..."
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
      </div>

      {/* Events Table */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <Subheading>Svi događaji ({filteredEvents.length})</Subheading>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Događaj
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Tip
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Trke
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Kreirano
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                    {search || filterType !== 'ALL'
                      ? 'Nema događaja koji odgovaraju filterima'
                      : 'Nema događaja'}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {event.mainImage && (
                          <img
                            src={event.mainImage}
                            alt={event.eventName}
                            className="size-10 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <Link
                            href={`/events/${event.slug}`}
                            className="font-medium text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                          >
                            {event.eventName}
                          </Link>
                          <div className="text-sm text-zinc-500">/{event.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={event.type === 'TRAIL' ? 'emerald' : event.type === 'OCR' ? 'orange' : 'sky'}>
                        {event.type === 'TRAIL' ? 'Trail' : event.type === 'OCR' ? 'OCR' : 'Ulična'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{event.races.length}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatDate(event.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Izmeni
                        </Link>
                        <Link
                          href={`/admin/events/${event.id}/races/new`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Dodaj trku
                        </Link>
                        <button
                          onClick={() => handleDelete(event)}
                          disabled={deletingId === event.id || event.races.length > 0}
                          className="text-sm text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          title={event.races.length > 0 ? 'Prvo obrišite sve trke' : 'Obriši događaj'}
                        >
                          Obriši
                        </button>
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
