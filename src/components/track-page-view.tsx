'use client'

import { trackEvent } from '@/app/lib/analytics'
import { useEffect } from 'react'

type Props = {
  entityId: string
  entityType: 'EVENT' | 'RACE'
  metadata?: Record<string, unknown>
}

export function TrackPageView({ entityId, entityType, metadata }: Props) {
  useEffect(() => {
    trackEvent({ type: 'PAGE_VIEW', entityId, entityType, metadata })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
