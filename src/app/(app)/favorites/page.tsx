'use client'

import { useAuth } from '@/app/auth/auth-context'
import { Badge } from '@/components/badge'
import { EmptyState } from '@/components/empty-state'
import { FavoriteButton } from '@/components/favorite-button'
import { Heading } from '@/components/heading'
import { IconText } from '@/components/icon-text'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { Text } from '@/components/text'
import { formatDate, formatTime } from '@/lib/formatters'
import { CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/16/solid'
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
        <div className="mt-6 flex flex-col gap-3">
          {[...favorites]
            .sort((a, b) => new Date(a.race.startDateTime).getTime() - new Date(b.race.startDateTime).getTime())
            .map((fav) => {
            const race = fav.race
            return (
              <div
                key={fav.id}
                className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 dark:border-zinc-700"
              >
                <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-6">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {race.raceName ?? 'Neimenovana trka'}
                  </div>
                  <IconText
                    icon={<CalendarIcon className="size-4" />}
                    className="text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    {formatDate(race.startDateTime, 'short')}
                  </IconText>
                  <IconText
                    icon={<ClockIcon className="size-4" />}
                    className="text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    {formatTime(race.startDateTime)}
                  </IconText>
                  <IconText
                    icon={<MapPinIcon className="size-4" />}
                    className="text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    {race.startLocation.startsWith('http') ? (
                      <a
                        href={race.startLocation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
                      >
                        Prikaži lokaciju
                      </a>
                    ) : (
                      race.startLocation
                    )}
                  </IconText>
                  {race.competition && (
                    <Badge color="blue">{race.competition.name}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm lg:shrink-0">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{race.length} km</span>
                  {race.elevation != null && (
                    <span className="text-zinc-500 dark:text-zinc-400">{race.elevation} m</span>
                  )}
                  <FavoriteButton
                    raceId={race.id}
                    initialIsFavorite={true}
                    size="sm"
                    onToggle={(isFav) => {
                      if (!isFav) handleRemove(race.id)
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
