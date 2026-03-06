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
 country: string | null
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
   country
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
   country
  }
 }
`

const TYPE_OPTIONS = [
 { value: 'TRAIL', label: 'Trail' },
 { value: 'ROAD', label: 'Ulicna' },
 { value: 'OCR', label: 'OCR' },
]

const COUNTRY_OPTIONS = [
 { value: 'ser', label: 'Srbija' },
 { value: 'cro', label: 'Hrvatska' },
 { value: 'bih', label: 'BiH' },
 { value: 'mne', label: 'Crna Gora' },
 { value: 'mkd', label: 'Severna Makedonija' },
 { value: 'reg', label: 'Region' },
]

export default function EventsMassEditPage() {
 const { accessToken } = useAuth()
 const { toast } = useToast()

 const [events, setEvents] = useState<EventRow[]>([])
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
   const data = await gql<{ raceEvents: EventRow[] }>(EVENTS_QUERY, {}, { accessToken })
   setEvents(data.raceEvents ?? [])
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
  let parsedValue: string | string[] | null = bulkValue
  if (bulkField === 'type' && bulkValue === '') {
   parsedValue = null
  } else if (bulkField === 'tags') {
   parsedValue = bulkValue
    ? bulkValue.split(',').map((t) => t.trim()).filter(Boolean)
    : []
  }

  for (const eventId of selectedIds) {
   try {
    await gql(UPDATE_EVENT_MUTATION, { eventId, input: { [bulkField]: parsedValue } }, { accessToken })
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, [bulkField]: parsedValue } : e)))
    successCount++
   } catch (err) {
    console.error(`Failed to update event ${eventId}:`, err)
    errorCount++
   }
  }

  setIsBulkUpdating(false)
  setSelectedIds(new Set())
  setBulkField('')
  setBulkValue('')

  if (errorCount === 0) {
   toast(`Azurirano ${successCount} dogadjaja`, 'success')
  } else {
   toast(`Azurirano ${successCount}, greske: ${errorCount}`, 'error')
  }
 }

 // Normalize all event names to Title Case
 async function handleNormalizeNames() {
  const eventsToNormalize = events.filter((e) => {
   const normalized = toTitleCase(e.eventName)
   return normalized !== e.eventName
  })

  if (eventsToNormalize.length === 0) {
   toast('Svi nazivi su već normalizovani', 'success')
   return
  }

  const confirmed = window.confirm(
   `Da li želite da normalizujete ${eventsToNormalize.length} naziva događaja u Title Case format?`
  )
  if (!confirmed) return

  setIsBulkUpdating(true)
  let successCount = 0
  let errorCount = 0

  for (const event of eventsToNormalize) {
   const normalizedName = toTitleCase(event.eventName)
   try {
    await gql(UPDATE_EVENT_MUTATION, { eventId: event.id, input: { eventName: normalizedName } }, { accessToken })
    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, eventName: normalizedName } : e)))
    successCount++
   } catch (err) {
    console.error(`Failed to normalize event ${event.id}:`, err)
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

 if (loading) return <LoadingState />

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
     className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
    >
     <ChevronLeftIcon className="size-4" />
     Nazad na dogadjaje
    </Link>
   </div>

   <div className="flex items-center justify-between">
    <div>
     <Heading>Masovna izmena dogadjaja</Heading>
     <p className="mt-1 text-sm text-text-secondary">
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
     <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
     <input
      type="text"
      placeholder="Pretrazi po nazivu ili slug-u..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full rounded-lg border border-border-secondary py-2 pl-9 pr-3 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-surface"
     />
    </div>
    <label className="flex items-center gap-2 text-sm text-text-secondary">
     <input
      type="checkbox"
      checked={showPast}
      onChange={(e) => setShowPast(e.target.checked)}
      className="size-4 rounded border-border-secondary text-brand-green focus:ring-brand-green bg-surface"
     />
     Prikazi istekle
    </label>
   </div>

   {/* Results count */}
   <p className="mt-4 text-sm text-text-secondary">
    Prikazano {filteredEvents.length} od {events.length} dogadjaja
    {selectedIds.size > 0 && ` • Selektovano: ${selectedIds.size}`}
   </p>

   {/* Bulk action toolbar */}
   {selectedIds.size > 0 && (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-blue-900/20 p-3">
     <span className="text-sm font-medium text-blue-300">
      Bulk akcija:
     </span>
     <select
      value={bulkField}
      onChange={(e) => {
       setBulkField(e.target.value)
       setBulkValue('')
      }}
      className="rounded border border-border-secondary bg-surface px-2 py-1 text-sm"
     >
      <option value="">Izaberi polje...</option>
      <option value="type">Tip</option>
      <option value="tags">Tagovi</option>
      <option value="registrationSite">Sajt za prijave</option>
      <option value="country">Zemlja</option>
     </select>

     {bulkField === 'type' && (
      <select
       value={bulkValue}
       onChange={(e) => setBulkValue(e.target.value)}
       className="rounded border border-border-secondary bg-surface px-2 py-1 text-sm"
      >
       <option value="">Izaberi...</option>
       {TYPE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
         {opt.label}
        </option>
       ))}
      </select>
     )}

     {bulkField === 'tags' && (
      <input
       type="text"
       value={bulkValue}
       onChange={(e) => setBulkValue(e.target.value)}
       placeholder="tag1, tag2, tag3..."
       className="rounded border border-border-secondary bg-surface px-2 py-1 text-sm"
      />
     )}

     {bulkField === 'registrationSite' && (
      <input
       type="text"
       value={bulkValue}
       onChange={(e) => setBulkValue(e.target.value)}
       placeholder="https://..."
       className="rounded border border-border-secondary bg-surface px-2 py-1 text-sm"
      />
     )}

     {bulkField === 'country' && (
      <select
       value={bulkValue}
       onChange={(e) => setBulkValue(e.target.value)}
       className="rounded border border-border-secondary bg-surface px-2 py-1 text-sm"
      >
       <option value="">Izaberi...</option>
       {COUNTRY_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
         {opt.label}
        </option>
       ))}
      </select>
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
      className="text-sm text-brand-green hover:text-brand-green-dark"
     >
      Poništi selekciju
     </button>
    </div>
   )}

   {/* Table */}
   <div className="mt-4 overflow-x-auto">
    <table className="min-w-full divide-y divide-border-primary">
     <thead className="bg-surface">
      <tr>
       <th className="w-[30px] px-1 py-2">
        <input
         type="checkbox"
         checked={filteredEvents.length > 0 && filteredEvents.every((e) => selectedIds.has(e.id))}
         onChange={() => toggleSelectAll(filteredEvents.map((e) => e.id))}
         className="size-3 rounded border-border-secondary text-brand-green focus:ring-brand-green"
        />
       </th>
       <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-text-secondary">
        Naziv
       </th>
       <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-text-secondary">
        Slug
       </th>
       <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-text-secondary">
        Tip
       </th>
       <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-text-secondary">
        Opis
       </th>
       <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-text-secondary">
        Slika
       </th>
       <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-text-secondary">
        Prijave
       </th>
       <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-text-secondary">
        Tagovi
       </th>
       <th className="px-1 py-2 text-left text-[10px] font-medium uppercase text-text-secondary">
        Zemlja
       </th>
      </tr>
     </thead>
     <tbody className="divide-y divide-border-primary bg-card">
      {filteredEvents.length === 0 ? (
       <tr>
        <td colSpan={9} className="px-4 py-8 text-center text-sm text-text-secondary">
         {search ? 'Nema rezultata pretrage' : 'Nema dogadjaja'}
        </td>
       </tr>
      ) : (
       filteredEvents.map((event) => (
        <tr
         key={event.id}
         className={`hover:bg-card-hover ${selectedIds.has(event.id) ? 'bg-blue-900/20' : ''}`}
        >
         <td className="w-[30px] px-1 py-1">
          <input
           type="checkbox"
           checked={selectedIds.has(event.id)}
           onChange={() => toggleSelect(event.id)}
           className="size-3 rounded border-border-secondary text-brand-green focus:ring-brand-green"
          />
         </td>
         <td className="w-[140px] overflow-hidden px-1 py-1">
          <EditableCell
           value={event.eventName}
           type="text"
           onSave={(v) => handleUpdateField(event.id, 'eventName', v)}
          />
         </td>
         <td className="w-[100px] overflow-hidden px-1 py-1">
          <EditableCell
           value={event.slug}
           type="text"
           onSave={(v) => handleUpdateField(event.id, 'slug', v)}
          />
         </td>
         <td className="w-[55px] overflow-hidden px-1 py-1">
          <EditableCell
           value={event.type}
           type="select"
           options={TYPE_OPTIONS}
           onSave={(v) => handleUpdateField(event.id, 'type', v)}
          />
         </td>
         <td className="w-[150px] overflow-hidden px-1 py-1">
          <EditableCell
           value={event.description}
           type="text"
           onSave={(v) => handleUpdateField(event.id, 'description', v)}
           placeholder="-"
          />
         </td>
         <td className="w-[100px] overflow-hidden px-1 py-1">
          <EditableCell
           value={event.mainImage}
           type="text"
           onSave={(v) => handleUpdateField(event.id, 'mainImage', v)}
           placeholder="-"
          />
         </td>
         <td className="w-[100px] overflow-hidden px-1 py-1">
          <EditableCell
           value={event.registrationSite}
           type="text"
           onSave={(v) => handleUpdateField(event.id, 'registrationSite', v)}
           placeholder="-"
          />
         </td>
         <td className="w-[100px] overflow-hidden px-1 py-1">
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
           placeholder="-"
          />
         </td>
         <td className="w-[80px] overflow-hidden px-1 py-1">
          <EditableCell
           value={event.country}
           type="select"
           options={COUNTRY_OPTIONS}
           onSave={(v) => handleUpdateField(event.id, 'country', v || null)}
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
