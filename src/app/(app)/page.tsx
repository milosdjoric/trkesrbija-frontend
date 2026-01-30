import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Divider } from '@/components/divider'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/dropdown'
import { Heading } from '@/components/heading'
import { Link } from '@/components/link'
import { EllipsisVerticalIcon } from '@heroicons/react/16/solid'
import type { Metadata } from 'next'
import { FiltersBar } from './events/filters-bar'

export const metadata: Metadata = {
  title: 'Events',
}

export default async function Events({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (await searchParams) ?? {}
  type BackendRace = {
    id: string
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
    type: 'TRAIL' | 'ROAD' | string
    mainImage: string | null
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
        races {
          id
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

  const lenMin = lenMinRaw ? Number(lenMinRaw) : null
  const lenMax = lenMaxRaw ? Number(lenMaxRaw) : null
  const elevMin = elevMinRaw ? Number(elevMinRaw) : null
  const elevMax = elevMaxRaw ? Number(elevMaxRaw) : null

  const hasLenMin = lenMin != null && !Number.isNaN(lenMin)
  const hasLenMax = lenMax != null && !Number.isNaN(lenMax)
  const hasElevMin = elevMin != null && !Number.isNaN(elevMin)
  const hasElevMax = elevMax != null && !Number.isNaN(elevMax)
  const hasCompetition = Boolean(competitionIdRaw)
  const hasEventType = Boolean(eventTypeRaw)

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
        ? sharedDateBase.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : 'TBD'

    const sharedTime =
      sameStartDateTime.allSame && sameStartDateTime.value
        ? sameStartDateTime.value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
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
    Boolean(q) || hasLenMin || hasLenMax || hasElevMin || hasElevMax || hasCompetition || hasEventType

  events = events.filter((ev) => {
    // Filter by event type
    if (hasEventType && ev.eventType !== eventTypeRaw) return false

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

  // Helper for formatting month headings
  function formatMonthHeading(ts: number) {
    if (!Number.isFinite(ts)) return null
    const d = new Date(ts)
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
  }

  // Helpers for formatting race date/time inside badges
  function formatDate(d: Date) {
    return d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>All Race Events</Heading>
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
            }}
            competitions={competitions}
          />
        </div>
      </div>
      {events.length === 0 ? (
        <div className="mt-10 rounded-lg border border-zinc-200 p-6 text-sm/6">
          {anyFilterActive ? (
            <>
              <div className="font-medium">No results for the selected filters.</div>
              <div className="mt-1">
                Try adjusting the search, length, or elevation filters, or clear filters to see all events.
              </div>
            </>
          ) : (
            <>
              <div className="font-medium">No events yet.</div>
              <div className="mt-1">
                There are currently no race events in the database. Create one in the backend and refresh this page.
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
          return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
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

                      {/* postojeći sadržaj event kartice ostaje NEPROMENJEN */}
                      <div className="flex items-center justify-between">
                        <div key={event.id} className="flex w-full gap-6 py-6 md:w-fit">
                          <div className="w-full space-y-1.5 md:w-fit">
                            <div className="text-lg font-semibold md:text-base/6">
                              <Link href={event.url}>{event.name}</Link>
                            </div>
                            <div className="flex flex-col flex-wrap gap-2 md:flex-row">
                              <div className="flex flex-wrap items-center gap-1 text-sm/6 text-zinc-500">
                                {event.hasSharedStart ? (
                                  <>
                                    {event.date} at {event.time}
                                  </>
                                ) : event.hasSharedDate ? (
                                  <>{event.date}</>
                                ) : (
                                  <>Various dates</>
                                )}{' '}
                                <span aria-hidden="true">/</span>{' '}
                                {event.hasSharedLocation ? (
                                  typeof event.location === 'string' && event.location.startsWith('http') ? (
                                    <a
                                      href={event.location}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline underline-offset-2 hover:text-zinc-700"
                                    >
                                      Start location
                                    </a>
                                  ) : (
                                    <>{event.location}</>
                                  )
                                ) : (
                                  <>Various locations</>
                                )}
                              </div>
                              <div className="text-xs/6">
                                {event.races?.length ? (
                                  <div className="flex flex-col flex-wrap items-start gap-1 md:flex-row md:items-center">
                                    {event.races.map((r: any) => {
                                      const name = r.raceName ?? 'Race'

                                      const matches = !anyFilterActive || Boolean(r._matchesFilters)

                                      const dt = r.startDateTime ? new Date(r.startDateTime) : null
                                      const date =
                                        dt && !Number.isNaN(dt.getTime())
                                          ? event.hasSharedStart
                                            ? ''
                                            : event.hasSharedDate
                                              ? formatTime(dt)
                                              : `${formatDate(dt)} ${formatTime(dt)}`
                                          : ''

                                      const length = typeof r.length === 'number' ? `${r.length} km` : ''
                                      const elevation = r.elevation != null ? `${r.elevation} m` : ''

                                      const location = event.hasSharedLocation
                                        ? ''
                                        : typeof r.startLocation === 'string' && r.startLocation.trim().length
                                          ? r.startLocation
                                          : ''

                                      const competition = r.competitionId
                                        ? (competitionNameById.get(r.competitionId) ?? '')
                                        : ''

                                      const details = [date, competition, length, elevation, location]
                                        .filter(Boolean)
                                        .join(' / ')

                                      return (
                                        <div key={r.id} className="flex w-full flex-wrap items-center gap-2 md:w-fit">
                                          <Badge
                                            color="zinc"
                                            className={`flex w-full flex-col items-center gap-0.5 md:w-fit md:flex-row md:items-start ${matches ? '' : 'line-through opacity-60'}`}
                                          >
                                            <span className="font-medium">{name}</span>
                                            {details ? (
                                              <div className="flex flex-row gap-2">
                                                <div className="hidden md:block">-</div>
                                                {details}
                                              </div>
                                            ) : null}
                                          </Badge>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  'No races yet'
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex hidden items-center gap-4">
                          <Badge className="max-sm:hidden" color={event.status === 'On Sale' ? 'lime' : 'zinc'}>
                            {event.status}
                          </Badge>
                          <Dropdown>
                            <DropdownButton plain aria-label="More options">
                              <EllipsisVerticalIcon />
                            </DropdownButton>
                            <DropdownMenu anchor="bottom end">
                              <DropdownItem href={event.url}>View</DropdownItem>
                              <DropdownItem>Edit</DropdownItem>
                              <DropdownItem>Delete</DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </div>
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
