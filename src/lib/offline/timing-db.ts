import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

// ── Types ────────────────────────────────────────────────────────────────────

export interface LocalTiming {
  localId: string
  bibNumber: string
  timestamp: string // ISO string
  checkpointId: string
  raceId: string
  synced: number // 0 = pending, 1 = synced, 2 = permanent error (number za IndexedDB kompatibilnost)
  syncedAt?: string
  serverId?: string
  error?: string
}

export interface CachedCheckpoint {
  id: string
  name: string
  orderIndex: number
  race: {
    id: string
    raceName: string | null
    raceEvent: { eventName: string }
  }
}

interface TimingDB extends DBSchema {
  timings: {
    key: string
    value: LocalTiming
    indexes: {
      'by-synced': number
      'by-timestamp': string
    }
  }
  checkpointCache: {
    key: string
    value: CachedCheckpoint & { cachedAt: string }
  }
}

// ── Database ─────────────────────────────────────────────────────────────────

const DB_NAME = 'judge-timings'
const DB_VERSION = 2

let dbPromise: Promise<IDBPDatabase<TimingDB>> | null = null

function getDB(): Promise<IDBPDatabase<TimingDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TimingDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('timings', { keyPath: 'localId' })
          store.createIndex('by-synced', 'synced')
          store.createIndex('by-timestamp', 'timestamp')
        }
        if (oldVersion < 2) {
          db.createObjectStore('checkpointCache', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

// ── CRUD Functions ───────────────────────────────────────────────────────────

export async function saveTiming(timing: LocalTiming): Promise<void> {
  const db = await getDB()
  await db.put('timings', timing)
}

export async function getPendingTimings(): Promise<LocalTiming[]> {
  const db = await getDB()
  return db.getAllFromIndex('timings', 'by-synced', 0)
}

export async function markAsSynced(localId: string, serverId: string): Promise<void> {
  const db = await getDB()
  const timing = await db.get('timings', localId)
  if (timing) {
    timing.synced = 1
    timing.syncedAt = new Date().toISOString()
    timing.serverId = serverId
    timing.error = undefined
    await db.put('timings', timing)
  }
}

export async function markAsError(localId: string, error: string): Promise<void> {
  const db = await getDB()
  const timing = await db.get('timings', localId)
  if (timing) {
    timing.error = error
    await db.put('timings', timing)
  }
}

export async function markAsPermanentError(localId: string, error: string): Promise<void> {
  const db = await getDB()
  const timing = await db.get('timings', localId)
  if (timing) {
    timing.synced = 2
    timing.error = error
    await db.put('timings', timing)
  }
}

export async function getAllTimings(limit = 50): Promise<LocalTiming[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('timings', 'by-timestamp')
  // Sort DESC (newest first) and limit
  return all.reverse().slice(0, limit)
}

export async function deleteTiming(localId: string): Promise<boolean> {
  const db = await getDB()
  const timing = await db.get('timings', localId)
  if (timing) {
    await db.delete('timings', localId)
    return true
  }
  return false
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB()
  return db.countFromIndex('timings', 'by-synced', 0)
}

// ── Checkpoint Cache ─────────────────────────────────────────────────────────

export async function saveCheckpointCache(checkpoint: CachedCheckpoint): Promise<void> {
  const db = await getDB()
  await db.put('checkpointCache', { ...checkpoint, cachedAt: new Date().toISOString() })
}

export async function getCheckpointCache(): Promise<CachedCheckpoint | null> {
  const db = await getDB()
  const all = await db.getAll('checkpointCache')
  return all[0] ?? null
}

// ── Cleanup ──────────────────────────────────────────────────────────────────

export async function clearSyncedTimings(olderThanMs = 24 * 60 * 60 * 1000): Promise<number> {
  const db = await getDB()
  const cutoff = new Date(Date.now() - olderThanMs).toISOString()
  const all = await db.getAllFromIndex('timings', 'by-synced', 1)
  let deleted = 0

  const tx = db.transaction('timings', 'readwrite')
  for (const timing of all) {
    if (timing.syncedAt && timing.syncedAt < cutoff) {
      await tx.store.delete(timing.localId)
      deleted++
    }
  }
  await tx.done

  return deleted
}
