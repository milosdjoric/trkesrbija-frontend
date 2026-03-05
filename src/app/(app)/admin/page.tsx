'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { StatsGrid } from '@/components/stats-grid'
import {
 CalendarIcon,
 ClipboardDocumentListIcon,
 ExclamationTriangleIcon,
 FlagIcon,
 UserGroupIcon,
 ArrowUpTrayIcon,
 BoltIcon,
} from '@heroicons/react/16/solid'
import { useCallback, useEffect, useState } from 'react'

type DashboardStats = {
 totalEvents: number
 totalRaces: number
 totalTrainings: number
 totalTrainingRaces: number
 totalRegistrations: number
 pendingRegistrations: number
 confirmedRegistrations: number
 totalUsers: number
}

type RecentRace = {
 id: string
 raceName: string | null
 startDateTime: string
 registrationEnabled: boolean
 registrationCount: number
 raceEvent: {
  id: string
  eventName: string
  slug: string
  isTraining: boolean
 }
}

const DASHBOARD_STATS_QUERY = `
 query DashboardStats {
  raceEvents(limit: 1000) {
   id
   isTraining
  }
  races(limit: 1000) {
   id
   raceName
   startDateTime
   registrationEnabled
   registrationCount
   raceEvent {
    id
    eventName
    slug
    isTraining
   }
  }
  users(limit: 1000) {
   id
  }
 }
`

export default function AdminDashboardPage() {
 const { accessToken } = useAuth()

 const [loading, setLoading] = useState(true)
 const [stats, setStats] = useState<DashboardStats | null>(null)
 const [recentRaces, setRecentRaces] = useState<RecentRace[]>([])
 const [showPast, setShowPast] = useState(false)

 const loadData = useCallback(async () => {
  if (!accessToken) return

  try {
   const data = await gql<{
    raceEvents: Array<{ id: string; isTraining: boolean }>
    races: RecentRace[]
    users: Array<{ id: string }>
   }>(DASHBOARD_STATS_QUERY, {}, { accessToken })

   // Calculate stats
   const races = data.races ?? []
   const allEvents = data.raceEvents ?? []
   const trainingRaces = races.filter((r) => r.raceEvent.isTraining)
   const nonTrainingRaces = races.filter((r) => !r.raceEvent.isTraining)
   const totalRegistrations = nonTrainingRaces.reduce((sum, r) => sum + (r.registrationCount ?? 0), 0)

   setStats({
    totalEvents: allEvents.filter((e) => !e.isTraining).length,
    totalRaces: nonTrainingRaces.length,
    totalTrainings: allEvents.filter((e) => e.isTraining).length,
    totalTrainingRaces: trainingRaces.length,
    totalRegistrations,
    pendingRegistrations: 0,
    confirmedRegistrations: 0,
    totalUsers: data.users?.length ?? 0,
   })

   // Sort races by date
   const sortedRaces = [...races].sort(
    (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
   )
   setRecentRaces(sortedRaces)
  } catch (err) {
   console.error('Failed to load dashboard:', err)
  } finally {
   setLoading(false)
  }
 }, [accessToken])

 useEffect(() => {
  if (accessToken) {
   loadData()
  }
 }, [accessToken, loadData])

 if (loading) {
  return <LoadingState />
 }

 function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  const day = parseInt(d.toLocaleDateString('sr-Latn-RS', { day: 'numeric', timeZone: 'Europe/Belgrade' }))
  const month = d.toLocaleDateString('sr-Latn-RS', { month: 'short', timeZone: 'Europe/Belgrade' }).replace('.', '')
  const year = parseInt(d.toLocaleDateString('sr-Latn-RS', { year: 'numeric', timeZone: 'Europe/Belgrade' }))
  return `${day}. ${month} ${year}.`
 }

 return (
  <>
   <Heading>Admin Panel</Heading>

   {/* Quick Links */}
   <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
    <Link
     href="/admin/events"
     className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-border-primary p-4 text-center transition-colors hover:border-border-secondary hover:bg-card-hover"
    >
     <div>
      <div className="font-medium">Događaji</div>
      <div className="text-sm text-text-secondary">Upravljaj događajima</div>
     </div>
     <CalendarIcon className="size-8 text-blue-500" />
    </Link>

    <Link
     href="/admin/races"
     className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-border-primary p-4 text-center transition-colors hover:border-border-secondary hover:bg-card-hover"
    >
     <div>
      <div className="font-medium">Trke</div>
      <div className="text-sm text-text-secondary">Registracije & checkpoint-i</div>
     </div>
     <FlagIcon className="size-8 text-emerald-500" />
    </Link>

    <Link
     href="/admin/trainings"
     className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-border-primary p-4 text-center transition-colors hover:border-border-secondary hover:bg-card-hover"
    >
     <div>
      <div className="font-medium">Treninzi</div>
      <div className="text-sm text-text-secondary">Svi treninzi korisnika</div>
     </div>
     <BoltIcon className="size-8 text-indigo-500" />
    </Link>

    <Link
     href="/admin/users"
     className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-border-primary p-4 text-center transition-colors hover:border-border-secondary hover:bg-card-hover"
    >
     <div>
      <div className="font-medium">Korisnici</div>
      <div className="text-sm text-text-secondary">Upravljaj korisnicima</div>
     </div>
     <UserGroupIcon className="size-8 text-purple-500" />
    </Link>

    <Link
     href="/admin/import"
     className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-border-primary p-4 text-center transition-colors hover:border-border-secondary hover:bg-card-hover"
    >
     <div>
      <div className="font-medium">Import</div>
      <div className="text-sm text-text-secondary">CSV import podataka</div>
     </div>
     <ArrowUpTrayIcon className="size-8 text-amber-500" />
    </Link>

    <Link
     href="/admin/reports"
     className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-border-primary p-4 text-center transition-colors hover:border-border-secondary hover:bg-card-hover"
    >
     <div>
      <div className="font-medium">Prijave grešaka</div>
      <div className="text-sm text-text-secondary">Korisničke prijave pogrešnih podataka</div>
     </div>
     <ExclamationTriangleIcon className="size-8 text-red-500" />
    </Link>

   </div>

   {/* Stats */}
   <StatsGrid
    items={[
     { label: 'Događaji', value: stats?.totalEvents ?? 0, icon: <CalendarIcon className="size-4" /> },
     { label: 'Trke', value: stats?.totalRaces ?? 0, icon: <FlagIcon className="size-4" /> },
     { label: 'Treninzi', value: stats?.totalTrainings ?? 0, icon: <BoltIcon className="size-4" /> },
     { label: 'Korisnici', value: stats?.totalUsers ?? 0, icon: <UserGroupIcon className="size-4" /> },
     { label: 'Prijave', value: stats?.totalRegistrations ?? 0, icon: <ClipboardDocumentListIcon className="size-4" /> },
    ]}
    columns={5}
    className="mt-6"
   />

   {/* Recent Races */}
   <div className="mt-10">
    <div className="flex items-center justify-between">
     <Subheading>Predstojeće trke</Subheading>
     <Link href="/admin/races" className="text-sm text-brand-green hover:text-brand-green-dark">
      Pogledaj sve →
     </Link>
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

    <div className="mt-4 overflow-hidden rounded-lg border border-border-primary">
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
       {(() => {
        const now = new Date().getTime()
        const filteredRaces = recentRaces.filter((race) => {
         const raceTs = new Date(race.startDateTime).getTime()
         const isPast = raceTs < now
         return showPast || !isPast
        }).slice(0, 10)

        if (filteredRaces.length === 0) {
         return (
          <tr>
           <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-secondary">
            {showPast ? 'Nema trka' : 'Nema predstojećih trka'}
           </td>
          </tr>
         )
        }

        return filteredRaces.map((race) => (
         <tr key={race.id} className="hover:bg-card-hover">
          <td className="px-4 py-3">
           <div className="font-medium text-text-primary">
            {race.raceName ?? race.raceEvent.eventName}
           </div>
           <div className="text-sm text-text-secondary">{race.raceEvent.eventName}</div>
          </td>
          <td className="px-4 py-3 text-sm text-text-secondary">
           {formatDate(race.startDateTime)}
          </td>
          <td className="px-4 py-3">
           <span className="font-medium">{race.registrationCount}</span>
          </td>
          <td className="px-4 py-3">
           {race.registrationEnabled ? (
            <Badge color="green">Otvoreno</Badge>
           ) : (
            <Badge color="zinc">Zatvoreno</Badge>
           )}
          </td>
          <td className="px-4 py-3 text-right">
           <div className="flex justify-end gap-2">
            <Link
             href={`/admin/races/${race.id}/registrations`}
             className="text-sm text-brand-green hover:text-brand-green-dark"
            >
             Prijave
            </Link>
            <Link
             href={`/admin/races/${race.id}/checkpoints`}
             className="text-sm text-brand-green hover:text-brand-green-dark"
            >
             CP
            </Link>
           </div>
          </td>
         </tr>
        ))
       })()}
      </tbody>
     </table>
    </div>
   </div>
  </>
 )
}
