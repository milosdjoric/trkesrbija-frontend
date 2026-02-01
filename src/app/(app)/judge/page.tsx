'use client'

import { useAuth } from '@/app/auth/auth-context'
import {
  fetchMyAssignedCheckpoint,
  fetchRecentTimings,
  recordTime,
  type CheckpointWithRace,
  type Timing,
} from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Field, Label } from '@/components/fieldset'
import { Heading, Subheading } from '@/components/heading'
import { Input } from '@/components/input'
import { Text } from '@/components/text'
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('sr-RS', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('sr-RS', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function JudgePage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)

  const [checkpoint, setCheckpoint] = useState<CheckpointWithRace | null>(null)
  const [recentTimings, setRecentTimings] = useState<Timing[]>([])
  const [loading, setLoading] = useState(true)
  const [bibNumber, setBibNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; timing?: Timing } | null>(null)

  const loadData = useCallback(async () => {
    if (!accessToken) return

    try {
      const cp = await fetchMyAssignedCheckpoint(accessToken)
      setCheckpoint(cp)

      if (cp) {
        const timings = await fetchRecentTimings(cp.id, 20, accessToken)
        setRecentTimings(timings)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (accessToken) {
      loadData()
    }
  }, [authLoading, user, accessToken, loadData, router])

  // Auto-refresh recent timings every 10 seconds
  useEffect(() => {
    if (!checkpoint || !accessToken) return

    const interval = setInterval(async () => {
      try {
        const timings = await fetchRecentTimings(checkpoint.id, 20, accessToken)
        setRecentTimings(timings)
      } catch (err) {
        console.error('Failed to refresh timings:', err)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [checkpoint, accessToken])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bibNumber.trim() || submitting) return

    setSubmitting(true)
    setLastResult(null)

    try {
      const timing = await recordTime(bibNumber.trim(), accessToken)
      setLastResult({
        success: true,
        message: `Vreme zabeleženo za #${timing.registration.bibNumber} - ${timing.registration.firstName} ${timing.registration.lastName}`,
        timing,
      })
      setBibNumber('')

      // Refresh timings
      if (checkpoint) {
        const timings = await fetchRecentTimings(checkpoint.id, 20, accessToken)
        setRecentTimings(timings)
      }
    } catch (err: any) {
      setLastResult({
        success: false,
        message: err?.message ?? 'Greška pri zapisivanju vremena',
      })
    } finally {
      setSubmitting(false)
      // Focus back to input
      inputRef.current?.focus()
    }
  }

  // Clear result after 5 seconds
  useEffect(() => {
    if (lastResult) {
      const timeout = setTimeout(() => setLastResult(null), 5000)
      return () => clearTimeout(timeout)
    }
  }, [lastResult])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-zinc-500">Učitavanje...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!checkpoint) {
    return (
      <div className="py-12 text-center">
        <ExclamationTriangleIcon className="mx-auto size-12 text-amber-500" />
        <Heading className="mt-4">Nema dodeljenog checkpoint-a</Heading>
        <Text className="mt-2">
          Niste dodeljeni nijednom checkpoint-u. Kontaktirajte administratora.
        </Text>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
        <div className="flex items-center gap-2">
          <Badge color="emerald" className="text-lg">
            {checkpoint.orderIndex}
          </Badge>
          <Heading>{checkpoint.name}</Heading>
        </div>
        <Text className="mt-1">
          {checkpoint.race.raceName ?? checkpoint.race.raceEvent.eventName} •{' '}
          {formatDate(checkpoint.race.startDateTime)} • {checkpoint.race.length} km
        </Text>
        {checkpoint.distance && (
          <Text className="text-sm text-zinc-500">Distanca od starta: {checkpoint.distance} km</Text>
        )}
      </div>

      {/* Time Recording Form */}
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
        <Subheading>Zabeleži vreme</Subheading>
        <form onSubmit={handleSubmit} className="mt-4">
          <Field>
            <Label>Startni broj</Label>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={bibNumber}
                onChange={(e) => setBibNumber(e.target.value)}
                placeholder="Unesite startni broj..."
                className="flex-1 text-2xl font-mono"
                autoFocus
                disabled={submitting}
              />
              <Button type="submit" disabled={!bibNumber.trim() || submitting} className="px-8">
                <ClockIcon className="size-5" />
                {submitting ? 'Čuvam...' : 'Zabeleži'}
              </Button>
            </div>
          </Field>
        </form>

        {/* Result feedback */}
        {lastResult && (
          <div
            className={`mt-4 rounded-lg p-4 ${
              lastResult.success
                ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircleIcon className="size-5" />
              ) : (
                <ExclamationTriangleIcon className="size-5" />
              )}
              <span className="font-medium">{lastResult.message}</span>
            </div>
            {lastResult.timing && (
              <div className="mt-1 text-sm opacity-75">
                Vreme: {formatTime(lastResult.timing.timestamp)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Timings */}
      <div className="mt-6">
        <Subheading>Poslednja zabeležena vremena</Subheading>
        <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
          {recentTimings.length === 0 ? (
            <div className="p-4 text-center text-zinc-500">
              Još nema zabeleženih vremena na ovom checkpoint-u.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    #
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Učesnik
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Vreme
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {recentTimings.map((timing) => (
                  <tr key={timing.id}>
                    <td className="px-4 py-2 font-mono text-sm font-bold">
                      {timing.registration.bibNumber}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {timing.registration.firstName} {timing.registration.lastName}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm">
                      {formatTime(timing.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
