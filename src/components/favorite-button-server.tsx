'use client'

import { useAuth } from '@/app/auth/auth-context'
import { Button } from '@/components/button'
import { HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useState, useTransition, useEffect } from 'react'
import { gql } from '@/app/lib/api'

type FavoriteButtonServerProps = {
  raceId: string
}

const CHECK_FAVORITE_QUERY = `
  query CheckFavorite {
    races(raceEventId: null, limit: 1000) {
      id
      isFavorite
    }
  }
`

export function FavoriteButtonServer({ raceId }: FavoriteButtonServerProps) {
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function checkFavorite() {
      if (!accessToken) {
        setLoading(false)
        return
      }

      try {
        const data = await gql<{
          races: Array<{ id: string; isFavorite: boolean }>
        }>(CHECK_FAVORITE_QUERY, {}, { accessToken })

        const race = data.races.find((r) => r.id === raceId)
        if (race) {
          setIsFavorite(race.isFavorite)
        }
      } catch (err) {
        console.error('Failed to check favorite:', err)
      } finally {
        setLoading(false)
      }
    }

    checkFavorite()
  }, [raceId, accessToken])

  async function handleToggle() {
    if (!user || !accessToken) {
      window.location.href = `/login?redirect=/races/${raceId}`
      return
    }

    const newValue = !isFavorite
    setIsFavorite(newValue)

    startTransition(async () => {
      try {
        const mutation = newValue
          ? `mutation AddFavorite($raceId: ID!) { addFavorite(raceId: $raceId) { id } }`
          : `mutation RemoveFavorite($raceId: ID!) { removeFavorite(raceId: $raceId) }`

        const res = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            query: mutation,
            variables: { raceId },
          }),
        })

        const json = await res.json()

        if (json.errors?.length) {
          setIsFavorite(!newValue)
          console.error('Failed to toggle favorite:', json.errors[0].message)
        }
      } catch (err) {
        setIsFavorite(!newValue)
        console.error('Failed to toggle favorite:', err)
      }
    })
  }

  if (authLoading || loading) {
    return (
      <Button outline disabled className="w-full">
        <HeartIcon data-slot="icon" />
        ...
      </Button>
    )
  }

  return (
    <Button
      outline
      onClick={handleToggle}
      disabled={isPending}
      className="w-full"
    >
      {isFavorite ? (
        <HeartSolidIcon data-slot="icon" className="text-red-500" />
      ) : (
        <HeartIcon data-slot="icon" />
      )}
      {isFavorite ? 'Ukloni iz favorita' : 'Dodaj u favorite'}
    </Button>
  )
}
