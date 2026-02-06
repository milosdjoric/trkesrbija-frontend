'use client'

import { useAuth } from '@/app/auth/auth-context'
import { Button } from '@/components/button'
import { gql } from '@/app/lib/api'
import { useEffect, useState } from 'react'

const CHECK_REGISTRATION_QUERY = `
  query CheckRegistration {
    races(raceEventId: null, limit: 1000) {
      id
      isRegistered
      registrationCount
      registrationEnabled
    }
  }
`

type Props = {
  raceId: string
  size?: 'sm' | 'md'
}

export function RegisterRaceButton({ raceId, size = 'sm' }: Props) {
  const { user, accessToken, isLoading } = useAuth()
  const [isRegistered, setIsRegistered] = useState(false)
  const [registrationEnabled, setRegistrationEnabled] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkRegistration() {
      try {
        const data = await gql<{
          races: Array<{
            id: string
            isRegistered: boolean
            registrationCount: number
            registrationEnabled: boolean
          }>
        }>(CHECK_REGISTRATION_QUERY, {}, { accessToken })

        const race = data.races.find((r) => r.id === raceId)
        if (race) {
          setIsRegistered(race.isRegistered)
          setRegistrationEnabled(race.registrationEnabled)
        }
      } catch (err) {
        console.error('Failed to check registration:', err)
      } finally {
        setChecking(false)
      }
    }

    checkRegistration()
  }, [raceId, accessToken])

  // Don't show button if registration is not enabled
  if (!checking && !registrationEnabled) {
    return null
  }

  if (isLoading || checking) {
    return (
      <Button outline disabled className={size === 'sm' ? 'text-xs' : ''}>
        ...
      </Button>
    )
  }

  if (isRegistered) {
    return (
      <Button outline disabled className={size === 'sm' ? 'text-xs' : ''}>
        ✓ Prijavljen
      </Button>
    )
  }

  // If user not logged in, redirect to login
  if (!user) {
    return (
      <Button outline href={`/login?redirect=/races/${raceId}/register`} className={size === 'sm' ? 'text-xs' : ''}>
        Prijavi se
      </Button>
    )
  }

  return (
    <Button outline href={`/races/${raceId}/register`} className={size === 'sm' ? 'text-xs' : ''}>
      Prijavi se
    </Button>
  )
}
