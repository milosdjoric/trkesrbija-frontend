'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import {
  ChevronLeftIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type ImportType = 'events' | 'races' | 'combined'

type ParsedEvent = {
  eventName: string
  slug: string
  type: 'TRAIL' | 'ROAD' | 'OCR'
  description?: string
  registrationSite?: string
  tags?: string[]
  socialMedia?: string[]
  valid: boolean
  errors: string[]
}

type ParsedRace = {
  eventSlug: string
  raceName: string
  slug: string
  length: number
  elevation?: number
  startDateTime: string
  endDateTime?: string
  startLocation?: string
  registrationEnabled: boolean
  competitionName?: string
  valid: boolean
  errors: string[]
}

// Combined row can be either event or race
type ParsedCombinedRow = {
  rowType: 'event' | 'race'
  // Event fields
  eventName?: string
  eventSlug?: string
  eventType?: 'TRAIL' | 'ROAD' | 'OCR'
  description?: string
  registrationSite?: string
  tags?: string[]
  socialMedia?: string[]
  // Race fields
  raceName?: string
  raceSlug?: string
  length?: number
  elevation?: number
  startDateTime?: string
  endDateTime?: string
  startLocation?: string
  registrationEnabled?: boolean
  competitionName?: string
  // Common
  valid: boolean
  errors: string[]
}

const IMPORT_EVENTS_MUTATION = `
  mutation ImportEvents($events: [CreateRaceEventInput!]!) {
    importEvents(events: $events) {
      success
      imported
      failed
      errors
    }
  }
`

const IMPORT_RACES_MUTATION = `
  mutation ImportRaces($races: [ImportRaceInput!]!) {
    importRaces(races: $races) {
      success
      imported
      failed
      errors
    }
  }
`

// Helper to generate slug from text
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[čćžšđ]/g, (c) => ({ č: 'c', ć: 'c', ž: 'z', š: 's', đ: 'd' })[c] || c)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n')
  return lines.map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  })
}

function parseEvents(rows: string[][]): ParsedEvent[] {
  const [header, ...dataRows] = rows

  // Find column indices
  const nameIdx = header.findIndex(h => h.toLowerCase().includes('naziv') || h.toLowerCase() === 'eventname' || h.toLowerCase() === 'name')
  const slugIdx = header.findIndex(h => h.toLowerCase() === 'slug')
  const typeIdx = header.findIndex(h => h.toLowerCase().includes('tip') || h.toLowerCase() === 'type')
  const descIdx = header.findIndex(h => h.toLowerCase().includes('opis') || h.toLowerCase() === 'description')
  const regSiteIdx = header.findIndex(h => h.toLowerCase().includes('prijav') || h.toLowerCase().includes('registration'))
  const tagsIdx = header.findIndex(h => h.toLowerCase().includes('tag') || h.toLowerCase().includes('kategorij'))
  const socialIdx = header.findIndex(h => h.toLowerCase().includes('social') || h.toLowerCase().includes('mrež') || h.toLowerCase().includes('mrez'))

  return dataRows.map(row => {
    const errors: string[] = []

    const eventName = row[nameIdx]?.trim() || ''
    if (!eventName) errors.push('Naziv je obavezan')

    const slug = row[slugIdx]?.trim() || generateSlug(eventName)

    const typeRaw = row[typeIdx]?.trim().toUpperCase() || 'TRAIL'
    const type: 'TRAIL' | 'ROAD' | 'OCR' = typeRaw === 'ROAD' || typeRaw === 'ULIČNA' || typeRaw === 'ULICNA'
      ? 'ROAD'
      : typeRaw === 'OCR'
        ? 'OCR'
        : 'TRAIL'

    const description = row[descIdx]?.trim() || undefined
    const registrationSite = row[regSiteIdx]?.trim() || undefined
    const tagsRaw = row[tagsIdx]?.trim() || ''
    const tags = tagsRaw ? tagsRaw.split(';').map(t => t.trim()).filter(Boolean) : undefined
    const socialRaw = row[socialIdx]?.trim() || ''
    const socialMedia = socialRaw ? socialRaw.split(';').map(s => s.trim()).filter(Boolean) : undefined

    return {
      eventName,
      slug,
      type,
      description,
      registrationSite,
      tags,
      socialMedia,
      valid: errors.length === 0,
      errors,
    }
  }).filter(e => e.eventName) // Filter out empty rows
}

function parseRaces(rows: string[][]): ParsedRace[] {
  const [header, ...dataRows] = rows

  // Find column indices
  const eventSlugIdx = header.findIndex(h => h.toLowerCase().includes('event') || h.toLowerCase().includes('događaj'))
  const nameIdx = header.findIndex(h => h.toLowerCase().includes('naziv') || h.toLowerCase() === 'racename' || h.toLowerCase() === 'name')
  const slugIdx = header.findIndex(h => h.toLowerCase() === 'slug' || h.toLowerCase() === 'race_slug')
  const lengthIdx = header.findIndex(h => h.toLowerCase().includes('dužina') || h.toLowerCase().includes('duzina') || h.toLowerCase() === 'length' || h.toLowerCase().includes('km'))
  const elevationIdx = header.findIndex(h => h.toLowerCase().includes('visinska') || h.toLowerCase() === 'elevation' || h.toLowerCase().includes('d+'))
  const startIdx = header.findIndex(h => h.toLowerCase().includes('start') || h.toLowerCase().includes('datum'))
  const endIdx = header.findIndex(h => h.toLowerCase().includes('end') || h.toLowerCase().includes('cutoff') || h.toLowerCase().includes('cut-off'))
  const locationIdx = header.findIndex(h => h.toLowerCase().includes('lokacija') || h.toLowerCase() === 'location')
  const regIdx = header.findIndex(h => h.toLowerCase().includes('prijav') || h.toLowerCase().includes('registration'))
  const competitionIdx = header.findIndex(h => h.toLowerCase().includes('takmičenj') || h.toLowerCase().includes('takmicenj') || h.toLowerCase() === 'competition' || h.toLowerCase() === 'serija')

  return dataRows.map(row => {
    const errors: string[] = []

    const eventSlug = row[eventSlugIdx]?.trim() || ''
    if (!eventSlug) errors.push('Event slug je obavezan')

    const raceName = row[nameIdx]?.trim() || ''
    if (!raceName) errors.push('Naziv trke je obavezan')

    const slug = row[slugIdx]?.trim() || generateSlug(raceName)

    const lengthRaw = row[lengthIdx]?.trim() || ''
    const length = parseFloat(lengthRaw.replace(',', '.')) || 0
    if (length <= 0) errors.push('Dužina mora biti veća od 0')

    const elevationRaw = row[elevationIdx]?.trim() || ''
    const elevation = elevationRaw ? parseFloat(elevationRaw.replace(',', '.')) : undefined

    const startDateTime = row[startIdx]?.trim() || ''
    if (!startDateTime) errors.push('Datum starta je obavezan')

    const endDateTime = row[endIdx]?.trim() || undefined
    const startLocation = row[locationIdx]?.trim() || undefined

    const regRaw = row[regIdx]?.trim().toLowerCase() || ''
    const registrationEnabled = regRaw === 'da' || regRaw === 'yes' || regRaw === 'true' || regRaw === '1' || regRaw === 'otvoreno'
    const competitionName = row[competitionIdx]?.trim() || undefined

    return {
      eventSlug,
      raceName,
      slug,
      length,
      elevation,
      startDateTime,
      endDateTime,
      startLocation,
      registrationEnabled,
      competitionName,
      valid: errors.length === 0,
      errors,
    }
  }).filter(r => r.raceName || r.eventSlug) // Filter out empty rows
}

// Parse combined CSV with both events and races
function parseCombined(rows: string[][]): ParsedCombinedRow[] {
  const [header, ...dataRows] = rows

  // Find column indices
  const rowTypeIdx = header.findIndex(h =>
    h.toLowerCase() === 'tip_reda' ||
    h.toLowerCase() === 'row_type' ||
    h.toLowerCase() === 'vrsta'
  )

  // Event columns
  const eventNameIdx = header.findIndex(h =>
    h.toLowerCase() === 'naziv_dogadjaja' ||
    h.toLowerCase() === 'event_name' ||
    h.toLowerCase() === 'naziv_događaja'
  )
  const eventTypeIdx = header.findIndex(h =>
    h.toLowerCase() === 'tip_dogadjaja' ||
    h.toLowerCase() === 'event_type' ||
    h.toLowerCase() === 'tip_događaja' ||
    h.toLowerCase() === 'tip'
  )
  const descIdx = header.findIndex(h => h.toLowerCase().includes('opis') || h.toLowerCase() === 'description')
  const regSiteIdx = header.findIndex(h => h.toLowerCase() === 'sajt_prijava' || h.toLowerCase() === 'registration_site')
  const tagsIdx = header.findIndex(h => h.toLowerCase().includes('tag') || h.toLowerCase().includes('kategorij'))
  const socialIdx = header.findIndex(h => h.toLowerCase().includes('social') || h.toLowerCase().includes('mrež'))

  // Race columns
  const raceNameIdx = header.findIndex(h =>
    h.toLowerCase() === 'naziv_trke' ||
    h.toLowerCase() === 'race_name' ||
    h.toLowerCase() === 'trka'
  )
  const lengthIdx = header.findIndex(h =>
    h.toLowerCase().includes('dužina') ||
    h.toLowerCase().includes('duzina') ||
    h.toLowerCase() === 'length' ||
    h.toLowerCase() === 'km'
  )
  const elevationIdx = header.findIndex(h =>
    h.toLowerCase().includes('visinska') ||
    h.toLowerCase() === 'elevation' ||
    h.toLowerCase() === 'd+'
  )
  const startIdx = header.findIndex(h =>
    h.toLowerCase() === 'datum_start' ||
    h.toLowerCase() === 'start_date' ||
    h.toLowerCase() === 'datum'
  )
  const endIdx = header.findIndex(h => h.toLowerCase().includes('end') || h.toLowerCase().includes('cutoff'))
  const locationIdx = header.findIndex(h => h.toLowerCase().includes('lokacija') || h.toLowerCase() === 'location')
  const regIdx = header.findIndex(h => h.toLowerCase() === 'prijave' || h.toLowerCase() === 'registration')
  const competitionIdx = header.findIndex(h =>
    h.toLowerCase().includes('takmičenj') ||
    h.toLowerCase().includes('takmicenj') ||
    h.toLowerCase() === 'competition'
  )

  const result: ParsedCombinedRow[] = []
  let currentEventSlug: string | null = null

  for (const row of dataRows) {
    const rowTypeRaw = row[rowTypeIdx]?.trim().toLowerCase() || ''
    const isEvent = rowTypeRaw === 'dogadjaj' || rowTypeRaw === 'događaj' || rowTypeRaw === 'event' || rowTypeRaw === 'd'
    const isRace = rowTypeRaw === 'trka' || rowTypeRaw === 'race' || rowTypeRaw === 't'

    if (!isEvent && !isRace) {
      // Skip invalid rows
      continue
    }

    if (isEvent) {
      const errors: string[] = []
      const eventName = row[eventNameIdx]?.trim() || ''
      if (!eventName) errors.push('Naziv događaja je obavezan')

      const eventSlug = generateSlug(eventName)
      currentEventSlug = eventSlug // Remember for subsequent races

      const typeRaw = row[eventTypeIdx]?.trim().toUpperCase() || 'TRAIL'
      const eventType: 'TRAIL' | 'ROAD' | 'OCR' = typeRaw === 'ROAD' || typeRaw === 'ULIČNA' || typeRaw === 'ULICNA'
        ? 'ROAD'
        : typeRaw === 'OCR'
          ? 'OCR'
          : 'TRAIL'

      const description = row[descIdx]?.trim() || undefined
      const registrationSite = row[regSiteIdx]?.trim() || undefined
      const tagsRaw = row[tagsIdx]?.trim() || ''
      const tags = tagsRaw ? tagsRaw.split(';').map(t => t.trim()).filter(Boolean) : undefined
      const socialRaw = row[socialIdx]?.trim() || ''
      const socialMedia = socialRaw ? socialRaw.split(';').map(s => s.trim()).filter(Boolean) : undefined

      result.push({
        rowType: 'event',
        eventName,
        eventSlug,
        eventType,
        description,
        registrationSite,
        tags,
        socialMedia,
        valid: errors.length === 0,
        errors,
      })
    } else if (isRace) {
      const errors: string[] = []

      if (!currentEventSlug) {
        errors.push('Trka mora biti nakon događaja')
      }

      const raceName = row[raceNameIdx]?.trim() || ''
      if (!raceName) errors.push('Naziv trke je obavezan')

      const raceSlug = generateSlug(raceName)

      const lengthRaw = row[lengthIdx]?.trim() || ''
      const length = parseFloat(lengthRaw.replace(',', '.')) || 0
      if (length <= 0) errors.push('Dužina mora biti veća od 0')

      const elevationRaw = row[elevationIdx]?.trim() || ''
      const elevation = elevationRaw ? parseFloat(elevationRaw.replace(',', '.')) : undefined

      const startDateTime = row[startIdx]?.trim() || ''
      if (!startDateTime) errors.push('Datum starta je obavezan')

      const endDateTime = row[endIdx]?.trim() || undefined
      const startLocation = row[locationIdx]?.trim() || undefined

      const regRaw = row[regIdx]?.trim().toLowerCase() || ''
      const registrationEnabled = regRaw === 'da' || regRaw === 'yes' || regRaw === 'true' || regRaw === '1' || regRaw === 'otvoreno'
      const competitionName = row[competitionIdx]?.trim() || undefined

      result.push({
        rowType: 'race',
        eventSlug: currentEventSlug || '',
        raceName,
        raceSlug,
        length,
        elevation,
        startDateTime,
        endDateTime,
        startLocation,
        registrationEnabled,
        competitionName,
        valid: errors.length === 0,
        errors,
      })
    }
  }

  return result
}

export default function ImportPage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [importType, setImportType] = useState<ImportType>('combined')
  const [parsedEvents, setParsedEvents] = useState<ParsedEvent[]>([])
  const [parsedRaces, setParsedRaces] = useState<ParsedRace[]>([])
  const [parsedCombined, setParsedCombined] = useState<ParsedCombinedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    imported: number
    failed: number
    errors: string[]
  } | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
    }
  }, [authLoading, user, router])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const rows = parseCSV(text)

      if (importType === 'events') {
        setParsedEvents(parseEvents(rows))
        setParsedRaces([])
        setParsedCombined([])
      } else if (importType === 'races') {
        setParsedRaces(parseRaces(rows))
        setParsedEvents([])
        setParsedCombined([])
      } else {
        setParsedCombined(parseCombined(rows))
        setParsedEvents([])
        setParsedRaces([])
      }
      setImportResult(null)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (importType === 'events' && parsedEvents.length === 0) {
      toast('Nema događaja za import', 'error')
      return
    }
    if (importType === 'races' && parsedRaces.length === 0) {
      toast('Nema trka za import', 'error')
      return
    }
    if (importType === 'combined' && parsedCombined.length === 0) {
      toast('Nema podataka za import', 'error')
      return
    }

    setImporting(true)
    try {
      if (importType === 'combined') {
        // First import events, then races
        const events = parsedCombined
          .filter(r => r.rowType === 'event' && r.valid)
          .map(e => ({
            eventName: e.eventName!,
            slug: e.eventSlug,
            type: e.eventType!,
            description: e.description || null,
            registrationSite: e.registrationSite || null,
            tags: e.tags || [],
            socialMedia: e.socialMedia || [],
          }))

        const races = parsedCombined
          .filter(r => r.rowType === 'race' && r.valid)
          .map(r => ({
            eventSlug: r.eventSlug!,
            raceName: r.raceName!,
            slug: r.raceSlug,
            length: r.length!,
            elevation: r.elevation || null,
            startDateTime: r.startDateTime!,
            endDateTime: r.endDateTime || null,
            startLocation: r.startLocation || null,
            registrationEnabled: r.registrationEnabled ?? false,
            competitionName: r.competitionName || null,
          }))

        let totalImported = 0
        let totalFailed = 0
        const allErrors: string[] = []

        // Import events first
        if (events.length > 0) {
          const eventResult = await gql<{ importEvents: { success: boolean; imported: number; failed: number; errors: string[] } }>(
            IMPORT_EVENTS_MUTATION,
            { events },
            { accessToken }
          )
          totalImported += eventResult.importEvents?.imported ?? 0
          totalFailed += eventResult.importEvents?.failed ?? 0
          if (eventResult.importEvents?.errors) {
            allErrors.push(...eventResult.importEvents.errors)
          }
        }

        // Then import races
        if (races.length > 0) {
          const raceResult = await gql<{ importRaces: { success: boolean; imported: number; failed: number; errors: string[] } }>(
            IMPORT_RACES_MUTATION,
            { races },
            { accessToken }
          )
          totalImported += raceResult.importRaces?.imported ?? 0
          totalFailed += raceResult.importRaces?.failed ?? 0
          if (raceResult.importRaces?.errors) {
            allErrors.push(...raceResult.importRaces.errors)
          }
        }

        setImportResult({
          success: totalFailed === 0,
          imported: totalImported,
          failed: totalFailed,
          errors: allErrors,
        })

        if (totalFailed === 0) {
          toast(`Uspešno importovano ${totalImported} stavki`, 'success')
        }
      } else if (importType === 'events') {
        const eventsInput = parsedEvents.filter(e => e.valid).map(e => ({
          eventName: e.eventName,
          slug: e.slug,
          type: e.type,
          description: e.description || null,
          registrationSite: e.registrationSite || null,
          tags: e.tags || [],
          socialMedia: e.socialMedia || [],
        }))

        const result = await gql<{ importEvents: typeof importResult }>(
          IMPORT_EVENTS_MUTATION,
          { events: eventsInput },
          { accessToken }
        )
        setImportResult(result.importEvents)

        if (result.importEvents?.success) {
          toast(`Uspešno importovano ${result.importEvents.imported} događaja`, 'success')
        }
      } else {
        const racesInput = parsedRaces.filter(r => r.valid).map(r => ({
          eventSlug: r.eventSlug,
          raceName: r.raceName,
          slug: r.slug,
          length: r.length,
          elevation: r.elevation || null,
          startDateTime: r.startDateTime,
          endDateTime: r.endDateTime || null,
          startLocation: r.startLocation || null,
          registrationEnabled: r.registrationEnabled,
          competitionName: r.competitionName || null,
        }))

        const result = await gql<{ importRaces: typeof importResult }>(
          IMPORT_RACES_MUTATION,
          { races: racesInput },
          { accessToken }
        )
        setImportResult(result.importRaces)

        if (result.importRaces?.success) {
          toast(`Uspešno importovano ${result.importRaces.imported} trka`, 'success')
        }
      }
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri importu', 'error')
      const totalItems = importType === 'events'
        ? parsedEvents.length
        : importType === 'races'
          ? parsedRaces.length
          : parsedCombined.length
      setImportResult({
        success: false,
        imported: 0,
        failed: totalItems,
        errors: [err?.message ?? 'Nepoznata greška'],
      })
    } finally {
      setImporting(false)
    }
  }

  function handleReset() {
    setParsedEvents([])
    setParsedRaces([])
    setParsedCombined([])
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (authLoading) {
    return <LoadingState />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  const hasData = parsedEvents.length > 0 || parsedRaces.length > 0 || parsedCombined.length > 0

  let validCount = 0
  let invalidCount = 0

  if (importType === 'events') {
    validCount = parsedEvents.filter(e => e.valid).length
    invalidCount = parsedEvents.filter(e => !e.valid).length
  } else if (importType === 'races') {
    validCount = parsedRaces.filter(r => r.valid).length
    invalidCount = parsedRaces.filter(r => !r.valid).length
  } else {
    validCount = parsedCombined.filter(r => r.valid).length
    invalidCount = parsedCombined.filter(r => !r.valid).length
  }

  return (
    <>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4" />
          Admin Panel
        </Link>
      </div>

      <Heading>Import podataka</Heading>
      <p className="mt-2 text-sm text-zinc-500">
        Importujte događaje i trke iz CSV fajla
      </p>

      {/* Import Type Selection */}
      <div className="mt-6 flex flex-wrap gap-4">
        <button
          onClick={() => { setImportType('combined'); handleReset() }}
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors ${
            importType === 'combined'
              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
          }`}
        >
          <DocumentTextIcon className="size-5" />
          <div className="text-left">
            <div className="font-medium">Kombinovano</div>
            <div className="text-xs opacity-70">Događaji + Trke</div>
          </div>
        </button>
        <button
          onClick={() => { setImportType('events'); handleReset() }}
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors ${
            importType === 'events'
              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
          }`}
        >
          <DocumentTextIcon className="size-5" />
          <span className="font-medium">Samo događaji</span>
        </button>
        <button
          onClick={() => { setImportType('races'); handleReset() }}
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors ${
            importType === 'races'
              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
          }`}
        >
          <DocumentTextIcon className="size-5" />
          <span className="font-medium">Samo trke</span>
        </button>
      </div>

      {/* CSV Format Info */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <Subheading>Format CSV fajla</Subheading>
        {importType === 'combined' ? (
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="mb-2">Kolone (header u prvom redu):</p>
            <code className="block rounded bg-zinc-200 p-2 text-xs dark:bg-zinc-700">
              tip_reda,naziv_dogadjaja,tip_dogadjaja,naziv_trke,duzina,visinska,datum_start,lokacija,prijave,takmicenje
            </code>
            <div className="mt-3 space-y-1 text-xs">
              <p><strong>tip_reda:</strong> &quot;dogadjaj&quot; ili &quot;trka&quot;</p>
              <p><strong>Za događaj:</strong> popuni naziv_dogadjaja, tip_dogadjaja (TRAIL/ROAD)</p>
              <p><strong>Za trku:</strong> popuni naziv_trke, duzina, datum_start, lokacija... (automatski se vezuje za prethodni događaj)</p>
            </div>
          </div>
        ) : importType === 'events' ? (
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="mb-2">Potrebne kolone (header u prvom redu):</p>
            <code className="block rounded bg-zinc-200 p-2 text-xs dark:bg-zinc-700">
              naziv,tip,opis,sajt_prijava,tagovi,social_media
            </code>
            <p className="mt-2 text-xs">
              <strong>tip:</strong> TRAIL ili ROAD | <strong>tagovi:</strong> razdvojeni sa ; | <strong>social_media:</strong> URL-ovi razdvojeni sa ;
            </p>
          </div>
        ) : (
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="mb-2">Potrebne kolone (header u prvom redu):</p>
            <code className="block rounded bg-zinc-200 p-2 text-xs dark:bg-zinc-700">
              event_slug,naziv,dužina,visinska_razlika,datum_start,lokacija,prijave,takmicenje
            </code>
            <p className="mt-2 text-xs">
              <strong>event_slug:</strong> slug postojećeg događaja | <strong>datum_start:</strong> YYYY-MM-DD HH:MM | <strong>prijave:</strong> da/ne | <strong>takmicenje:</strong> ime postojećeg takmičenja
            </p>
          </div>
        )}
      </div>

      {/* File Upload */}
      <div className="mt-6">
        <label
          htmlFor="csv-file"
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-600 dark:bg-zinc-800/50 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
        >
          <ArrowUpTrayIcon className="size-10 text-zinc-400" />
          <span className="mt-2 font-medium text-zinc-700 dark:text-zinc-300">
            Kliknite za upload CSV fajla
          </span>
          <span className="mt-1 text-sm text-zinc-500">ili prevucite fajl ovde</span>
          <input
            id="csv-file"
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Preview */}
      {hasData && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <Subheading>
              Pregled ({importType === 'events' ? parsedEvents.length : importType === 'races' ? parsedRaces.length : parsedCombined.length} stavki)
            </Subheading>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge color="green">{validCount} validno</Badge>
                {invalidCount > 0 && <Badge color="red">{invalidCount} sa greškama</Badge>}
              </div>
              <Button onClick={handleReset} outline>
                Poništi
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Status
                  </th>
                  {importType === 'combined' ? (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Tip</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Naziv</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Detalji</th>
                    </>
                  ) : importType === 'events' ? (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Naziv</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Slug</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Tip</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Tagovi</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Event</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Naziv</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Dužina</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Datum</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Prijave</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Greške</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
                {importType === 'combined' ? (
                  parsedCombined.map((row, idx) => (
                    <tr key={idx} className={`${row.valid ? '' : 'bg-red-50 dark:bg-red-900/10'} ${row.rowType === 'event' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                      <td className="px-4 py-3">
                        {row.valid ? (
                          <CheckCircleIcon className="size-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="size-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={row.rowType === 'event' ? 'blue' : 'emerald'}>
                          {row.rowType === 'event' ? 'Događaj' : 'Trka'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {row.rowType === 'event' ? row.eventName : row.raceName}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">
                        {row.rowType === 'event' ? (
                          <span>
                            <Badge color={row.eventType === 'TRAIL' ? 'emerald' : row.eventType === 'OCR' ? 'orange' : 'sky'} className="mr-2">
                              {row.eventType}
                            </Badge>
                            {row.tags?.join(', ')}
                          </span>
                        ) : (
                          <span>{row.length} km • {row.startDateTime}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600">{row.errors.join(', ') || '-'}</td>
                    </tr>
                  ))
                ) : importType === 'events' ? (
                  parsedEvents.map((event, idx) => (
                    <tr key={idx} className={event.valid ? '' : 'bg-red-50 dark:bg-red-900/10'}>
                      <td className="px-4 py-3">
                        {event.valid ? (
                          <CheckCircleIcon className="size-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="size-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{event.eventName}</td>
                      <td className="px-4 py-3 text-sm text-zinc-500">{event.slug}</td>
                      <td className="px-4 py-3">
                        <Badge color={event.type === 'TRAIL' ? 'emerald' : event.type === 'OCR' ? 'orange' : 'sky'}>{event.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{event.tags?.join(', ') || '-'}</td>
                      <td className="px-4 py-3 text-sm text-red-600">{event.errors.join(', ') || '-'}</td>
                    </tr>
                  ))
                ) : (
                  parsedRaces.map((race, idx) => (
                    <tr key={idx} className={race.valid ? '' : 'bg-red-50 dark:bg-red-900/10'}>
                      <td className="px-4 py-3">
                        {race.valid ? (
                          <CheckCircleIcon className="size-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="size-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">{race.eventSlug}</td>
                      <td className="px-4 py-3 font-medium">{race.raceName}</td>
                      <td className="px-4 py-3">{race.length} km</td>
                      <td className="px-4 py-3 text-sm">{race.startDateTime}</td>
                      <td className="px-4 py-3">
                        <Badge color={race.registrationEnabled ? 'green' : 'zinc'}>
                          {race.registrationEnabled ? 'Da' : 'Ne'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600">{race.errors.join(', ') || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Import Button */}
          <div className="mt-6 flex items-center gap-4">
            <Button
              onClick={handleImport}
              color="blue"
              disabled={importing || validCount === 0}
            >
              {importing ? 'Importujem...' : `Importuj ${validCount} stavki`}
            </Button>
            {invalidCount > 0 && (
              <p className="text-sm text-amber-600">
                <ExclamationTriangleIcon className="inline size-4 mr-1" />
                {invalidCount} stavki sa greškama neće biti importovano
              </p>
            )}
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className={`mt-6 rounded-lg border p-4 ${
          importResult.success
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
        }`}>
          <div className="flex items-center gap-2">
            {importResult.success ? (
              <CheckCircleIcon className="size-5 text-green-600" />
            ) : (
              <XCircleIcon className="size-5 text-red-600" />
            )}
            <span className="font-medium">
              {importResult.success ? 'Import završen' : 'Greška pri importu'}
            </span>
          </div>
          <div className="mt-2 text-sm">
            <p>Uspešno importovano: {importResult.imported}</p>
            {importResult.failed > 0 && <p>Neuspešno: {importResult.failed}</p>}
            {importResult.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-4 text-red-600">
                {importResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Download Template */}
      <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <Subheading>Preuzmi šablon</Subheading>
        <div className="mt-4 flex flex-wrap gap-4">
          <a
            href="/templates/combined-template.csv"
            download
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
          >
            <DocumentTextIcon className="size-4" />
            Kombinovani šablon (preporučeno)
          </a>
          <a
            href="/templates/events-template.csv"
            download
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <DocumentTextIcon className="size-4" />
            Šablon za događaje
          </a>
          <a
            href="/templates/races-template.csv"
            download
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <DocumentTextIcon className="size-4" />
            Šablon za trke
          </a>
        </div>
      </div>
    </>
  )
}
