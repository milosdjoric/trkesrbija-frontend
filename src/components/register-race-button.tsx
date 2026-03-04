'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const linkStyles =
  'inline-flex items-center gap-1 rounded border border-border-primary px-2 py-0.5 text-xs text-text-secondary hover:border-zinc-500 hover:text-zinc-200'

const disabledStyles =
  'inline-flex items-center gap-1 rounded border border-border-primary px-2 py-0.5 text-xs text-text-secondary'

const CHECK_REGISTRATION_QUERY = `
  query CheckRegistration {
    races(raceEventId: null, limit: 1000) {
      id
      slug
      isRegistered
      registrationCount
      registrationEnabled
    }
  }
`

type Props = {
  raceId: string
  raceSlug?: string
  size?: 'sm' | 'md'
}

export function RegisterRaceButton({ raceId, raceSlug, size = 'sm' }: Props) {
  const { user, accessToken, isLoading } = useAuth()
  const [isRegistered, setIsRegistered] = useState(false)
  const [registrationEnabled, setRegistrationEnabled] = useState(false)
  const [slug, setSlug] = useState(raceSlug ?? '')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkRegistration() {
      try {
        const data = await gql<{
          races: Array<{
            id: string
            slug: string
            isRegistered: boolean
            registrationCount: number
            registrationEnabled: boolean
          }>
        }>(CHECK_REGISTRATION_QUERY, {}, { accessToken })

        const race = data.races.find((r) => r.id === raceId)
        if (race) {
          setIsRegistered(race.isRegistered)
          setRegistrationEnabled(race.registrationEnabled)
          if (!raceSlug) {
            setSlug(race.slug)
          }
        }
      } catch (err) {
        console.error('Failed to check registration:', err)
      } finally {
        setChecking(false)
      }
    }

    checkRegistration()
  }, [raceId, raceSlug, accessToken])

  // Don't show button if registration is not enabled
  if (!checking && !registrationEnabled) {
    return null
  }

  if (isLoading || checking) {
    return <span className={disabledStyles}>...</span>
  }

  if (isRegistered) {
    return <span className={disabledStyles}>✓ Prijavljen</span>
  }

  // If user not logged in, redirect to login
  if (!user) {
    return (
      <Link href={`/login?redirect=/races/${slug}/register`} className={linkStyles}>
        Prijavi se
      </Link>
    )
  }

  return (
    <Link href={`/races/${slug}/register`} className={linkStyles}>
      Prijavi se
    </Link>
  )
}
