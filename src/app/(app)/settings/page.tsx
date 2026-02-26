'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Divider } from '@/components/divider'
import { Heading, Subheading } from '@/components/heading'
import { Text } from '@/components/text'
import { CheckCircleIcon, ExclamationTriangleIcon, UserCircleIcon } from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
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

export default function Settings() {
  const { user, isLoading, refreshSession } = useAuth()
  const router = useRouter()

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
        <div className="animate-pulse text-zinc-500">Ucitavanje...</div>
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
      <section className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <UserCircleIcon className="size-10 text-zinc-400" />
          </div>
          <div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {user.name || 'Korisnik'}
            </div>
            <div className="text-sm text-zinc-500">{user.email}</div>
          </div>
        </div>

        <Divider className="my-6" soft />

        <div className="space-y-4">
          {/* Email status */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email verifikacija</div>
              <div className="text-xs text-zinc-500">{user.email}</div>
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
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Uloga</div>
              <div className="text-xs text-zinc-500">Vasa uloga u sistemu</div>
            </div>
            <Badge color={user.role === 'ADMIN' ? 'purple' : 'zinc'}>
              {user.role === 'ADMIN' ? 'Administrator' : 'Korisnik'}
            </Badge>
          </div>

          {/* Judge status */}
          {user.assignedCheckpointId && (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sudija</div>
                <div className="text-xs text-zinc-500">Imate dodeljen checkpoint</div>
              </div>
              <Badge color="blue">Aktivan sudija</Badge>
            </div>
          )}
        </div>
      </section>

      {/* Email subscriptions */}
      <section className="mt-6 rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
        <Subheading>Email obaveštenja</Subheading>
        <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Odaberite koje emailove želite da primate.
        </Text>

        <div className="mt-4 space-y-4">
          {PREFS.map(({ key, label, description }) => (
            <label key={key} className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-0.5 size-4 rounded border-zinc-300 text-zinc-900 accent-zinc-900 dark:border-zinc-600"
                checked={prefs[key]}
                onChange={(e) => handlePrefChange(key, e.target.checked)}
              />
              <div>
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</div>
                <div className="text-xs text-zinc-500">{description}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {saving ? 'Čuvanje...' : 'Sačuvaj'}
          </button>
          {saveSuccess && (
            <span className="text-sm text-green-600 dark:text-green-400">Podešavanja su sačuvana.</span>
          )}
          {saveError && (
            <span className="text-sm text-red-600 dark:text-red-400">{saveError}</span>
          )}
        </div>
      </section>

      {/* Info section */}
      <section className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <Subheading>Izmena profila</Subheading>
        <Text className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Opcije za izmenu imena, lozinke i drugih podesavanja ce biti dostupne uskoro.
        </Text>
      </section>
    </div>
  )
}
