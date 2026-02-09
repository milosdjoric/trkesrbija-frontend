'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { StatsGrid, type StatItem } from '@/components/stats-grid'
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  FlagIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type DashboardStats = {
  totalEvents: number
  totalRaces: number
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
  }
}

const DASHBOARD_STATS_QUERY = `
  query DashboardStats {
    raceEvents(limit: 1000) {
      id
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
      }
    }
    users(limit: 1000) {
      id
    }
  }
`

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentRaces, setRecentRaces] = useState<RecentRace[]>([])

  const loadData = useCallback(async () => {
    if (!accessToken) return

    try {
      const data = await gql<{
        raceEvents: Array<{ id: string }>
        races: RecentRace[]
        users: Array<{ id: string }>
      }>(DASHBOARD_STATS_QUERY, {}, { accessToken })

      // Calculate stats
      const races = data.races ?? []
      const totalRegistrations = races.reduce((sum, r) => sum + (r.registrationCount ?? 0), 0)

      setStats({
        totalEvents: data.raceEvents?.length ?? 0,
        totalRaces: races.length,
        totalRegistrations,
        pendingRegistrations: 0, // Would need separate query
        confirmedRegistrations: 0,
        totalUsers: data.users?.length ?? 0,
      })

      // Sort races by date and take recent ones
      const sortedRaces = [...races].sort(
        (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      )
      setRecentRaces(sortedRaces.slice(0, 10))
    } catch (err) {
      console.error('Failed to load dashboard:', err)
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

  if (authLoading || loading) {
    return <LoadingState />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  const statItems: StatItem[] = [
    {
      label: 'Događaji',
      value: stats?.totalEvents ?? 0,
      icon: <CalendarIcon className="size-5" />,
    },
    {
      label: 'Trke',
      value: stats?.totalRaces ?? 0,
      icon: <FlagIcon className="size-5" />,
    },
    {
      label: 'Prijave',
      value: stats?.totalRegistrations ?? 0,
      icon: <ClipboardDocumentListIcon className="size-5" />,
    },
    {
      label: 'Korisnici',
      value: stats?.totalUsers ?? 0,
      icon: <UserGroupIcon className="size-5" />,
    },
  ]

  function formatDate(iso: string) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return 'TBD'
    return d.toLocaleDateString('sr-Latn-RS', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <>
      <Heading>Admin Panel</Heading>

      {/* Quick Links */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/events"
          className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <CalendarIcon className="size-8 text-blue-500" />
          <div>
            <div className="font-medium">Događaji</div>
            <div className="text-sm text-zinc-500">Upravljaj događajima</div>
          </div>
        </Link>

        <Link
          href="/admin/races"
          className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <FlagIcon className="size-8 text-emerald-500" />
          <div>
            <div className="font-medium">Trke</div>
            <div className="text-sm text-zinc-500">Registracije & checkpoint-i</div>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <UserGroupIcon className="size-8 text-purple-500" />
          <div>
            <div className="font-medium">Korisnici</div>
            <div className="text-sm text-zinc-500">Upravljaj korisnicima</div>
          </div>
        </Link>

        <Link
          href="/events"
          className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <CheckCircleIcon className="size-8 text-amber-500" />
          <div>
            <div className="font-medium">Javni sajt</div>
            <div className="text-sm text-zinc-500">Pogledaj kao korisnik</div>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <StatsGrid items={statItems} className="mt-8" />

      {/* Recent Races */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <Subheading>Predstojeće trke</Subheading>
          <Link href="/admin/races" className="text-sm text-blue-600 hover:text-blue-700">
            Pogledaj sve →
          </Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
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
              {recentRaces.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                    Nema trka
                  </td>
                </tr>
              ) : (
                recentRaces.map((race) => (
                  <tr key={race.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {race.raceName ?? race.raceEvent.eventName}
                      </div>
                      <div className="text-sm text-zinc-500">{race.raceEvent.eventName}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
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
