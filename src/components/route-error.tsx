'use client'

import { Button } from '@/components/button'
import { Heading } from '@/components/heading'
import { Text } from '@/components/text'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'

interface RouteErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  description?: string
}

export function RouteError({
  reset,
  title = 'Došlo je do greške',
  description = 'Nešto nije pošlo po planu. Pokušajte ponovo.',
}: RouteErrorProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-900/20">
        <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
      </div>
      <div className="space-y-2">
        <Heading level={2}>{title}</Heading>
        <Text className="text-gray-400">{description}</Text>
      </div>
      <Button onClick={reset}>Pokušaj ponovo</Button>
    </div>
  )
}
