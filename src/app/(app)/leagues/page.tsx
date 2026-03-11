'use client'

import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Heading } from '@/components/heading'
import { Text } from '@/components/text'
import { CalendarIcon, UserGroupIcon } from '@heroicons/react/16/solid'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type League = {
  id: string
  name: string
  slug: string
  description: string | null
  type: string
  status: string
  period: string
  minDistance: number | null
  maxDistance: number | null
  startDate: string
  endDate: string
  memberCount: number
  isMember: boolean
}

const LEAGUES_QUERY = `
  query Leagues($status: LeagueStatus, $limit: Int) {
    leagues(status: $status, limit: $limit) {
      id
      name
      slug
      description
      type
      status
      period
      minDistance
      maxDistance
      startDate
      endDate
      memberCount
      isMember
    }
  }
`

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  return d.toLocaleDateString('sr-Latn-RS', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Belgrade',
  })
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return <Badge color="green">Aktivna</Badge>
    case 'COMPLETED':
      return <Badge color="zinc">Završena</Badge>
    case 'DRAFT':
      return <Badge color="yellow">Nacrt</Badge>
    default:
      return <Badge color="zinc">{status}</Badge>
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

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)

  const loadLeagues = useCallback(async () => {
    try {
      const data = await gql<{ leagues: League[] }>(LEAGUES_QUERY, { limit: 50 })
      setLeagues(data.leagues)
    } catch (err) {
      console.error('Failed to load leagues:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLeagues()
  }, [loadLeagues])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-text-secondary">Učitavanje...</div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <Heading>Lige</Heading>
          <Text className="mt-1">Virtuelna takmičenja — trči samostalno, takmič se na leaderboard-u</Text>
        </div>
      </div>

      {leagues.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border-primary p-8 text-center">
          <UserGroupIcon className="mx-auto size-8 text-text-secondary" />
          <Text className="mt-2">Nema dostupnih liga.</Text>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.slug}`}
              className="group rounded-xl border border-border-primary bg-card p-5 transition-colors hover:border-brand-green/40"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-text-primary group-hover:text-brand-green">{league.name}</h3>
                {getStatusBadge(league.status)}
              </div>

              {league.description && (
                <Text className="mt-2 line-clamp-2 text-sm">{league.description}</Text>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-3.5" />
                  {formatDate(league.startDate)} — {formatDate(league.endDate)}
                </span>
                <span className="flex items-center gap-1">
                  <UserGroupIcon className="size-3.5" />
                  {league.memberCount} članova
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Badge color="blue">{getDistanceLabel(league.minDistance, league.maxDistance)}</Badge>
                {league.isMember && <Badge color="green">Član</Badge>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Strava attribution — required by Strava API Brand Guidelines */}
      <div className="mt-8 flex justify-end">
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
