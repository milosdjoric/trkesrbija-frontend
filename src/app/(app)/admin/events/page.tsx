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
 DocumentDuplicateIcon,
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

const DUPLICATE_EVENT_MUTATION = `
 mutation DuplicateRaceEvent($eventId: ID!) {
  duplicateRaceEvent(eventId: $eventId) {
   id
  }
 }
`

export default function AdminEventsPage() {
 const router = useRouter()
 const { accessToken } = useAuth()
 const { toast } = useToast()
 const { confirm } = useConfirm()

 const [loading, setLoading] = useState(true)
 const [events, setEvents] = useState<RaceEvent[]>([])
 const [search, setSearch] = useState('')
 const [filterType, setFilterType] = useState<'ALL' | 'TRAIL' | 'ROAD' | 'OCR'>('ALL')
 const [showPast, setShowPast] = useState(false)
 const [deletingId, setDeletingId] = useState<string | null>(null)
 const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

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
  if (accessToken) {
   loadData()
  }
 }, [accessToken, loadData])

 async function handleDelete(event: RaceEvent) {
  const hasRaces = event.races.length > 0
  const message = hasRaces
   ? `Da li ste sigurni da želite da obrišete događaj "${event.eventName}" i sve njegove trke (${event.races.length})? Ova akcija se ne može poništiti.`
   : `Da li ste sigurni da želite da obrišete događaj "${event.eventName}"? Ova akcija se ne može poništiti.`

  const confirmed = await confirm({
   title: 'Obriši događaj',
   message,
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

 async function handleDuplicate(eventId: string) {
  setDuplicatingId(eventId)
  try {
   const data = await gql<{ duplicateRaceEvent: { id: string } }>(
    DUPLICATE_EVENT_MUTATION,
    { eventId },
    { accessToken }
   )
   toast('Događaj dupliran', 'success')
   router.push(`/admin/events/${data.duplicateRaceEvent.id}/edit`)
  } catch (err: any) {
   toast(err?.message ?? 'Greška pri dupliciranju', 'error')
  } finally {
   setDuplicatingId(null)
  }
 }

 if (loading) {
  return <LoadingState />
 }

 // Filter events
 const now = new Date().getTime()
 const filteredEvents = events.filter((event) => {
  const searchLower = search.toLowerCase()
  const matchesSearch =
   !search ||
   event.eventName.toLowerCase().includes(searchLower) ||
   event.slug.toLowerCase().includes(searchLower)

  const matchesType = filterType === 'ALL' || event.type === filterType

  // Check if event has any future races
  const earliestRaceTs = event.races.length > 0
   ? Math.min(...event.races.map(r => new Date(r.startDateTime).getTime()))
   : Infinity
  const isPast = earliestRaceTs < now
  const matchesPast = showPast || !isPast

  return matchesSearch && matchesType && matchesPast
 })

 function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  const day = parseInt(d.toLocaleDateString('sr-Latn-RS', { day: 'numeric', timeZone: 'Europe/Belgrade' }))
  const month = d.toLocaleDateString('sr-Latn-RS', { month: 'short', timeZone: 'Europe/Belgrade' }).replace('.', '')
  const year = parseInt(d.toLocaleDateString('sr-Latn-RS', { year: 'numeric', timeZone: 'Europe/Belgrade' }))
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
     className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
    >
     <ChevronLeftIcon className="size-4" />
     Admin Panel
    </Link>
   </div>

   <div className="flex flex-wrap items-center justify-between gap-4">
    <Heading>Upravljanje događajima</Heading>
    <div className="flex gap-2">
     <Button href="/admin/events/duplicates" outline>
      Duplikati
     </Button>
     <Button href="/admin/events/mass-edit" outline>
      Masovna izmena
     </Button>
     <Button href="/admin/events/new" color="blue">
      <PlusIcon className="size-4" />
      Novi događaj
     </Button>
    </div>
   </div>

   {/* Stats */}
   <StatsGrid items={statItems} className="mt-6" />

   {/* Filters - Full Width */}
   <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
    {/* Search */}
    <div className="relative">
     <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
     <input
      type="text"
      placeholder="Pretraži događaje..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full rounded-lg border border-border-secondary py-2 pl-9 pr-3 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-surface"
     />
    </div>

    {/* Type filter */}
    <select
     value={filterType}
     onChange={(e) => setFilterType(e.target.value as any)}
     className="w-full rounded-lg border border-border-secondary px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-surface"
    >
     <option value="ALL">Svi tipovi</option>
     <option value="TRAIL">Trail</option>
     <option value="OCR">OCR</option>
     <option value="ROAD">Asfalt</option>
    </select>
   </div>

   {/* Show past toggle */}
   <div className="mt-4">
    <label className="flex items-center gap-2 text-sm text-text-secondary">
     <input
      type="checkbox"
      checked={showPast}
      onChange={(e) => setShowPast(e.target.checked)}
      className="size-4 rounded border-border-secondary text-brand-green focus:ring-brand-green bg-surface"
     />
     Prikaži istekle događaje
    </label>
   </div>

   {/* Events Table */}
   <div className="mt-6">
    <div className="flex items-center justify-between mb-4">
     <Subheading>Svi događaji ({filteredEvents.length})</Subheading>
    </div>

    <div className="overflow-hidden rounded-lg border border-border-primary">
     <table className="min-w-full divide-y divide-border-primary">
      <thead className="bg-surface">
       <tr>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
         Događaj
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
         Tip
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
         Trke
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
         Kreirano
        </th>
        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-text-secondary">
         Akcije
        </th>
       </tr>
      </thead>
      <tbody className="divide-y divide-border-primary bg-card">
       {filteredEvents.length === 0 ? (
        <tr>
         <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-secondary">
          {search || filterType !== 'ALL'
           ? 'Nema događaja koji odgovaraju filterima'
           : 'Nema događaja'}
         </td>
        </tr>
       ) : (
        filteredEvents.map((event) => (
         <tr key={event.id} className="hover:bg-card-hover">
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
              className="font-medium text-text-primary hover:text-brand-green"
             >
              {event.eventName}
             </Link>
             <div className="text-sm text-text-secondary">/{event.slug}</div>
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
          <td className="px-4 py-3 text-sm text-text-secondary">
           {formatDate(event.createdAt)}
          </td>
          <td className="px-4 py-3 text-right">
           <div className="flex justify-end gap-1">
            <Link
             href={`/admin/events/${event.id}/edit`}
             className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
             title="Izmeni"
            >
             <PencilIcon className="size-4" />
            </Link>
            <Link
             href={`/admin/events/${event.id}/races/new`}
             className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface hover:text-brand-green"
             title="Dodaj trku"
            >
             <PlusIcon className="size-4" />
            </Link>
            <button
             onClick={() => handleDuplicate(event.id)}
             disabled={duplicatingId === event.id}
             className="cursor-pointer rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary disabled:opacity-50"
             title="Dupliraj"
            >
             <DocumentDuplicateIcon className="size-4" />
            </button>
            <button
             onClick={() => handleDelete(event)}
             disabled={deletingId === event.id}
             className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-red-900/20 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
             title="Obriši događaj"
            >
             <TrashIcon className="size-4" />
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
