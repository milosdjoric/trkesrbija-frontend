'use client'

import { useAuth } from '@/app/auth/auth-context'
import { ClipboardDocumentListIcon, FlagIcon } from '@heroicons/react/16/solid'
import NextLink from 'next/link'

type Props = {
  raceId: string
}

export function AdminRaceLinks({ raceId }: Props) {
  const { user } = useAuth()

  if (!user || user.role !== 'ADMIN') return null

  return (
    <>
      <NextLink
        href={`/admin/races/${raceId}/registrations`}
        className="inline-flex items-center gap-1 rounded border border-zinc-300 px-2 py-0.5 text-xs text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
        title="Prijave"
      >
        <ClipboardDocumentListIcon className="size-3" />
        Prijave
      </NextLink>
      <NextLink
        href={`/admin/races/${raceId}/checkpoints`}
        className="inline-flex items-center gap-1 rounded border border-zinc-300 px-2 py-0.5 text-xs text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
        title="Checkpoint-i"
      >
        <FlagIcon className="size-3" />
        Checkpoint-i
      </NextLink>
    </>
  )
}
