'use client'

import { ApiError } from '@/app/lib/api'
import * as authApi from '@/app/lib/auth'
import { useRouter } from 'next/navigation'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type AuthUser = authApi.User

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  register: (payload: { email: string; password: string; name?: string }) => Promise<void>
  logout: () => Promise<void>

  // Useful for app boot and future retry flows
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[auth] AuthProvider mounted')
  }

  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshInFlightRef = useRef<Promise<void> | null>(null)

  const refreshSession = useCallback(async () => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[auth] refreshSession() called')
    }

    if (refreshInFlightRef.current) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[auth] refreshSession() deduped (in-flight)')
      }
      return refreshInFlightRef.current
    }

    const p = (async () => {
      setIsLoading(true)
      try {
        const refreshed = await authApi.refresh()

        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log('[auth] refreshSession() success', refreshed)
        }

        setAccessToken(refreshed.accessToken)
        setUser(refreshed.user)
      } catch (err) {
        // If not logged in / cookie missing / revoked etc.
        setAccessToken(null)
        setUser(null)

        // Keep dev-friendly logs (do not throw, so app can render logged-out UI)
        if (process.env.NODE_ENV !== 'production') {
          const e = err as ApiError
          // eslint-disable-next-line no-console
          console.warn('[auth] refreshSession() failed', { message: e.message, code: e.code, field: e.field })
        }
      } finally {
        setIsLoading(false)
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

      // After logout, send the user to the login page.
      // Using replace prevents going back to protected pages via browser back button.
      router.replace('/login')
    }
  }, [router])

  // On first load, try to restore session via refresh cookie.
  useEffect(() => {
    refreshSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, accessToken, isLoading, login, register, logout, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
