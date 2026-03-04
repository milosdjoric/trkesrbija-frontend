'use client'

import {
  fetchCheckpoints,
  fetchRaceResults,
  gql,
  type Checkpoint,
  type Gender,
  type RaceResult,
} from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Heading } from '@/components/heading'
import { Select } from '@/components/select'
import { Text } from '@/components/text'
import { ChevronLeftIcon, TrophyIcon } from '@heroicons/react/16/solid'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type RaceInfo = {
  id: string
  slug: string
  raceName: string | null
  length: number
  startDateTime: string
  raceEvent: {
    id: string
    eventName: string
    slug: string
  }
}

const RACE_BY_SLUG_QUERY = `
  query RaceBySlug($slug: String!) {
    race(slug: $slug) {
      id
      slug
      raceName
      length
      startDateTime
      raceEvent {
        id
        eventName
        slug
      }
    }
  }
`

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  const day = parseInt(d.toLocaleDateString('sr-Latn-RS', { day: 'numeric', timeZone: 'Europe/Belgrade' }))
  const month = d.toLocaleDateString('sr-Latn-RS', { month: 'short', timeZone: 'Europe/Belgrade' }).replace('.', '')
  const year = parseInt(d.toLocaleDateString('sr-Latn-RS', { year: 'numeric', timeZone: 'Europe/Belgrade' }))
  return `${day}. ${month} ${year}.`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('sr-Latn-RS', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Europe/Belgrade',
  })
}

function formatDuration(ms: number | null | undefined) {
  if (ms == null) return '-'

  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function getMedalColor(position: number): 'yellow' | 'zinc' | 'amber' | null {
  switch (position) {
    case 1:
      return 'yellow' // Gold
    case 2:
      return 'zinc' // Silver
    case 3:
      return 'amber' // Bronze
    default:
      return null
  }
}

export default function RaceResultsPage() {
  const params = useParams()
  const slug = params.slug as string

  const [race, setRace] = useState<RaceInfo | null>(null)
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [results, setResults] = useState<RaceResult[]>([])
  const [loading, setLoading] = useState(true)
  const [genderFilter, setGenderFilter] = useState<Gender | ''>('')

  const loadData = useCallback(async () => {
    try {
      // Load race info by slug
      const raceData = await gql<{
        race: RaceInfo | null
      }>(RACE_BY_SLUG_QUERY, { slug })

      if (raceData.race) {
        setRace(raceData.race)

        // Load checkpoints using race ID
        const cps = await fetchCheckpoints(raceData.race.id)
        setCheckpoints(cps.sort((a, b) => a.orderIndex - b.orderIndex))

        // Load results using race ID
        const raceResults = await fetchRaceResults(raceData.race.id, genderFilter || undefined)
        setResults(raceResults)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [slug, genderFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-text-secondary">Učitavanje...</div>
      </div>
    )
  }

  if (!race) {
    return (
      <div className="py-12 text-center">
        <Heading>Trka nije pronađena</Heading>
      </div>
    )
  }

  // Count finishers
  const finishers = results.filter((r) => r.totalTime != null).length

  return (
    <>
      <div className="max-lg:hidden">
        <Link
          href={`/events/${race.raceEvent.slug}`}
          className="inline-flex items-center gap-2 text-sm/6 text-text-secondary hover:text-text-primary"
        >
          <ChevronLeftIcon className="size-4 fill-gray-400" />
          {race.raceEvent.eventName}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading>Rezultati</Heading>
          <Text className="mt-1">
            {race.raceName ?? race.raceEvent.eventName} • {formatDate(race.startDateTime)} • {race.length} km
          </Text>
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as Gender | '')}
          >
            <option value="">Svi učesnici</option>
            <option value="MALE">Muškarci</option>
            <option value="FEMALE">Žene</option>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border-primary bg-card p-4">
          <div className="text-2xl font-semibold">{results.length}</div>
          <div className="text-sm text-text-secondary">Učesnika</div>
        </div>
        <div className="rounded-lg border border-border-primary bg-card p-4">
          <div className="text-2xl font-semibold text-green-600">{finishers}</div>
          <div className="text-sm text-text-secondary">Završilo</div>
        </div>
        <div className="rounded-lg border border-border-primary bg-card p-4">
          <div className="text-2xl font-semibold">{checkpoints.length}</div>
          <div className="text-sm text-text-secondary">Checkpoint-a</div>
        </div>
        <div className="rounded-lg border border-border-primary bg-card p-4">
          <div className="text-2xl font-semibold text-amber-600">
            {results.length - finishers}
          </div>
          <div className="text-sm text-text-secondary">Nije završilo</div>
        </div>
      </div>

      {/* Results Table */}
      <div className="mt-6 overflow-x-auto">
        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-primary p-8 text-center">
            <Text>Nema rezultata za prikaz.</Text>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border-primary">
            <thead>
              <tr className="text-left text-sm font-medium text-text-secondary">
                <th className="px-4 py-3">Poz.</th>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Učesnik</th>
                <th className="px-4 py-3">Pol</th>
                {checkpoints.map((cp) => (
                  <th key={cp.id} className="px-4 py-3 text-center">
                    {cp.name}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Ukupno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {results.map((result, index) => {
                const position = result.totalTime != null ? index + 1 : null
                const medalColor = position ? getMedalColor(position) : null

                return (
                  <tr key={result.registration.id} className="text-sm">
                    <td className="px-4 py-3">
                      {position ? (
                        medalColor ? (
                          <Badge color={medalColor} className="font-bold">
                            {position === 1 && <TrophyIcon className="mr-1 size-3" />}
                            {position}
                          </Badge>
                        ) : (
                          <span className="text-text-secondary">{position}</span>
                        )
                      ) : (
                        <span className="text-text-secondary">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      {result.registration.bibNumber || '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {result.registration.firstName} {result.registration.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={result.registration.gender === 'MALE' ? 'blue' : 'pink'}>
                        {result.registration.gender === 'MALE' ? 'M' : 'Ž'}
                      </Badge>
                    </td>
                    {checkpoints.map((cp) => {
                      const cpTime = result.checkpointTimes.find((ct) => ct.checkpointId === cp.id)
                      return (
                        <td key={cp.id} className="px-4 py-3 text-center font-mono text-xs">
                          {cpTime ? formatTime(cpTime.timestamp) : '-'}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {result.totalTime != null ? (
                        <span className="text-brand-green">
                          {formatDuration(result.totalTime)}
                        </span>
                      ) : (
                        <span className="text-text-secondary">DNF</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
