'use client'

import { gql } from '@/app/lib/api'
import { useAuth } from '@/app/auth/auth-context'
import { Badge } from '@/components/badge'
import { Heading } from '@/components/heading'
import { Select } from '@/components/select'
import { Text } from '@/components/text'
import { ChevronLeftIcon } from '@heroicons/react/16/solid'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type LeagueActivity = {
  id: string
  user: { id: string; name: string | null; email: string }
  name: string | null
  distance: number
  elapsedTime: number
  movingTime: number
  elevationGain: number | null
  startDate: string
  source: string
  stravaActivityId: string | null
  status: string
  rejectionReason: string | null
  createdAt: string
}

type League = {
  id: string
  name: string
  slug: string
  scoringMode: string
}

const LEAGUE_QUERY = `
  query League($slug: String!) {
    league(slug: $slug) {
      id
      name
      slug
      scoringMode
    }
  }
`

const ACTIVITIES_QUERY = `
  query LeagueActivities($leagueId: ID!, $limit: Int, $skip: Int) {
    leagueActivities(leagueId: $leagueId, limit: $limit, skip: $skip) {
      id
      user { id name email }
      name
      distance
      elapsedTime
      movingTime
      elevationGain
      startDate
      source
      stravaActivityId
      status
      rejectionReason
      createdAt
    }
  }
`

function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(2)} km`
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sr-Latn-RS', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Belgrade',
  })
}

function statusBadge(status: string) {
  switch (status) {
    case 'VALID':
      return <Badge color="green">Validna</Badge>
    case 'REJECTED':
      return <Badge color="red">Odbijena</Badge>
    case 'PENDING':
      return <Badge color="yellow">Na čekanju</Badge>
    default:
      return <Badge color="zinc">{status}</Badge>
  }
}

const PAGE_SIZE = 30

export default function LeagueActivitiesPage() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken } = useAuth()

  const [league, setLeague] = useState<League | null>(null)
  const [activities, setActivities] = useState<LeagueActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)

  const statusFilter = searchParams.get('status') ?? ''

  function updateFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    router.replace(`?${p.toString()}`, { scroll: false })
  }

  const loadData = useCallback(async () => {
    try {
      const leagueData = await gql<{ league: League | null }>(LEAGUE_QUERY, { slug }, { accessToken })
      if (!leagueData.league) return
      setLeague(leagueData.league)

      const data = await gql<{ leagueActivities: LeagueActivity[] }>(
        ACTIVITIES_QUERY,
        { leagueId: leagueData.league.id, limit: PAGE_SIZE + 1, skip: page * PAGE_SIZE },
        { accessToken },
      )

      const items = data.leagueActivities
      setHasMore(items.length > PAGE_SIZE)
      setActivities(items.slice(0, PAGE_SIZE))
    } catch (err) {
      console.error('Failed to load activities:', err)
    } finally {
      setLoading(false)
    }
  }, [slug, accessToken, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredActivities = statusFilter
    ? activities.filter((a) => a.status === statusFilter)
    : activities

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-text-secondary">Učitavanje...</div>
      </div>
    )
  }

  if (!league) {
    return (
      <div className="py-12 text-center">
        <Heading>Liga nije pronađena</Heading>
      </div>
    )
  }

  return (
    <>
      <Link
        href={`/leagues/${slug}`}
        className="inline-flex items-center gap-2 text-sm/6 text-text-secondary hover:text-text-primary"
      >
        <ChevronLeftIcon className="size-4 fill-gray-400" />
        {league.name}
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Heading>Aktivnosti</Heading>
        <Select value={statusFilter} onChange={(e) => updateFilter('status', e.target.value)}>
          <option value="">Sve</option>
          <option value="VALID">Validne</option>
          <option value="REJECTED">Odbijene</option>
          <option value="PENDING">Na čekanju</option>
        </Select>
      </div>

      <div className="mt-4 overflow-x-auto">
        {filteredActivities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-primary p-8 text-center">
            <Text>Nema aktivnosti.</Text>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border-primary">
            <thead>
              <tr className="text-left text-sm font-medium text-text-secondary">
                <th className="px-4 py-3">Takmičar</th>
                <th className="px-4 py-3">Naziv</th>
                <th className="px-4 py-3 text-right">Distanca</th>
                <th className="px-4 py-3 text-right">Vreme</th>
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Strava</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {filteredActivities.map((a) => (
                <tr key={a.id} className="text-sm">
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {a.user.name ?? a.user.email}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{a.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatDistance(a.distance)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatTime(a.movingTime)}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(a.startDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {statusBadge(a.status)}
                      {a.rejectionReason && (
                        <span className="text-xs text-red-400" title={a.rejectionReason}>
                          ⓘ
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {a.stravaActivityId ? (
                      <a
                        href={`https://www.strava.com/activities/${a.stravaActivityId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#FC5200] underline hover:text-[#e04402]"
                      >
                        View on Strava
                      </a>
                    ) : (
                      <span className="text-text-secondary">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="rounded-md px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary disabled:opacity-30"
        >
          Prethodna
        </button>
        <span className="text-sm text-text-secondary">Strana {page + 1}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore}
          className="rounded-md px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary disabled:opacity-30"
        >
          Sledeća
        </button>
      </div>

      {/* Strava attribution */}
      <div className="mt-6 flex justify-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/strava/powered_by_strava_white.svg"
          alt="Powered by Strava"
          className="h-8 opacity-60"
        />
      </div>
    </>
  )
}
