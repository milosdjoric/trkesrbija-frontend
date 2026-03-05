'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { Select } from '@/components/select'
import { useConfirm } from '@/components/confirm-dialog'
import { useToast } from '@/components/toast'
import {
 ChevronLeftIcon,
 ExclamationTriangleIcon,
 ArrowTopRightOnSquareIcon,
 TrashIcon,
} from '@heroicons/react/16/solid'
import { useCallback, useEffect, useState } from 'react'

type SimilarityScore = {
 total: number
 name: number
 date: number
 location: number
}

type EventInfo = {
 id: string
 eventName: string
 slug: string
 type: 'TRAIL' | 'ROAD' | 'OCR'
 earliestDate: string | null
 location: string | null
}

type PotentialDuplicate = {
 eventA: EventInfo
 eventB: EventInfo
 similarity: SimilarityScore
}

const DUPLICATES_QUERY = `
 query PotentialDuplicates($threshold: Int!) {
  potentialDuplicates(threshold: $threshold) {
   eventA {
    id
    eventName
    slug
    type
    earliestDate
    location
   }
   eventB {
    id
    eventName
    slug
    type
    earliestDate
    location
   }
   similarity {
    total
    name
    date
    location
   }
  }
 }
`

const DELETE_EVENT_MUTATION = `
 mutation DeleteRaceEvent($eventId: ID!) {
  deleteRaceEvent(eventId: $eventId)
 }
`

export default function AdminDuplicatesPage() {
 const { accessToken } = useAuth()
 const { toast } = useToast()
 const { confirm } = useConfirm()

 const [loading, setLoading] = useState(true)
 const [duplicates, setDuplicates] = useState<PotentialDuplicate[]>([])
 const [threshold, setThreshold] = useState(60)
 const [deletingId, setDeletingId] = useState<string | null>(null)

 const loadData = useCallback(async () => {
  if (!accessToken) return

  setLoading(true)
  try {
   const data = await gql<{ potentialDuplicates: PotentialDuplicate[] }>(
    DUPLICATES_QUERY,
    { threshold },
    { accessToken }
   )
   setDuplicates(data.potentialDuplicates ?? [])
  } catch (err) {
   console.error('Failed to load duplicates:', err)
  } finally {
   setLoading(false)
  }
 }, [accessToken, threshold])

 useEffect(() => {
  if (accessToken) {
   loadData()
  }
 }, [accessToken, loadData])

 if (loading) {
  return <LoadingState />
 }

 function formatDate(iso: string | null) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  const day = parseInt(d.toLocaleDateString('sr-Latn-RS', { day: 'numeric', timeZone: 'Europe/Belgrade' }))
  const month = d.toLocaleDateString('sr-Latn-RS', { month: 'short', timeZone: 'Europe/Belgrade' }).replace('.', '')
  const year = parseInt(d.toLocaleDateString('sr-Latn-RS', { year: 'numeric', timeZone: 'Europe/Belgrade' }))
  return `${day}. ${month} ${year}.`
 }

 function getSimilarityColor(score: number): 'red' | 'orange' | 'yellow' | 'zinc' {
  if (score >= 80) return 'red'
  if (score >= 70) return 'orange'
  if (score >= 60) return 'yellow'
  return 'zinc'
 }

 function getTypeColor(type: string): 'emerald' | 'orange' | 'sky' {
  if (type === 'TRAIL') return 'emerald'
  if (type === 'OCR') return 'orange'
  return 'sky'
 }

 function getTypeLabel(type: string): string {
  if (type === 'TRAIL') return 'Trail'
  if (type === 'OCR') return 'OCR'
  return 'Ulična'
 }

 async function handleDelete(event: EventInfo) {
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
   // Remove duplicates that contain this event
   setDuplicates((prev) =>
    prev.filter((dup) => dup.eventA.id !== event.id && dup.eventB.id !== event.id)
   )
   toast('Događaj obrisan', 'success')
  } catch (err: any) {
   const message = err?.message ?? 'Greška pri brisanju'
   if (message.includes('HAS_RACES') || message.includes('existing races')) {
    toast('Ne možete obrisati događaj koji ima trke. Prvo obrišite trke.', 'error')
   } else {
    toast(message, 'error')
   }
  } finally {
   setDeletingId(null)
  }
 }

 return (
  <>
   {/* Back link */}
   <div className="mb-4">
    <Link
     href="/admin/events"
     className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
    >
     <ChevronLeftIcon className="size-4" />
     Događaji
    </Link>
   </div>

   <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
     <Heading>Potencijalni duplikati</Heading>
     <p className="mt-1 text-sm text-text-secondary">
      Pronađeni događaji sa sličnim imenom, datumom ili lokacijom
     </p>
    </div>
   </div>

   {/* Threshold filter */}
   <div className="mt-6 flex items-center gap-4">
    <label className="text-sm font-medium text-text-secondary">
     Minimalna sličnost:
    </label>
    <Select
     value={threshold.toString()}
     onChange={(e) => setThreshold(Number(e.target.value))}
     className="w-32"
    >
     <option value="50">50%</option>
     <option value="60">60%</option>
     <option value="70">70%</option>
     <option value="80">80%</option>
     <option value="90">90%</option>
    </Select>
    <span className="text-sm text-text-secondary">
     ({duplicates.length} pronađeno)
    </span>
   </div>

   {/* Results */}
   <div className="mt-8 space-y-4">
    {duplicates.length === 0 ? (
     <div className="rounded-lg border border-border-primary p-8 text-center">
      <ExclamationTriangleIcon className="mx-auto size-12 text-text-secondary" />
      <p className="mt-4 text-text-secondary">
       Nema pronađenih duplikata sa sličnošću {'>='} {threshold}%
      </p>
     </div>
    ) : (
     duplicates.map((dup, index) => (
      <div
       key={`${dup.eventA.id}-${dup.eventB.id}`}
       className="rounded-lg border border-border-primary bg-card p-4"
      >
       {/* Header with similarity score */}
       <div className="mb-4 flex items-center justify-between">
        <Badge color={getSimilarityColor(dup.similarity.total)} className="text-sm">
         {dup.similarity.total}% sličnost
        </Badge>
        <div className="flex gap-4 text-xs text-text-secondary">
         <span>Ime: {dup.similarity.name}%</span>
         <span>Datum: {dup.similarity.date}%</span>
         <span>Lokacija: {dup.similarity.location}%</span>
        </div>
       </div>

       {/* Two events side by side */}
       <div className="grid gap-4 md:grid-cols-2">
        {/* Event A */}
        <div className="rounded-lg border border-border-primary bg-surface p-4">
         <div className="flex items-start justify-between">
          <div>
           <h3 className="font-medium text-text-primary">
            {dup.eventA.eventName}
           </h3>
           <p className="mt-1 text-sm text-text-secondary">/{dup.eventA.slug}</p>
          </div>
          <Badge color={getTypeColor(dup.eventA.type)}>
           {getTypeLabel(dup.eventA.type)}
          </Badge>
         </div>
         <div className="mt-3 space-y-1 text-sm text-text-secondary">
          <div>
           <span className="font-medium">Datum:</span> {formatDate(dup.eventA.earliestDate)}
          </div>
          <div>
           <span className="font-medium">Lokacija:</span> {dup.eventA.location ?? '-'}
          </div>
         </div>
         <div className="mt-3 flex gap-2">
          <Link
           href={`/admin/events/${dup.eventA.id}/edit`}
           className="text-sm text-brand-green hover:text-brand-green-dark"
          >
           Izmeni
          </Link>
          <Link
           href={`/events/${dup.eventA.slug}`}
           className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
          >
           Pogledaj
           <ArrowTopRightOnSquareIcon className="size-3" />
          </Link>
          <button
           onClick={() => handleDelete(dup.eventA)}
           disabled={deletingId === dup.eventA.id}
           className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
           {deletingId === dup.eventA.id ? 'Brisanje...' : 'Obriši'}
          </button>
         </div>
        </div>

        {/* Event B */}
        <div className="rounded-lg border border-border-primary bg-surface p-4">
         <div className="flex items-start justify-between">
          <div>
           <h3 className="font-medium text-text-primary">
            {dup.eventB.eventName}
           </h3>
           <p className="mt-1 text-sm text-text-secondary">/{dup.eventB.slug}</p>
          </div>
          <Badge color={getTypeColor(dup.eventB.type)}>
           {getTypeLabel(dup.eventB.type)}
          </Badge>
         </div>
         <div className="mt-3 space-y-1 text-sm text-text-secondary">
          <div>
           <span className="font-medium">Datum:</span> {formatDate(dup.eventB.earliestDate)}
          </div>
          <div>
           <span className="font-medium">Lokacija:</span> {dup.eventB.location ?? '-'}
          </div>
         </div>
         <div className="mt-3 flex gap-2">
          <Link
           href={`/admin/events/${dup.eventB.id}/edit`}
           className="text-sm text-brand-green hover:text-brand-green-dark"
          >
           Izmeni
          </Link>
          <Link
           href={`/events/${dup.eventB.slug}`}
           className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
          >
           Pogledaj
           <ArrowTopRightOnSquareIcon className="size-3" />
          </Link>
          <button
           onClick={() => handleDelete(dup.eventB)}
           disabled={deletingId === dup.eventB.id}
           className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
           {deletingId === dup.eventB.id ? 'Brisanje...' : 'Obriši'}
          </button>
         </div>
        </div>
       </div>
      </div>
     ))
    )}
   </div>
  </>
 )
}
