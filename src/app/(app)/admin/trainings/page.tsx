'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { useConfirm } from '@/components/confirm-dialog'
import { Heading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import { ChevronLeftIcon, TrashIcon } from '@heroicons/react/16/solid'
import { useCallback, useEffect, useRef, useState } from 'react'

type TrainingEvent = {
 id: string
 eventName: string
 slug: string
 type: 'TRAIL' | 'ROAD' | 'OCR'
 description: string | null
 createdAt: string
 createdById: string | null
 races: Array<{
  id: string
  raceName: string | null
  startDateTime: string
  startLocation: string
 }>
}

const ALL_TRAININGS_QUERY = `
 query AllTrainings {
  raceEvents(limit: 1000, isTraining: true) {
   id
   eventName
   slug
   type
   description
   createdAt
   createdById
   races {
    id
    raceName
    startDateTime
    startLocation
   }
  }
 }
`

const DELETE_TRAINING_EVENT_MUTATION = `
 mutation DeleteTrainingEvent($eventId: ID!) {
  deleteTrainingEvent(eventId: $eventId)
 }
`

export default function AdminTrainingsPage() {
 const { user, accessToken } = useAuth()
 const { toast } = useToast()
 const { confirm } = useConfirm()

 const [loading, setLoading] = useState(true)
 const [events, setEvents] = useState<TrainingEvent[]>([])
 const loadedRef = useRef(false)

 const loadData = useCallback(async () => {
  if (!accessToken) return

  try {
   const data = await gql<{ raceEvents: TrainingEvent[] }>(ALL_TRAININGS_QUERY, {}, { accessToken })
   const sorted = [...(data.raceEvents ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
   )
   setEvents(sorted)
  } catch (err) {
   console.error('Failed to load trainings:', err)
  } finally {
   setLoading(false)
  }
 }, [accessToken])

 useEffect(() => {
  if (accessToken && !loadedRef.current) {
   loadedRef.current = true
   loadData()
  }
 }, [accessToken, loadData])

 async function handleDelete(eventId: string, eventName: string) {
  const confirmed = await confirm({
   title: 'Obriši trening',
   message: `Da li ste sigurni da želite da obrišete "${eventName}"? Ova akcija se ne može poništiti.`,
   confirmText: 'Obriši',
   cancelText: 'Otkaži',
   variant: 'danger',
  })

  if (!confirmed) return

  try {
   await gql(DELETE_TRAINING_EVENT_MUTATION, { eventId }, { accessToken })
   toast('Trening obrisan', 'success')
   setEvents((prev) => prev.filter((e) => e.id !== eventId))
  } catch (err: any) {
   toast(err?.message ?? 'Greška pri brisanju', 'error')
  }
 }

 if (loading) {
  return <LoadingState />
 }

 function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  const tz = 'Europe/Belgrade'
  const day = parseInt(d.toLocaleDateString('sr-Latn-RS', { day: 'numeric', timeZone: tz }))
  const month = d.toLocaleDateString('sr-Latn-RS', { month: 'short', timeZone: tz }).replace('.', '')
  const year = parseInt(d.toLocaleDateString('sr-Latn-RS', { year: 'numeric', timeZone: tz }))
  return `${day}. ${month} ${year}.`
 }

 const typeLabel = (t: string) => (t === 'TRAIL' ? 'Trail' : t === 'OCR' ? 'OCR' : 'Ulična')

 return (
  <>
   <div className="mb-4">
    <Link
     href="/admin"
     className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
    >
     <ChevronLeftIcon className="size-4" />
     Admin Panel
    </Link>
   </div>

   <Heading>Svi treninzi ({events.length})</Heading>

   {events.length === 0 ? (
    <div className="mt-12 text-center text-sm text-text-secondary">Nema kreiranih treninga.</div>
   ) : (
    <div className="mt-6 overflow-hidden rounded-lg border border-border-primary">
     <table className="min-w-full divide-y divide-border-primary">
      <thead className="bg-surface">
       <tr>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
         Trening
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
         Tip
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
         Staze
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
         Sledeća staza
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
         Kreiran
        </th>
        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-text-secondary">
         Akcije
        </th>
       </tr>
      </thead>
      <tbody className="divide-y divide-border-primary bg-card">
       {events.map((event) => {
        const now = new Date().getTime()
        const upcomingRaces = event.races
         .filter((r) => new Date(r.startDateTime).getTime() >= now)
         .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
        const nextRace = upcomingRaces[0] ?? event.races[0] ?? null

        return (
         <tr key={event.id} className="hover:bg-card-hover">
          <td className="px-4 py-3">
           <div className="font-medium text-text-primary">{event.eventName}</div>
           {event.description && (
            <div className="max-w-xs truncate text-sm text-text-secondary">{event.description}</div>
           )}
          </td>
          <td className="px-4 py-3">
           <Badge color={event.type === 'TRAIL' ? 'emerald' : event.type === 'OCR' ? 'orange' : 'sky'}>
            {typeLabel(event.type)}
           </Badge>
          </td>
          <td className="px-4 py-3 text-sm text-text-secondary">
           {event.races.length}
          </td>
          <td className="px-4 py-3 text-sm text-text-secondary">
           {nextRace ? formatDate(nextRace.startDateTime) : '—'}
          </td>
          <td className="px-4 py-3 text-sm text-text-secondary">
           {formatDate(event.createdAt)}
          </td>
          <td className="px-4 py-3 text-right">
           <div className="flex items-center justify-end gap-3">
            <Link
             href={`/events/${event.slug}`}
             className="text-sm text-brand-green hover:text-brand-green-dark"
            >
             Pogledaj
            </Link>
            <button
             onClick={() => handleDelete(event.id, event.eventName)}
             className="rounded p-1 text-red-400 hover:bg-red-900/20"
             title="Obriši trening"
            >
             <TrashIcon className="size-4" />
            </button>
           </div>
          </td>
         </tr>
        )
       })}
      </tbody>
     </table>
    </div>
   )}
  </>
 )
}
