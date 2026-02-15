/**
 * Centralized date/time formatting utilities
 * All functions use Serbian Latin locale (sr-Latn-RS)
 */

const LOCALE = 'sr-Latn-RS'

/**
 * Format date - standard format: "14. feb 2026."
 * short: "14. feb 2026."
 * long: "14. februar 2026."
 * full: "pet, 14. februar 2026."
 */
export function formatDate(
  iso: string | Date,
  format: 'short' | 'long' | 'full' = 'short'
): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return 'TBD'

  const day = d.getDate()
  const year = d.getFullYear()
  const monthShort = d.toLocaleDateString(LOCALE, { month: 'short' }).replace('.', '')
  const monthLong = d.toLocaleDateString(LOCALE, { month: 'long' })
  const weekday = d.toLocaleDateString(LOCALE, { weekday: 'short' }).replace('.', '')

  if (format === 'full') {
    return `${weekday}, ${day}. ${monthLong} ${year}.`
  } else if (format === 'long') {
    return `${day}. ${monthLong} ${year}.`
  }
  return `${day}. ${monthShort} ${year}.`
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

/**
 * Serbian month names
 */
export const SERBIAN_MONTHS = [
  'januar',
  'februar',
  'mart',
  'april',
  'maj',
  'jun',
  'jul',
  'avgust',
  'septembar',
  'oktobar',
  'novembar',
  'decembar',
]

/**
 * Serbian weekday names (short, starting Monday)
 */
export const SERBIAN_WEEKDAYS_SHORT = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned']

/**
 * Format month and year for calendar header: "Februar 2026"
 */
export function formatMonthYear(date: Date): string {
  const month = SERBIAN_MONTHS[date.getMonth()]
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${date.getFullYear()}`
}

/**
 * Format full date with weekday: "Subota, 15. februar 2026."
 */
export function formatDateWithWeekday(date: Date): string {
  return date.toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format date as YYYY-MM-DD key for grouping
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Convert string to Title Case, preserving short acronyms (2-5 chars all-caps).
 * Examples:
 * - "BBKT 2026" → "BBKT 2026" (short acronym preserved)
 * - "KOSTOLAČKI POLUMARATON" → "Kostolački Polumaraton" (long words converted)
 * - "avala trail" → "Avala Trail"
 * - "trka OCR za decu" → "Trka OCR Za Decu" (OCR preserved)
 * - "10K" → "10K" (preserved with number)
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return ''

  return str
    .split(' ')
    .map((word) => {
      // If word contains numbers (like "10K", "5km", "3."), preserve/handle specially
      if (/\d/.test(word)) {
        // If it's just a number or number with punctuation, keep as is
        if (/^[\d.,]+$/.test(word)) {
          return word
        }
        // Otherwise capitalize first letter (e.g., "10k" → "10K", "3rd" → "3rd")
        return word.toUpperCase()
      }
      // Only preserve SHORT all-caps words (2-5 chars) as acronyms (BBKT, OCR, USA, etc.)
      // Longer words like "KOSTOLAČKI" should be converted to Title Case
      if (word === word.toUpperCase() && word.length >= 2 && word.length <= 5) {
        return word
      }
      // Standard title case: first letter uppercase, rest lowercase
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
