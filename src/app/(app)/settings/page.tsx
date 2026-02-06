'use client'

import { useAuth } from '@/app/auth/auth-context'
import { Badge } from '@/components/badge'
import { Divider } from '@/components/divider'
import { Heading, Subheading } from '@/components/heading'
import { Text } from '@/components/text'
import { CheckCircleIcon, ExclamationTriangleIcon, UserCircleIcon } from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Settings() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-zinc-500">Ucitavanje...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Heading>Podesavanja</Heading>
      <Text className="mt-2">Pregledajte informacije o svom nalogu.</Text>

      <Divider className="my-6" />

      {/* Profile info */}
      <section className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <UserCircleIcon className="size-10 text-zinc-400" />
          </div>
          <div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {user.name || 'Korisnik'}
            </div>
            <div className="text-sm text-zinc-500">{user.email}</div>
          </div>
        </div>

        <Divider className="my-6" soft />

        <div className="space-y-4">
          {/* Email status */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email verifikacija</div>
              <div className="text-xs text-zinc-500">{user.email}</div>
            </div>
            {user.emailVerified ? (
              <Badge color="green" className="flex items-center gap-1">
                <CheckCircleIcon className="size-3" />
                Verifikovan
              </Badge>
            ) : (
              <Badge color="amber" className="flex items-center gap-1">
                <ExclamationTriangleIcon className="size-3" />
                Nije verifikovan
              </Badge>
            )}
          </div>

          {/* Role */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Uloga</div>
              <div className="text-xs text-zinc-500">Vasa uloga u sistemu</div>
            </div>
            <Badge color={user.role === 'ADMIN' ? 'purple' : 'zinc'}>
              {user.role === 'ADMIN' ? 'Administrator' : 'Korisnik'}
            </Badge>
          </div>

          {/* Judge status */}
          {user.assignedCheckpointId && (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sudija</div>
                <div className="text-xs text-zinc-500">Imate dodeljen checkpoint</div>
              </div>
              <Badge color="blue">Aktivan sudija</Badge>
            </div>
          )}
        </div>
      </section>

      {/* Info section */}
      <section className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <Subheading>Izmena profila</Subheading>
        <Text className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Opcije za izmenu imena, lozinke i drugih podesavanja ce biti dostupne uskoro.
        </Text>
      </section>
    </div>
  )
}
