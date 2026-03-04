'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Button } from '@/components/button'
import { GpxUpload } from '@/components/gpx-upload'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import { toTitleCase, toDateTimeLocalString } from '@/lib/formatters'
import { ChevronLeftIcon } from '@heroicons/react/16/solid'
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

type Competition = {
 id: string
 name: string
}

type RaceEventOption = {
 id: string
 eventName: string
}

type RaceData = {
 id: string
 slug: string
 raceName: string | null
 length: number
 elevation: number | null
 gpsFile: string | null
 startDateTime: string
 endDateTime: string | null
 startLocation: string | null
 registrationEnabled: boolean
 registrationSite: string | null
 competitionId: string | null
 competition: Competition | null
 raceEvent: {
  id: string
  eventName: string
  slug: string
  registrationSite: string | null
 }
}

const RACE_BY_ID_QUERY = `
 query RaceById($id: ID!) {
  race(id: $id) {
   id
   slug
   raceName
   length
   elevation
   gpsFile
   startDateTime
   endDateTime
   startLocation
   registrationEnabled
   registrationSite
   competitionId
   competition {
    id
    name
   }
   raceEvent {
    id
    eventName
    slug
    registrationSite
   }
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

const EVENTS_QUERY = `
 query AllEvents {
  raceEvents(limit: 1000) {
   id
   eventName
  }
 }
`

const UPDATE_RACE_MUTATION = `
 mutation UpdateRace($raceId: ID!, $input: UpdateRaceInput!) {
  updateRace(raceId: $raceId, input: $input) {
   id
   slug
   raceName
   length
   elevation
   startDateTime
   endDateTime
   startLocation
   registrationEnabled
   registrationSite
   competitionId
  }
 }
`

export default function EditRacePage() {
 const params = useParams()
 const router = useRouter()
 const { user, accessToken, isLoading: authLoading } = useAuth()
 const { toast } = useToast()

 const raceId = params.raceId as string

 const [race, setRace] = useState<RaceData | null>(null)
 const [competitions, setCompetitions] = useState<Competition[]>([])
 const [events, setEvents] = useState<RaceEventOption[]>([])
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const loadedRef = useRef(false)

 // Form state
 const [raceName, setRaceName] = useState('')
 const [slug, setSlug] = useState('')
 const [length, setLength] = useState('')
 const [elevation, setElevation] = useState('')
 const [gpsFile, setGpsFile] = useState('')
 const [startDateTime, setStartDateTime] = useState('')
 const [endDateTime, setEndDateTime] = useState('')
 const [startLocation, setStartLocation] = useState('')
 const [registrationEnabled, setRegistrationEnabled] = useState(true)
 const [registrationSite, setRegistrationSite] = useState('')
 const [competitionId, setCompetitionId] = useState('')
 const [raceEventId, setRaceEventId] = useState('')

 const loadRace = useCallback(async () => {
  if (!accessToken) return

  try {
   // Load race, competitions, and events in parallel
   const [raceData, competitionsData, eventsData] = await Promise.all([
    gql<{ race: RaceData | null }>(RACE_BY_ID_QUERY, { id: raceId }, { accessToken }),
    gql<{ competitions: Competition[] }>(COMPETITIONS_QUERY, {}, { accessToken }),
    gql<{ raceEvents: RaceEventOption[] }>(EVENTS_QUERY, {}, { accessToken }),
   ])

   if (competitionsData.competitions) {
    setCompetitions(competitionsData.competitions)
   }

   if (eventsData.raceEvents) {
    setEvents(eventsData.raceEvents.sort((a, b) => a.eventName.localeCompare(b.eventName)))
   }

   if (raceData.race) {
    setRace(raceData.race)
    setRaceName(raceData.race.raceName || '')
    setSlug(raceData.race.slug || '')
    setLength(raceData.race.length.toString())
    setElevation(raceData.race.elevation?.toString() || '')
    setGpsFile(raceData.race.gpsFile || '')
    // Convert ISO to datetime-local format using local time components
    setStartDateTime(toDateTimeLocalString(new Date(raceData.race.startDateTime)))
    if (raceData.race.endDateTime) {
     setEndDateTime(toDateTimeLocalString(new Date(raceData.race.endDateTime)))
    }
    setStartLocation(raceData.race.startLocation || '')
    setRegistrationEnabled(raceData.race.registrationEnabled)
    setRegistrationSite(raceData.race.registrationSite || '')
    setCompetitionId(raceData.race.competitionId || '')
    setRaceEventId(raceData.race.raceEvent.id)

    document.title = `Izmeni: ${raceData.race.raceName || 'Trka'} | Trke Srbija`
   }
  } catch (err) {
   console.error('Failed to load race:', err)
   toast('Greška pri učitavanju trke', 'error')
  } finally {
   setLoading(false)
  }
 }, [accessToken, raceId, toast])

 useEffect(() => {
  if (!authLoading && (!user || user.role !== 'ADMIN')) {
   router.push('/')
   return
  }

  if (accessToken && !loadedRef.current) {
   loadedRef.current = true
   loadRace()
  }
 }, [authLoading, user, accessToken, loadRace, router])

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

  // Generate slug from race name if empty
  const finalSlug = slug.trim() || generateSlug(raceName)

  setSaving(true)
  try {
   const result = await gql<{ updateRace: { slug: string } }>(
    UPDATE_RACE_MUTATION,
    {
     raceId,
     input: {
      raceName: raceName.trim(),
      slug: finalSlug,
      length: parseFloat(length),
      elevation: elevation ? parseFloat(elevation) : null,
      gpsFile: gpsFile.trim() || null,
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: endDateTime ? new Date(endDateTime).toISOString() : null,
      startLocation: startLocation.trim() || null,
      registrationEnabled,
      registrationSite: registrationSite.trim() || null,
      competitionId: competitionId || null,
      raceEventId: raceEventId || null,
     },
    },
    { accessToken }
   )

   toast('Trka sačuvana uspešno!', 'success')
   router.push(`/races/${result.updateRace.slug}`)
  } catch (err: any) {
   toast(err?.message ?? 'Greška pri čuvanju', 'error')
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

 if (!race) {
  return (
   <div className="py-12 text-center">
    <Heading>Trka nije pronađena</Heading>
   </div>
  )
 }

 return (
  <>
   {/* Back link */}
   <div className="mb-4">
    <Link
     href="/admin/races"
     className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300"
    >
     <ChevronLeftIcon className="size-4" />
     Sve trke
    </Link>
   </div>

   <Heading>Izmeni trku: {race.raceName || 'Bez naziva'}</Heading>

   <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
    {/* Event selector */}
    <div className="rounded-lg border border-dark-border p-6">
     <Subheading>Događaj</Subheading>
     <div className="mt-4">
      <label className="block text-sm font-medium text-gray-300">
       Pripada događaju
      </label>
      <select
       value={raceEventId}
       onChange={(e) => setRaceEventId(e.target.value)}
       className="mt-1 w-full rounded-lg border border-dark-border-light px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-dark-surface"
      >
       {events.map((ev) => (
        <option key={ev.id} value={ev.id}>
         {ev.eventName}
        </option>
       ))}
      </select>
      <p className="mt-1 text-xs text-gray-400">
       Promenite događaj kome ova trka pripada
      </p>
     </div>
    </div>

    <div className="rounded-lg border border-dark-border p-6">
     <Subheading>Informacije o trci</Subheading>

     <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {/* Race name */}
      <div className="sm:col-span-2">
       <label className="block text-sm font-medium text-gray-300">
        Naziv trke *
       </label>
       <input
        type="text"
        value={raceName}
        onChange={(e) => setRaceName(toTitleCase(e.target.value))}
        placeholder="npr. Avala 18K"
        className="mt-1 w-full rounded-lg border border-dark-border-light px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-dark-surface"
        required
       />
      </div>

      {/* Slug */}
      <div className="sm:col-span-2">
       <label className="block text-sm font-medium text-gray-300">
        URL slug
       </label>
       <div className="mt-1 flex items-center gap-2">
        <span className="text-sm text-gray-400">/races/</span>
        <input
         type="text"
         value={slug}
         onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
         placeholder={generateSlug(raceName) || 'naziv-trke-2025'}
         className="flex-1 rounded-lg border border-dark-border-light px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-dark-surface"
        />
        <Button
         type="button"
         outline
         onClick={() => {
          if (raceName.trim()) {
           setSlug(generateSlug(raceName))
          }
         }}
        >
         Generiši slug
        </Button>
       </div>
       <p className="mt-1 text-xs text-gray-400">
        URL: /races/{slug || generateSlug(raceName) || 'slug'}
        {!slug && raceName && ' (automatski generisan)'}
       </p>
      </div>

      {/* Start date/time */}
      <div>
       <label className="block text-sm font-medium text-gray-300">
        Datum i vreme starta *
       </label>
       <input
        type="datetime-local"
        value={startDateTime}
        onChange={(e) => setStartDateTime(e.target.value)}
        className="mt-1 w-full rounded-lg border border-dark-border-light px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-dark-surface"
        required
       />
      </div>

      {/* End date/time (cut-off) */}
      <div>
       <label className="block text-sm font-medium text-gray-300">
        Cut-off vreme
       </label>
       <input
        type="datetime-local"
        value={endDateTime}
        onChange={(e) => setEndDateTime(e.target.value)}
        className="mt-1 w-full rounded-lg border border-dark-border-light px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-dark-surface"
       />
       <p className="mt-1 text-xs text-gray-400">Opciono - krajnje vreme za završetak trke</p>
      </div>

      {/* Length */}
      <div>
       <label className="block text-sm font-medium text-gray-300">
        Dužina (km) *
       </label>
       <input
        type="number"
        step="0.1"
        min="0"
        value={length}
        onChange={(e) => setLength(e.target.value)}
        placeholder="18"
        className="mt-1 w-full rounded-lg border border-dark-border-light px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-dark-surface"
        required
       />
      </div>

      {/* Elevation */}
      <div>
       <label className="block text-sm font-medium text-gray-300">
        Visinska razlika (m)
       </label>
       <input
        type="number"
        min="0"
        value={elevation}
        onChange={(e) => setElevation(e.target.value)}
        placeholder="520"
        className="mt-1 w-full rounded-lg border border-dark-border-light px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-dark-surface"
       />
      </div>

      {/* Start location */}
      <div>
       <label className="block text-sm font-medium text-gray-300">
        Startna lokacija
       </label>
       <input
        type="text"
        value={startLocation}
        onChange={(e) => setStartLocation(e.target.value)}
        placeholder="Adresa ili Google Maps link"
        className="mt-1 w-full rounded-lg border border-dark-border-light px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-dark-surface"
       />
      </div>

      {/* GPX file */}
      <div className="sm:col-span-2">
       <GpxUpload
        value={gpsFile || null}
        onChange={(url) => setGpsFile(url || '')}
        label="GPX staza"
       />
      </div>

      {/* Competition */}
      <div className="sm:col-span-2">
       <label className="block text-sm font-medium text-gray-300">
        Takmičenje / Serija
       </label>
       <select
        value={competitionId}
        onChange={(e) => setCompetitionId(e.target.value)}
        className="mt-1 w-full rounded-lg border border-dark-border-light px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-dark-surface"
       >
        <option value="">Bez takmičenja</option>
        {competitions.map((comp) => (
         <option key={comp.id} value={comp.id}>
          {comp.name}
         </option>
        ))}
       </select>
       <p className="mt-1 text-xs text-gray-400">
        Opciono - ako trka pripada nekoj seriji ili ligi
       </p>
      </div>

      {/* Registration enabled */}
      <div className="sm:col-span-2">
       <label className="flex items-center gap-3">
        <input
         type="checkbox"
         checked={registrationEnabled}
         onChange={(e) => setRegistrationEnabled(e.target.checked)}
         className="size-4 rounded border-dark-border-light text-brand-green focus:ring-brand-green"
        />
        <span className="text-sm font-medium text-gray-300">
         Omogući prijave za ovu trku
        </span>
       </label>
      </div>

      {/* Registration site */}
      <div className="sm:col-span-2">
       <label className="block text-sm font-medium text-gray-300">
        Link za registraciju (eksterni)
       </label>
       <input
        type="url"
        value={registrationSite}
        onChange={(e) => setRegistrationSite(e.target.value)}
        placeholder="https://..."
        className="mt-1 block w-full rounded-lg border border-dark-border-light px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-dark-surface"
       />
       <p className="mt-1 text-xs text-gray-400">
        Ako ima link na nivou događaja, ovaj ga zamenjuje za ovu trku
       </p>
       {race?.raceEvent.registrationSite && (
        <p className="mt-2 rounded-md bg-amber-900/20 px-3 py-2 text-xs text-amber-400">
         Događaj već ima link za prijave:{' '}
         <a href={race.raceEvent.registrationSite} target="_blank" rel="noopener noreferrer" className="underline break-all">
          {race.raceEvent.registrationSite}
         </a>
        </p>
       )}
      </div>
     </div>
    </div>

    {/* Submit */}
    <div className="flex gap-4">
     <Button type="submit" color="blue" disabled={saving}>
      {saving ? 'Čuvanje...' : 'Sačuvaj izmene'}
     </Button>
     <Button href="/admin/races" outline>
      Odustani
     </Button>
    </div>
   </form>

   {/* Quick links */}
   <div className="mt-8 max-w-2xl rounded-lg border border-dark-border p-6">
    <Subheading>Brzi linkovi</Subheading>
    <div className="mt-4 flex flex-wrap gap-3">
     <Button href={`/admin/races/${raceId}/registrations`} outline>
      Prijave
     </Button>
     <Button href={`/admin/races/${raceId}/checkpoints`} outline>
      Checkpoint-ovi
     </Button>
     <Button href={`/admin/events/${race.raceEvent.id}/edit`} outline>
      Događaj
     </Button>
     <Button href={`/events/${race.raceEvent.slug}`} outline target="_blank">
      Prikaži na sajtu
     </Button>
    </div>
   </div>
  </>
 )
}
