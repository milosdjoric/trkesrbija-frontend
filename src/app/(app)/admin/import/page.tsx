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
import { useCallback, useEffect, useRef, useState } from 'react'

type ImportType = 'events' | 'races'

type ParsedEvent = {
  eventName: string
  slug: string
  type: 'TRAIL' | 'ROAD'
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
    const type: 'TRAIL' | 'ROAD' = typeRaw === 'ROAD' || typeRaw === 'ULIČNA' || typeRaw === 'ULICNA' ? 'ROAD' : 'TRAIL'

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

export default function ImportPage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [importType, setImportType] = useState<ImportType>('events')
  const [parsedEvents, setParsedEvents] = useState<ParsedEvent[]>([])
  const [parsedRaces, setParsedRaces] = useState<ParsedRace[]>([])
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
      } else {
        setParsedRaces(parseRaces(rows))
        setParsedEvents([])
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

    const validItems = importType === 'events'
      ? parsedEvents.filter(e => e.valid)
      : parsedRaces.filter(r => r.valid)

    if (validItems.length === 0) {
      toast('Nema validnih stavki za import', 'error')
      return
    }

    setImporting(true)
    try {
      if (importType === 'events') {
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
      setImportResult({
        success: false,
        imported: 0,
        failed: importType === 'events' ? parsedEvents.length : parsedRaces.length,
        errors: [err?.message ?? 'Nepoznata greška'],
      })
    } finally {
      setImporting(false)
    }
  }

  function handleReset() {
    setParsedEvents([])
    setParsedRaces([])
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

  const hasData = parsedEvents.length > 0 || parsedRaces.length > 0
  const validCount = importType === 'events'
    ? parsedEvents.filter(e => e.valid).length
    : parsedRaces.filter(r => r.valid).length
  const invalidCount = importType === 'events'
    ? parsedEvents.filter(e => !e.valid).length
    : parsedRaces.filter(r => !r.valid).length

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
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => { setImportType('events'); handleReset() }}
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors ${
            importType === 'events'
              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
          }`}
        >
          <DocumentTextIcon className="size-5" />
          <span className="font-medium">Događaji</span>
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
          <span className="font-medium">Trke</span>
        </button>
      </div>

      {/* CSV Format Info */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <Subheading>Format CSV fajla</Subheading>
        {importType === 'events' ? (
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
              Pregled ({importType === 'events' ? parsedEvents.length : parsedRaces.length} stavki)
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
                  {importType === 'events' ? (
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
                {importType === 'events' ? (
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
                        <Badge color={event.type === 'TRAIL' ? 'emerald' : 'sky'}>{event.type}</Badge>
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
        <div className="mt-4 flex gap-4">
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
