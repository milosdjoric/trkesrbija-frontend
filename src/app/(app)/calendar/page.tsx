import { gql } from '@/app/lib/api'
import { Heading } from '@/components/heading'
import { formatDateKey } from '@/lib/formatters'
import type { Metadata } from 'next'
import { CalendarView } from './calendar-view'

export const revalidate = 300 // ISR: revalidate svakih 5 minuta

export const metadata: Metadata = {
  title: 'Kalendar trka',
  description: 'Pregledajte kalendar trail i uličnih trka u Srbiji. Vidite koje trke su zakazane za svaki dan.',
  openGraph: {
    title: 'Kalendar trka - Trke Srbija',
    description: 'Pregledajte kalendar trail i uličnih trka u Srbiji.',
  },
}

type BackendRace = {
  id: string
  slug: string
  raceName: string | null
  length: number
  elevation: number | null
  startLocation: string | null
  startDateTime: string
}

type BackendRaceEvent = {
  id: string
  eventName: string
  slug: string
  type: 'TRAIL' | 'ROAD' | 'OCR'
  mainImage: string | null
  races: BackendRace[]
}

export type EventOnDate = {
  event: {
    id: string
    eventName: string
    slug: string
    type: 'TRAIL' | 'ROAD' | 'OCR'
  }
  races: BackendRace[]
}

const RACE_EVENTS_QUERY = `
  query RaceEventsForCalendar($limit: Int!, $skip: Int!) {
    raceEvents(limit: $limit, skip: $skip, orderBy: CREATED_AT_DESC, isTraining: false) {
      id
      eventName
      slug
      type
      mainImage
      races {
        id
        slug
        raceName
        length
        elevation
        startLocation
        startDateTime
      }
    }
  }
`

export default async function CalendarPage() {
  const data = await gql<{ raceEvents: BackendRaceEvent[] }>(RACE_EVENTS_QUERY, {
    limit: 2000,
    skip: 0,
  })

  // Group by date, then by event within each date
  const eventsByDate: Record<string, EventOnDate[]> = {}

  for (const event of data.raceEvents ?? []) {
    const byDate: Record<string, BackendRace[]> = {}
    for (const race of event.races ?? []) {
      const d = new Date(race.startDateTime)
      if (Number.isNaN(d.getTime())) continue
      const dateKey = formatDateKey(d)
      if (!byDate[dateKey]) byDate[dateKey] = []
      byDate[dateKey].push(race)
    }
    for (const [dateKey, races] of Object.entries(byDate)) {
      if (!eventsByDate[dateKey]) eventsByDate[dateKey] = []
      eventsByDate[dateKey].push({
        event: { id: event.id, eventName: event.eventName, slug: event.slug, type: event.type },
        races: races.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()),
      })
    }
  }

  // Sort events within each date: ROAD first, then TRAIL, then OCR
  const typeOrder: Record<string, number> = { ROAD: 0, TRAIL: 1, OCR: 2 }
  for (const dateKey of Object.keys(eventsByDate)) {
    eventsByDate[dateKey].sort((a, b) => {
      const orderA = typeOrder[a.event.type] ?? 3
      const orderB = typeOrder[b.event.type] ?? 3
      if (orderA !== orderB) return orderA - orderB
      const minA = Math.min(...a.races.map((r) => new Date(r.startDateTime).getTime()))
      const minB = Math.min(...b.races.map((r) => new Date(r.startDateTime).getTime()))
      return minA - minB
    })
  }

  return (
    <>
      <Heading>Kalendar trka</Heading>
      <p className="mt-2 text-sm text-text-secondary">Pregledajte sve zakazane događaje po datumu.</p>
      <div className="mt-8">
        <CalendarView eventsByDate={eventsByDate} />
      </div>
    </>
  )
}
