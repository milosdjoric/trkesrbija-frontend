'use client'

import { useAuth } from '@/app/auth/auth-context'
import { trackEvent } from '@/app/lib/analytics'
import { useEffect } from 'react'

type Props = {
  entityId: string
  entityType: 'EVENT' | 'RACE'
  metadata?: Record<string, unknown>
}

function getOrCreateVisitorId(): string {
  const key = 'trke_vid'
  let vid = localStorage.getItem(key)
  if (!vid) {
    vid = crypto.randomUUID()
    localStorage.setItem(key, vid)
  }
  return vid
}

export function TrackPageView({ entityId, entityType, metadata }: Props) {
  const { user } = useAuth()

  useEffect(() => {
    const visitorId = getOrCreateVisitorId()
    trackEvent({ type: 'PAGE_VIEW', entityId, entityType, metadata, visitorId, userId: user?.id ?? undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
