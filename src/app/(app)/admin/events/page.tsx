'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useConfirm } from '@/components/confirm-dialog'
import { useToast } from '@/components/toast'
import {
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type RaceEvent = {
  id: string
  eventName: string
  slug: string
  type: 'TRAIL' | 'ROAD'
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
    return d.toLocaleDateString('sr-Latn-RS', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const trailCount = events.filter((e) => e.type === 'TRAIL').length
  const roadCount = events.filter((e) => e.type === 'ROAD').length

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
      <div className="mt-4 flex gap-2 text-sm">
        <Badge color="zinc">{events.length} ukupno</Badge>
        <Badge color="emerald">{trailCount} trail</Badge>
        <Badge color="sky">{roadCount} asfalt</Badge>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
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
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="ALL">Svi tipovi</option>
          <option value="TRAIL">Trail</option>
          <option value="ROAD">Asfalt</option>
        </select>
      </div>

      {/* Events list */}
      <div className="mt-6 space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <p className="text-zinc-500">
              {search || filterType !== 'ALL'
                ? 'Nema događaja koji odgovaraju filterima'
                : 'Nema događaja'}
            </p>
            <Button href="/admin/events/new" className="mt-4" outline>
              <PlusIcon className="size-4" />
              Kreiraj prvi događaj
            </Button>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-4">
                  {event.mainImage && (
                    <img
                      src={event.mainImage}
                      alt={event.eventName}
                      className="size-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {event.eventName}
                      </h3>
                      <Badge color={event.type === 'TRAIL' ? 'emerald' : 'sky'}>
                        {event.type === 'TRAIL' ? 'Trail' : 'Asfalt'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      Slug: {event.slug} • Kreirano: {formatDate(event.createdAt)}
                    </p>
                    {event.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/events/${event.slug}`}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                  >
                    Pogledaj
                  </Link>
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                  >
                    <PencilIcon className="size-3" />
                  </Link>
                  <button
                    onClick={() => handleDelete(event)}
                    disabled={deletingId === event.id}
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <TrashIcon className="size-3" />
                  </button>
                </div>
              </div>

              {/* Races */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Trke ({event.races.length})
                  </span>
                  <Link
                    href={`/admin/events/${event.id}/races/new`}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    + Dodaj trku
                  </Link>
                </div>

                {event.races.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-400">Nema trka</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {event.races.map((race) => (
                      <Link
                        key={race.id}
                        href={`/admin/races/${race.id}/registrations`}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                      >
                        {race.raceName ?? 'Trka'} • {race.length}km
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
