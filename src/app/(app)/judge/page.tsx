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
import { Heading } from '@/components/heading'
import { LoadingState } from '@/components/loading-state'
import { Text } from '@/components/text'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { formatTime } from '@/lib/formatters'
import {
  deleteTiming,
  getAllTimings,
  getCheckpointCache,
  saveCheckpointCache,
  saveTiming,
  type CachedCheckpoint,
  type LocalTiming,
} from '@/lib/offline/timing-db'
import { initAutoSync, setSyncCallback, syncPendingTimings, cleanupAutoSync } from '@/lib/offline/sync-queue'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  SignalSlashIcon,
} from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

// ── Unified timing type za prikaz ────────────────────────────────────────────
// Kombinuje server timinge i lokalne pending timinge u jednu listu.

type DisplayTiming = {
  id: string
  bibNumber: string
  firstName?: string
  lastName?: string
  timestamp: string
  synced: boolean
  error?: string
  isLocal: boolean
}

function serverTimingToDisplay(t: Timing): DisplayTiming {
  return {
    id: t.id,
    bibNumber: t.registration.bibNumber ?? '',
    firstName: t.registration.firstName,
    lastName: t.registration.lastName,
    timestamp: t.timestamp,
    synced: true,
    isLocal: false,
  }
}

function localTimingToDisplay(t: LocalTiming): DisplayTiming {
  return {
    id: t.localId,
    bibNumber: t.bibNumber,
    timestamp: t.timestamp,
    synced: t.synced === 1,
    error: t.error,
    isLocal: true,
  }
}

// ── Page Component ───────────────────────────────────────────────────────────

export default function JudgePage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { isOnline, pendingCount, refreshPendingCount } = useOnlineStatus()

  const [checkpoint, setCheckpoint] = useState<CheckpointWithRace | CachedCheckpoint | null>(null)
  const [offlineMode, setOfflineMode] = useState(false)
  const [displayTimings, setDisplayTimings] = useState<DisplayTiming[]>([])
  const [loading, setLoading] = useState(true)
  const [bibNumber, setBibNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; timestamp?: string } | null>(null)

  // ── Merge server + local timings ─────────────────────────────────────────

  const refreshDisplayTimings = useCallback(
    async (serverTimings?: Timing[]) => {
      const localTimings = await getAllTimings(50)

      // Lokalne pending i error stavke (synced !== 1)
      const pendingLocal = localTimings.filter((t) => t.synced !== 1).map(localTimingToDisplay)

      // Server timings (ili prazan niz ako offline)
      const serverDisplay = (serverTimings ?? []).map(serverTimingToDisplay)

      // Merge: pending/error lokalni na vrhu, pa svi server timings
      // Sortiraj sve po timestamp DESC
      const merged = [...pendingLocal, ...serverDisplay].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      setDisplayTimings(merged)
      refreshPendingCount()
    },
    [refreshPendingCount]
  )

  // ── Load checkpoint + initial data ───────────────────────────────────────

  const loadData = useCallback(async () => {
    // Ima token — učitaj sa servera i keširaj checkpoint
    if (accessToken) {
      try {
        const cp = await fetchMyAssignedCheckpoint(accessToken)
        setCheckpoint(cp)

        if (cp) {
          // Keširaj checkpoint u IndexedDB za offline upotrebu
          await saveCheckpointCache({
            id: cp.id,
            name: cp.name,
            orderIndex: cp.orderIndex,
            race: {
              id: cp.race.id,
              raceName: cp.race.raceName ?? null,
              raceEvent: { eventName: cp.race.raceEvent.eventName },
            },
          })

          if (navigator.onLine) {
            try {
              const timings = await fetchRecentTimings(cp.id, 20, accessToken)
              await refreshDisplayTimings(timings)
            } catch {
              await refreshDisplayTimings()
            }
          } else {
            await refreshDisplayTimings()
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        await refreshDisplayTimings()
      } finally {
        setLoading(false)
      }
      return
    }

    // Nema tokena — probaj keširani checkpoint iz IndexedDB
    // (navigator.onLine je nepouzdan, pa uvek probamo cache)
    try {
      const cached = await getCheckpointCache()
      if (cached) {
        setCheckpoint(cached)
        setOfflineMode(true)
        await refreshDisplayTimings()
        setLoading(false)
        return
      }
    } catch (err) {
      console.error('Failed to load cached checkpoint:', err)
    }

    // Nema ni tokena ni keša — redirect na login
    router.push('/login')
    setLoading(false)
  }, [accessToken, refreshDisplayTimings, router])

  useEffect(() => {
    if (authLoading) return

    // loadData() sam odlučuje: ako ima token — server flow,
    // ako nema — probaj cache, ako ni to — redirect na login
    loadData()
  }, [authLoading, loadData])

  // ── Init auto-sync ───────────────────────────────────────────────────────

  useEffect(() => {
    initAutoSync(accessToken ?? null)

    setSyncCallback(async () => {
      // Posle synca, refreshuj listu sa servera
      if (checkpoint && accessToken && navigator.onLine) {
        try {
          const timings = await fetchRecentTimings(checkpoint.id, 20, accessToken)
          await refreshDisplayTimings(timings)
        } catch {
          await refreshDisplayTimings()
        }
      } else {
        await refreshDisplayTimings()
      }
    })

    return () => cleanupAutoSync()
  }, [accessToken, checkpoint, refreshDisplayTimings])

  // ── Auto-refresh server timings svaki 10s (samo online) ──────────────────

  useEffect(() => {
    if (!checkpoint || !accessToken || !isOnline) return

    const interval = setInterval(async () => {
      try {
        const timings = await fetchRecentTimings(checkpoint.id, 20, accessToken)
        await refreshDisplayTimings(timings)
      } catch {
        // Silent fail
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [checkpoint, accessToken, isOnline, refreshDisplayTimings])

  // ── Submit handler (offline-first) ───────────────────────────────────────

  async function handleSubmit() {
    if (!bibNumber.trim() || submitting || !checkpoint) return

    setSubmitting(true)
    setLastResult(null)

    const localId = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const bib = bibNumber.trim()

    // 1. Sačuvaj u IndexedDB odmah
    const localTiming: LocalTiming = {
      localId,
      bibNumber: bib,
      timestamp,
      checkpointId: checkpoint.id,
      raceId: checkpoint.race.id,
      synced: 0,
    }

    try {
      await saveTiming(localTiming)
    } catch (err) {
      console.error('Failed to save to IndexedDB:', err)
    }

    // 2. Optimistic UI update
    setBibNumber('')
    await refreshDisplayTimings()

    // 3. Pokušaj da pošalješ na server
    if (navigator.onLine && accessToken) {
      try {
        const serverTiming = await recordTime(bib, accessToken, timestamp)

        // Importuj markAsSynced dinamički da ne blokira initial load
        const { markAsSynced } = await import('@/lib/offline/timing-db')
        await markAsSynced(localId, serverTiming.id)

        setLastResult({
          success: true,
          message: `#${serverTiming.registration.bibNumber} — ${serverTiming.registration.firstName} ${serverTiming.registration.lastName}`,
          timestamp,
        })

        // Refresh sa server podacima
        const timings = await fetchRecentTimings(checkpoint.id, 20, accessToken)
        await refreshDisplayTimings(timings)
      } catch (err: any) {
        const message = err?.message ?? 'Greška pri slanju na server'
        // Permanentne greške (not found) ne pokušavaj ponovo
        if (message.includes('nije pronađen') || message.includes('not found')) {
          const { markAsPermanentError } = await import('@/lib/offline/timing-db')
          await markAsPermanentError(localId, message)
        } else {
          const { markAsError } = await import('@/lib/offline/timing-db')
          await markAsError(localId, message)
        }

        setLastResult({
          success: false,
          message: `Sačuvano lokalno. Server: ${message}`,
          timestamp,
        })
        await refreshDisplayTimings()
      }
    } else {
      // Offline — sačuvano lokalno, sync later
      setLastResult({
        success: true,
        message: `#${bib} sačuvano lokalno (offline)`,
        timestamp,
      })
    }

    setSubmitting(false)
  }

  // ── Delete error timing ──────────────────────────────────────────────────

  async function handleDeleteTiming(id: string) {
    await deleteTiming(id)
    await refreshDisplayTimings()
  }

  // ── Manual sync ──────────────────────────────────────────────────────────

  async function handleManualSync() {
    if (syncing || !isOnline || !accessToken) return
    setSyncing(true)
    try {
      await syncPendingTimings(accessToken)
    } finally {
      setSyncing(false)
    }
  }

  // ── Clear result after 5s ────────────────────────────────────────────────

  useEffect(() => {
    if (lastResult) {
      const timeout = setTimeout(() => setLastResult(null), 5000)
      return () => clearTimeout(timeout)
    }
  }, [lastResult])

  // ── Render ─────────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return <LoadingState className="min-h-[50vh]" />
  }

  if (!user && !offlineMode) {
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
      {/* Online/Offline Status Bar */}
      <div
        className={`mb-2 flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium ${
          isOnline
            ? pendingCount > 0
              ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200'
              : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'
            : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'
        }`}
      >
        <div className="flex items-center gap-1.5">
          {isOnline ? <SignalIcon className="size-3" /> : <SignalSlashIcon className="size-3" />}
          <span>
            {isOnline
              ? pendingCount > 0
                ? `Online — ${pendingCount} čeka sync`
                : 'Online'
              : `Offline${pendingCount > 0 ? ` — ${pendingCount} čeka sync` : ''}`}
          </span>
        </div>
        {isOnline && pendingCount > 0 && (
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-1 rounded bg-white/50 px-2 py-0.5 text-[11px] font-semibold transition-colors hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/20"
          >
            <ArrowPathIcon className={`size-3 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        )}
      </div>

      {/* Offline Mode Banner */}
      {offlineMode && (
        <div className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <span className="font-semibold">Offline režim</span> — koristite keširane podatke. Timings se čuvaju lokalno i sinhronizuju kad se vrati signal.
        </div>
      )}

      {/* Checkpoint Header */}
      <div className="mb-5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 shadow-md dark:from-emerald-600 dark:to-emerald-700">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/20 text-lg font-bold text-white">
            {checkpoint.orderIndex}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold text-text-primary">
              {checkpoint.name}
            </div>
            <div className="truncate text-xs text-emerald-100">
              {checkpoint.race.raceName ?? checkpoint.race.raceEvent.eventName}
            </div>
          </div>
        </div>
      </div>

      {/* Bib Number Display */}
      <div className="mb-3">
        <div className="flex h-20 items-center justify-center rounded-2xl border-2 border-emerald-200 bg-white font-mono text-5xl font-bold tracking-[0.2em] text-zinc-900 dark:border-emerald-800 dark:bg-zinc-900 dark:text-white">
          {bibNumber || <span className="text-zinc-300 dark:text-zinc-600">000</span>}
        </div>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setBibNumber((prev) => prev + n)}
            disabled={submitting}
            className="flex h-14 items-center justify-center rounded-xl bg-zinc-100 text-2xl font-semibold text-zinc-900 transition-colors active:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-100 dark:active:bg-zinc-700"
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setBibNumber((prev) => prev.slice(0, -1))}
          disabled={submitting || !bibNumber}
          className="flex h-14 items-center justify-center rounded-xl bg-zinc-200 text-xl font-semibold text-zinc-600 transition-colors active:bg-zinc-300 disabled:opacity-30 dark:bg-zinc-700 dark:text-zinc-400 dark:active:bg-zinc-600"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={() => setBibNumber((prev) => prev + '0')}
          disabled={submitting}
          className="flex h-14 items-center justify-center rounded-xl bg-zinc-100 text-2xl font-semibold text-zinc-900 transition-colors active:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-100 dark:active:bg-zinc-700"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!bibNumber.trim() || submitting}
          className="flex h-14 items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-white transition-colors active:bg-emerald-600 disabled:opacity-30 dark:bg-emerald-600 dark:active:bg-emerald-700"
        >
          {submitting ? '...' : '✓'}
        </button>
      </div>

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
              {lastResult.timestamp && (
                <div className="mt-1 font-mono text-3xl font-bold tracking-tight">
                  {formatTime(lastResult.timestamp, true)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timings List */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
            Poslednja vremena
          </h2>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge color="amber">{pendingCount} pending</Badge>
            )}
            <Badge color="zinc">{displayTimings.length} unosa</Badge>
          </div>
        </div>

        {displayTimings.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-10 text-center dark:border-zinc-700">
            <ClockIcon className="mx-auto size-10 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-2 text-sm text-zinc-400">Nema zabeleženih vremena</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayTimings.map((timing, index) => (
              <div
                key={timing.id}
                className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                  index === 0 && timing.synced
                    ? 'border-2 border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                    : !timing.synced && timing.error
                      ? 'border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                      : !timing.synced
                        ? 'border-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                        : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-14 rounded-lg bg-white px-2 py-1 text-center font-mono text-xl font-bold text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
                    {timing.bibNumber}
                  </span>
                  <div className="min-w-0">
                    {timing.firstName && timing.lastName ? (
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {timing.firstName} {timing.lastName}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {timing.error ? 'Greška' : 'Čeka sync...'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                    {formatTime(timing.timestamp, true)}
                  </span>
                  {!timing.synced && !timing.error && (
                    <span className="text-xs text-amber-500">⏳</span>
                  )}
                  {timing.error && timing.isLocal && (
                    <button
                      onClick={() => handleDeleteTiming(timing.id)}
                      className="flex size-6 items-center justify-center rounded-full bg-red-100 text-red-500 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                      title="Obriši"
                    >
                      <span className="text-sm font-bold leading-none">✕</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
