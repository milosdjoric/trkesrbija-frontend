'use client'

import { useAuth } from '@/app/auth/auth-context'
import { cancelMyRegistration, fetchMyRaceRegistrations, type RaceRegistration } from '@/app/lib/api'
import { Button } from '@/components/button'
import { useConfirm } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { Heading, Subheading } from '@/components/heading'
import { LoadingState } from '@/components/loading-state'
import { Text } from '@/components/text'
import { useToast } from '@/components/toast'
import { formatDate } from '@/lib/formatters'
import { getStatusBadge } from '@/lib/badges'
import { CalendarIcon, MapPinIcon } from '@heroicons/react/16/solid'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function MyRegistrationsPage() {
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const [registrations, setRegistrations] = useState<RaceRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const loadRegistrations = useCallback(async () => {
    if (!accessToken) return
    try {
      const data = await fetchMyRaceRegistrations(accessToken)
      setRegistrations(data)
    } catch (err) {
      console.error('Failed to load registrations:', err)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/my-registrations')
      return
    }

    if (accessToken) {
      loadRegistrations()
    }
  }, [authLoading, user, accessToken, router, loadRegistrations])

  async function handleCancel(registrationId: string) {
    const confirmed = await confirm({
      title: 'Otkaži prijavu',
      message: 'Da li ste sigurni da želite da otkažete ovu prijavu?',
      confirmText: 'Otkaži prijavu',
      cancelText: 'Nazad',
      variant: 'danger',
    })
    if (!confirmed) return

    setCancellingId(registrationId)
    try {
      await cancelMyRegistration(registrationId, accessToken)
      await loadRegistrations()
      toast('Prijava uspešno otkazana', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Otkazivanje nije uspelo', 'error')
    } finally {
      setCancellingId(null)
    }
  }

  if (authLoading || loading) {
    return <LoadingState />
  }

  if (!user) {
    return null
  }

  const activeRegistrations = registrations.filter((r) => r.status !== 'CANCELLED')
  const cancelledRegistrations = registrations.filter((r) => r.status === 'CANCELLED')

  return (
    <>
      <Heading>Moje prijave</Heading>
      <Text className="mt-2 text-zinc-600 dark:text-zinc-400">Pregled vaših prijava za trke</Text>

      {registrations.length === 0 ? (
        <EmptyState
          icon="🏃"
          title="Nemate nijednu prijavu"
          description="Pretražite događaje i prijavite se za svoju prvu trku!"
          action={{ label: 'Pregledaj događaje', href: '/events' }}
          className="mt-8"
        />
      ) : (
        <>
          {activeRegistrations.length > 0 && (
            <div className="mt-6">
              <Subheading>Aktivne prijave ({activeRegistrations.length})</Subheading>
              <div className="mt-4 space-y-4">
                {activeRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/events/${reg.race?.raceEvent?.slug}`}
                            className="font-semibold text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                          >
                            {reg.race?.raceName ?? reg.race?.raceEvent?.eventName ?? 'Nepoznata trka'}
                          </Link>
                          {getStatusBadge(reg.status)}
                        </div>

                        {reg.race && (
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarIcon className="size-4" />
                              {formatDate(reg.race.startDateTime, 'long')}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <MapPinIcon className="size-4" />
                              {reg.race.length} km
                            </span>
                          </div>
                        )}

                        <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                          <span>
                            {reg.firstName} {reg.lastName}
                          </span>
                          {reg.bibNumber && (
                            <span className="ml-2 font-mono text-zinc-900 dark:text-zinc-100">
                              #{reg.bibNumber}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-xs text-zinc-400">
                          Prijavljeno: {formatDate(reg.createdAt, 'long')}
                        </div>
                      </div>

                      <div className="flex gap-2 sm:shrink-0">
                        {reg.status !== 'CANCELLED' && (
                          <Button
                            outline
                            onClick={() => handleCancel(reg.id)}
                            disabled={cancellingId === reg.id}
                          >
                            {cancellingId === reg.id ? 'Otkazivanje...' : 'Otkaži'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cancelledRegistrations.length > 0 && (
            <div className="mt-8">
              <Subheading className="text-zinc-500">Otkazane prijave ({cancelledRegistrations.length})</Subheading>
              <div className="mt-4 space-y-4">
                {cancelledRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 opacity-60 dark:border-zinc-700 dark:bg-zinc-800/50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">
                        {reg.race?.raceName ?? reg.race?.raceEvent?.eventName ?? 'Nepoznata trka'}
                      </span>
                      {getStatusBadge(reg.status)}
                    </div>
                    <div className="mt-1 text-sm text-zinc-500">
                      {formatDate(reg.race?.startDateTime ?? reg.createdAt, 'long')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
