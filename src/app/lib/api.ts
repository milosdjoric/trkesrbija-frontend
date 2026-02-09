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

const RACE_EVENT_BY_SLUG_QUERY = `
  query RaceEventBySlug($slug: String!) {
    raceEvent(slug: $slug) {
      id
      eventName
      slug
      type
      description
      mainImage
      tags
      createdAt
      updatedAt
      races {
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
  }
`

export async function fetchRaceEventBySlug(slug: string, signal?: AbortSignal): Promise<RaceEventWithRaces | null> {
  const data = await gql<{ raceEvent: RaceEventWithRaces | null }>(RACE_EVENT_BY_SLUG_QUERY, { slug }, { signal })
  return data.raceEvent
}

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

// -----------------------------
// Race Registration Types & Queries
// -----------------------------

export type Gender = 'MALE' | 'FEMALE'
export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED'

export type RaceRegistration = {
  id: string
  userId?: string | null
  raceId: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  dateOfBirth: string
  gender: Gender
  status: RegistrationStatus
  bibNumber?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  race?: Race & { raceEvent?: RaceEvent }
  user?: {
    id: string
    email: string
    name?: string | null
  } | null
}

export type SelfRegistrationInput = {
  raceId: string
  firstName: string
  lastName: string
  phone?: string | null
  dateOfBirth: string
  gender: Gender
}

export type AdminRegistrationInput = SelfRegistrationInput & {
  email: string
  status?: RegistrationStatus
  bibNumber?: string | null
  notes?: string | null
}

// GraphQL Queries & Mutations for Registration

const MY_RACE_REGISTRATIONS_QUERY = `
  query MyRaceRegistrations {
    myRaceRegistrations {
      id
      firstName
      lastName
      email
      phone
      dateOfBirth
      gender
      status
      bibNumber
      createdAt
      race {
        id
        raceName
        length
        startDateTime
        startLocation
        raceEvent {
          id
          eventName
          slug
        }
      }
    }
  }
`

const RACE_REGISTRATIONS_QUERY = `
  query RaceRegistrations($raceId: ID!, $status: RegistrationStatus, $search: String) {
    raceRegistrations(raceId: $raceId, status: $status, search: $search) {
      id
      firstName
      lastName
      email
      phone
      dateOfBirth
      gender
      status
      bibNumber
      notes
      createdAt
      user {
        id
        email
        name
      }
    }
  }
`

const REGISTER_FOR_RACE_MUTATION = `
  mutation RegisterForRace($input: SelfRegistrationInput!) {
    registerForRace(input: $input) {
      id
      firstName
      lastName
      email
      status
      createdAt
    }
  }
`

const CANCEL_MY_REGISTRATION_MUTATION = `
  mutation CancelMyRegistration($registrationId: ID!) {
    cancelMyRegistration(registrationId: $registrationId) {
      id
      status
    }
  }
`

const ADMIN_REGISTER_MUTATION = `
  mutation AdminRegisterForRace($input: AdminRegistrationInput!) {
    adminRegisterForRace(input: $input) {
      id
      firstName
      lastName
      email
      status
      bibNumber
      createdAt
    }
  }
`

const UPDATE_REGISTRATION_STATUS_MUTATION = `
  mutation UpdateRegistrationStatus($registrationId: ID!, $status: RegistrationStatus!) {
    updateRegistrationStatus(registrationId: $registrationId, status: $status) {
      id
      status
    }
  }
`

const ASSIGN_BIB_NUMBER_MUTATION = `
  mutation AssignBibNumber($registrationId: ID!, $bibNumber: String!) {
    assignBibNumber(registrationId: $registrationId, bibNumber: $bibNumber) {
      id
      bibNumber
    }
  }
`

const DELETE_REGISTRATION_MUTATION = `
  mutation DeleteRegistration($registrationId: ID!) {
    deleteRegistration(registrationId: $registrationId)
  }
`

// API Functions

export async function fetchMyRaceRegistrations(accessToken?: string | null): Promise<RaceRegistration[]> {
  const data = await gql<{ myRaceRegistrations: RaceRegistration[] }>(
    MY_RACE_REGISTRATIONS_QUERY,
    {},
    { accessToken }
  )
  return data.myRaceRegistrations
}

export async function fetchRaceRegistrations(
  raceId: string,
  params?: { status?: RegistrationStatus; search?: string },
  accessToken?: string | null
): Promise<RaceRegistration[]> {
  const data = await gql<{ raceRegistrations: RaceRegistration[] }>(
    RACE_REGISTRATIONS_QUERY,
    { raceId, status: params?.status, search: params?.search },
    { accessToken }
  )
  return data.raceRegistrations
}

export async function registerForRace(
  input: SelfRegistrationInput,
  accessToken?: string | null
): Promise<RaceRegistration> {
  const data = await gql<{ registerForRace: RaceRegistration }>(
    REGISTER_FOR_RACE_MUTATION,
    { input },
    { accessToken }
  )
  return data.registerForRace
}

export async function cancelMyRegistration(
  registrationId: string,
  accessToken?: string | null
): Promise<RaceRegistration> {
  const data = await gql<{ cancelMyRegistration: RaceRegistration }>(
    CANCEL_MY_REGISTRATION_MUTATION,
    { registrationId },
    { accessToken }
  )
  return data.cancelMyRegistration
}

export async function adminRegisterForRace(
  input: AdminRegistrationInput,
  accessToken?: string | null
): Promise<RaceRegistration> {
  const data = await gql<{ adminRegisterForRace: RaceRegistration }>(
    ADMIN_REGISTER_MUTATION,
    { input },
    { accessToken }
  )
  return data.adminRegisterForRace
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: RegistrationStatus,
  accessToken?: string | null
): Promise<RaceRegistration> {
  const data = await gql<{ updateRegistrationStatus: RaceRegistration }>(
    UPDATE_REGISTRATION_STATUS_MUTATION,
    { registrationId, status },
    { accessToken }
  )
  return data.updateRegistrationStatus
}

export async function assignBibNumber(
  registrationId: string,
  bibNumber: string,
  accessToken?: string | null
): Promise<RaceRegistration> {
  const data = await gql<{ assignBibNumber: RaceRegistration }>(
    ASSIGN_BIB_NUMBER_MUTATION,
    { registrationId, bibNumber },
    { accessToken }
  )
  return data.assignBibNumber
}

export async function deleteRegistration(
  registrationId: string,
  accessToken?: string | null
): Promise<boolean> {
  const data = await gql<{ deleteRegistration: boolean }>(
    DELETE_REGISTRATION_MUTATION,
    { registrationId },
    { accessToken }
  )
  return data.deleteRegistration
}

// -----------------------------
// Checkpoint & Timing Types & Queries
// -----------------------------

export type Checkpoint = {
  id: string
  name: string
  raceId: string
  distance?: number | null
  orderIndex: number
  createdAt?: string
  updatedAt?: string
}

export type CheckpointWithRace = Checkpoint & {
  race: {
    id: string
    raceName?: string | null
    length: number
    startDateTime: string
    raceEvent: {
      id: string
      eventName: string
      slug: string
    }
  }
}

export type RegistrationBasic = {
  id: string
  firstName: string
  lastName: string
  bibNumber?: string | null
  gender: Gender
}

export type CheckpointBasic = {
  id: string
  name: string
  orderIndex: number
}

export type Timing = {
  id: string
  registrationId: string
  checkpointId: string
  raceId: string
  timestamp: string
  registration: RegistrationBasic
  checkpoint: CheckpointBasic
}

export type CheckpointTime = {
  checkpointId: string
  checkpointName: string
  orderIndex: number
  timestamp: string
}

export type RaceResult = {
  registration: RegistrationBasic
  checkpointTimes: CheckpointTime[]
  startTime?: string | null
  finishTime?: string | null
  totalTime?: number | null // milliseconds
}

// GraphQL Queries & Mutations for Checkpoint/Timing

const MY_ASSIGNED_CHECKPOINT_QUERY = `
  query MyAssignedCheckpoint {
    myAssignedCheckpoint {
      id
      name
      raceId
      distance
      orderIndex
      race {
        id
        raceName
        length
        startDateTime
        raceEvent {
          id
          eventName
          slug
        }
      }
    }
  }
`

const RECENT_TIMINGS_QUERY = `
  query RecentTimings($checkpointId: ID!, $limit: Int) {
    recentTimings(checkpointId: $checkpointId, limit: $limit) {
      id
      registrationId
      checkpointId
      raceId
      timestamp
      registration {
        id
        firstName
        lastName
        bibNumber
        gender
      }
      checkpoint {
        id
        name
        orderIndex
      }
    }
  }
`

const RACE_RESULTS_QUERY = `
  query RaceResults($raceId: ID!, $gender: Gender) {
    raceResults(raceId: $raceId, gender: $gender) {
      registration {
        id
        firstName
        lastName
        bibNumber
        gender
      }
      checkpointTimes {
        checkpointId
        checkpointName
        orderIndex
        timestamp
      }
      startTime
      finishTime
      totalTime
    }
  }
`

const CHECKPOINTS_QUERY = `
  query Checkpoints($raceId: ID!) {
    checkpoints(raceId: $raceId) {
      id
      name
      raceId
      distance
      orderIndex
    }
  }
`

const RECORD_TIME_MUTATION = `
  mutation RecordTime($input: RecordTimeInput!) {
    recordTime(input: $input) {
      id
      registrationId
      checkpointId
      raceId
      timestamp
      registration {
        id
        firstName
        lastName
        bibNumber
        gender
      }
      checkpoint {
        id
        name
        orderIndex
      }
    }
  }
`

// API Functions for Checkpoint/Timing

export async function fetchMyAssignedCheckpoint(accessToken?: string | null): Promise<CheckpointWithRace | null> {
  const data = await gql<{ myAssignedCheckpoint: CheckpointWithRace | null }>(
    MY_ASSIGNED_CHECKPOINT_QUERY,
    {},
    { accessToken }
  )
  return data.myAssignedCheckpoint
}

export async function fetchRecentTimings(
  checkpointId: string,
  limit = 10,
  accessToken?: string | null
): Promise<Timing[]> {
  const data = await gql<{ recentTimings: Timing[] }>(
    RECENT_TIMINGS_QUERY,
    { checkpointId, limit },
    { accessToken }
  )
  return data.recentTimings
}

export async function fetchRaceResults(
  raceId: string,
  gender?: Gender,
  accessToken?: string | null
): Promise<RaceResult[]> {
  const data = await gql<{ raceResults: RaceResult[] }>(RACE_RESULTS_QUERY, { raceId, gender }, { accessToken })
  return data.raceResults
}

export async function fetchCheckpoints(raceId: string, accessToken?: string | null): Promise<Checkpoint[]> {
  const data = await gql<{ checkpoints: Checkpoint[] }>(CHECKPOINTS_QUERY, { raceId }, { accessToken })
  return data.checkpoints
}

export async function recordTime(bibNumber: string, accessToken?: string | null): Promise<Timing> {
  const data = await gql<{ recordTime: Timing }>(RECORD_TIME_MUTATION, { input: { bibNumber } }, { accessToken })
  return data.recordTime
}

// -----------------------------
// Admin Checkpoint Management
// -----------------------------

export type JudgeUser = {
  id: string
  email: string
  name?: string | null
}

// Checkpoint - fizička lokacija u okviru eventa
export type EventCheckpoint = {
  id: string
  name: string
  raceEventId: string
  assignedJudges: JudgeUser[]
  createdAt: string
  updatedAt: string
}

// RaceCheckpoint - veza između trke i checkpointa sa redosledom
export type RaceCheckpoint = {
  id: string
  raceId: string
  checkpointId: string
  orderIndex: number
  distance: number | null
  checkpoint: EventCheckpoint
  createdAt: string
  updatedAt: string
}

// Legacy type - kombinuje checkpoint sa redosledom (za kompatibilnost)
export type CheckpointWithJudges = Checkpoint & {
  assignedJudges: JudgeUser[]
}

export type CreateCheckpointInput = {
  raceEventId: string
  name: string
}

export type UpdateCheckpointInput = {
  name?: string
}

export type RaceCheckpointOrderInput = {
  checkpointId: string
  orderIndex: number
  distance?: number | null
}

export type SetRaceCheckpointsInput = {
  raceId: string
  checkpoints: RaceCheckpointOrderInput[]
}

// Query za checkpoint-e eventa (fizičke lokacije)
const EVENT_CHECKPOINTS_QUERY = `
  query EventCheckpoints($raceEventId: ID!) {
    eventCheckpoints(raceEventId: $raceEventId) {
      id
      name
      raceEventId
      assignedJudges {
        id
        email
        name
      }
      createdAt
      updatedAt
    }
  }
`

// Query za checkpoint-e trke sa redosledom
const RACE_CHECKPOINTS_QUERY = `
  query RaceCheckpoints($raceId: ID!) {
    raceCheckpoints(raceId: $raceId) {
      id
      raceId
      checkpointId
      orderIndex
      distance
      checkpoint {
        id
        name
        raceEventId
        assignedJudges {
          id
          email
          name
        }
      }
      createdAt
      updatedAt
    }
  }
`

const USERS_QUERY = `
  query Users($search: String, $limit: Int) {
    users(search: $search, limit: $limit) {
      id
      email
      name
      role
    }
  }
`

const CREATE_CHECKPOINT_MUTATION = `
  mutation CreateCheckpoint($input: CreateCheckpointInput!) {
    createCheckpoint(input: $input) {
      id
      name
      raceEventId
      assignedJudges {
        id
        email
        name
      }
      createdAt
      updatedAt
    }
  }
`

const UPDATE_CHECKPOINT_MUTATION = `
  mutation UpdateCheckpoint($checkpointId: ID!, $input: UpdateCheckpointInput!) {
    updateCheckpoint(checkpointId: $checkpointId, input: $input) {
      id
      name
      raceEventId
      assignedJudges {
        id
        email
        name
      }
      createdAt
      updatedAt
    }
  }
`

const DELETE_CHECKPOINT_MUTATION = `
  mutation DeleteCheckpoint($checkpointId: ID!) {
    deleteCheckpoint(checkpointId: $checkpointId)
  }
`

const SET_RACE_CHECKPOINTS_MUTATION = `
  mutation SetRaceCheckpoints($input: SetRaceCheckpointsInput!) {
    setRaceCheckpoints(input: $input) {
      id
      raceId
      checkpointId
      orderIndex
      distance
      checkpoint {
        id
        name
        raceEventId
        assignedJudges {
          id
          email
          name
        }
      }
    }
  }
`

const ASSIGN_JUDGE_MUTATION = `
  mutation AssignJudge($userId: ID!, $checkpointId: ID!) {
    assignJudge(userId: $userId, checkpointId: $checkpointId) {
      id
      email
      name
    }
  }
`

const UNASSIGN_JUDGE_MUTATION = `
  mutation UnassignJudge($userId: ID!) {
    unassignJudge(userId: $userId) {
      id
      email
      name
    }
  }
`

export type User = {
  id: string
  email: string
  name?: string | null
  role: 'STANDARD' | 'ADMIN'
}

// Fetch event checkpoints (fizičke lokacije)
export async function fetchEventCheckpoints(
  raceEventId: string,
  accessToken?: string | null
): Promise<EventCheckpoint[]> {
  const data = await gql<{ eventCheckpoints: EventCheckpoint[] }>(
    EVENT_CHECKPOINTS_QUERY,
    { raceEventId },
    { accessToken }
  )
  return data.eventCheckpoints
}

// Fetch race checkpoints (sa redosledom za konkretnu trku)
export async function fetchRaceCheckpoints(
  raceId: string,
  accessToken?: string | null
): Promise<RaceCheckpoint[]> {
  const data = await gql<{ raceCheckpoints: RaceCheckpoint[] }>(
    RACE_CHECKPOINTS_QUERY,
    { raceId },
    { accessToken }
  )
  return data.raceCheckpoints
}

export async function fetchUsers(
  search?: string,
  limit = 50,
  accessToken?: string | null
): Promise<User[]> {
  const data = await gql<{ users: User[] }>(USERS_QUERY, { search, limit }, { accessToken })
  return data.users
}

export async function createCheckpoint(
  input: CreateCheckpointInput,
  accessToken?: string | null
): Promise<EventCheckpoint> {
  const data = await gql<{ createCheckpoint: EventCheckpoint }>(
    CREATE_CHECKPOINT_MUTATION,
    { input },
    { accessToken }
  )
  return data.createCheckpoint
}

export async function updateCheckpoint(
  checkpointId: string,
  input: UpdateCheckpointInput,
  accessToken?: string | null
): Promise<EventCheckpoint> {
  const data = await gql<{ updateCheckpoint: EventCheckpoint }>(
    UPDATE_CHECKPOINT_MUTATION,
    { checkpointId, input },
    { accessToken }
  )
  return data.updateCheckpoint
}

export async function deleteCheckpoint(checkpointId: string, accessToken?: string | null): Promise<boolean> {
  const data = await gql<{ deleteCheckpoint: boolean }>(DELETE_CHECKPOINT_MUTATION, { checkpointId }, { accessToken })
  return data.deleteCheckpoint
}

export async function setRaceCheckpoints(
  input: SetRaceCheckpointsInput,
  accessToken?: string | null
): Promise<RaceCheckpoint[]> {
  const data = await gql<{ setRaceCheckpoints: RaceCheckpoint[] }>(
    SET_RACE_CHECKPOINTS_MUTATION,
    { input },
    { accessToken }
  )
  return data.setRaceCheckpoints
}

export async function assignJudge(
  userId: string,
  checkpointId: string,
  accessToken?: string | null
): Promise<User> {
  const data = await gql<{ assignJudge: User }>(ASSIGN_JUDGE_MUTATION, { userId, checkpointId }, { accessToken })
  return data.assignJudge
}

export async function unassignJudge(userId: string, accessToken?: string | null): Promise<User> {
  const data = await gql<{ unassignJudge: User }>(UNASSIGN_JUDGE_MUTATION, { userId }, { accessToken })
  return data.unassignJudge
}
