'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Button } from '@/components/button'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { OrganizerSelect } from '@/components/organizer-select'
import { useToast } from '@/components/toast'
import { GalleryUpload } from '@/components/gallery-upload'
import { GpxUpload } from '@/components/gpx-upload'
import { ImageUpload } from '@/components/image-upload'
import { SocialMediaInput } from '@/components/social-media-input'
import { TagsInput } from '@/components/tags-input'
import { toTitleCase, toDateTimeLocalString } from '@/lib/formatters'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type RaceInput = {
  tempId: string
  raceName: string
  length: string
  elevation: string
  startDateTime: string
  endDateTime: string
  startLocation: string
  registrationEnabled: boolean
  registrationSite: string
  competitionId: string
  gpsFile: string
}

type Competition = {
  id: string
  name: string
}

const CREATE_EVENT_MUTATION = `
  mutation CreateRaceEvent($input: CreateRaceEventInput!) {
    createRaceEvent(input: $input) {
      id
      slug
    }
  }
`

const CREATE_RACE_MUTATION = `
  mutation CreateRace($input: CreateRaceInput!) {
    createRace(input: $input) {
      id
    }
  }
`

const COMPETITIONS_QUERY = `
  query Competitions {
    competitions {
      id
      name
    }
  }
`

function generateSlug(name: string, year: number): string {
  return (
    name
      .toLowerCase()
      .replace(/[čć]/g, 'c')
      .replace(/[šś]/g, 's')
      .replace(/[žź]/g, 'z')
      .replace(/đ/g, 'dj')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${year}`
  )
}

export default function NewEventPage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)

  // Event fields
  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState<'TRAIL' | 'ROAD' | 'OCR'>('TRAIL')
  const [description, setDescription] = useState('')
  const [mainImage, setMainImage] = useState('')
  const [gallery, setGallery] = useState<string[]>([])
  const [registrationSite, setRegistrationSite] = useState('')
  const [socialMedia, setSocialMedia] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [slug, setSlug] = useState('')
  const [autoSlug, setAutoSlug] = useState(true)

  // Organizer
  const [organizerId, setOrganizerId] = useState<string | null>(null)

  // Competitions
  const [competitions, setCompetitions] = useState<Competition[]>([])

  // Races
  const [races, setRaces] = useState<RaceInput[]>([])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
      return
    }

    if (accessToken) {
      gql<{ competitions: Competition[] }>(COMPETITIONS_QUERY, {}, { accessToken })
        .then((data) => {
          if (data.competitions) setCompetitions(data.competitions)
        })
        .catch(() => {})
    }
  }, [authLoading, user, accessToken, router])

  // Auto-generate slug when name changes
  useEffect(() => {
    if (autoSlug && eventName) {
      const year = new Date().getFullYear()
      setSlug(generateSlug(eventName, year))
    }
  }, [eventName, autoSlug])

  function addRace() {
    const defaultDate = new Date()
    defaultDate.setMonth(defaultDate.getMonth() + 1)
    defaultDate.setHours(9, 0, 0, 0)

    setRaces((prev) => [
      ...prev,
      {
        tempId: Math.random().toString(36).slice(2),
        raceName: '',
        length: '',
        elevation: '',
        startDateTime: toDateTimeLocalString(defaultDate),
        endDateTime: '',
        startLocation: '',
        registrationEnabled: true,
        registrationSite: '',
        competitionId: '',
        gpsFile: '',
      },
    ])
  }

  function updateRace(tempId: string, field: keyof RaceInput, value: string | boolean) {
    setRaces((prev) => prev.map((r) => (r.tempId === tempId ? { ...r, [field]: value } : r)))
  }

  function removeRace(tempId: string) {
    setRaces((prev) => prev.filter((r) => r.tempId !== tempId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!eventName.trim()) {
      toast('Unesite naziv događaja', 'error')
      return
    }

    if (!slug.trim()) {
      toast('Unesite slug', 'error')
      return
    }

    setLoading(true)
    try {
      // 1. Create the event
      const eventData = await gql<{ createRaceEvent: { id: string; slug: string } }>(
        CREATE_EVENT_MUTATION,
        {
          input: {
            eventName: eventName.trim(),
            slug: slug.trim(),
            type: eventType,
            description: description.trim() || null,
            mainImage: mainImage.trim() || null,
            gallery: gallery.length > 0 ? gallery : null,
            registrationSite: registrationSite.trim() || null,
            socialMedia: socialMedia.length > 0 ? socialMedia : null,
            tags: tags.length > 0 ? tags : null,
            organizerId: organizerId || null,
          },
        },
        { accessToken }
      )

      const eventId = eventData.createRaceEvent.id

      // 2. Create races
      for (const race of races) {
        if (!race.raceName.trim() || !race.length) continue

        await gql(
          CREATE_RACE_MUTATION,
          {
            input: {
              raceEventId: eventId,
              raceName: race.raceName.trim(),
              length: parseFloat(race.length),
              elevation: race.elevation ? parseFloat(race.elevation) : null,
              startDateTime: new Date(race.startDateTime).toISOString(),
              endDateTime: race.endDateTime ? new Date(race.endDateTime).toISOString() : null,
              startLocation: race.startLocation.trim() || 'TBD',
              registrationEnabled: race.registrationEnabled,
              registrationSite: race.registrationSite.trim() || null,
              competitionId: race.competitionId || null,
              gpsFile: race.gpsFile.trim() || null,
            },
          },
          { accessToken }
        )
      }

      toast('Događaj kreiran uspešno!', 'success')
      router.push('/admin/events')
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri kreiranju', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return <LoadingState />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
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

      <Heading>Novi događaj</Heading>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        {/* Event details */}
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
                onChange={(e) => setEventName(toTitleCase(e.target.value))}
                placeholder="npr. Avala Trail"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                required
              />
            </div>

            {/* Slug */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Slug (URL) *
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value)
                    setAutoSlug(false)
                  }}
                  placeholder="avala-trail-2024"
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                  required
                />
                {!autoSlug && (
                  <button
                    type="button"
                    onClick={() => {
                      setAutoSlug(true)
                      const year = new Date().getFullYear()
                      setSlug(generateSlug(eventName, year))
                    }}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                  >
                    Auto
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                URL: /events/{slug || 'slug'}
              </p>
            </div>

            {/* Type */}
            <div>
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
                <option value="OCR">OCR</option>
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
                rows={3}
                placeholder="Kratki opis događaja..."
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
            <ImageUpload
              value={mainImage || null}
              onChange={(url) => setMainImage(url || '')}
              endpoint="eventImage"
              label="Glavna slika"
            />

            <GalleryUpload value={gallery} onChange={setGallery} />
          </div>
        </div>

        {/* Organizer */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <Subheading>Organizator</Subheading>
          <p className="mt-1 mb-4 text-sm text-zinc-500">
            Izaberite postojećeg organizatora ili dodajte novog
          </p>

          <OrganizerSelect value={organizerId} onChange={setOrganizerId} />
        </div>

        {/* Links */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <Subheading>Linkovi i društvene mreže</Subheading>

          <div className="mt-4 space-y-4">
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

            <SocialMediaInput value={socialMedia} onChange={setSocialMedia} />
          </div>
        </div>

        {/* Races */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <Subheading>Trke ({races.length})</Subheading>
            <button
              type="button"
              onClick={addRace}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
            >
              <PlusIcon className="size-4" />
              Dodaj trku
            </button>
          </div>

          {races.length === 0 ? (
            <p className="mt-4 text-center text-sm text-zinc-500">
              Nema trka. Kliknite &quot;Dodaj trku&quot; da dodate prvu trku.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {races.map((race, index) => (
                <div
                  key={race.tempId}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium">Trka #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeRace(race.tempId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Naziv trke *
                      </label>
                      <input
                        type="text"
                        value={race.raceName}
                        onChange={(e) => updateRace(race.tempId, 'raceName', toTitleCase(e.target.value))}
                        placeholder="npr. Avala 18K"
                        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Datum i vreme *
                      </label>
                      <input
                        type="datetime-local"
                        value={race.startDateTime}
                        onChange={(e) => updateRace(race.tempId, 'startDateTime', e.target.value)}
                        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Cut-off vreme
                      </label>
                      <input
                        type="datetime-local"
                        value={race.endDateTime}
                        onChange={(e) => updateRace(race.tempId, 'endDateTime', e.target.value)}
                        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Dužina (km) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={race.length}
                        onChange={(e) => updateRace(race.tempId, 'length', e.target.value)}
                        placeholder="18"
                        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Visinska razlika (m)
                      </label>
                      <input
                        type="number"
                        value={race.elevation}
                        onChange={(e) => updateRace(race.tempId, 'elevation', e.target.value)}
                        placeholder="520"
                        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Startna lokacija
                      </label>
                      <input
                        type="text"
                        value={race.startLocation}
                        onChange={(e) => updateRace(race.tempId, 'startLocation', e.target.value)}
                        placeholder="Adresa ili Google Maps link"
                        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
                      />
                    </div>

                    {/* Competition */}
                    {competitions.length > 0 && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Takmičenje / Serija
                        </label>
                        <select
                          value={race.competitionId}
                          onChange={(e) => updateRace(race.tempId, 'competitionId', e.target.value)}
                          className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
                        >
                          <option value="">Bez takmičenja</option>
                          {competitions.map((comp) => (
                            <option key={comp.id} value={comp.id}>
                              {comp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Registration */}
                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={race.registrationEnabled}
                          onChange={(e) => updateRace(race.tempId, 'registrationEnabled', e.target.checked)}
                          className="size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          Omogući prijave za ovu trku
                        </span>
                      </label>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Link za registraciju (eksterni)
                      </label>
                      <input
                        type="url"
                        value={race.registrationSite}
                        onChange={(e) => updateRace(race.tempId, 'registrationSite', e.target.value)}
                        placeholder="https://..."
                        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <GpxUpload
                        value={race.gpsFile || null}
                        onChange={(url) => updateRace(race.tempId, 'gpsFile', url || '')}
                        label="GPX staza"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" color="blue" disabled={loading}>
            {loading ? 'Kreiranje...' : 'Kreiraj događaj'}
          </Button>
          <Button href="/admin/events" outline>
            Odustani
          </Button>
        </div>
      </form>
    </>
  )
}
