'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Button } from '@/components/button'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import { GpxUpload } from '@/components/gpx-upload'
import { toTitleCase, toDateTimeLocalString } from '@/lib/formatters'
import { ChevronLeftIcon } from '@heroicons/react/16/solid'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type EventData = {
 id: string
 eventName: string
 slug: string
}

type Competition = {
 id: string
 name: string
}

const EVENT_BY_ID_QUERY = `
 query RaceEventById($id: ID!) {
  raceEvent(id: $id) {
   id
   eventName
   slug
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

const CREATE_RACE_MUTATION = `
 mutation CreateRace($input: CreateRaceInput!) {
  createRace(input: $input) {
   id
   raceName
  }
 }
`

export default function NewRacePage() {
 const params = useParams()
 const router = useRouter()
 const { user, accessToken, isLoading: authLoading } = useAuth()
 const { toast } = useToast()

 const eventId = params.eventId as string

 const [event, setEvent] = useState<EventData | null>(null)
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const loadedRef = useRef(false)

 // Form state
 const [raceName, setRaceName] = useState('')
 const [length, setLength] = useState('')
 const [elevation, setElevation] = useState('')
 const [startDateTime, setStartDateTime] = useState('')
 const [startLocation, setStartLocation] = useState('')
 const [registrationEnabled, setRegistrationEnabled] = useState(true)
 const [registrationSite, setRegistrationSite] = useState('')
 const [endDateTime, setEndDateTime] = useState('')
 const [competitionId, setCompetitionId] = useState('')
 const [competitions, setCompetitions] = useState<Competition[]>([])
 const [gpsFile, setGpsFile] = useState('')

 useEffect(() => {
  if (!authLoading && (!user || user.role !== 'ADMIN')) {
   router.push('/')
   return
  }

  if (accessToken && !loadedRef.current) {
   loadedRef.current = true

   // Set default date/time to 1 month from now at 9:00
   const defaultDate = new Date()
   defaultDate.setMonth(defaultDate.getMonth() + 1)
   defaultDate.setHours(9, 0, 0, 0)
   setStartDateTime(toDateTimeLocalString(defaultDate))

   // Load event data and competitions in parallel
   Promise.all([
    gql<{ raceEvent: EventData | null }>(EVENT_BY_ID_QUERY, { id: eventId }, { accessToken }),
    gql<{ competitions: Competition[] }>(COMPETITIONS_QUERY, {}, { accessToken }),
   ])
    .then(([eventData, competitionsData]) => {
     if (eventData.raceEvent) {
      setEvent(eventData.raceEvent)
     }
     if (competitionsData.competitions) {
      setCompetitions(competitionsData.competitions)
     }
    })
    .catch((err) => {
     console.error('Failed to load data:', err)
     toast('Greška pri učitavanju podataka', 'error')
    })
    .finally(() => {
     setLoading(false)
    })
  }
 }, [authLoading, user, accessToken, eventId, router, toast])

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()

  if (!raceName.trim()) {
   toast('Unesite naziv trke', 'error')
   return
  }

  if (!length || parseFloat(length) <= 0) {
   toast('Unesite validnu dužinu trke', 'error')
   return
  }

  if (!startDateTime) {
   toast('Unesite datum i vreme starta', 'error')
   return
  }

  setSaving(true)
  try {
   await gql(
    CREATE_RACE_MUTATION,
    {
     input: {
      raceEventId: eventId,
      raceName: raceName.trim(),
      length: parseFloat(length),
      elevation: elevation ? parseFloat(elevation) : null,
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: endDateTime ? new Date(endDateTime).toISOString() : null,
      startLocation: startLocation.trim() || 'TBD',
      registrationEnabled,
      registrationSite: registrationSite.trim() || null,
      competitionId: competitionId || null,
      gpsFile: gpsFile.trim() || null,
     },
    },
    { accessToken }
   )

   toast('Trka kreirana uspešno!', 'success')
   router.push(`/admin/events/${eventId}/edit`)
  } catch (err: any) {
   toast(err?.message ?? 'Greška pri kreiranju', 'error')
  } finally {
   setSaving(false)
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
     href={`/admin/events/${eventId}/edit`}
     className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
    >
     <ChevronLeftIcon className="size-4" />
     {event.eventName}
    </Link>
   </div>

   <Heading>Nova trka</Heading>
   <p className="mt-1 text-sm text-text-secondary">
    Dodajete trku za događaj: <strong>{event.eventName}</strong>
   </p>

   <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
    <div className="rounded-lg border border-border-primary p-6">
     <Subheading>Informacije o trci</Subheading>

     <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {/* Race name */}
      <div className="sm:col-span-2">
       <label className="block text-sm font-medium text-text-secondary">
        Naziv trke *
       </label>
       <input
        type="text"
        value={raceName}
        onChange={(e) => setRaceName(toTitleCase(e.target.value))}
        placeholder="npr. Avala 18K"
        className="mt-1 w-full rounded-lg border border-border-secondary px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-surface"
        required
       />
      </div>

      {/* Start date/time */}
      <div>
       <label className="block text-sm font-medium text-text-secondary">
        Datum i vreme starta *
       </label>
       <input
        type="datetime-local"
        value={startDateTime}
        onChange={(e) => setStartDateTime(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border-secondary px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-surface"
        required
       />
      </div>

      {/* End date/time (cut-off) */}
      <div>
       <label className="block text-sm font-medium text-text-secondary">
        Cut-off vreme
       </label>
       <input
        type="datetime-local"
        value={endDateTime}
        onChange={(e) => setEndDateTime(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border-secondary px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-surface"
       />
       <p className="mt-1 text-xs text-text-secondary">Opciono - krajnje vreme za završetak trke</p>
      </div>

      {/* Length */}
      <div>
       <label className="block text-sm font-medium text-text-secondary">
        Dužina (km) *
       </label>
       <input
        type="number"
        step="0.1"
        min="0"
        value={length}
        onChange={(e) => setLength(e.target.value)}
        placeholder="18"
        className="mt-1 w-full rounded-lg border border-border-secondary px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-surface"
        required
       />
      </div>

      {/* Elevation */}
      <div>
       <label className="block text-sm font-medium text-text-secondary">
        Visinska razlika (m)
       </label>
       <input
        type="number"
        min="0"
        value={elevation}
        onChange={(e) => setElevation(e.target.value)}
        placeholder="520"
        className="mt-1 w-full rounded-lg border border-border-secondary px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-surface"
       />
      </div>

      {/* Start location */}
      <div>
       <label className="block text-sm font-medium text-text-secondary">
        Startna lokacija
       </label>
       <input
        type="text"
        value={startLocation}
        onChange={(e) => setStartLocation(e.target.value)}
        placeholder="Adresa ili Google Maps link"
        className="mt-1 w-full rounded-lg border border-border-secondary px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-surface"
       />
      </div>

      {/* Competition */}
      {competitions.length > 0 && (
       <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-text-secondary">
         Takmičenje / Serija
        </label>
        <select
         value={competitionId}
         onChange={(e) => setCompetitionId(e.target.value)}
         className="mt-1 w-full rounded-lg border border-border-secondary px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-surface"
        >
         <option value="">Bez takmičenja</option>
         {competitions.map((comp) => (
          <option key={comp.id} value={comp.id}>
           {comp.name}
          </option>
         ))}
        </select>
        <p className="mt-1 text-xs text-text-secondary">
         Opciono - ako trka pripada nekoj seriji ili ligi
        </p>
       </div>
      )}

      {/* Registration enabled */}
      <div className="sm:col-span-2">
       <label className="flex items-center gap-3">
        <input
         type="checkbox"
         checked={registrationEnabled}
         onChange={(e) => setRegistrationEnabled(e.target.checked)}
         className="size-4 rounded border-border-secondary text-brand-green focus:ring-brand-green"
        />
        <span className="text-sm font-medium text-text-secondary">
         Omogući prijave za ovu trku
        </span>
       </label>
      </div>

      {/* Registration site */}
      <div className="sm:col-span-2">
       <label className="block text-sm font-medium text-text-secondary">
        Link za registraciju (eksterni)
       </label>
       <input
        type="url"
        value={registrationSite}
        onChange={(e) => setRegistrationSite(e.target.value)}
        placeholder="https://..."
        className="mt-1 block w-full rounded-lg border border-border-secondary px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-surface"
       />
       <p className="mt-1 text-xs text-text-secondary">
        Opciono — link ka eksternoj registraciji specifičan za ovu trku
       </p>
      </div>

      {/* GPX file */}
      <div className="sm:col-span-2">
       <GpxUpload value={gpsFile || null} onChange={(url) => setGpsFile(url || '')} label="GPX staza" />
      </div>
     </div>
    </div>

    {/* Submit */}
    <div className="flex gap-4">
     <Button type="submit" color="blue" disabled={saving}>
      {saving ? 'Kreiranje...' : 'Kreiraj trku'}
     </Button>
     <Button href={`/admin/events/${eventId}/edit`} outline>
      Odustani
     </Button>
    </div>
   </form>
  </>
 )
}
