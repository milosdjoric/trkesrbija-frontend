'use client'

import { ApiError } from '@/app/lib/api'
import * as authApi from '@/app/lib/auth'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type AuthUser = authApi.User

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  register: (payload: { email: string; password: string; name?: string }) => Promise<void>
  logout: () => Promise<void>

  // Useful for app boot and future retry flows
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[auth] AuthProvider mounted')
  }

  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshInFlightRef = useRef<Promise<void> | null>(null)
  // After the initial boot refresh completes, all subsequent refreshes are "silent"
  // (they don't touch isLoading and don't clear user state on transient failure).
  const bootedRef = useRef(false)

  const refreshSession = useCallback(async () => {
    const silent = bootedRef.current

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[auth] refreshSession() called', { silent })
    }

    if (refreshInFlightRef.current) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[auth] refreshSession() deduped (in-flight)')
      }
      return refreshInFlightRef.current
    }

    const p = (async () => {
      // Only show loading spinner on the initial boot, never on background refreshes
      if (!silent) setIsLoading(true)

      try {
        // Timeout za boot refresh — mobilni fetch može visiti 30-60s kad nema signala.
        // Kratak timeout osigurava da judge stranica brzo padne na offline cache.
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), silent ? 10000 : 5000)

        let refreshed: Awaited<ReturnType<typeof authApi.refresh>>
        try {
          refreshed = await authApi.refresh({ signal: controller.signal })
        } finally {
          clearTimeout(timeoutId)
        }

        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log('[auth] refreshSession() success', refreshed)
        }

        setAccessToken(refreshed.accessToken)
        setUser(refreshed.user)
      } catch (err) {
        const e = err as ApiError

        if (silent) {
          // Background refresh failed — keep current user state intact.
          // The user might still have a valid refresh cookie; we'll retry on
          // the next interval tick or when the tab becomes visible again.
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[auth] Silent refresh failed, keeping current session', {
              message: e.message,
              code: e.code,
              field: e.field,
            })
          }
        } else {
          // Initial boot failed — no session to restore, show logged-out UI
          setAccessToken(null)
          setUser(null)

          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[auth] refreshSession() failed', {
              message: e.message,
              code: e.code,
              field: e.field,
            })
          }
        }
      } finally {
        if (!silent) setIsLoading(false)
        bootedRef.current = true
        refreshInFlightRef.current = null

        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log('[auth] refreshSession() done')
        }
      }
    })()

    refreshInFlightRef.current = p
    return p
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await authApi.login(email, password)
      setAccessToken(res.accessToken)
      setUser(res.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginWithGoogle = useCallback(async (idToken: string) => {
    setIsLoading(true)
    try {
      const res = await authApi.loginWithGoogle(idToken)
      setAccessToken(res.accessToken)
      setUser(res.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (payload: { email: string; password: string; name?: string }) => {
    setIsLoading(true)
    try {
      const res = await authApi.register(payload)
      setAccessToken(res.accessToken)
      setUser(res.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authApi.logout()
    } finally {
      setAccessToken(null)
      setUser(null)
      setIsLoading(false)
      // No redirect - users can browse events without being logged in
    }
  }, [])

  // On first load, try to restore session via refresh cookie.
  useEffect(() => {
    refreshSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh token before expiry (every 14 minutes, since token expires at 15).
  // Also refresh immediately when the tab becomes visible again — browsers throttle
  // (or freeze) setInterval in background tabs, so the 14-min tick may never fire.
  useEffect(() => {
    // Only set up if user is logged in
    if (!accessToken) return

    const REFRESH_INTERVAL = 14 * 60 * 1000 // 14 minutes

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[auth] Setting up auto-refresh interval + visibility listener')
    }

    const intervalId = setInterval(() => {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[auth] Auto-refreshing token...')
      }
      refreshSession()
    }, REFRESH_INTERVAL)

    // When tab becomes visible again after being backgrounded, refresh immediately
    // so the user never sees stale / "logged out" UI.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log('[auth] Tab became visible, refreshing token...')
        }
        refreshSession()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[auth] Clearing auto-refresh interval + visibility listener')
      }
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [accessToken, refreshSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      login,
      loginWithGoogle,
      register,
      logout,
      refreshSession,
    }),
    [user, accessToken, isLoading, login, loginWithGoogle, register, logout, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
