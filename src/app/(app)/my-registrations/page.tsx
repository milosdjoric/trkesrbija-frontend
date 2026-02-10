'use client'

import { useAuth } from '@/app/auth/auth-context'
import { cancelMyRegistration, fetchMyRaceRegistrations, type RaceRegistration } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { useConfirm } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { Heading, Subheading } from '@/components/heading'
import { LoadingState } from '@/components/loading-state'
import { RaceListCard } from '@/components/race-list-card'
import { Text } from '@/components/text'
import { useToast } from '@/components/toast'
import { formatDate } from '@/lib/formatters'
import { getStatusBadge } from '@/lib/badges'
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
              <div className="mt-4 space-y-2">
                {activeRegistrations.map((reg) => (
                  <RaceListCard
                    key={reg.id}
                    raceId={reg.race?.id ?? reg.raceId}
                    raceName={reg.race?.raceName ?? null}
                    eventName={reg.race?.raceEvent?.eventName ?? 'Nepoznata trka'}
                    eventSlug={reg.race?.raceEvent?.slug ?? ''}
                    type={(reg.race?.raceEvent?.type as 'TRAIL' | 'ROAD') ?? 'ROAD'}
                    length={reg.race?.length ?? 0}
                    elevation={reg.race?.elevation}
                    startDateTime={reg.race?.startDateTime ?? reg.createdAt}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusBadge(reg.status)}
                      {reg.bibNumber && (
                        <Badge color="zinc">#{reg.bibNumber}</Badge>
                      )}
                      {reg.status !== 'CANCELLED' && (
                        <Button
                          outline
                          onClick={() => handleCancel(reg.id)}
                          disabled={cancellingId === reg.id}
                          className="text-xs"
                        >
                          {cancellingId === reg.id ? '...' : 'Otkaži'}
                        </Button>
                      )}
                    </div>
                  </RaceListCard>
                ))}
              </div>
            </div>
          )}

          {cancelledRegistrations.length > 0 && (
            <div className="mt-8">
              <Subheading className="text-zinc-500">Otkazane prijave ({cancelledRegistrations.length})</Subheading>
              <div className="mt-4 space-y-2 opacity-60">
                {cancelledRegistrations.map((reg) => (
                  <RaceListCard
                    key={reg.id}
                    raceId={reg.race?.id ?? reg.raceId}
                    raceName={reg.race?.raceName ?? null}
                    eventName={reg.race?.raceEvent?.eventName ?? 'Nepoznata trka'}
                    eventSlug={reg.race?.raceEvent?.slug ?? ''}
                    type={(reg.race?.raceEvent?.type as 'TRAIL' | 'ROAD') ?? 'ROAD'}
                    length={reg.race?.length ?? 0}
                    elevation={reg.race?.elevation}
                    startDateTime={reg.race?.startDateTime ?? reg.createdAt}
                    showCountdown={false}
                  >
                    {getStatusBadge(reg.status)}
                  </RaceListCard>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
