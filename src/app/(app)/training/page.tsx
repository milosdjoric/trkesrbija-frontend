'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { useConfirm } from '@/components/confirm-dialog'
import { Heading } from '@/components/heading'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import { PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type TrainingRace = {
  id: string
  slug: string
  raceName: string | null
  startDateTime: string
  startLocation: string
  gpsFile: string | null
}

type TrainingEvent = {
  id: string
  eventName: string
  slug: string
  type: 'TRAIL' | 'ROAD' | 'OCR'
  description: string | null
  races: TrainingRace[]
  createdAt: string
}

const MY_TRAINING_EVENTS_QUERY = `
  query MyTrainingEvents {
    myTrainingEvents {
      id
      eventName
      slug
      type
      description
      races {
        id
        slug
        raceName
        startDateTime
        startLocation
        gpsFile
      }
      createdAt
    }
  }
`

const DELETE_TRAINING_EVENT_MUTATION = `
  mutation DeleteTrainingEvent($eventId: ID!) {
    deleteTrainingEvent(eventId: $eventId)
  }
`

export default function TrainingPage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const [events, setEvents] = useState<TrainingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)

  const loadEvents = useCallback(async () => {
    if (!accessToken) return

    try {
      const data = await gql<{ myTrainingEvents: TrainingEvent[] }>(MY_TRAINING_EVENTS_QUERY, {}, { accessToken })
      setEvents(data.myTrainingEvents ?? [])
    } catch (err) {
      console.error('Failed to load training events:', err)
      toast('Greška pri učitavanju treninga', 'error')
    } finally {
      setLoading(false)
    }
  }, [accessToken, toast])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/training')
      return
    }

    if (accessToken && !loadedRef.current) {
      loadedRef.current = true
      loadEvents()
    }
  }, [authLoading, user, accessToken, loadEvents, router])

  async function handleDelete(eventId: string, eventName: string) {
    const confirmed = await confirm({
      title: 'Obriši trening',
      message: `Da li ste sigurni da želite da obrišete "${eventName}"? Ova akcija se ne može poništiti.`,
      confirmText: 'Obriši',
      cancelText: 'Otkaži',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      await gql(DELETE_TRAINING_EVENT_MUTATION, { eventId }, { accessToken })
      toast('Trening obrisan', 'success')
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri brisanju', 'error')
    }
  }

  if (authLoading || loading) {
    return <LoadingState />
  }

  if (!user) {
    return null
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return 'TBD'
    const tz = 'Europe/Belgrade'
    const day = parseInt(d.toLocaleDateString('sr-Latn-RS', { day: 'numeric', timeZone: tz }))
    const month = d.toLocaleDateString('sr-Latn-RS', { month: 'short', timeZone: tz }).replace('.', '')
    const year = parseInt(d.toLocaleDateString('sr-Latn-RS', { year: 'numeric', timeZone: tz }))
    return `${day}. ${month} ${year}.`
  }

  const typeLabel = (t: string) => (t === 'TRAIL' ? 'Trail' : t === 'OCR' ? 'OCR' : 'Ulična')

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading>Moji treninzi</Heading>
        <Button href="/training/new" color="brand">
          <PlusIcon className="size-4" />
          Kreiraj trening
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-lg text-text-primary">Nemate još nijedan trening.</p>
          <p className="mt-2 text-sm text-text-secondary">
            Kreirajte svoj prvi trening i podelite ga sa prijateljima.
          </p>
          <Button href="/training/new" color="brand" className="mt-4">
            Kreiraj prvi trening
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {events.map((event) => {
            const earliestRace = event.races.length > 0
              ? event.races.reduce((a, b) =>
                  new Date(a.startDateTime).getTime() < new Date(b.startDateTime).getTime() ? a : b
                )
              : null

            return (
              <div
                key={event.id}
                className="rounded-xl border border-border-primary bg-card p-5 transition-colors hover:border-border-secondary"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-text-primary">
                        {event.eventName}
                      </h3>
                      <Badge color={event.type === 'TRAIL' ? 'emerald' : event.type === 'OCR' ? 'orange' : 'sky'}>
                        {typeLabel(event.type)}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="mt-1 text-sm text-text-secondary">{event.description}</p>
                    )}
                    <div className="mt-2 text-sm text-text-secondary">
                      {event.races.length} {event.races.length === 1 ? 'staza' : event.races.length < 5 ? 'staze' : 'staza'}
                      {earliestRace && ` · ${formatDate(earliestRace.startDateTime)}`}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button href={`/events/${event.slug}`} outline>
                      Pogledaj
                    </Button>
                    <Button href={`/training/${event.id}/edit`} outline>
                      Izmeni
                    </Button>
                    <button
                      onClick={() => handleDelete(event.id, event.eventName)}
                      className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-900/20"
                      title="Obriši trening"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
