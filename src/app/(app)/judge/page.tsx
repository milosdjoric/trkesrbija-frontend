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
import { Heading } from '@/components/heading'
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
        message: `#${timing.registration.bibNumber} - ${timing.registration.firstName} ${timing.registration.lastName}`,
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
        message: err?.message ?? 'Greska pri zapisivanju vremena',
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse text-xl text-zinc-500">Ucitavanje...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!checkpoint) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <ExclamationTriangleIcon className="size-16 text-amber-500" />
        <Heading className="mt-4">Nema dodeljenog checkpoint-a</Heading>
        <Text className="mt-2 max-w-sm">
          Niste dodeljeni nijednom checkpoint-u. Kontaktirajte administratora da vas dodeli.
        </Text>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-8">
      {/* Checkpoint Header - compact */}
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
        <Badge color="emerald" className="px-3 py-1 text-xl font-bold">
          {checkpoint.orderIndex}
        </Badge>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-bold text-emerald-900 dark:text-emerald-100">
            {checkpoint.name}
          </div>
          <div className="truncate text-sm text-emerald-700 dark:text-emerald-300">
            {checkpoint.race.raceName ?? checkpoint.race.raceEvent.eventName}
          </div>
        </div>
      </div>

      {/* Main Input Area - LARGE for mobile */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Startni broj
          </label>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={bibNumber}
            onChange={(e) => setBibNumber(e.target.value)}
            placeholder="000"
            className="w-full rounded-2xl border-2 border-zinc-300 bg-white px-6 py-6 text-center font-mono text-5xl font-bold tracking-wider text-zinc-900 placeholder:text-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-emerald-400"
            autoFocus
            autoComplete="off"
            disabled={submitting}
          />
        </div>

        <Button
          type="submit"
          disabled={!bibNumber.trim() || submitting}
          className="h-16 w-full rounded-2xl text-xl font-bold"
          color="emerald"
        >
          <ClockIcon className="size-7" />
          {submitting ? 'Cuvam...' : 'ZABELEZI VREME'}
        </Button>
      </form>

      {/* Result feedback - prominent */}
      {lastResult && (
        <div
          className={`mt-4 rounded-2xl p-5 ${
            lastResult.success
              ? 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100'
              : 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100'
          }`}
        >
          <div className="flex items-center gap-3">
            {lastResult.success ? (
              <CheckCircleIcon className="size-8 shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="size-8 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold">{lastResult.success ? 'Uspesno!' : 'Greska'}</div>
              <div className="truncate text-sm">{lastResult.message}</div>
              {lastResult.timing && (
                <div className="mt-1 font-mono text-2xl font-bold">
                  {formatTime(lastResult.timing.timestamp)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Timings - scrollable list */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            Poslednja vremena
          </h2>
          <span className="text-xs text-zinc-400">{recentTimings.length} unosa</span>
        </div>

        {recentTimings.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-zinc-200 p-8 text-center text-zinc-400 dark:border-zinc-700">
            Nema zabelezenih vremena
          </div>
        ) : (
          <div className="space-y-2">
            {recentTimings.map((timing, index) => (
              <div
                key={timing.id}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                  index === 0
                    ? 'bg-emerald-50 dark:bg-emerald-900/20'
                    : 'bg-zinc-50 dark:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-12 font-mono text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {timing.registration.bibNumber}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {timing.registration.firstName} {timing.registration.lastName}
                  </span>
                </div>
                <span className="font-mono text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                  {formatTime(timing.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
