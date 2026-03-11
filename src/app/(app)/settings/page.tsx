'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Divider } from '@/components/divider'
import { Heading, Subheading } from '@/components/heading'
import { Text } from '@/components/text'
import {
  CheckCircleIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  MoonIcon,
  SunIcon,
  UserCircleIcon,
} from '@heroicons/react/16/solid'
import { useTheme } from 'next-themes'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const UPDATE_EMAIL_PREFS_MUTATION = `
  mutation UpdateEmailPreferences($input: UpdateEmailPreferencesInput!) {
    updateEmailPreferences(input: $input) {
      id
      emailSubMonthly
      emailSubNews
      emailSubNewEvents
    }
  }
`

type Pref = 'emailSubMonthly' | 'emailSubNews' | 'emailSubNewEvents'

const PREFS: { key: Pref; label: string; description: string }[] = [
  {
    key: 'emailSubMonthly',
    label: 'Mesečni raspored trka',
    description: 'Svakog 1. u mesecu dobijate listu svih trka planiranih za tekući mesec.',
  },
  {
    key: 'emailSubNews',
    label: 'Vesti i novosti',
    description: 'Povremene vesti i zanimljivosti iz trkačkog sveta.',
  },
  {
    key: 'emailSubNewEvents',
    label: 'Nove trke na sajtu',
    description: `Obaveštenje čim se doda ${5} ili više novih trka na sajt.`,
  },
]

const THEME_OPTIONS = [
  { value: 'dark', label: 'Tamna', icon: MoonIcon },
  { value: 'light', label: 'Svetla', icon: SunIcon },
  { value: 'system', label: 'Sistem', icon: ComputerDesktopIcon },
] as const

const STRAVA_CONNECTION_QUERY = `
  query MyStravaConnection {
    myStravaConnection {
      connected
      athleteId
      connectedAt
    }
  }
`

const DISCONNECT_STRAVA = `
  mutation DisconnectStrava {
    disconnectStrava
  }
`

export default function Settings() {
  const { user, isLoading, refreshSession, accessToken } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Strava state
  const [stravaConnected, setStravaConnected] = useState(false)
  const [stravaLoading, setStravaLoading] = useState(true)
  const [stravaMessage, setStravaMessage] = useState<string | null>(null)

  useEffect(() => setMounted(true), [])

  // Strava callback status iz URL parametra
  useEffect(() => {
    const stravaStatus = searchParams.get('strava')
    if (stravaStatus === 'connected') setStravaMessage('Strava nalog je uspešno povezan!')
    else if (stravaStatus === 'denied') setStravaMessage('Strava pristup je odbijen.')
    else if (stravaStatus === 'error') setStravaMessage('Greška pri povezivanju sa Stravom.')
  }, [searchParams])

  // Učitaj Strava connection status
  useEffect(() => {
    if (!accessToken) return
    gql<{ myStravaConnection: { connected: boolean } }>(STRAVA_CONNECTION_QUERY, {}, { accessToken })
      .then((data) => {
        setStravaConnected(data.myStravaConnection.connected)
      })
      .catch(() => {})
      .finally(() => setStravaLoading(false))
  }, [accessToken, searchParams])

  const [prefs, setPrefs] = useState<Record<Pref, boolean>>({
    emailSubMonthly: false,
    emailSubNews: false,
    emailSubNewEvents: false,
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Track if prefs have been initialised from the user object
  const initialisedRef = useRef(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  // Initialise checkboxes from user object (only once, or when user object identity changes)
  useEffect(() => {
    if (user && !initialisedRef.current) {
      setPrefs({
        emailSubMonthly: user.emailSubMonthly ?? false,
        emailSubNews: user.emailSubNews ?? false,
        emailSubNewEvents: user.emailSubNewEvents ?? false,
      })
      initialisedRef.current = true
    }
  }, [user])

  const handlePrefChange = (key: Pref, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
    setSaveSuccess(false)
    setSaveError(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await gql(UPDATE_EMAIL_PREFS_MUTATION, { input: prefs })
      await refreshSession()
      setSaveSuccess(true)
    } catch {
      setSaveError('Greška pri čuvanju podešavanja. Pokušajte ponovo.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-text-secondary">Ucitavanje...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Heading>Podesavanja</Heading>
      <Text className="mt-2">Pregledajte informacije o svom nalogu.</Text>

      <Divider className="my-6" />

      {/* Profile info */}
      <section className="rounded-lg border border-border-primary p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-surface">
            <UserCircleIcon className="size-10 text-text-muted" />
          </div>
          <div>
            <div className="text-lg font-semibold text-text-primary">
              {user.name || 'Korisnik'}
            </div>
            <div className="text-sm text-text-secondary">{user.email}</div>
          </div>
        </div>

        <Divider className="my-6" soft />

        <div className="space-y-4">
          {/* Email status */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text-primary">Email verifikacija</div>
              <div className="text-xs text-text-secondary">{user.email}</div>
            </div>
            {user.emailVerified ? (
              <Badge color="green" className="flex items-center gap-1">
                <CheckCircleIcon className="size-3" />
                Verifikovan
              </Badge>
            ) : (
              <Badge color="amber" className="flex items-center gap-1">
                <ExclamationTriangleIcon className="size-3" />
                Nije verifikovan
              </Badge>
            )}
          </div>

          {/* Role */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-text-primary">Uloga</div>
              <div className="text-xs text-text-secondary">Vasa uloga u sistemu</div>
            </div>
            <Badge color={user.role === 'ADMIN' ? 'purple' : 'zinc'}>
              {user.role === 'ADMIN' ? 'Administrator' : 'Korisnik'}
            </Badge>
          </div>

          {/* Judge status */}
          {user.assignedCheckpointId && (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-primary">Sudija</div>
                <div className="text-xs text-text-secondary">Imate dodeljen checkpoint</div>
              </div>
              <Badge color="blue">Aktivan sudija</Badge>
            </div>
          )}
        </div>
      </section>

      {/* Email subscriptions */}
      <section className="mt-6 rounded-lg border border-border-primary p-6">
        <Subheading>Email obaveštenja</Subheading>
        <Text className="mt-1 text-sm text-text-secondary">
          Odaberite koje emailove želite da primate.
        </Text>

        <div className="mt-4 space-y-4">
          {PREFS.map(({ key, label, description }) => (
            <label key={key} className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-0.5 size-4 rounded border-border-secondary accent-brand-green"
                checked={prefs[key]}
                onChange={(e) => handlePrefChange(key, e.target.checked)}
              />
              <div>
                <div className="text-sm font-medium text-text-primary">{label}</div>
                <div className="text-xs text-text-secondary">{description}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-brand-green px-4 py-2 text-sm font-medium text-black hover:bg-brand-green-dark disabled:opacity-50"
          >
            {saving ? 'Čuvanje...' : 'Sačuvaj'}
          </button>
          {saveSuccess && (
            <span className="text-sm text-green-600">Podešavanja su sačuvana.</span>
          )}
          {saveError && (
            <span className="text-sm text-red-600">{saveError}</span>
          )}
        </div>
      </section>

      {/* Strava integration */}
      <section className="mt-6 rounded-lg border border-border-primary p-6">
        <Subheading>Strava integracija</Subheading>
        <Text className="mt-1 text-sm text-text-secondary">
          Poveži Strava nalog da bi se tvoje aktivnosti automatski sinhronizovale sa ligama.
        </Text>

        {stravaMessage && (
          <div
            className={`mt-3 rounded-lg px-4 py-2 text-sm ${
              stravaMessage.includes('uspešno')
                ? 'border border-green-500/20 bg-green-500/10 text-green-400'
                : 'border border-red-500/20 bg-red-500/10 text-red-400'
            }`}
          >
            {stravaMessage}
          </div>
        )}

        <div className="mt-4">
          {stravaLoading ? (
            <div className="animate-pulse text-sm text-text-secondary">Učitavanje...</div>
          ) : stravaConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge color="green">Povezan</Badge>
                <span className="text-sm text-text-secondary">Strava nalog je aktivan</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await gql(DISCONNECT_STRAVA, {}, { accessToken })
                    setStravaConnected(false)
                    setStravaMessage('Strava nalog je odvojen.')
                  } catch {
                    setStravaMessage('Greška pri odvajanju Strave.')
                  }
                }}
                className="rounded-lg border border-red-700 px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/20"
              >
                Odvoji Strava
              </button>
            </div>
          ) : (
            <a
              href={`${(process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')}/strava/auth?token=${accessToken}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/strava/btn_strava_connect_orange.svg"
                alt="Connect with Strava"
                height={48}
                className="h-12"
              />
            </a>
          )}
        </div>
      </section>

      {/* Theme preference */}
      <section className="mt-6 rounded-lg border border-border-primary p-6">
        <Subheading>Tema</Subheading>
        <Text className="mt-1 text-sm text-text-secondary">Izaberite željeni izgled aplikacije.</Text>

        {mounted && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                  theme === value
                    ? 'border-brand-green bg-brand-green/10 text-brand-green'
                    : 'border-border-primary text-text-secondary hover:border-border-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="size-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Info section */}
      <section className="mt-6 rounded-lg border border-dashed border-border-primary bg-surface p-6">
        <Subheading>Izmena profila</Subheading>
        <Text className="mt-2 text-sm text-text-secondary">
          Opcije za izmenu imena, lozinke i drugih podesavanja ce biti dostupne uskoro.
        </Text>
      </section>
    </div>
  )
}
