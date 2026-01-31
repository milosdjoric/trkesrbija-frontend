'use client'

import { Badge } from '@/components/badge'
import { FavoriteButton } from '@/components/favorite-button'
import { Heading } from '@/components/heading'
import { Link } from '@/components/link'
import { CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/16/solid'
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

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteRace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
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
          const firstError = json.errors[0]
          if (firstError.extensions?.code === 'UNAUTHENTICATED') {
            setError('Please log in to view your favorites')
          } else {
            setError(firstError.message)
          }
          return
        }

        setFavorites(json.data?.myFavorites ?? [])
      } catch (err) {
        setError('Failed to load favorites')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [])

  function handleRemove(raceId: string) {
    setFavorites((prev) => prev.filter((f) => f.raceId !== raceId))
  }

  if (loading) {
    return (
      <>
        <Heading>My Favorites</Heading>
        <div className="mt-6 text-sm text-zinc-500">Loading...</div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Heading>My Favorites</Heading>
        <div className="mt-6 rounded-lg border border-zinc-200 p-6 text-sm/6 dark:border-zinc-700">
          <div className="font-medium">{error}</div>
          {error.includes('log in') && (
            <div className="mt-2">
              <Link href="/login" className="text-blue-600 underline hover:text-blue-700">
                Go to login
              </Link>
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <Heading>My Favorites</Heading>

      {favorites.length === 0 ? (
        <div className="mt-6 rounded-lg border border-zinc-200 p-6 text-sm/6 dark:border-zinc-700">
          <div className="font-medium">No favorites yet</div>
          <div className="mt-1 text-zinc-500">
            Browse <Link href="/events" className="underline">events</Link> and click the heart icon to add races to your favorites.
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {favorites.map((fav) => {
            const race = fav.race
            return (
              <div
                key={fav.id}
                className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6 dark:border-zinc-700"
              >
                <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-6">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {race.raceName ?? 'Unnamed Race'}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                    <CalendarIcon className="size-4 shrink-0" />
                    <span>{formatDate(race.startDateTime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                    <ClockIcon className="size-4 shrink-0" />
                    <span>{formatTime(race.startDateTime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                    <MapPinIcon className="size-4 shrink-0" />
                    {race.startLocation.startsWith('http') ? (
                      <a
                        href={race.startLocation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
                      >
                        View location
                      </a>
                    ) : (
                      <span>{race.startLocation}</span>
                    )}
                  </div>
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
