const TRACK_EVENT_MUTATION = `
  mutation TrackEvent($input: TrackEventInput!) {
    trackEvent(input: $input)
  }
`

export function trackEvent(input: {
  type: 'PAGE_VIEW' | 'SEARCH'
  entityId?: string
  entityType?: 'EVENT' | 'RACE'
  metadata?: Record<string, unknown>
  visitorId?: string
}) {
  // Fire-and-forget — ne blokiramo UI
  fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: TRACK_EVENT_MUTATION, variables: { input } }),
  }).catch(() => {})
}
