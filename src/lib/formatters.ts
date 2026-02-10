/**
 * Centralized date/time formatting utilities
 * All functions use Serbian Latin locale (sr-Latn-RS)
 */

const LOCALE = 'sr-Latn-RS'

/**
 * Format date - various formats
 */
export function formatDate(
  iso: string | Date,
  format: 'short' | 'long' | 'full' = 'short'
): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return 'TBD'

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: format === 'short' ? 'short' : 'long',
    year: 'numeric',
  }

  if (format === 'full') {
    options.weekday = 'short'
  }

  return d.toLocaleDateString(LOCALE, options)
}

/**
 * Format date as simple date (no options)
 */
export function formatDateSimple(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString(LOCALE)
}

/**
 * Format time (HH:MM or HH:MM:SS with seconds) - always 24h format
 */
export function formatTime(iso: string | Date, withSeconds = false): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return 'TBD'
  return d.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...(withSeconds && { second: '2-digit' }),
  })
}

/**
 * Format duration in milliseconds to HH:MM:SS
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Get month abbreviation for calendar display
 */
export function formatMonth(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(LOCALE, { month: 'short' }).toUpperCase()
}

/**
 * Get day of month for calendar display
 */
export function formatDay(iso: string | Date): number {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.getDate()
}
