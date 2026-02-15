import { gql } from '@/app/lib/api'
import { Heading } from '@/components/heading'
import { formatDateKey } from '@/lib/formatters'
import type { Metadata } from 'next'
import { CalendarView } from './calendar-view'

export const dynamic = 'force-dynamic'

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

export type RaceWithEvent = {
  race: BackendRace
  event: {
    id: string
    eventName: string
    slug: string
    type: 'TRAIL' | 'ROAD' | 'OCR'
  }
}

const RACE_EVENTS_QUERY = `
  query RaceEventsForCalendar($limit: Int!, $skip: Int!) {
    raceEvents(limit: $limit, skip: $skip, orderBy: CREATED_AT_DESC) {
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
    limit: 200,
    skip: 0,
  })

  // Group races by date (YYYY-MM-DD)
  const racesByDate: Record<string, RaceWithEvent[]> = {}

  for (const event of data.raceEvents ?? []) {
    for (const race of event.races ?? []) {
      const date = new Date(race.startDateTime)
      if (Number.isNaN(date.getTime())) continue

      const dateKey = formatDateKey(date)
      if (!racesByDate[dateKey]) {
        racesByDate[dateKey] = []
      }
      racesByDate[dateKey].push({
        race,
        event: {
          id: event.id,
          eventName: event.eventName,
          slug: event.slug,
          type: event.type,
        },
      })
    }
  }

  // Sort races within each date by start time
  for (const dateKey of Object.keys(racesByDate)) {
    racesByDate[dateKey].sort((a, b) => {
      const timeA = new Date(a.race.startDateTime).getTime()
      const timeB = new Date(b.race.startDateTime).getTime()
      return timeA - timeB
    })
  }

  return (
    <>
      <Heading>Kalendar trka</Heading>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Izaberite datum da vidite zakazane trke.
      </p>
      <div className="mt-8">
        <CalendarView racesByDate={racesByDate} />
      </div>
    </>
  )
}
