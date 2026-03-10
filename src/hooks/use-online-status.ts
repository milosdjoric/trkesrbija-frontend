import { getPendingCount } from '@/lib/offline/timing-db'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

// ── Online/Offline detection via useSyncExternalStore ────────────────────────
// Ovo je React-recommended pristup za subscribovanje na browser API-je.
// navigator.onLine + online/offline eventovi.

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot() {
  return navigator.onLine
}

function getServerSnapshot() {
  return true // SSR pretpostavlja online
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [pendingCount, setPendingCount] = useState(0)

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setPendingCount(count)
    } catch {
      // IndexedDB nedostupan (npr. private browsing)
    }
  }, [])

  // Refresh pending count periodično i na online/offline promene
  useEffect(() => {
    refreshPendingCount()
    const interval = setInterval(refreshPendingCount, 5000)

    const onStatusChange = () => refreshPendingCount()
    window.addEventListener('online', onStatusChange)
    window.addEventListener('offline', onStatusChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', onStatusChange)
      window.removeEventListener('offline', onStatusChange)
    }
  }, [refreshPendingCount])

  return { isOnline, pendingCount, refreshPendingCount }
}
