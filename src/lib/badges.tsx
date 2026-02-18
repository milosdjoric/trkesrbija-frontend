import { Badge } from '@/components/badge'
import { CheckBadgeIcon } from '@heroicons/react/16/solid'

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED'
export type Gender = 'MALE' | 'FEMALE'
export type EventType = 'TRAIL' | 'ROAD' | 'OCR'

/**
 * Get badge component for registration status
 */
export function getStatusBadge(status: RegistrationStatus) {
  switch (status) {
    case 'PENDING':
      return <Badge color="yellow">Na čekanju</Badge>
    case 'CONFIRMED':
      return <Badge color="blue">Potvrđeno</Badge>
    case 'PAID':
      return <Badge color="green">Plaćeno</Badge>
    case 'CANCELLED':
      return <Badge color="red">Otkazano</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

/**
 * Get short label for gender
 */
export function getGenderLabel(gender: Gender): string {
  return gender === 'MALE' ? 'M' : 'Ž'
}

/**
 * Get badge color for event type
 */
export function getEventTypeColor(type: EventType): 'emerald' | 'sky' | 'orange' {
  switch (type) {
    case 'TRAIL':
      return 'emerald'
    case 'ROAD':
      return 'sky'
    case 'OCR':
      return 'orange'
    default:
      return 'emerald'
  }
}

/**
 * Get label for event type
 */
export function getEventTypeLabel(type: EventType): string {
  switch (type) {
    case 'TRAIL':
      return 'Trail'
    case 'ROAD':
      return 'Ulična'
    case 'OCR':
      return 'OCR'
    default:
      return type
  }
}

/**
 * Get badge component for event type
 */
export function getEventTypeBadge(type: EventType) {
  return (
    <Badge color={getEventTypeColor(type)}>
      {getEventTypeLabel(type)}
    </Badge>
  )
}

/**
 * Get medal color for race position
 */
export function getMedalColor(position: number): string | null {
  switch (position) {
    case 1:
      return 'text-yellow-500' // Gold
    case 2:
      return 'text-zinc-400' // Silver
    case 3:
      return 'text-amber-600' // Bronze
    default:
      return null
  }
}

/**
 * Get medal emoji for race position
 */
export function getMedalEmoji(position: number): string | null {
  switch (position) {
    case 1:
      return '🥇'
    case 2:
      return '🥈'
    case 3:
      return '🥉'
    default:
      return null
  }
}

/**
 * Badge component for verified events
 */
export function VerifiedBadge() {
  return (
    <Badge color="violet" className="inline-flex items-center gap-1">
      <CheckBadgeIcon className="size-3" />
      Verifikovan
    </Badge>
  )
}
