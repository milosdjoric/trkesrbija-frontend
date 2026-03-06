'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { useConfirm } from '@/components/confirm-dialog'
import { Heading, Subheading } from '@/components/heading'
import { useToast } from '@/components/toast'
import {
 ArrowUpTrayIcon,
 DocumentTextIcon,
 CheckCircleIcon,
 ExclamationTriangleIcon,
 XCircleIcon,
} from '@heroicons/react/16/solid'
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { useRef, useState } from 'react'

type ImportType = 'events' | 'races' | 'combined'

type ParsedEvent = {
 eventName: string
 slug: string
 type: 'TRAIL' | 'ROAD' | 'OCR'
 description?: string
 registrationSite?: string
 tags?: string[]
 socialMedia?: string[]
 country?: string
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
 country?: string
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
 mutation ImportEvents($events: [CreateRaceEventInput!]!, $override: Boolean) {
  importEvents(events: $events, override: $override) {
   success
   imported
   updated
   failed
   errors
  }
 }
`

const IMPORT_RACES_MUTATION = `
 mutation ImportRaces($races: [ImportRaceInput!]!, $override: Boolean) {
  importRaces(races: $races, override: $override) {
   success
   imported
   updated
   failed
   errors
  }
 }
`

const CHECK_DUPLICATES_QUERY = `
 query CheckImportDuplicates($eventSlugs: [String!]!, $raceSlugs: [String!]!) {
  checkImportDuplicates(eventSlugs: $eventSlugs, raceSlugs: $raceSlugs) {
   existingEventSlugs
   existingRaceSlugs
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
 const countryIdx = header.findIndex(h => h.toLowerCase().includes('država') || h.toLowerCase().includes('drzava') || h.toLowerCase() === 'country')

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
  const country = countryIdx >= 0 ? row[countryIdx]?.trim() || undefined : undefined

  return {
   eventName,
   slug,
   type,
   description,
   registrationSite,
   tags,
   socialMedia,
   country,
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
 const startIdx = header.findIndex(h => h.toLowerCase().includes('start') || h.toLowerCase() === 'datum')
 const endIdx = header.findIndex(h => h.toLowerCase().includes('end') || h.toLowerCase().includes('cutoff') || h.toLowerCase().includes('cut-off') || h.toLowerCase() === 'datum_zavrsetka')
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
 const countryIdx = header.findIndex(h => h.toLowerCase().includes('država') || h.toLowerCase().includes('drzava') || h.toLowerCase() === 'country')

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
 const endIdx = header.findIndex(h => h.toLowerCase().includes('end') || h.toLowerCase().includes('cutoff') || h.toLowerCase() === 'datum_zavrsetka')
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
   const country = countryIdx >= 0 ? row[countryIdx]?.trim() || undefined : undefined

   result.push({
    rowType: 'event',
    eventName,
    eventSlug,
    eventType,
    description,
    registrationSite,
    tags,
    socialMedia,
    country,
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
 const { user, accessToken } = useAuth()
 const { toast } = useToast()
 const { confirm } = useConfirm()
 const fileInputRef = useRef<HTMLInputElement>(null)

 const [importType, setImportType] = useState<ImportType>('combined')
 const [parsedEvents, setParsedEvents] = useState<ParsedEvent[]>([])
 const [parsedRaces, setParsedRaces] = useState<ParsedRace[]>([])
 const [parsedCombined, setParsedCombined] = useState<ParsedCombinedRow[]>([])
 const [importing, setImporting] = useState(false)
 const [pasteText, setPasteText] = useState('')
 const [inputMode, setInputMode] = useState<'file' | 'paste'>('file')
 const [override, setOverride] = useState(false)
 const [existingEventSlugs, setExistingEventSlugs] = useState<Set<string>>(new Set())
 const [existingRaceSlugs, setExistingRaceSlugs] = useState<Set<string>>(new Set())
 const [checkingDuplicates, setCheckingDuplicates] = useState(false)
 const [importResult, setImportResult] = useState<{
  success: boolean
  imported: number
  updated: number
  failed: number
  errors: string[]
 } | null>(null)

 async function processCSVText(text: string) {
  const rows = parseCSV(text)

  let eventSlugs: string[] = []
  let raceSlugs: string[] = []

  if (importType === 'events') {
   const events = parseEvents(rows)
   setParsedEvents(events)
   setParsedRaces([])
   setParsedCombined([])
   eventSlugs = events.map(e => e.slug)
  } else if (importType === 'races') {
   const races = parseRaces(rows)
   setParsedRaces(races)
   setParsedEvents([])
   setParsedCombined([])
   raceSlugs = races.map(r => r.slug)
  } else {
   const combined = parseCombined(rows)
   setParsedCombined(combined)
   setParsedEvents([])
   setParsedRaces([])
   eventSlugs = combined.filter(r => r.rowType === 'event').map(r => r.eventSlug!)
   raceSlugs = combined.filter(r => r.rowType === 'race').map(r => r.raceSlug!)
  }
  setImportResult(null)

  // Check for duplicates in DB
  if (eventSlugs.length > 0 || raceSlugs.length > 0) {
   setCheckingDuplicates(true)
   try {
    const result = await gql<{
     checkImportDuplicates: { existingEventSlugs: string[]; existingRaceSlugs: string[] }
    }>(
     CHECK_DUPLICATES_QUERY,
     { eventSlugs, raceSlugs },
     { accessToken }
    )
    setExistingEventSlugs(new Set(result.checkImportDuplicates.existingEventSlugs))
    setExistingRaceSlugs(new Set(result.checkImportDuplicates.existingRaceSlugs))
   } catch {
    // Silently fail — duplicates just won't be shown
    setExistingEventSlugs(new Set())
    setExistingRaceSlugs(new Set())
   } finally {
    setCheckingDuplicates(false)
   }
  } else {
   setExistingEventSlugs(new Set())
   setExistingRaceSlugs(new Set())
  }
 }

 function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (event) => {
   const text = event.target?.result as string
   await processCSVText(text)
  }
  reader.readAsText(file)
 }

 async function handlePaste() {
  if (!pasteText.trim()) {
   toast('Nalepite CSV sadržaj u polje', 'error')
   return
  }
  await processCSVText(pasteText)
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

  // Ask for confirmation if override is enabled
  if (override) {
   const confirmed = await confirm({
    title: 'Pregazi postojeće vrednosti?',
    message: 'Postojeći podaci u bazi koji nisu prazni biće pregazeni vrednostima iz CSV-a. Da li ste sigurni?',
    confirmText: 'Pregazi i importuj',
    variant: 'danger',
   })
   if (!confirmed) return
  }

  setImporting(true)
  try {
   if (importType === 'combined') {
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
      country: e.country || null,
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
    let totalUpdated = 0
    let totalFailed = 0
    const allErrors: string[] = []

    if (events.length > 0) {
     const eventResult = await gql<{ importEvents: { success: boolean; imported: number; updated: number; failed: number; errors: string[] } }>(
      IMPORT_EVENTS_MUTATION,
      { events, override },
      { accessToken }
     )
     totalImported += eventResult.importEvents?.imported ?? 0
     totalUpdated += eventResult.importEvents?.updated ?? 0
     totalFailed += eventResult.importEvents?.failed ?? 0
     if (eventResult.importEvents?.errors) {
      allErrors.push(...eventResult.importEvents.errors)
     }
    }

    if (races.length > 0) {
     const raceResult = await gql<{ importRaces: { success: boolean; imported: number; updated: number; failed: number; errors: string[] } }>(
      IMPORT_RACES_MUTATION,
      { races, override },
      { accessToken }
     )
     totalImported += raceResult.importRaces?.imported ?? 0
     totalUpdated += raceResult.importRaces?.updated ?? 0
     totalFailed += raceResult.importRaces?.failed ?? 0
     if (raceResult.importRaces?.errors) {
      allErrors.push(...raceResult.importRaces.errors)
     }
    }

    setImportResult({
     success: totalFailed === 0,
     imported: totalImported,
     updated: totalUpdated,
     failed: totalFailed,
     errors: allErrors,
    })

    if (totalFailed === 0) {
     const parts = []
     if (totalImported > 0) parts.push(`${totalImported} kreirano`)
     if (totalUpdated > 0) parts.push(`${totalUpdated} ažurirano`)
     toast(`Uspešno: ${parts.join(', ')}`, 'success')
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
     country: e.country || null,
    }))

    const result = await gql<{ importEvents: typeof importResult }>(
     IMPORT_EVENTS_MUTATION,
     { events: eventsInput, override },
     { accessToken }
    )
    setImportResult(result.importEvents)

    if (result.importEvents?.success) {
     const parts = []
     if (result.importEvents.imported > 0) parts.push(`${result.importEvents.imported} kreirano`)
     if (result.importEvents.updated > 0) parts.push(`${result.importEvents.updated} ažurirano`)
     toast(`Uspešno: ${parts.join(', ')}`, 'success')
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
     { races: racesInput, override },
     { accessToken }
    )
    setImportResult(result.importRaces)

    if (result.importRaces?.success) {
     const parts = []
     if (result.importRaces.imported > 0) parts.push(`${result.importRaces.imported} kreirano`)
     if (result.importRaces.updated > 0) parts.push(`${result.importRaces.updated} ažurirano`)
     toast(`Uspešno: ${parts.join(', ')}`, 'success')
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
    updated: 0,
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
  setPasteText('')
  setExistingEventSlugs(new Set())
  setExistingRaceSlugs(new Set())
  if (fileInputRef.current) {
   fileInputRef.current.value = ''
  }
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
   <Heading>Import podataka</Heading>
   <p className="mt-2 text-sm text-text-secondary">
    Importujte događaje i trke iz CSV fajla
   </p>

   {/* Import Type Selection */}
   <div className="mt-6 flex flex-wrap gap-4">
    <button
     onClick={() => { setImportType('combined'); handleReset() }}
     className={`flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors ${
      importType === 'combined'
       ? 'border-brand-green bg-brand-green/10 text-brand-green'
       : 'border-border-primary hover:bg-card-hover'
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
       ? 'border-brand-green bg-brand-green/10 text-brand-green'
       : 'border-border-primary hover:bg-card-hover'
     }`}
    >
     <DocumentTextIcon className="size-5" />
     <span className="font-medium">Samo događaji</span>
    </button>
    <button
     onClick={() => { setImportType('races'); handleReset() }}
     className={`flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors ${
      importType === 'races'
       ? 'border-brand-green bg-brand-green/10 text-brand-green'
       : 'border-border-primary hover:bg-card-hover'
     }`}
    >
     <DocumentTextIcon className="size-5" />
     <span className="font-medium">Samo trke</span>
    </button>
   </div>

   {/* CSV Format Info */}
   <div className="mt-6 rounded-lg border border-border-primary bg-surface p-4">
    <Subheading>Format CSV fajla</Subheading>
    {importType === 'combined' ? (
     <div className="mt-2 text-sm text-text-secondary">
      <p className="mb-2">Kolone (header u prvom redu):</p>
      <code className="block overflow-x-auto rounded bg-surface p-2 text-xs">
       tip_reda,naziv_dogadjaja,tip_dogadjaja,opis,sajt_prijava,tagovi,social_media,drzava,naziv_trke,duzina,visinska,datum_start,datum_zavrsetka,lokacija,prijave,takmicenje
      </code>
      <div className="mt-3 space-y-1 text-xs">
       <p><strong>tip_reda:</strong> &quot;dogadjaj&quot; ili &quot;trka&quot;</p>
       <p><strong>Za događaj:</strong> naziv_dogadjaja, tip_dogadjaja (TRAIL/ROAD/OCR), opis, sajt_prijava, tagovi (;), social_media (;), drzava (ser/cro/bih/reg)</p>
       <p><strong>Za trku:</strong> naziv_trke, duzina, visinska, datum_start, datum_zavrsetka, lokacija, prijave (da/ne), takmicenje</p>
       <p>Trke se automatski vezuju za prethodni događaj u CSV-u.</p>
      </div>
     </div>
    ) : importType === 'events' ? (
     <div className="mt-2 text-sm text-text-secondary">
      <p className="mb-2">Potrebne kolone (header u prvom redu):</p>
      <code className="block overflow-x-auto rounded bg-surface p-2 text-xs">
       naziv,tip,opis,sajt_prijava,tagovi,social_media,drzava
      </code>
      <p className="mt-2 text-xs">
       <strong>tip:</strong> TRAIL, ROAD ili OCR | <strong>tagovi:</strong> razdvojeni sa ; | <strong>social_media:</strong> URL-ovi razdvojeni sa ; | <strong>drzava:</strong> ser/cro/bih/reg
      </p>
     </div>
    ) : (
     <div className="mt-2 text-sm text-text-secondary">
      <p className="mb-2">Potrebne kolone (header u prvom redu):</p>
      <code className="block overflow-x-auto rounded bg-surface p-2 text-xs">
       event_slug,naziv,duzina,visinska_razlika,datum_start,datum_zavrsetka,lokacija,prijave,takmicenje
      </code>
      <p className="mt-2 text-xs">
       <strong>event_slug:</strong> slug postojećeg događaja | <strong>datum_start/datum_zavrsetka:</strong> YYYY-MM-DD HH:MM | <strong>prijave:</strong> da/ne | <strong>takmicenje:</strong> ime postojećeg takmičenja
      </p>
     </div>
    )}
   </div>

   {/* Input Mode Toggle */}
   <div className="mt-6 flex gap-2">
    <button
     onClick={() => setInputMode('file')}
     className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      inputMode === 'file'
       ? 'bg-border-secondary text-text-primary'
       : 'text-text-secondary hover:bg-surface hover:text-text-primary'
     }`}
    >
     <ArrowUpTrayIcon className="size-4" />
     Upload fajla
    </button>
    <button
     onClick={() => setInputMode('paste')}
     className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      inputMode === 'paste'
       ? 'bg-border-secondary text-text-primary'
       : 'text-text-secondary hover:bg-surface hover:text-text-primary'
     }`}
    >
     <ClipboardDocumentIcon className="size-4" />
     Nalepi tekst
    </button>
   </div>

   {/* File Upload */}
   {inputMode === 'file' ? (
    <div className="mt-4">
     <label
      htmlFor="csv-file"
      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-secondary bg-surface p-8 transition-colors hover:border-brand-green hover:bg-card-hover"
     >
      <ArrowUpTrayIcon className="size-10 text-text-secondary" />
      <span className="mt-2 font-medium text-text-secondary">
       Kliknite za upload CSV fajla
      </span>
      <span className="mt-1 text-sm text-text-secondary">ili prevucite fajl ovde</span>
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
   ) : (
    <div className="mt-4">
     <textarea
      value={pasteText}
      onChange={(e) => setPasteText(e.target.value)}
      placeholder={'tip_reda,naziv_dogadjaja,tip_dogadjaja,opis,sajt_prijava,tagovi,social_media,drzava,naziv_trke,duzina,visinska,datum_start,datum_zavrsetka,lokacija,prijave,takmicenje\ndogadjaj,Fruska Gora Trail,TRAIL,Trail trka,https://prijave.rs,trail;srbija,,ser,,,,,,,,\ntrka,,,,,,,,FGT 42K,42,1200,2025-06-15 07:00,2025-06-15 21:00,Irig,da,'}
      className="w-full rounded-lg border border-border-secondary bg-surface px-4 py-3 font-mono text-sm text-text-primary outline-none placeholder:text-text-secondary/40 focus:border-brand-green focus:ring-1 focus:ring-brand-green"
      rows={8}
     />
     <Button onClick={handlePaste} className="mt-3" disabled={!pasteText.trim()}>
      Parsiraj CSV
     </Button>
    </div>
   )}

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
        {checkingDuplicates && <Badge color="zinc">Proveravam duplikate...</Badge>}
        {!checkingDuplicates && (existingEventSlugs.size > 0 || existingRaceSlugs.size > 0) && (
         <Badge color="amber">{existingEventSlugs.size + existingRaceSlugs.size} već postoji</Badge>
        )}
       </div>
       <Button onClick={handleReset} outline>
        Poništi
       </Button>
      </div>
     </div>

     <div className="mt-4 overflow-x-auto rounded-lg border border-border-primary">
      <table className="min-w-full divide-y divide-border-primary">
       <thead className="bg-surface">
        <tr>
         <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
          Status
         </th>
         {importType === 'combined' ? (
          <>
           <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">Tip</th>
           <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">Naziv</th>
           <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">Detalji</th>
          </>
         ) : importType === 'events' ? (
          <>
           <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">Naziv</th>
           <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">Slug</th>
           <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">Tip</th>
           <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">Tagovi</th>
          </>
         ) : (
          <>
           <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">Event</th>
           <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">Naziv</th>
           <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">Dužina</th>
           <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">Datum</th>
           <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">Prijave</th>
          </>
         )}
         <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">Greške</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-border-primary bg-card">
        {importType === 'combined' ? (
         parsedCombined.map((row, idx) => {
          const slug = row.rowType === 'event' ? row.eventSlug : row.raceSlug
          const isDuplicate = row.rowType === 'event'
           ? existingEventSlugs.has(slug || '')
           : existingRaceSlugs.has(slug || '')
          return (
          <tr key={idx} className={`${row.valid ? '' : 'bg-red-900/10'} ${row.rowType === 'event' ? 'bg-blue-900/10' : ''}`}>
           <td className="px-4 py-3">
            <div className="flex items-center gap-1.5">
             {row.valid ? (
              <CheckCircleIcon className="size-5 text-green-500" />
             ) : (
              <XCircleIcon className="size-5 text-red-500" />
             )}
             {!checkingDuplicates && (
              <Badge color={isDuplicate ? 'amber' : 'green'} className="text-[10px]">
               {isDuplicate ? 'Postoji' : 'Novi'}
              </Badge>
             )}
            </div>
           </td>
           <td className="px-4 py-3">
            <Badge color={row.rowType === 'event' ? 'blue' : 'emerald'}>
             {row.rowType === 'event' ? 'Događaj' : 'Trka'}
            </Badge>
           </td>
           <td className="px-4 py-3 font-medium">
            {row.rowType === 'event' ? row.eventName : row.raceName}
           </td>
           <td className="px-4 py-3 text-sm text-text-secondary">
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
          )
         })
        ) : importType === 'events' ? (
         parsedEvents.map((event, idx) => (
          <tr key={idx} className={event.valid ? '' : 'bg-red-900/10'}>
           <td className="px-4 py-3">
            <div className="flex items-center gap-1.5">
             {event.valid ? (
              <CheckCircleIcon className="size-5 text-green-500" />
             ) : (
              <XCircleIcon className="size-5 text-red-500" />
             )}
             {!checkingDuplicates && (
              <Badge color={existingEventSlugs.has(event.slug) ? 'amber' : 'green'} className="text-[10px]">
               {existingEventSlugs.has(event.slug) ? 'Postoji' : 'Novi'}
              </Badge>
             )}
            </div>
           </td>
           <td className="px-4 py-3 font-medium">{event.eventName}</td>
           <td className="px-4 py-3 text-sm text-text-secondary">{event.slug}</td>
           <td className="px-4 py-3">
            <Badge color={event.type === 'TRAIL' ? 'emerald' : event.type === 'OCR' ? 'orange' : 'sky'}>{event.type}</Badge>
           </td>
           <td className="px-4 py-3 text-sm">{event.tags?.join(', ') || '-'}</td>
           <td className="px-4 py-3 text-sm text-red-600">{event.errors.join(', ') || '-'}</td>
          </tr>
         ))
        ) : (
         parsedRaces.map((race, idx) => (
          <tr key={idx} className={race.valid ? '' : 'bg-red-900/10'}>
           <td className="px-4 py-3">
            <div className="flex items-center gap-1.5">
             {race.valid ? (
              <CheckCircleIcon className="size-5 text-green-500" />
             ) : (
              <XCircleIcon className="size-5 text-red-500" />
             )}
             {!checkingDuplicates && (
              <Badge color={existingRaceSlugs.has(race.slug) ? 'amber' : 'green'} className="text-[10px]">
               {existingRaceSlugs.has(race.slug) ? 'Postoji' : 'Novi'}
              </Badge>
             )}
            </div>
           </td>
           <td className="px-4 py-3 text-sm text-text-secondary">{race.eventSlug}</td>
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

     {/* Override option */}
     <div className="mt-6">
      <label className="flex items-center gap-2 text-sm">
       <input
        type="checkbox"
        checked={override}
        onChange={(e) => setOverride(e.target.checked)}
        className="size-4 rounded border-border-secondary accent-brand-green"
       />
       <span className="text-text-secondary">
        Pregazi postojeće vrednosti
       </span>
      </label>
      <p className="mt-1 ml-6 text-xs text-text-secondary">
       {override
        ? 'Sva polja iz CSV-a će pregaziti postojeće podatke u bazi'
        : 'Popuniće se samo prazna polja kod postojećih zapisa'}
      </p>
     </div>

     {/* Import Button */}
     <div className="mt-4 flex items-center gap-4">
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
      ? 'border-green-800 bg-green-900/20'
      : 'border-red-800 bg-red-900/20'
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
      {importResult.imported > 0 && <p>Kreirano: {importResult.imported}</p>}
      {importResult.updated > 0 && <p>Ažurirano: {importResult.updated}</p>}
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
   <div className="mt-8 border-t border-border-primary pt-6">
    <Subheading>Preuzmi šablon</Subheading>
    <div className="mt-4 flex flex-wrap gap-4">
     <a
      href="/templates/combined-template.csv"
      download
      className="inline-flex items-center gap-2 rounded-lg border border-brand-green bg-brand-green/10 px-4 py-2 text-sm text-brand-green hover:bg-brand-green/20"
     >
      <DocumentTextIcon className="size-4" />
      Kombinovani šablon (preporučeno)
     </a>
     <a
      href="/templates/events-template.csv"
      download
      className="inline-flex items-center gap-2 rounded-lg border border-border-primary px-4 py-2 text-sm hover:bg-card-hover"
     >
      <DocumentTextIcon className="size-4" />
      Šablon za događaje
     </a>
     <a
      href="/templates/races-template.csv"
      download
      className="inline-flex items-center gap-2 rounded-lg border border-border-primary px-4 py-2 text-sm hover:bg-card-hover"
     >
      <DocumentTextIcon className="size-4" />
      Šablon za trke
     </a>
    </div>
   </div>
  </>
 )
}
