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
import { EmptyState } from '@/components/empty-state'
import { Heading } from '@/components/heading'
import { LoadingState } from '@/components/loading-state'
import { Text } from '@/components/text'
import { formatTime } from '@/lib/formatters'
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function JudgePage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)

  const [checkpoint, setCheckpoint] = useState<CheckpointWithRace | null>(null)
  const [recentTimings, setRecentTimings] = useState<Timing[]>([])
  const [loading, setLoading] = useState(true)
  const [bibNumber, setBibNumber] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
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
    return <LoadingState className="min-h-[50vh]" />
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
    <div className="mx-auto max-w-lg pb-8">
      {/* Checkpoint Header */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 shadow-lg dark:from-emerald-600 dark:to-emerald-700">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 text-2xl font-bold text-white">
            {checkpoint.orderIndex}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold text-white">
              {checkpoint.name}
            </div>
            <div className="truncate text-sm text-emerald-100">
              {checkpoint.race.raceName ?? checkpoint.race.raceEvent.eventName}
            </div>
          </div>
        </div>
      </div>

      {/* Main Input Area */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-3 block text-base font-medium text-zinc-700 dark:text-zinc-300">
            Startni broj
          </label>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={bibNumber}
            onChange={(e) => setBibNumber(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={inputFocused ? '' : '000'}
            className="w-full rounded-2xl border-2 border-emerald-200 bg-white px-6 py-8 text-center font-mono text-6xl font-bold tracking-[0.2em] text-zinc-900 placeholder:text-zinc-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 dark:border-emerald-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-emerald-400"
            autoFocus
            autoComplete="off"
            disabled={submitting}
          />
        </div>

        <Button
          type="submit"
          disabled={!bibNumber.trim() || submitting}
          outline
          className="!h-16 w-full !rounded-2xl !border-2 !border-emerald-500 !text-lg !font-semibold !text-emerald-600 hover:!bg-emerald-50 dark:!border-emerald-400 dark:!text-emerald-400 dark:hover:!bg-emerald-950/30"
        >
          {submitting ? 'Čuvam...' : 'Zabeleži vreme'}
        </Button>
      </form>

      {/* Result feedback */}
      {lastResult && (
        <div
          className={`mt-5 rounded-2xl p-5 shadow-md ${
            lastResult.success
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-100'
              : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-900 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-100'
          }`}
        >
          <div className="flex items-center gap-4">
            {lastResult.success ? (
              <div className="flex size-12 items-center justify-center rounded-full bg-green-500 text-white">
                <CheckCircleIcon className="size-7" />
              </div>
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-red-500 text-white">
                <ExclamationTriangleIcon className="size-7" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold">{lastResult.success ? 'Uspešno!' : 'Greška'}</div>
              <div className="truncate text-sm opacity-80">{lastResult.message}</div>
              {lastResult.timing && (
                <div className="mt-1 font-mono text-3xl font-bold tracking-tight">
                  {formatTime(lastResult.timing.timestamp, true)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Timings */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
            Poslednja vremena
          </h2>
          <Badge color="zinc">{recentTimings.length} unosa</Badge>
        </div>

        {recentTimings.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-10 text-center dark:border-zinc-700">
            <ClockIcon className="mx-auto size-10 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-2 text-sm text-zinc-400">Nema zabeleženih vremena</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTimings.map((timing, index) => (
              <div
                key={timing.id}
                className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                  index === 0
                    ? 'border-2 border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                    : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-14 rounded-lg bg-white px-2 py-1 text-center font-mono text-xl font-bold text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
                    {timing.registration.bibNumber}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {timing.registration.firstName} {timing.registration.lastName}
                  </span>
                </div>
                <span className="font-mono text-base font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                  {formatTime(timing.timestamp, true)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
