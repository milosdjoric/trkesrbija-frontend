'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Button } from '@/components/button'
import { useConfirm } from '@/components/confirm-dialog'
import { GalleryUpload } from '@/components/gallery-upload'
import { Heading, Subheading } from '@/components/heading'
import { ImageUpload } from '@/components/image-upload'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { SocialMediaInput } from '@/components/social-media-input'
import { TagsInput } from '@/components/tags-input'
import { useToast } from '@/components/toast'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

// Helper to generate slug from text
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[čćžšđ]/g, (c) => ({ č: 'c', ć: 'c', ž: 'z', š: 's', đ: 'd' })[c] || c)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

type RaceData = {
  id: string
  raceName: string | null
  length: number
  elevation: number | null
  startDateTime: string
  startLocation: string | null
  registrationEnabled: boolean
}

type OrganizerData = {
  id: string
  name: string
  contactPhone: string | null
  contactEmail: string | null
  organizerSite: string | null
}

type EventData = {
  id: string
  eventName: string
  slug: string
  type: 'TRAIL' | 'ROAD'
  description: string | null
  mainImage: string | null
  gallery: string[]
  registrationSite: string | null
  socialMedia: string[]
  tags: string[]
  organizer: OrganizerData | null
  races: RaceData[]
}

const EVENT_BY_ID_QUERY = `
  query RaceEventById($id: ID!) {
    raceEvent(id: $id) {
      id
      eventName
      slug
      type
      description
      mainImage
      gallery
      registrationSite
      socialMedia
      tags
      organizer {
        id
        name
        contactPhone
        contactEmail
        organizerSite
      }
      races {
        id
        raceName
        length
        elevation
        startDateTime
        startLocation
        registrationEnabled
      }
    }
  }
`

const UPDATE_EVENT_MUTATION = `
  mutation UpdateRaceEvent($eventId: ID!, $input: UpdateRaceEventInput!) {
    updateRaceEvent(eventId: $eventId, input: $input) {
      id
      eventName
      slug
    }
  }
`

const DELETE_RACE_MUTATION = `
  mutation DeleteRace($raceId: ID!) {
    deleteRace(raceId: $raceId)
  }
`

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const eventId = params.eventId as string

  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const loadedRef = useRef(false)

  // Form state
  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState<'TRAIL' | 'ROAD'>('TRAIL')
  const [description, setDescription] = useState('')
  const [mainImage, setMainImage] = useState('')
  const [gallery, setGallery] = useState<string[]>([])
  const [registrationSite, setRegistrationSite] = useState('')
  const [socialMedia, setSocialMedia] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [slug, setSlug] = useState('')

  // Organizer inline fields
  const [organizerName, setOrganizerName] = useState('')
  const [organizerPhone, setOrganizerPhone] = useState('')
  const [organizerEmail, setOrganizerEmail] = useState('')
  const [organizerSite, setOrganizerSite] = useState('')

  const loadEvent = useCallback(async () => {
    if (!accessToken) return

    try {
      const eventData = await gql<{ raceEvent: EventData | null }>(EVENT_BY_ID_QUERY, { id: eventId }, { accessToken })

      if (eventData.raceEvent) {
        const e = eventData.raceEvent
        setEvent(e)
        setEventName(e.eventName)
        setEventType(e.type)
        setDescription(e.description || '')
        setMainImage(e.mainImage || '')
        setGallery(e.gallery || [])
        setRegistrationSite(e.registrationSite || '')
        setSocialMedia(e.socialMedia || [])
        setTags(e.tags || [])
        setSlug(e.slug)
        // Load organizer data
        setOrganizerName(e.organizer?.name || '')
        setOrganizerPhone(e.organizer?.contactPhone || '')
        setOrganizerEmail(e.organizer?.contactEmail || '')
        setOrganizerSite(e.organizer?.organizerSite || '')
      }
    } catch (err) {
      console.error('Failed to load event:', err)
      toast('Greška pri učitavanju događaja', 'error')
    } finally {
      setLoading(false)
    }
  }, [accessToken, eventId, toast])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
      return
    }

    if (accessToken && !loadedRef.current) {
      loadedRef.current = true
      loadEvent()
    }
  }, [authLoading, user, accessToken, loadEvent, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!eventName.trim()) {
      toast('Unesite naziv događaja', 'error')
      return
    }

    // Generate slug from event name if empty
    const finalSlug = slug.trim() || generateSlug(eventName)

    setSaving(true)
    try {
      const input: Record<string, unknown> = {
        eventName: eventName.trim(),
        slug: finalSlug,
        type: eventType,
        description: description.trim() || null,
        mainImage: mainImage.trim() || null,
        gallery,
        registrationSite: registrationSite.trim() || null,
        socialMedia,
        tags,
      }

      // Add organizer if name is provided
      if (organizerName.trim()) {
        input.organizer = {
          name: organizerName.trim(),
          contactPhone: organizerPhone.trim() || null,
          contactEmail: organizerEmail.trim() || null,
          organizerSite: organizerSite.trim() || null,
        }
      }

      await gql(
        UPDATE_EVENT_MUTATION,
        { eventId, input },
        { accessToken }
      )

      toast('Događaj sačuvan uspešno!', 'success')
      router.push(`/events/${finalSlug}`)
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri čuvanju', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteRace(raceId: string, raceName: string | null) {
    const confirmed = await confirm({
      title: 'Obriši trku',
      message: `Da li ste sigurni da želite da obrišete trku "${raceName || 'Bez imena'}"? Ova akcija se ne može poništiti.`,
      confirmText: 'Obriši',
      cancelText: 'Otkaži',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      await gql(DELETE_RACE_MUTATION, { raceId }, { accessToken })
      toast('Trka obrisana', 'success')
      await loadEvent()
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri brisanju', 'error')
    }
  }

  if (authLoading || loading) {
    return <LoadingState />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  if (!event) {
    return (
      <div className="py-12 text-center">
        <Heading>Događaj nije pronađen</Heading>
      </div>
    )
  }

  return (
    <>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4" />
          Događaji
        </Link>
      </div>

      <Heading>Izmeni događaj</Heading>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        {/* Basic info */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <Subheading>Osnovne informacije</Subheading>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Event name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Naziv događaja *
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="npr. Avala Trail"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                required
              />
            </div>

            {/* Slug */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Slug (URL)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={generateSlug(eventName) || 'avala-trail-2024'}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <p className="mt-1 text-xs text-zinc-500">
                URL: /events/{slug || generateSlug(eventName) || 'slug'}
                {!slug && eventName && ' (automatski generisan)'}
              </p>
            </div>

            {/* Type */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Tip događaja *
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              >
                <option value="TRAIL">Trail</option>
                <option value="ROAD">Ulična</option>
              </select>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Opis
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Detaljni opis događaja..."
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>

            {/* Tags */}
            <div className="sm:col-span-2">
              <TagsInput value={tags} onChange={setTags} />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <Subheading>Slike</Subheading>

          <div className="mt-4 space-y-6">
            {/* Main image */}
            <ImageUpload
              value={mainImage || null}
              onChange={(url) => setMainImage(url || '')}
              endpoint="eventImage"
              label="Glavna slika"
            />

            {/* Gallery */}
            <GalleryUpload value={gallery} onChange={setGallery} />
          </div>
        </div>

        {/* Organizer */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <Subheading>Organizator</Subheading>
          <p className="mt-1 text-sm text-zinc-500">Unesite podatke o organizatoru događaja</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Organizer name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Naziv organizatora
              </label>
              <input
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="npr. Trkački klub Avala"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>

            {/* Organizer phone */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Telefon
              </label>
              <input
                type="tel"
                value={organizerPhone}
                onChange={(e) => setOrganizerPhone(e.target.value)}
                placeholder="+381 64 123 4567"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>

            {/* Organizer email */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <input
                type="email"
                value={organizerEmail}
                onChange={(e) => setOrganizerEmail(e.target.value)}
                placeholder="info@organizator.rs"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>

            {/* Organizer website */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Sajt organizatora
              </label>
              <input
                type="url"
                value={organizerSite}
                onChange={(e) => setOrganizerSite(e.target.value)}
                placeholder="https://organizator.rs"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <Subheading>Linkovi i društvene mreže</Subheading>

          <div className="mt-4 space-y-4">
            {/* Registration site */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Sajt za prijave
              </label>
              <input
                type="url"
                value={registrationSite}
                onChange={(e) => setRegistrationSite(e.target.value)}
                placeholder="https://prijave.example.com"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Eksterni link ako se prijave ne vode preko ovog sistema
              </p>
            </div>

            {/* Social media */}
            <SocialMediaInput value={socialMedia} onChange={setSocialMedia} />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" color="blue" disabled={saving}>
            {saving ? 'Čuvanje...' : 'Sačuvaj izmene'}
          </Button>
          <Button href="/admin/events" outline>
            Odustani
          </Button>
        </div>
      </form>

      {/* Races section */}
      <div className="mt-8 max-w-2xl">
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <Subheading>Trke ({event.races.length})</Subheading>
            <Button href={`/admin/events/${eventId}/races/new`} outline>
              <PlusIcon className="size-4" />
              Dodaj trku
            </Button>
          </div>

          {event.races.length === 0 ? (
            <p className="mt-4 text-center text-sm text-zinc-500">
              Nema trka za ovaj događaj.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {event.races.map((race) => (
                <div
                  key={race.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
                >
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {race.raceName || 'Bez naziva'}
                    </div>
                    <div className="mt-1 text-sm text-zinc-500">
                      {race.length} km
                      {race.elevation && ` • ${race.elevation}m D+`}
                      {' • '}
                      {(() => {
                        const d = new Date(race.startDateTime)
                        const day = d.getDate()
                        const month = d.toLocaleDateString('sr-Latn-RS', { month: 'short' }).replace('.', '')
                        const year = d.getFullYear()
                        const time = d.toLocaleTimeString('sr-Latn-RS', { hour: '2-digit', minute: '2-digit', hour12: false })
                        return `${day}. ${month} ${year}. ${time}`
                      })()}
                    </div>
                    <div className="mt-1">
                      {race.registrationEnabled ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Prijave otvorene
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          Prijave zatvorene
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button href={`/admin/races/${race.id}/edit`} color="blue">
                      Izmeni
                    </Button>
                    <Button href={`/admin/races/${race.id}/registrations`} outline>
                      Prijave
                    </Button>
                    <button
                      onClick={() => handleDeleteRace(race.id, race.raceName)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      title="Obriši trku"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
