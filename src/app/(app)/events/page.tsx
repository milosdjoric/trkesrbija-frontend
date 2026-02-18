import { gql } from '@/app/lib/api'
import { Divider } from '@/components/divider'
import { EventCard } from '@/components/event-card'
import { Heading } from '@/components/heading'
import { formatDate as formatDateUtil } from '@/lib/formatters'
import type { Metadata } from 'next'
import { FiltersBar } from './filters-bar'

export const metadata: Metadata = {
  title: 'Svi događaji',
  description:
    'Pregledajte sve trail i ulične trke u Srbiji. Filtrirajte po dužini, elevaciji i tipu trke.',
  openGraph: {
    title: 'Svi događaji - Trke Srbija',
    description:
      'Pregledajte sve trail i ulične trke u Srbiji. Filtrirajte po dužini, elevaciji i tipu trke.',
  },
}

export default async function Events({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (await searchParams) ?? {}
  type BackendRace = {
    id: string
    slug: string
    raceName: string | null
    length: number
    elevation: number | null
    startLocation: string
    startDateTime: string
    competitionId: string | null
  }
  type BackendCompetition = {
    id: string
    name: string
  }

  type BackendRaceEvent = {
    id: string
    eventName: string
    slug: string
    type: 'TRAIL' | 'ROAD' | 'OCR'
    mainImage: string | null
    tags: string[]
    verified: boolean
    races: BackendRace[]
  }

  const RACE_EVENTS_QUERY = `
    query RaceEventsForList($limit: Int!, $skip: Int!) {
      raceEvents(limit: $limit, skip: $skip, orderBy: CREATED_AT_DESC) {
        id
        eventName
        slug
        type
        mainImage
        tags
        verified
        races {
          id
          slug
          raceName
          length
          elevation
          startLocation
          startDateTime
          competitionId
        }
      }
    }
  `

  const COMPETITIONS_QUERY = `
    query CompetitionsForFilters {
      competitions {
        id
        name
      }
    }
  `

  function allSameString(values: Array<string | null | undefined>) {
    const normalized = values.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean)
    if (!normalized.length) return { allSame: false as const, value: null as string | null }
    const first = normalized[0]
    const allSame = normalized.every((v) => v === first)
    return { allSame, value: allSame ? first : null }
  }

  function allSameDateTime(values: Array<string | null | undefined>) {
    const normalized = values.map((v) => (typeof v === 'string' ? v : null)).filter(Boolean) as string[]

    if (!normalized.length) return { allSame: false as const, value: null as Date | null }

    const first = new Date(normalized[0])
    if (Number.isNaN(first.getTime())) return { allSame: false as const, value: null as Date | null }

    const allSame = normalized.every((v) => {
      const d = new Date(v)
      return !Number.isNaN(d.getTime()) && d.getTime() === first.getTime()
    })

    return { allSame, value: allSame ? first : null }
  }

  const data = await gql<{ raceEvents: BackendRaceEvent[] }>(RACE_EVENTS_QUERY, { limit: 50, skip: 0 })
  const competitionsData = await gql<{ competitions: BackendCompetition[] }>(COMPETITIONS_QUERY)
  const competitions = competitionsData.competitions ?? []
  const competitionNameById = new Map<string, string>(competitions.map((c) => [c.id, c.name]))

  function getParam(name: string): string {
    const v = sp?.[name]
    if (Array.isArray(v)) return v[0] ?? ''
    return typeof v === 'string' ? v : ''
  }

  const qRaw = getParam('q').trim()
  const competitionIdRaw = getParam('competitionId').trim()
  const q = qRaw.toLowerCase()

  const lenMinRaw = getParam('lenMin').trim()
  const lenMaxRaw = getParam('lenMax').trim()
  const elevMinRaw = getParam('elevMin').trim()
  const elevMaxRaw = getParam('elevMax').trim()
  const eventTypeRaw = getParam('eventType').trim()
  const sortByRaw = getParam('sortBy').trim()
  const tagRaw = getParam('tag').trim()

  const showPastRaw = getParam('showPast').trim()
  const showPast = showPastRaw === 'true'
  const verifiedRaw = getParam('verified').trim()
  const verifiedFilter = verifiedRaw === 'true' ? true : verifiedRaw === 'false' ? false : null

  const lenMin = lenMinRaw ? Number(lenMinRaw) : null
  const lenMax = lenMaxRaw ? Number(lenMaxRaw) : null
  const elevMin = elevMinRaw ? Number(elevMinRaw) : null
  const elevMax = elevMaxRaw ? Number(elevMaxRaw) : null

  const now = new Date().getTime()

  const hasLenMin = lenMin != null && !Number.isNaN(lenMin)
  const hasLenMax = lenMax != null && !Number.isNaN(lenMax)
  const hasElevMin = elevMin != null && !Number.isNaN(elevMin)
  const hasElevMax = elevMax != null && !Number.isNaN(elevMax)
  const hasCompetition = Boolean(competitionIdRaw)
  const hasEventType = Boolean(eventTypeRaw)
  const hasTag = Boolean(tagRaw)

  function raceMatchesNumericFilters(r: BackendRace) {
    if (hasCompetition && r.competitionId !== competitionIdRaw) return false
    if (hasLenMin && !(r.length >= (lenMin as number))) return false
    if (hasLenMax && !(r.length <= (lenMax as number))) return false

    // elevation is nullable; if user filters by elevation, require a value
    if ((hasElevMin || hasElevMax) && r.elevation == null) return false
    if (hasElevMin && !((r.elevation as number) >= (elevMin as number))) return false
    if (hasElevMax && !((r.elevation as number) <= (elevMax as number))) return false

    return true
  }

  function raceMatchesText(r: BackendRace) {
    if (!q) return true
    const rn = (r.raceName ?? '').toLowerCase()
    const loc = (r.startLocation ?? '').toLowerCase()
    const compName = (r.competitionId ? competitionNameById.get(r.competitionId) : '') ?? ''
    const cn = compName.toLowerCase()
    return rn.includes(q) || loc.includes(q) || cn.includes(q)
  }

  function eventMatchesText(re: BackendRaceEvent) {
    if (!q) return true
    const en = (re.eventName ?? '').toLowerCase()
    const type = (re.type ?? '').toLowerCase()
    return en.includes(q) || type.includes(q)
  }

  // Map backend RaceEvents into the existing UI-friendly `events` shape.
  // Fields that do not exist in the DB yet are filled with reasonable placeholders.
  let events = (data.raceEvents ?? []).map((re) => {
    const racesAll = re.races ?? []

    const eventStartTs = (() => {
      const ts = racesAll.map((r) => new Date(r.startDateTime).getTime()).filter((t) => Number.isFinite(t))
      return ts.length ? Math.min(...ts) : Number.POSITIVE_INFINITY
    })()

    const racesSorted = [...racesAll].sort((a, b) => {
      const da = new Date(a.startDateTime).getTime()
      const db = new Date(b.startDateTime).getTime()
      return da - db
    })

    // Keep all races for display, but mark which ones match current filters.
    // Text match should include event name/type as well; if the event matches the text,
    // individual races only need to satisfy numeric filters.
    const evTextMatch = eventMatchesText(re)

    const racesWithMatch = racesSorted.map((r) => ({
      ...r,
      _matchesFilters: raceMatchesNumericFilters(r) && (evTextMatch || raceMatchesText(r)),
    }))

    const matchingRaces = racesWithMatch.filter((r) => r._matchesFilters)

    const earliestTsFrom = (items: Array<{ startDateTime: string }>) => {
      const ts = items.map((r) => new Date(r.startDateTime).getTime()).filter((n) => Number.isFinite(n))
      return ts.length ? Math.min(...ts) : Number.POSITIVE_INFINITY
    }

    const eventEarliestTsAll = earliestTsFrom(racesSorted)
    const eventEarliestTsMatch = earliestTsFrom(matchingRaces)

    // Shared fields should be computed from the matching races (the ones that make the event visible)
    const sameLocation = allSameString(matchingRaces.map((r) => r.startLocation))

    // Shared start logic:
    // - hasSharedDateTime: all matching races share the exact same DateTime
    // - hasSharedDate: all matching races share the same calendar date (but possibly different times)
    const sameStartDateTime = allSameDateTime(matchingRaces.map((r) => r.startDateTime))

    const dateKeys = matchingRaces
      .map((r) => (typeof r.startDateTime === 'string' ? r.startDateTime : null))
      .filter(Boolean)
      .map((iso) => {
        const d = new Date(iso as string)
        return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
      })
      .filter(Boolean)

    const hasSharedDate = dateKeys.length > 0 && dateKeys.every((k) => k === dateKeys[0])

    const sharedDateBase = (() => {
      const firstIso = matchingRaces.find((r) => typeof r.startDateTime === 'string' && r.startDateTime)?.startDateTime
      if (!firstIso) return null
      const d = new Date(firstIso)
      return Number.isNaN(d.getTime()) ? null : d
    })()

    const sharedDate =
      sharedDateBase && hasSharedDate
        ? formatDateUtil(sharedDateBase, 'short')
        : 'TBD'

    const sharedTime =
      sameStartDateTime.allSame && sameStartDateTime.value
        ? sameStartDateTime.value.toLocaleTimeString('sr-Latn-RS', { hour: '2-digit', minute: '2-digit', hour12: false })
        : ''
    const sharedLocation = sameLocation.allSame && sameLocation.value ? sameLocation.value : 'TBD'

    return {
      id: re.id,
      name: re.eventName,
      url: `/events/${re.slug}`,
      imgUrl: re.mainImage ?? 'https://placehold.co/600x400?text=Event',

      // Shared fields are only meaningful if ALL matching races share them.
      date: sharedDate,
      time: sharedTime,
      location: sharedLocation,

      // Used by the UI and for conditional display in the list.
      hasSharedStart: sameStartDateTime.allSame,
      hasSharedDate: hasSharedDate,
      hasSharedLocation: sameLocation.allSame,

      eventType: re.type,
      tags: re.tags ?? [],
      verified: re.verified ?? false,
      _eventStartTs: eventStartTs,

      // These are not in the backend model yet; keep placeholders so the UI stays unchanged.
      ticketsSold: 0,
      ticketsAvailable: 0,
      status: 'On Sale',

      // Keep ALL races, but annotated.
      races: racesWithMatch,
      matchingRacesCount: matchingRaces.length,
      _sortTsAll: eventEarliestTsAll,
      _sortTsMatch: eventEarliestTsMatch,
    }
  })

  const anyFilterActive =
    Boolean(q) || hasLenMin || hasLenMax || hasElevMin || hasElevMax || hasCompetition || hasEventType || hasTag || verifiedFilter !== null

  events = events.filter((ev) => {
    // Filter by event type
    if (hasEventType && ev.eventType !== eventTypeRaw) return false

    // Filter by tag (case-insensitive)
    if (hasTag) {
      const tagLower = tagRaw.toLowerCase()
      const eventTags = (ev.tags ?? []).map((t: string) => t.toLowerCase())
      if (!eventTags.includes(tagLower)) return false
    }

    // Filter by verified status
    if (verifiedFilter !== null && ev.verified !== verifiedFilter) return false

    // Filter out past events unless showPast is true
    if (!showPast && ev._eventStartTs < now) return false

    if (!anyFilterActive) return true

    // When filters are active, hide events that have zero matching races.
    return (ev as any).matchingRacesCount > 0
  })

  // Helper functions for sorting by race attributes
  function getMinRaceLength(ev: any): number {
    const matchingRaces = (ev.races ?? []).filter((r: any) => r._matchesFilters)
    const racesToUse = matchingRaces.length > 0 ? matchingRaces : (ev.races ?? [])
    const lengths = racesToUse.map((r: any) => r.length).filter((l: any) => typeof l === 'number')
    return lengths.length > 0 ? Math.min(...lengths) : Infinity
  }

  function getMaxRaceLength(ev: any): number {
    const matchingRaces = (ev.races ?? []).filter((r: any) => r._matchesFilters)
    const racesToUse = matchingRaces.length > 0 ? matchingRaces : (ev.races ?? [])
    const lengths = racesToUse.map((r: any) => r.length).filter((l: any) => typeof l === 'number')
    return lengths.length > 0 ? Math.max(...lengths) : -Infinity
  }

  function getMinRaceElevation(ev: any): number {
    const matchingRaces = (ev.races ?? []).filter((r: any) => r._matchesFilters)
    const racesToUse = matchingRaces.length > 0 ? matchingRaces : (ev.races ?? [])
    const elevations = racesToUse.map((r: any) => r.elevation).filter((e: any) => typeof e === 'number')
    return elevations.length > 0 ? Math.min(...elevations) : Infinity
  }

  function getMaxRaceElevation(ev: any): number {
    const matchingRaces = (ev.races ?? []).filter((r: any) => r._matchesFilters)
    const racesToUse = matchingRaces.length > 0 ? matchingRaces : (ev.races ?? [])
    const elevations = racesToUse.map((r: any) => r.elevation).filter((e: any) => typeof e === 'number')
    return elevations.length > 0 ? Math.max(...elevations) : -Infinity
  }

  // Sort events based on sortBy parameter
  events = [...events].sort((a: any, b: any) => {
    switch (sortByRaw) {
      case 'distance_asc':
        return getMinRaceLength(a) - getMinRaceLength(b)
      case 'distance_desc':
        return getMaxRaceLength(b) - getMaxRaceLength(a)
      case 'elevation_asc':
        return getMinRaceElevation(a) - getMinRaceElevation(b)
      case 'elevation_desc':
        return getMaxRaceElevation(b) - getMaxRaceElevation(a)
      case 'name':
        return (a.name ?? '').localeCompare(b.name ?? '')
      default: {
        // Default: sort by date
        const rawA = anyFilterActive ? a._sortTsMatch : a._sortTsAll
        const rawB = anyFilterActive ? b._sortTsMatch : b._sortTsAll
        const ta = typeof rawA === 'number' && Number.isFinite(rawA) ? rawA : Number.POSITIVE_INFINITY
        const tb = typeof rawB === 'number' && Number.isFinite(rawB) ? rawB : Number.POSITIVE_INFINITY
        if (ta !== tb) return ta < tb ? -1 : 1
        return (a.name ?? '').localeCompare(b.name ?? '')
      }
    }
  })

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Svi događaji</Heading>
          <FiltersBar
            initial={{
              q: qRaw,
              lenMin: lenMinRaw,
              lenMax: lenMaxRaw,
              elevMin: elevMinRaw,
              elevMax: elevMaxRaw,
              competitionId: competitionIdRaw,
              eventType: eventTypeRaw,
              sortBy: sortByRaw,
              showPast: showPastRaw,
              tag: tagRaw,
              verified: verifiedRaw,
            }}
            competitions={competitions}
          />
        </div>
      </div>
      {events.length === 0 ? (
        <div className="mt-10 rounded-lg border border-zinc-200 p-6 text-sm/6">
          {anyFilterActive ? (
            <>
              <div className="font-medium">Nema rezultata za izabrane filtere.</div>
              <div className="mt-1">
                Pokušajte da prilagodite pretragu, dužinu ili elevaciju, ili očistite filtere da vidite sve događaje.
              </div>
            </>
          ) : (
            <>
              <div className="font-medium">Još nema događaja.</div>
              <div className="mt-1">
                Trenutno nema događaja u bazi podataka.
              </div>
            </>
          )}
        </div>
      ) : null}

      {(() => {
        // Group already-sorted events by month (based on the same sort timestamp we use elsewhere)
        type Group = { month: string; items: any[] }

        const groups: Group[] = []
        const tsFor = (ev: any) => (anyFilterActive ? ev._sortTsMatch : ev._sortTsAll)

        const monthLabelFor = (ts: number) => {
          if (!Number.isFinite(ts)) return 'TBD'
          const d = new Date(ts)
          const month = d.toLocaleDateString('sr-Latn-RS', { month: 'long' })
          const year = d.getFullYear()
          return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`
        }

        for (const ev of events) {
          const ts = tsFor(ev)
          const month = monthLabelFor(ts)
          const last = groups[groups.length - 1]
          if (!last || last.month !== month) {
            groups.push({ month, items: [ev] })
          } else {
            last.items.push(ev)
          }
        }

        return (
          <div className="mt-10 space-y-4">
            {groups.map((g, gi) => (
              <details key={`${g.month}-${gi}`} className="rounded-xl" open>
                <summary className="cursor-pointer px-4 py-3 text-sm font-normal select-none">
                  {g.month} <span className="font-normal text-zinc-500">({g.items.length})</span>
                </summary>

                <ul className="px-4 pb-4">
                  {g.items.map((event: any, index: number) => (
                    <li key={event.id}>
                      <Divider soft={index > 0} />
                      <EventCard
                        name={event.name}
                        url={event.url}
                        type={event.eventType}
                        date={event.date}
                        time={event.time}
                        location={event.location}
                        hasSharedStart={event.hasSharedStart}
                        hasSharedDate={event.hasSharedDate}
                        hasSharedLocation={event.hasSharedLocation}
                        races={event.races}
                        showDimmed={true}
                        filtersActive={anyFilterActive}
                        verified={event.verified}
                      />
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        )
      })()}
    </>
  )
}
