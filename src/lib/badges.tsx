import { Badge } from '@/components/badge'

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED'
export type Gender = 'MALE' | 'FEMALE'
export type EventType = 'TRAIL' | 'ROAD'

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
 * Get badge component for event type
 */
export function getEventTypeBadge(type: EventType) {
  return (
    <Badge color={type === 'TRAIL' ? 'emerald' : 'sky'}>
      {type === 'TRAIL' ? 'Trail' : 'Ulična'}
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
