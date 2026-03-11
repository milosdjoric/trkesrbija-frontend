'use client'

import { gql, type Gender } from '@/app/lib/api'
import { useAuth } from '@/app/auth/auth-context'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { Text } from '@/components/text'
import {
  CalendarIcon,
  ChevronLeftIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/16/solid'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

type League = {
  id: string
  name: string
  slug: string
  description: string | null
  type: string
  status: string
  period: string
  scoringMode: string
  minDistance: number | null
  maxDistance: number | null
  startDate: string
  endDate: string
  isPublic: boolean
  inviteCode: string | null
  memberCount: number
  isMember: boolean
  isLeagueAdmin: boolean
}

type LeaderboardEntry = {
  position: number
  userId: string
  userName: string | null
  userEmail: string
  totalDistance: number
  bestTime: number | null
  activityCount: number
  lastActivityDate: string | null
  gender: Gender | null
}

const LEAGUE_QUERY = `
  query League($slug: String!) {
    league(slug: $slug) {
      id
      name
      slug
      description
      type
      status
      period
      scoringMode
      minDistance
      maxDistance
      startDate
      endDate
      isPublic
      inviteCode
      memberCount
      isMember
      isLeagueAdmin
    }
  }
`

const LEADERBOARD_QUERY = `
  query LeagueLeaderboard($leagueId: ID!, $gender: Gender, $limit: Int) {
    leagueLeaderboard(leagueId: $leagueId, gender: $gender, limit: $limit) {
      position
      userId
      userName
      userEmail
      totalDistance
      bestTime
      activityCount
      lastActivityDate
      gender
    }
  }
`

const JOIN_LEAGUE = `
  mutation JoinLeague($leagueId: ID!, $gender: Gender) {
    joinLeague(leagueId: $leagueId, gender: $gender) {
      id
    }
  }
`

const LEAVE_LEAGUE = `
  mutation LeaveLeague($leagueId: ID!) {
    leaveLeague(leagueId: $leagueId)
  }
`

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  return d.toLocaleDateString('sr-Latn-RS', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Belgrade',
  })
}

function formatDistance(meters: number) {
  const km = meters / 1000
  return `${km.toFixed(1)} km`
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function getMedalColor(position: number): 'yellow' | 'zinc' | 'amber' | null {
  switch (position) {
    case 1:
      return 'yellow'
    case 2:
      return 'zinc'
    case 3:
      return 'amber'
    default:
      return null
  }
}

function getDistanceLabel(min: number | null, max: number | null) {
  if (min != null && max != null) {
    if (min === max) return `${min} km`
    return `${min}–${max} km`
  }
  if (min != null) return `≥ ${min} km`
  if (max != null) return `≤ ${max} km`
  return 'Bilo koja distanca'
}

export default function LeagueDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, accessToken } = useAuth()

  const [league, setLeague] = useState<League | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const genderFilter = (searchParams.get('gender') as Gender | null) ?? ''
  const nameSearch = searchParams.get('q') ?? ''

  function updateFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString())
    if (value) {
      p.set(key, value)
    } else {
      p.delete(key)
    }
    router.replace(`?${p.toString()}`, { scroll: false })
  }

  const loadData = useCallback(async () => {
    try {
      const leagueData = await gql<{ league: League | null }>(LEAGUE_QUERY, { slug }, { accessToken })
      if (leagueData.league) {
        setLeague(leagueData.league)

        const lb = await gql<{ leagueLeaderboard: LeaderboardEntry[] }>(
          LEADERBOARD_QUERY,
          {
            leagueId: leagueData.league.id,
            gender: genderFilter || null,
          },
          { accessToken },
        )
        setLeaderboard(lb.leagueLeaderboard)
      }
    } catch (err) {
      console.error('Failed to load league:', err)
    } finally {
      setLoading(false)
    }
  }, [slug, accessToken, genderFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredLeaderboard = useMemo(() => {
    if (!nameSearch.trim()) return leaderboard
    const query = nameSearch
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
    return leaderboard.filter((entry) => {
      const name = (entry.userName ?? entry.userEmail)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
      return name.includes(query)
    })
  }, [leaderboard, nameSearch])

  async function handleJoin() {
    if (!league || !user) return
    setJoining(true)
    try {
      await gql(JOIN_LEAGUE, { leagueId: league.id }, { accessToken })
      await loadData()
    } catch (err) {
      console.error('Failed to join league:', err)
    } finally {
      setJoining(false)
    }
  }

  async function handleLeave() {
    if (!league) return
    setLeaving(true)
    try {
      await gql(LEAVE_LEAGUE, { leagueId: league.id }, { accessToken })
      await loadData()
    } catch (err) {
      console.error('Failed to leave league:', err)
    } finally {
      setLeaving(false)
    }
  }

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
        href="/leagues"
        className="inline-flex items-center gap-2 text-sm/6 text-text-secondary hover:text-text-primary"
      >
        <ChevronLeftIcon className="size-4 fill-gray-400" />
        Sve lige
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading>{league.name}</Heading>
          {league.description && <Text className="mt-1">{league.description}</Text>}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-4" />
              {formatDate(league.startDate)} — {formatDate(league.endDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <UserGroupIcon className="size-4" />
              {league.memberCount} članova
            </span>
            <Badge color="blue">{getDistanceLabel(league.minDistance, league.maxDistance)}</Badge>
            <Badge color={league.status === 'ACTIVE' ? 'green' : 'zinc'}>
              {league.status === 'ACTIVE' ? 'Aktivna' : league.status === 'COMPLETED' ? 'Završena' : league.status}
            </Badge>
            <Badge color="purple">
              {league.scoringMode === 'BEST_TIME' ? 'Najbolje vreme' : 'Ukupna distanca'}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          {league.isMember ? (
            <Button color="zinc" onClick={handleLeave} disabled={leaving}>
              {leaving ? 'Napuštam...' : 'Napusti ligu'}
            </Button>
          ) : league.status === 'ACTIVE' && user ? (
            <Button color="green" onClick={handleJoin} disabled={joining}>
              {joining ? 'Pridruživanje...' : 'Pridruži se'}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border-primary bg-card p-4">
          <div className="text-2xl font-semibold">{league.memberCount}</div>
          <div className="text-sm text-text-secondary">Članova</div>
        </div>
        <div className="rounded-lg border border-border-primary bg-card p-4">
          <div className="text-2xl font-semibold text-brand-green">{leaderboard.length}</div>
          <div className="text-sm text-text-secondary">Na leaderboard-u</div>
        </div>
        <div className="rounded-lg border border-border-primary bg-card p-4">
          <div className="text-2xl font-semibold">
            {leaderboard.length > 0
              ? league.scoringMode === 'BEST_TIME' && leaderboard[0].bestTime
                ? formatTime(leaderboard[0].bestTime)
                : formatDistance(leaderboard[0].totalDistance)
              : '—'}
          </div>
          <div className="text-sm text-text-secondary">
            {league.scoringMode === 'BEST_TIME' ? 'Najbolje vreme' : 'Najviše km'}
          </div>
        </div>
      </div>

      {/* Invite code za admina privatne lige */}
      {league.isLeagueAdmin && !league.isPublic && league.inviteCode && (
        <div className="mt-4 rounded-lg border border-border-primary bg-card p-4">
          <div className="text-sm font-medium text-text-primary">Pozivni kod (samo za članove)</div>
          <div className="mt-1 flex items-center gap-3">
            <code className="rounded bg-surface px-3 py-1.5 font-mono text-lg font-bold text-brand-green">
              {league.inviteCode}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(league.inviteCode!)}
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              Kopiraj
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Heading level={2}>Leaderboard</Heading>
          <Link
            href={`/leagues/${league.slug}/activities`}
            className="text-sm text-text-secondary underline hover:text-text-primary"
          >
            Sve aktivnosti
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="search"
            placeholder="Pretraži ime..."
            value={nameSearch}
            onChange={(e) => updateFilter('q', e.target.value)}
            className="w-44"
          />
          <Select value={genderFilter} onChange={(e) => updateFilter('gender', e.target.value)}>
            <option value="">Svi</option>
            <option value="MALE">Muškarci</option>
            <option value="FEMALE">Žene</option>
          </Select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="mt-4 overflow-x-auto">
        {filteredLeaderboard.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-primary p-8 text-center">
            <Text>Nema rezultata. Pridruži se i istrči svoju prvu trku!</Text>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border-primary">
            <thead>
              <tr className="text-left text-sm font-medium text-text-secondary">
                <th className="px-4 py-3">Poz.</th>
                <th className="px-4 py-3">Takmičar</th>
                <th className="px-4 py-3">Pol</th>
                <th className="px-4 py-3 text-right">
                  {league.scoringMode === 'BEST_TIME' ? 'Najbolje vreme' : 'Ukupno km'}
                </th>
                <th className="px-4 py-3 text-right">Trka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {filteredLeaderboard.map((entry) => {
                const medalColor = getMedalColor(entry.position)
                return (
                  <tr key={entry.userId} className="text-sm">
                    <td className="px-4 py-3">
                      {medalColor ? (
                        <Badge color={medalColor} className="font-bold">
                          {entry.position === 1 && <TrophyIcon className="mr-1 size-3" />}
                          {entry.position}
                        </Badge>
                      ) : (
                        <span className="text-text-secondary">{entry.position}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {entry.userName ?? entry.userEmail}
                    </td>
                    <td className="px-4 py-3">
                      {entry.gender ? (
                        <Badge color={entry.gender === 'MALE' ? 'blue' : 'pink'}>
                          {entry.gender === 'MALE' ? 'M' : 'Ž'}
                        </Badge>
                      ) : (
                        <span className="text-text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-brand-green">
                      {league.scoringMode === 'BEST_TIME' && entry.bestTime
                        ? formatTime(entry.bestTime)
                        : formatDistance(entry.totalDistance)}
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary">
                      {entry.activityCount}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Strava attribution — required by Strava API Brand Guidelines */}
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
