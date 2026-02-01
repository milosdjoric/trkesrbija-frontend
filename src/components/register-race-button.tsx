'use client'

import { useAuth } from '@/app/auth/auth-context'
import { Button } from '@/components/button'
import { gql } from '@/app/lib/api'
import { useEffect, useState } from 'react'

const CHECK_REGISTRATION_QUERY = `
  query CheckRegistration($raceId: ID!) {
    races(raceEventId: null, limit: 1000) {
      id
      isRegistered
      registrationCount
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
  const [registrationCount, setRegistrationCount] = useState(0)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkRegistration() {
      if (!accessToken) {
        setChecking(false)
        return
      }

      try {
        const data = await gql<{
          races: Array<{
            id: string
            isRegistered: boolean
            registrationCount: number
          }>
        }>(CHECK_REGISTRATION_QUERY, {}, { accessToken })

        const race = data.races.find((r) => r.id === raceId)
        if (race) {
          setIsRegistered(race.isRegistered)
          setRegistrationCount(race.registrationCount)
        }
      } catch (err) {
        console.error('Failed to check registration:', err)
      } finally {
        setChecking(false)
      }
    }

    checkRegistration()
  }, [raceId, accessToken])

  if (isLoading || checking) {
    return (
      <Button outline disabled className={size === 'sm' ? 'text-xs' : ''}>
        ...
      </Button>
    )
  }

  if (isRegistered) {
    return (
      <Button color="green" disabled className={size === 'sm' ? 'text-xs' : ''}>
        Prijavljen
      </Button>
    )
  }

  return (
    <Button href={`/races/${raceId}/register`} className={size === 'sm' ? 'text-xs' : ''}>
      Prijavi se
    </Button>
  )
}
