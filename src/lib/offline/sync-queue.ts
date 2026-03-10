import { recordTime } from '@/app/lib/api'
import { getPendingTimings, markAsError, markAsPermanentError, markAsSynced } from './timing-db'

// ── Sync Queue ───────────────────────────────────────────────────────────────
// Sekvencijalno šalje pending timinge na server kad je online.
// Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s.
// Max 5 pokušaja po timingu pre nego što se označi kao error.

const MAX_RETRIES = 5
const BASE_DELAY = 1000
const MAX_DELAY = 30000

let syncing = false
let retryTimeout: ReturnType<typeof setTimeout> | null = null

type SyncCallback = () => void
let onSyncComplete: SyncCallback | null = null

export function setSyncCallback(cb: SyncCallback | null) {
  onSyncComplete = cb
}

export async function syncPendingTimings(accessToken: string | null): Promise<{ synced: number; failed: number }> {
  if (syncing || !navigator.onLine || !accessToken) {
    return { synced: 0, failed: 0 }
  }

  syncing = true
  let syncedCount = 0
  let failedCount = 0

  try {
    const pending = await getPendingTimings()

    for (const timing of pending) {
      if (!navigator.onLine) break // Prestani ako smo izgubili konekciju

      try {
        const serverTiming = await recordTime(timing.bibNumber, accessToken, timing.timestamp)
        await markAsSynced(timing.localId, serverTiming.id)
        syncedCount++
      } catch (err: any) {
        const message = err?.message ?? 'Unknown error'

        // Duplikat — već postoji na serveru, smatraj uspehom
        if (message.includes('već zabeleženo') || message.includes('already recorded')) {
          await markAsSynced(timing.localId, 'duplicate')
          syncedCount++
          continue
        }

        // Participant not found — trajni error, ne pokušavaj ponovo
        if (message.includes('nije pronađen') || message.includes('not found')) {
          await markAsPermanentError(timing.localId, message)
          failedCount++
          continue
        }

        // Ostale greške — retry sa backoff-om
        const retryCount = (timing.error?.match(/retry:(\d+)/)?.[1] ?? '0')
        const currentRetry = parseInt(retryCount, 10)

        if (currentRetry >= MAX_RETRIES) {
          await markAsPermanentError(timing.localId, message)
          failedCount++
        } else {
          await markAsError(timing.localId, `${message} [retry:${currentRetry + 1}]`)
          failedCount++
          // Pokreni retry sa backoff-om
          const delay = Math.min(BASE_DELAY * Math.pow(2, currentRetry), MAX_DELAY)
          scheduleRetry(accessToken, delay)
          break // Izadji iz loopa, retry ce pokusati ponovo
        }
      }
    }
  } finally {
    syncing = false
    if (syncedCount > 0) {
      onSyncComplete?.()
    }
  }

  return { synced: syncedCount, failed: failedCount }
}

function scheduleRetry(accessToken: string | null, delay: number) {
  if (retryTimeout) clearTimeout(retryTimeout)
  retryTimeout = setTimeout(() => {
    retryTimeout = null
    syncPendingTimings(accessToken)
  }, delay)
}

// ── Auto-sync na online event ────────────────────────────────────────────────

let initialized = false
let storedAccessToken: string | null = null

export function initAutoSync(accessToken: string | null) {
  storedAccessToken = accessToken

  if (initialized) return
  initialized = true

  window.addEventListener('online', () => {
    syncPendingTimings(storedAccessToken)
  })

  // Pokušaj sync odmah ako smo online
  if (navigator.onLine) {
    syncPendingTimings(storedAccessToken)
  }
}

export function cleanupAutoSync() {
  if (retryTimeout) {
    clearTimeout(retryTimeout)
    retryTimeout = null
  }
  initialized = false
  storedAccessToken = null
  onSyncComplete = null
}
