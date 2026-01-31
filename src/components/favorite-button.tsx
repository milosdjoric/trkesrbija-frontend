'use client'

import { HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useState, useTransition } from 'react'
import clsx from 'clsx'

type FavoriteButtonProps = {
  raceId: string
  initialIsFavorite: boolean
  onToggle?: (isFavorite: boolean) => void
  className?: string
  size?: 'sm' | 'md'
}

export function FavoriteButton({
  raceId,
  initialIsFavorite,
  onToggle,
  className,
  size = 'md',
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [isPending, startTransition] = useTransition()

  const iconSize = size === 'sm' ? 'size-4' : 'size-5'

  async function handleToggle() {
    const newValue = !isFavorite
    setIsFavorite(newValue) // Optimistic update

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
          },
          body: JSON.stringify({
            query: mutation,
            variables: { raceId },
          }),
        })

        const json = await res.json()

        if (json.errors?.length) {
          // Revert on error
          setIsFavorite(!newValue)
          console.error('Failed to toggle favorite:', json.errors[0].message)
          return
        }

        onToggle?.(newValue)
      } catch (err) {
        // Revert on error
        setIsFavorite(!newValue)
        console.error('Failed to toggle favorite:', err)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={clsx(
        'rounded-full p-1.5 transition-colors',
        isFavorite
          ? 'text-red-500 hover:text-red-600'
          : 'text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-500',
        isPending && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFavorite ? <HeartSolidIcon className={iconSize} /> : <HeartIcon className={iconSize} />}
    </button>
  )
}
