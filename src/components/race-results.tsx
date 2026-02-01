'use client'

import { useState, useEffect } from 'react'
import { fetchRaceResults, fetchCheckpoints, type RaceResult, type Checkpoint, type Gender } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Select } from '@/components/select'
import { Subheading } from '@/components/heading'
import { Text } from '@/components/text'

type Props = {
  raceId: string
  raceName?: string | null
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('sr-RS', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function RaceResults({ raceId, raceName }: Props) {
  const [results, setResults] = useState<RaceResult[]>([])
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [genderFilter, setGenderFilter] = useState<Gender | ''>('')

  useEffect(() => {
    async function loadData() {
      try {
        const [resultsData, checkpointsData] = await Promise.all([
          fetchRaceResults(raceId, genderFilter || undefined),
          fetchCheckpoints(raceId),
        ])
        setResults(resultsData)
        setCheckpoints(checkpointsData)
      } catch (err) {
        console.error('Failed to load results:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [raceId, genderFilter])

  // Don't render if no checkpoints configured
  if (!loading && checkpoints.length === 0) {
    return null
  }

  // Don't render if no results yet
  if (!loading && results.length === 0) {
    return null
  }

  if (loading) {
    return (
      <div className="mt-8">
        <Subheading>Rezultati{raceName && ` - ${raceName}`}</Subheading>
        <div className="mt-4 animate-pulse text-zinc-500">Učitavanje rezultata...</div>
      </div>
    )
  }

  // Count finished participants
  const finishedCount = results.filter((r) => r.totalTime != null).length
  const totalCount = results.length

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Subheading>Rezultati{raceName && ` - ${raceName}`}</Subheading>
        <div className="flex items-center gap-4">
          <Text className="text-sm text-zinc-500">
            {finishedCount} od {totalCount} završilo
          </Text>
          <Select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as Gender | '')}
            className="w-32"
          >
            <option value="">Svi</option>
            <option value="MALE">Muškarci</option>
            <option value="FEMALE">Žene</option>
          </Select>
        </div>
      </div>

      {/* Results table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead>
            <tr className="text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Broj</th>
              <th className="px-3 py-2">Učesnik</th>
              <th className="px-3 py-2">Pol</th>
              {checkpoints.map((cp) => (
                <th key={cp.id} className="px-3 py-2 text-center">
                  {cp.name}
                </th>
              ))}
              <th className="px-3 py-2 text-right">Vreme</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {results.map((result, index) => {
              const position = result.totalTime != null ? index + 1 : '-'

              return (
                <tr key={result.registration.id} className="text-sm">
                  <td className="whitespace-nowrap px-3 py-2 font-medium">{position}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono">
                    {result.registration.bibNumber ?? '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {result.registration.firstName} {result.registration.lastName}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <Badge color={result.registration.gender === 'MALE' ? 'sky' : 'pink'}>
                      {result.registration.gender === 'MALE' ? 'M' : 'Ž'}
                    </Badge>
                  </td>
                  {checkpoints.map((cp) => {
                    const cpTime = result.checkpointTimes.find((ct) => ct.checkpointId === cp.id)
                    return (
                      <td key={cp.id} className="whitespace-nowrap px-3 py-2 text-center font-mono text-zinc-600 dark:text-zinc-400">
                        {cpTime ? formatTime(cpTime.timestamp) : '-'}
                      </td>
                    )
                  })}
                  <td className="whitespace-nowrap px-3 py-2 text-right font-mono font-medium">
                    {result.totalTime != null ? formatDuration(result.totalTime) : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
