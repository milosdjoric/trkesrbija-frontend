'use client'

import { useAuth } from '@/app/auth/auth-context'
import { EmptyState } from '@/components/empty-state'
import { FavoriteButton } from '@/components/favorite-button'
import { Heading } from '@/components/heading'
import { LoadingState } from '@/components/loading-state'
import { RaceListCard } from '@/components/race-list-card'
import { Text } from '@/components/text'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type FavoriteRace = {
  id: string
  raceId: string
  createdAt: string
  race: {
    id: string
    raceName: string | null
    length: number
    elevation: number | null
    startLocation: string
    startDateTime: string
    raceEventId: string
    raceEvent: {
      id: string
      eventName: string
      slug: string
      type: 'TRAIL' | 'ROAD'
    }
    competition: { id: string; name: string } | null
  }
}

export default function FavoritesPage() {
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteRace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return

    // If not logged in, redirect to login
    if (!user) {
      router.push('/login?redirect=/favorites')
      return
    }

    async function fetchFavorites() {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            query: `
              query MyFavorites {
                myFavorites {
                  id
                  raceId
                  createdAt
                  race {
                    id
                    raceName
                    length
                    elevation
                    startLocation
                    startDateTime
                    raceEventId
                    raceEvent {
                      id
                      eventName
                      slug
                      type
                    }
                    competition {
                      id
                      name
                    }
                  }
                }
              }
            `,
          }),
        })

        const json = await res.json()

        if (json.errors?.length) {
          console.error('Failed to load favorites:', json.errors)
          return
        }

        setFavorites(json.data?.myFavorites ?? [])
      } catch (err) {
        console.error('Failed to load favorites:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [accessToken, authLoading, user, router])

  function handleRemove(raceId: string) {
    setFavorites((prev) => prev.filter((f) => f.raceId !== raceId))
  }

  if (loading || authLoading) {
    return <LoadingState />
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Heading>Omiljene trke</Heading>
      <Text className="mt-2 text-zinc-600 dark:text-zinc-400">Vaše omiljene trke na jednom mestu</Text>

      {favorites.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="Nemate nijednu omiljenu trku"
          description="Pretražite događaje i kliknite na srce da dodate trke u favorite!"
          action={{ label: 'Pregledaj događaje', href: '/events' }}
          className="mt-8"
        />
      ) : (
        <div className="mt-6 space-y-2">
          {[...favorites]
            .sort((a, b) => new Date(a.race.startDateTime).getTime() - new Date(b.race.startDateTime).getTime())
            .map((fav) => {
              const race = fav.race
              return (
                <RaceListCard
                  key={fav.id}
                  raceId={race.id}
                  raceName={race.raceName}
                  eventName={race.raceEvent.eventName}
                  eventSlug={race.raceEvent.slug}
                  type={race.raceEvent.type}
                  length={race.length}
                  elevation={race.elevation}
                  startDateTime={race.startDateTime}
                >
                  <FavoriteButton
                    raceId={race.id}
                    initialIsFavorite={true}
                    size="sm"
                    onToggle={(isFav) => {
                      if (!isFav) handleRemove(race.id)
                    }}
                  />
                </RaceListCard>
              )
            })}
        </div>
      )}
    </>
  )
}
