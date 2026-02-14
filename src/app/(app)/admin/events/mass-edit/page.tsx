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
import { useCallback, useEffect, useRef, useState } from 'react'

type EventRow = {
  id: string
  eventName: string
  slug: string
  type: 'TRAIL' | 'ROAD' | 'OCR'
  description: string | null
  mainImage: string | null
  registrationSite: string | null
  tags: string[]
  races: { id: string; startDateTime: string }[]
}

const EVENTS_QUERY = `
  query EventsForMassEdit {
    raceEvents(limit: 1000) {
      id
      eventName
      slug
      type
      description
      mainImage
      registrationSite
      tags
      races {
        id
        startDateTime
      }
    }
  }
`

const UPDATE_EVENT_MUTATION = `
  mutation UpdateRaceEvent($eventId: ID!, $input: UpdateRaceEventInput!) {
    updateRaceEvent(eventId: $eventId, input: $input) {
      id
      eventName
      slug
      type
      description
      mainImage
      registrationSite
      tags
    }
  }
`

const TYPE_OPTIONS = [
  { value: 'TRAIL', label: 'Trail' },
  { value: 'ROAD', label: 'Ulicna' },
  { value: 'OCR', label: 'OCR' },
]

export default function EventsMassEditPage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showPast, setShowPast] = useState(false)
  const loadedRef = useRef(false)

  const loadData = useCallback(async () => {
    if (!accessToken || loadedRef.current) return
    loadedRef.current = true
    try {
      const data = await gql<{ raceEvents: EventRow[] }>(EVENTS_QUERY, {}, { accessToken })
      setEvents(data.raceEvents ?? [])
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

  async function handleUpdateField(
    eventId: string,
    field: string,
    value: string | number | boolean | null | string[]
  ) {
    try {
      await gql(UPDATE_EVENT_MUTATION, { eventId, input: { [field]: value } }, { accessToken })

      // Update local state
      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, [field]: value } : e)))

      toast('Sacuvano', 'success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Greska pri cuvanju'
      toast(message, 'error')
      throw err // Re-throw so EditableCell knows it failed
    }
  }

  if (authLoading || loading) return <LoadingState />
  if (!user || user.role !== 'ADMIN') return null

  // Filter events
  const now = Date.now()
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      !search ||
      event.eventName.toLowerCase().includes(search.toLowerCase()) ||
      event.slug.toLowerCase().includes(search.toLowerCase())

    const earliestRace =
      event.races.length > 0
        ? Math.min(...event.races.map((r) => new Date(r.startDateTime).getTime()))
        : Infinity
    const isPast = earliestRace < now
    const matchesPast = showPast || !isPast

    return matchesSearch && matchesPast
  })

  return (
    <>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ChevronLeftIcon className="size-4" />
          Nazad na dogadjaje
        </Link>
      </div>

      <Heading>Masovna izmena dogadjaja</Heading>
      <p className="mt-1 text-sm text-zinc-500">
        Dupli klik na celiju za izmenu. Enter za cuvanje, Escape za otkaz.
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Pretrazi po nazivu ili slug-u..."
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
        Prikazano {filteredEvents.length} od {events.length} dogadjaja
      </p>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Naziv
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Slug
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Tip
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Opis
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Slika
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Prijave
              </th>
              <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-zinc-500">
                Tagovi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
                  {search ? 'Nema rezultata pretrage' : 'Nema dogadjaja'}
                </td>
              </tr>
            ) : (
              filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="max-w-[140px] px-1 py-1">
                    <EditableCell
                      value={event.eventName}
                      type="text"
                      onSave={(v) => handleUpdateField(event.id, 'eventName', v)}
                    />
                  </td>
                  <td className="max-w-[100px] px-1 py-1">
                    <EditableCell
                      value={event.slug}
                      type="text"
                      onSave={(v) => handleUpdateField(event.id, 'slug', v)}
                    />
                  </td>
                  <td className="w-[60px] px-1 py-1">
                    <EditableCell
                      value={event.type}
                      type="select"
                      options={TYPE_OPTIONS}
                      onSave={(v) => handleUpdateField(event.id, 'type', v)}
                    />
                  </td>
                  <td className="max-w-[150px] px-1 py-1">
                    <EditableCell
                      value={event.description}
                      type="text"
                      onSave={(v) => handleUpdateField(event.id, 'description', v)}
                      placeholder="-"
                    />
                  </td>
                  <td className="max-w-[100px] px-1 py-1">
                    <EditableCell
                      value={event.mainImage}
                      type="text"
                      onSave={(v) => handleUpdateField(event.id, 'mainImage', v)}
                      placeholder="-"
                    />
                  </td>
                  <td className="max-w-[100px] px-1 py-1">
                    <EditableCell
                      value={event.registrationSite}
                      type="text"
                      onSave={(v) => handleUpdateField(event.id, 'registrationSite', v)}
                      placeholder="-"
                    />
                  </td>
                  <td className="max-w-[100px] px-1 py-1">
                    <EditableCell
                      value={event.tags.join(', ')}
                      type="text"
                      onSave={(v) => {
                        const tags =
                          typeof v === 'string'
                            ? v
                                .split(',')
                                .map((t) => t.trim())
                                .filter(Boolean)
                            : []
                        return handleUpdateField(event.id, 'tags', tags)
                      }}
                      placeholder="tag1, tag2"
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
