'use client'

import { useAuth } from '@/app/auth/auth-context'
import { Button } from '@/components/button'
import { PencilSquareIcon } from '@heroicons/react/16/solid'

type AdminEditButtonProps = {
  href: string
  label?: string
}

export function AdminEditButton({ href, label = 'Izmeni' }: AdminEditButtonProps) {
  const { user } = useAuth()

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <Button href={href} outline>
      <PencilSquareIcon />
      {label}
    </Button>
  )
}
