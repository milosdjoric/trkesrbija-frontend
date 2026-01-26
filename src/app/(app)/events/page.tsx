import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Divider } from '@/components/divider'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/dropdown'
import { Heading } from '@/components/heading'
import { Input, InputGroup } from '@/components/input'
import { Link } from '@/components/link'
import { Select } from '@/components/select'
import { EllipsisVerticalIcon, MagnifyingGlassIcon } from '@heroicons/react/16/solid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Events',
}

export default async function Events({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  type BackendRace = {
    id: string
    raceName: string | null
    length: number
    elevation: number | null
    startLocation: string
    startDateTime: string
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
        }
      }
    }
  `

  function formatDate(dt: Date) {
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  function formatTime(dt: Date) {
    return dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

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

  function getParam(name: string): string {
    const v = searchParams?.[name]
    if (Array.isArray(v)) return v[0] ?? ''
    return typeof v === 'string' ? v : ''
  }

  const qRaw = getParam('q').trim()
  const q = qRaw.toLowerCase()

  const lenMinRaw = getParam('lenMin').trim()
  const lenMaxRaw = getParam('lenMax').trim()
  const elevMinRaw = getParam('elevMin').trim()
  const elevMaxRaw = getParam('elevMax').trim()

  const lenMin = lenMinRaw ? Number(lenMinRaw) : null
  const lenMax = lenMaxRaw ? Number(lenMaxRaw) : null
  const elevMin = elevMinRaw ? Number(elevMinRaw) : null
  const elevMax = elevMaxRaw ? Number(elevMaxRaw) : null

  const hasLenMin = lenMin != null && !Number.isNaN(lenMin)
  const hasLenMax = lenMax != null && !Number.isNaN(lenMax)
  const hasElevMin = elevMin != null && !Number.isNaN(elevMin)
  const hasElevMax = elevMax != null && !Number.isNaN(elevMax)

  function raceMatchesNumericFilters(r: BackendRace) {
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
    return rn.includes(q) || loc.includes(q)
  }

  // Map backend RaceEvents into the existing UI-friendly `events` shape.
  // Fields that do not exist in the DB yet are filled with reasonable placeholders.
  let events = (data.raceEvents ?? []).map((re) => {
    const racesAll = re.races ?? []
    const races = racesAll.filter((r) => raceMatchesNumericFilters(r) && raceMatchesText(r))

    const sameLocation = allSameString(races.map((r) => r.startLocation))
    const sameStart = allSameDateTime(races.map((r) => r.startDateTime))

    const sharedDate = sameStart.allSame && sameStart.value ? formatDate(sameStart.value) : 'TBD'
    const sharedTime = sameStart.allSame && sameStart.value ? formatTime(sameStart.value) : ''
    const sharedLocation = sameLocation.allSame && sameLocation.value ? sameLocation.value : 'TBD'

    return {
      id: re.id,
      name: re.eventName,
      url: `/events/${re.slug}`,
      imgUrl: re.mainImage ?? 'https://placehold.co/600x400?text=Event',

      // Shared fields are only meaningful if ALL races share them.
      date: sharedDate,
      time: sharedTime,
      location: sharedLocation,

      // Used by the UI and for conditional display in the list.
      hasSharedStart: sameStart.allSame,
      hasSharedLocation: sameLocation.allSame,

      eventType: re.type,

      // These are not in the backend model yet; keep placeholders so the UI stays unchanged.
      ticketsSold: 0,
      ticketsAvailable: 0,
      status: 'On Sale',

      races,
    }
  })

  const anyFilterActive = Boolean(q) || hasLenMin || hasLenMax || hasElevMin || hasElevMax

  events = events.filter((ev) => {
    if (!anyFilterActive) return true

    const eventNameMatches = q ? String(ev.name).toLowerCase().includes(q) : true

    // If the event name matches, keep it even if all races were filtered out by text,
    // but still respect numeric filters (races already filtered numerically).
    if (eventNameMatches) return true

    // Otherwise keep only if there is at least one matching race.
    return (ev.races?.length ?? 0) > 0
  })

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Events</Heading>
          <form method="GET" className="mt-4 flex flex-wrap items-center gap-4">
            <div className="min-w-64 flex-1">
              <InputGroup>
                <MagnifyingGlassIcon />
                <Input name="q" placeholder="Search events or races…" defaultValue={qRaw} />
              </InputGroup>
            </div>

            <div className="flex items-center gap-2">
              <Input
                name="lenMin"
                placeholder="Min km"
                inputMode="decimal"
                className="w-24"
                defaultValue={lenMinRaw}
                aria-label="Minimum length (km)"
              />
              <Input
                name="lenMax"
                placeholder="Max km"
                inputMode="decimal"
                className="w-24"
                defaultValue={lenMaxRaw}
                aria-label="Maximum length (km)"
              />
            </div>

            <div className="flex items-center gap-2">
              <Input
                name="elevMin"
                placeholder="Min m"
                inputMode="decimal"
                className="w-24"
                defaultValue={elevMinRaw}
                aria-label="Minimum elevation (m)"
              />
              <Input
                name="elevMax"
                placeholder="Max m"
                inputMode="decimal"
                className="w-24"
                defaultValue={elevMaxRaw}
                aria-label="Maximum elevation (m)"
              />
            </div>

            <div>
              <Select name="sort_by" defaultValue={getParam('sort_by') || 'name'}>
                <option value="name">Sort by name</option>
                <option value="date">Sort by date</option>
                <option value="status">Sort by status</option>
              </Select>
            </div>

            <Button type="submit">Apply</Button>

            {qRaw || lenMinRaw || lenMaxRaw || elevMinRaw || elevMaxRaw ? (
              <Link href="/events" className="text-sm/6 text-zinc-500 hover:text-zinc-700">
                Clear
              </Link>
            ) : null}
          </form>
        </div>
      </div>
      <ul className="mt-10">
        {events.map((event, index) => (
          <li key={event.id}>
            <Divider soft={index > 0} />
            <div className="flex items-center justify-between">
              <div key={event.id} className="flex gap-6 py-6">
                <div className="w-32 shrink-0">
                  <Link href={event.url} aria-hidden="true">
                    <img className="aspect-3/2 rounded-lg shadow-sm" src={event.imgUrl} alt="" />
                  </Link>
                </div>
                <div className="space-y-1.5">
                  <div className="text-base/6 font-semibold">
                    <Link href={event.url}>{event.name}</Link>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center text-xs/6 text-zinc-500">
                      {event.hasSharedStart ? (
                        <>
                          {event.date} at {event.time}
                        </>
                      ) : (
                        <>Various dates</>
                      )}{' '}
                      <span aria-hidden="true">·</span>{' '}
                      {event.hasSharedLocation ? <>{event.location}</> : <>Various locations</>}
                    </div>
                    <div className="text-xs/6">
                      {event.races?.length ? (
                        <div className="flex items-center gap-1">
                          {event.races.map((r: any) => {
                            const name = r.raceName ?? 'Race'

                            const dt = r.startDateTime ? new Date(r.startDateTime) : null
                            const date =
                              !event.hasSharedStart && dt && !Number.isNaN(dt.getTime())
                                ? `${formatDate(dt)} ${formatTime(dt)}`
                                : ''

                            const length = typeof r.length === 'number' ? `${r.length} km` : ''
                            const elevation = r.elevation != null ? `${r.elevation} m` : ''

                            const location = event.hasSharedLocation
                              ? ''
                              : typeof r.startLocation === 'string' && r.startLocation.trim().length
                                ? r.startLocation
                                : ''

                            const details = [date, length, elevation, location].filter(Boolean).join(' / ')

                            return (
                              <div key={r.id} className="flex flex-wrap items-center gap-2">
                                <Badge color="zinc" className="flex items-start gap-0.5">
                                  <span className="font-medium">{name} -</span>
                                  {details ? <span className="">{details}</span> : null}
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
              <div className="flex items-center gap-4">
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
    </>
  )
}
