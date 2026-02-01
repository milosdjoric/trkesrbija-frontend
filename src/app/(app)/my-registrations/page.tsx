'use client'

import { useAuth } from '@/app/auth/auth-context'
import { cancelMyRegistration, fetchMyRaceRegistrations, type RaceRegistration } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading, Subheading } from '@/components/heading'
import { Text } from '@/components/text'
import { CalendarIcon, MapPinIcon } from '@heroicons/react/16/solid'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  return d.toLocaleDateString('sr-RS', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getStatusBadge(status: RaceRegistration['status']) {
  switch (status) {
    case 'PENDING':
      return <Badge color="yellow">Na čekanju</Badge>
    case 'CONFIRMED':
      return <Badge color="blue">Potvrđeno</Badge>
    case 'PAID':
      return <Badge color="green">Plaćeno</Badge>
    case 'CANCELLED':
      return <Badge color="red">Otkazano</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default function MyRegistrationsPage() {
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const router = useRouter()

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
    if (!confirm('Da li ste sigurni da želite da otkažete ovu prijavu?')) {
      return
    }

    setCancellingId(registrationId)
    try {
      await cancelMyRegistration(registrationId, accessToken)
      await loadRegistrations()
    } catch (err: any) {
      alert(err?.message ?? 'Otkazivanje nije uspelo')
    } finally {
      setCancellingId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-zinc-500">Učitavanje...</div>
      </div>
    )
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
        <div className="mt-8 rounded-lg border border-zinc-200 p-8 text-center dark:border-zinc-700">
          <div className="text-4xl">🏃</div>
          <Subheading className="mt-4">Nemate nijednu prijavu</Subheading>
          <Text className="mt-2 text-zinc-500">Pretražite događaje i prijavite se za svoju prvu trku!</Text>
          <Button href="/events" className="mt-4">
            Pregledaj događaje
          </Button>
        </div>
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
                              {formatDate(reg.race.startDateTime)}
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
                          Prijavljeno: {formatDate(reg.createdAt)}
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
                      {formatDate(reg.race?.startDateTime ?? reg.createdAt)}
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
