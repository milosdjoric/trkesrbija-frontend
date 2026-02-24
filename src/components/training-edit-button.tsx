'use client'

import { useAuth } from '@/app/auth/auth-context'
import { Button } from '@/components/button'
import { PencilSquareIcon } from '@heroicons/react/16/solid'

type TrainingEditButtonProps = {
  eventId: string
  createdById?: string | null
}

export function TrainingEditButton({ eventId, createdById }: TrainingEditButtonProps) {
  const { user } = useAuth()

  if (!user || user.id !== createdById) {
    return null
  }

  return (
    <Button href={`/training/${eventId}/edit`} outline className="w-full">
      <PencilSquareIcon />
      Izmeni trening
    </Button>
  )
}
