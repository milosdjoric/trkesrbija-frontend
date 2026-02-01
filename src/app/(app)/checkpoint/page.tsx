'use client'

import { useAuth } from '@/app/auth/auth-context'
import { Button } from '@/components/button'
import { Field, Label } from '@/components/fieldset'
import { Heading, Subheading } from '@/components/heading'
import { Input } from '@/components/input'
import { Text } from '@/components/text'
import { fetchMyAssignedCheckpoint, fetchRecentTimings, recordTime, type CheckpointWithRace, type Timing } from '@/app/lib/api'
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
    month: 'long',
    year: 'numeric',
  })
}

export default function CheckpointPage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()

  const [checkpoint, setCheckpoint] = useState<CheckpointWithRace | null>(null)
  const [recentTimings, setRecentTimings] = useState<Timing[]>([])
  const [loading, setLoading] = useState(true)
  const [bibNumber, setBibNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // Load checkpoint and recent timings
  const loadData = useCallback(async () => {
    if (!accessToken) return

    try {
      const cp = await fetchMyAssignedCheckpoint(accessToken)
      setCheckpoint(cp)

      if (cp) {
        const timings = await fetchRecentTimings(cp.id, 15, accessToken)
        setRecentTimings(timings)
      }
    } catch (err) {
      console.error('Failed to load checkpoint:', err)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/checkpoint')
      return
    }

    if (accessToken) {
      loadData()
    }
  }, [authLoading, user, accessToken, router, loadData])

  // Auto-focus input after loading
  useEffect(() => {
    if (!loading && checkpoint && inputRef.current) {
      inputRef.current.focus()
    }
  }, [loading, checkpoint])

  // Refresh timings every 10 seconds
  useEffect(() => {
    if (!checkpoint || !accessToken) return

    const interval = setInterval(async () => {
      try {
        const timings = await fetchRecentTimings(checkpoint.id, 15, accessToken)
        setRecentTimings(timings)
      } catch (err) {
        console.error('Failed to refresh timings:', err)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [checkpoint, accessToken])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmedBib = bibNumber.trim()
    if (!trimmedBib) {
      setError('Unesite startni broj')
      return
    }

    setSubmitting(true)

    try {
      const timing = await recordTime(trimmedBib, accessToken)
      setSuccess(`${timing.registration.firstName} ${timing.registration.lastName} (${trimmedBib}) - ${formatTime(timing.timestamp)}`)
      setBibNumber('')

      // Refresh timings
      if (checkpoint) {
        const timings = await fetchRecentTimings(checkpoint.id, 15, accessToken)
        setRecentTimings(timings)
      }

      // Re-focus input
      inputRef.current?.focus()
    } catch (err: any) {
      setError(err?.message ?? 'Greška prilikom beleženja vremena')
      inputRef.current?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse text-zinc-500">Učitavanje...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!checkpoint) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <Heading>Nema dodeljenog checkpointa</Heading>
        <Text className="mt-4">
          Nemate dodeljen checkpoint za beleženje vremena. Kontaktirajte administratora da vam dodeli checkpoint.
        </Text>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Checkpoint Info */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <Heading>{checkpoint.name}</Heading>
        <Text className="mt-1">
          {checkpoint.race.raceEvent.eventName}
          {checkpoint.race.raceName && ` - ${checkpoint.race.raceName}`}
        </Text>
        <Text className="text-sm text-zinc-500">{formatDate(checkpoint.race.startDateTime)}</Text>
      </div>

      {/* Time Entry Form */}
      <form onSubmit={handleSubmit} className="mt-8">
        <Field>
          <Label className="text-lg">Startni broj</Label>
          <Input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={bibNumber}
            onChange={(e) => setBibNumber(e.target.value)}
            placeholder="Unesite broj..."
            disabled={submitting}
            className="mt-2 text-center text-3xl font-bold"
            autoComplete="off"
          />
        </Field>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-center text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            {success}
          </div>
        )}

        <Button type="submit" className="mt-4 w-full py-4 text-lg" disabled={submitting}>
          {submitting ? 'Beleženje...' : 'Zabeleži vreme'}
        </Button>
      </form>

      {/* Recent Timings */}
      {recentTimings.length > 0 && (
        <div className="mt-8">
          <Subheading>Poslednja zabeležena vremena</Subheading>
          <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
            {recentTimings.map((timing) => (
              <div key={timing.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="font-mono font-bold">{timing.registration.bibNumber}</span>
                  <span className="ml-2 text-zinc-600 dark:text-zinc-400">
                    {timing.registration.firstName} {timing.registration.lastName}
                  </span>
                </div>
                <div className="font-mono text-zinc-500">{formatTime(timing.timestamp)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
