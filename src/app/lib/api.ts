// src/app/lib/api.ts
// GraphQL fetch wrapper (FE-ready for: access token in Authorization header + refresh token in httpOnly cookie)

export type GraphQLErrorExtensions = {
  code?: string
  field?: string
  [key: string]: unknown
}

export type GraphQLErrorItem = {
  message: string
  extensions?: GraphQLErrorExtensions
}

export class ApiError extends Error {
  code?: string
  field?: string
  errors?: GraphQLErrorItem[]

  constructor(message: string, opts?: { code?: string; field?: string; errors?: GraphQLErrorItem[] }) {
    super(message)
    this.name = 'ApiError'
    this.code = opts?.code
    this.field = opts?.field
    this.errors = opts?.errors
  }
}

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql'

export async function gql<TData>(
  query: string,
  variables?: Record<string, unknown>,
  opts?: { accessToken?: string | null; signal?: AbortSignal }
): Promise<TData> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    credentials: 'include', // ✅ needed for refresh cookie
    headers: {
      'Content-Type': 'application/json',
      ...(opts?.accessToken ? { Authorization: `Bearer ${opts.accessToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    signal: opts?.signal,
  })

  // If server is down / proxy issues etc.
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ApiError(`Request failed (${res.status})${text ? `: ${text}` : ''}`, { code: String(res.status) })
  }

  // Guard: non-JSON responses
  let json: { data?: TData; errors?: GraphQLErrorItem[] }
  try {
    json = (await res.json()) as { data?: TData; errors?: GraphQLErrorItem[] }
  } catch {
    const text = await res.text().catch(() => '')
    throw new ApiError(`Invalid JSON response from API${text ? `: ${text}` : ''}`)
  }

  if (json.errors?.length) {
    const first = json.errors[0]
    throw new ApiError(first.message ?? 'GraphQL error', {
      code: first.extensions?.code,
      field: first.extensions?.field,
      errors: json.errors,
    })
  }

  if (!json.data) {
    throw new ApiError('No data returned from API')
  }

  return json.data
}

// -----------------------------
// Domain helpers (temporary, FE-only)
// Keep these here for now; we can split into src/lib/* later.
// -----------------------------

export type RaceEventType = 'TRAIL' | 'ROAD'

export type RaceEvent = {
  id: string
  eventName: string
  slug: string
  type: RaceEventType
  description?: string | null
  mainImage?: string | null
  tags: string[]
  createdAt?: string
  updatedAt?: string
}

export type Race = {
  id: string
  raceName?: string | null
  length: number
  elevation?: number | null
  gpsFile?: string | null
  startLocation: string
  startDateTime: string
  endDateTime?: string | null
  raceEventId: string
  competitionId?: string | null
  createdAt?: string
  updatedAt?: string
}

const RACE_EVENTS_QUERY = `
  query RaceEvents($limit: Int = 50, $skip: Int = 0) {
    raceEvents(limit: $limit, skip: $skip) {
      id
      eventName
      slug
      type
      description
      mainImage
      tags
      createdAt
      updatedAt
    }
  }
`

const RACES_QUERY = `
  query Races($raceEventId: ID, $limit: Int = 200, $skip: Int = 0) {
    races(raceEventId: $raceEventId, limit: $limit, skip: $skip) {
      id
      raceName
      length
      elevation
      gpsFile
      startLocation
      startDateTime
      endDateTime
      raceEventId
      competitionId
      createdAt
      updatedAt
    }
  }
`

export async function fetchRaceEvents(params?: { limit?: number; skip?: number; signal?: AbortSignal }) {
  const data = await gql<{ raceEvents: RaceEvent[] }>(
    RACE_EVENTS_QUERY,
    {
      limit: params?.limit ?? 50,
      skip: params?.skip ?? 0,
    },
    { signal: params?.signal }
  )
  return data.raceEvents
}

export async function fetchRaces(params?: {
  raceEventId?: string
  limit?: number
  skip?: number
  signal?: AbortSignal
}) {
  const data = await gql<{ races: Race[] }>(
    RACES_QUERY,
    {
      raceEventId: params?.raceEventId ?? null,
      limit: params?.limit ?? 200,
      skip: params?.skip ?? 0,
    },
    { signal: params?.signal }
  )
  return data.races
}

export type RaceEventWithRaces = RaceEvent & { races: Race[] }

export function buildEventsWithRaces(events: RaceEvent[], races: Race[]): RaceEventWithRaces[] {
  const byEventId = new Map<string, Race[]>()
  for (const r of races) {
    const key = r.raceEventId
    const list = byEventId.get(key)
    if (list) list.push(r)
    else byEventId.set(key, [r])
  }

  return events.map((e) => ({
    ...e,
    races: byEventId.get(e.id) ?? [],
  }))
}
