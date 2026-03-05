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
 MapIcon,
 TrashIcon,
 DocumentDuplicateIcon,
 UserGroupIcon,
} from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type Race = {
 id: string
 slug: string
 raceName: string | null
 length: number
 elevation: number | null
 gpsFile: string | null
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
   gpsFile
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

const DELETE_RACE_MUTATION = `
 mutation DeleteRace($raceId: ID!) {
  deleteRace(raceId: $raceId)
 }
`

const DUPLICATE_RACE_MUTATION = `
 mutation DuplicateRace($raceId: ID!) {
  duplicateRace(raceId: $raceId) {
   id
  }
 }
`

export default function AdminRacesPage() {
 const router = useRouter()
 const { accessToken } = useAuth()
 const { toast } = useToast()

 const [loading, setLoading] = useState(true)
 const [races, setRaces] = useState<Race[]>([])
 const [search, setSearch] = useState('')
 const [filterType, setFilterType] = useState<'ALL' | 'TRAIL' | 'ROAD' | 'OCR'>('ALL')
 const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL')
 const [filterGpx, setFilterGpx] = useState<'ALL' | 'HAS_GPX' | 'NO_GPX'>('ALL')
 const [showPast, setShowPast] = useState(false)
 const [togglingId, setTogglingId] = useState<string | null>(null)
 const [deletingId, setDeletingId] = useState<string | null>(null)
 const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
 const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

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
  if (accessToken) {
   loadData()
  }
 }, [accessToken, loadData])

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

 async function handleDeleteRace(raceId: string) {
  setDeletingId(raceId)
  try {
   await gql(DELETE_RACE_MUTATION, { raceId }, { accessToken })
   setRaces((prev) => prev.filter((r) => r.id !== raceId))
   toast('Trka obrisana', 'success')
  } catch (err: any) {
   toast(err?.message ?? 'Greška pri brisanju trke', 'error')
  } finally {
   setDeletingId(null)
   setConfirmDeleteId(null)
  }
 }

 async function handleDuplicateRace(raceId: string) {
  setDuplicatingId(raceId)
  try {
   const data = await gql<{ duplicateRace: { id: string } }>(
    DUPLICATE_RACE_MUTATION,
    { raceId },
    { accessToken }
   )
   toast('Trka duplirana', 'success')
   router.push(`/admin/races/${data.duplicateRace.id}/edit`)
  } catch (err: any) {
   toast(err?.message ?? 'Greška pri dupliciranju', 'error')
  } finally {
   setDuplicatingId(null)
  }
 }

 if (loading) {
  return <LoadingState />
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

  // GPX filter
  const matchesGpx =
   filterGpx === 'ALL' ||
   (filterGpx === 'HAS_GPX' && !!race.gpsFile) ||
   (filterGpx === 'NO_GPX' && !race.gpsFile)

  // Past filter
  const now = new Date().getTime()
  const raceTs = new Date(race.startDateTime).getTime()
  const isPast = raceTs < now
  const matchesPast = showPast || !isPast

  return matchesSearch && matchesType && matchesStatus && matchesGpx && matchesPast
 })

 function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  const day = parseInt(d.toLocaleDateString('sr-Latn-RS', { day: 'numeric', timeZone: 'Europe/Belgrade' }))
  const month = d.toLocaleDateString('sr-Latn-RS', { month: 'short', timeZone: 'Europe/Belgrade' }).replace('.', '')
  const year = parseInt(d.toLocaleDateString('sr-Latn-RS', { year: 'numeric', timeZone: 'Europe/Belgrade' }))
  return `${day}. ${month} ${year}.`
 }

 const openCount = races.filter((r) => r.registrationEnabled).length
 const closedCount = races.filter((r) => !r.registrationEnabled).length
 const totalRegistrations = races.reduce((sum, r) => sum + r.registrationCount, 0)
 const gpxCount = races.filter((r) => !!r.gpsFile).length

 const statItems: StatItem[] = [
  {
   label: 'Trke',
   value: races.length,
   icon: <FlagIcon className="size-5" />,
  },
  {
   label: 'Ima GPX',
   value: `${gpxCount}/${races.length}`,
   icon: <MapIcon className="size-5" />,
  },
  {
   label: 'Otvorene prijave',
   value: openCount,
   icon: <CheckCircleIcon className="size-5" />,
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
     className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
    >
     <ChevronLeftIcon className="size-4" />
     Admin Panel
    </Link>
   </div>

   <div className="flex flex-wrap items-center justify-between gap-4">
    <Heading>Upravljanje trkama</Heading>
    <Link
     href="/admin/races/mass-edit"
     className="rounded-lg border border-border-secondary px-4 py-2 text-sm font-medium text-text-secondary hover:bg-card-hover"
    >
     Masovna izmena
    </Link>
   </div>

   {/* Stats */}
   <StatsGrid items={statItems} className="mt-6" />

   {/* Filters - Full Width */}
   <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
    {/* Search */}
    <div className="relative">
     <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
     <input
      type="text"
      placeholder="Pretraži trke..."
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

    {/* Status filter */}
    <select
     value={filterStatus}
     onChange={(e) => setFilterStatus(e.target.value as any)}
     className="w-full rounded-lg border border-border-secondary px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-surface"
    >
     <option value="ALL">Svi statusi</option>
     <option value="OPEN">Otvorene prijave</option>
     <option value="CLOSED">Zatvorene prijave</option>
    </select>

    {/* GPX filter */}
    <select
     value={filterGpx}
     onChange={(e) => setFilterGpx(e.target.value as any)}
     className="w-full rounded-lg border border-border-secondary px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-surface"
    >
     <option value="ALL">GPX: svi</option>
     <option value="HAS_GPX">Ima GPX</option>
     <option value="NO_GPX">Nema GPX</option>
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
     Prikaži istekle trke
    </label>
   </div>

   {/* Races Table */}
   <div className="mt-6">
    <div className="flex items-center justify-between mb-4">
     <Subheading>Sve trke ({filteredRaces.length})</Subheading>
    </div>

    <div className="overflow-hidden rounded-lg border border-border-primary">
     <table className="min-w-full divide-y divide-border-primary">
      <thead className="bg-surface">
       <tr>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
         Trka
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
         Datum
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
         GPX
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
         Prijave
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
         Status
        </th>
        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-text-secondary">
         Akcije
        </th>
       </tr>
      </thead>
      <tbody className="divide-y divide-border-primary bg-card">
       {filteredRaces.length === 0 ? (
        <tr>
         <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-secondary">
          {search || filterType !== 'ALL' || filterStatus !== 'ALL'
           ? 'Nema trka koje odgovaraju filterima'
           : 'Nema trka'}
         </td>
        </tr>
       ) : (
        filteredRaces.map((race) => (
         <tr key={race.id} className="hover:bg-card-hover">
          <td className="px-4 py-3">
           <div>
            <Link
             href={`/races/${race.slug}`}
             className="font-medium text-text-primary hover:text-brand-green"
            >
             {race.raceName ?? 'Neimenovana'}
            </Link>
            <div className="text-sm text-text-secondary">{race.raceEvent.eventName}</div>
           </div>
          </td>
          <td className="px-4 py-3 text-sm text-text-secondary">
           {formatDate(race.startDateTime)}
          </td>
          <td className="px-4 py-3">
           {race.gpsFile ? (
            <Badge color="green">Da</Badge>
           ) : (
            <Badge color="zinc">Ne</Badge>
           )}
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
           <div className="flex items-center justify-end gap-1">
            <Link
             href={`/admin/races/${race.id}/registrations`}
             className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
             title="Prijave"
            >
             <UserGroupIcon className="size-4" />
            </Link>
            <Link
             href={`/admin/races/${race.id}/checkpoints`}
             className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
             title="Checkpoint-i"
            >
             <MapIcon className="size-4" />
            </Link>
            <button
             onClick={() => handleDuplicateRace(race.id)}
             disabled={duplicatingId === race.id}
             className="cursor-pointer rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary disabled:opacity-50"
             title="Dupliraj"
            >
             <DocumentDuplicateIcon className="size-4" />
            </button>
            {confirmDeleteId === race.id ? (
             <span className="inline-flex items-center gap-1">
              <button
               onClick={() => handleDeleteRace(race.id)}
               disabled={deletingId === race.id}
               className="cursor-pointer rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
               {deletingId === race.id ? '...' : 'Da'}
              </button>
              <button
               onClick={() => setConfirmDeleteId(null)}
               className="cursor-pointer rounded bg-surface px-2 py-1 text-xs font-medium text-text-secondary hover:bg-card-hover"
              >
               Ne
              </button>
             </span>
            ) : (
             <button
              onClick={() => setConfirmDeleteId(race.id)}
              className="cursor-pointer rounded p-1 text-text-secondary hover:bg-red-900/20 hover:text-red-400"
              title="Obriši trku"
             >
              <TrashIcon className="size-4" />
             </button>
            )}
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
