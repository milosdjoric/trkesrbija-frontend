'use client'

import { Badge } from '@/components/badge'
import { Link } from '@/components/link'
import {
  formatDateKey,
  formatDateWithWeekday,
  formatMonthYear,
  formatTime,
  isSameDay,
  SERBIAN_WEEKDAYS_SHORT,
  toTitleCase,
} from '@/lib/formatters'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import type { EventOnDate } from './page'

type EventType = 'ALL' | 'TRAIL' | 'ROAD' | 'OCR'

interface CalendarViewProps {
  eventsByDate: Record<string, EventOnDate[]>
}

interface CalendarDay {
  date: Date
  dateKey: string
  isCurrentMonth: boolean
  isToday: boolean
}

function generateCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1)
  const today = new Date()

  // Get the Monday before or on the first day
  const startDate = new Date(firstDayOfMonth)
  const dayOfWeek = startDate.getDay()
  // Convert Sunday (0) to 7 for ISO week calculation
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  startDate.setDate(startDate.getDate() + mondayOffset)

  // Generate 42 days (6 weeks)
  const days: CalendarDay[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    days.push({
      date,
      dateKey: formatDateKey(date),
      isCurrentMonth: date.getMonth() === month,
      isToday: isSameDay(date, today),
    })
  }
  return days
}

export function CalendarView({ eventsByDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date())
  const [activeFilter, setActiveFilter] = useState<EventType>('ALL')
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single')

  const calendarDays = useMemo(
    () => generateCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  )

  const nextMonth = useMemo(
    () => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    [currentMonth]
  )

  const nextMonthDays = useMemo(
    () => generateCalendarDays(nextMonth.getFullYear(), nextMonth.getMonth()),
    [nextMonth]
  )

  const selectedDateKey = selectedDate ? formatDateKey(selectedDate) : null

  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDateKey) return []
    return eventsByDate[selectedDateKey] ?? []
  }, [selectedDateKey, eventsByDate])

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'ALL') return eventsForSelectedDate
    return eventsForSelectedDate.filter((e) => e.event.type === activeFilter)
  }, [eventsForSelectedDate, activeFilter])

  function goToPreviousMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  function getEventTypesForDate(dateKey: string): Set<'TRAIL' | 'ROAD' | 'OCR'> {
    const events = eventsByDate[dateKey] ?? []
    return new Set(events.map((e) => e.event.type))
  }

  // Reusable month grid component
  function MonthGrid({ days, month, showTitle = true }: { days: CalendarDay[]; month: Date; showTitle?: boolean }) {
    return (
      <div className="text-center">
        {showTitle && (
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {formatMonthYear(month)}
          </h2>
        )}
        {/* Weekday Headers */}
        <div className={clsx('grid grid-cols-7 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400', showTitle ? 'mt-4' : '')}>
          {SERBIAN_WEEKDAYS_SHORT.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar Days Grid */}
        <div className="mt-2 grid grid-cols-7">
          {days.map((day, index) => {
            const isSelected = selectedDate && isSameDay(day.date, selectedDate)
            const eventTypes = getEventTypesForDate(day.dateKey)
            const hasEvents = eventTypes.size > 0
            const isFirstRow = index < 7

            return (
              <div
                key={day.dateKey + index}
                className={clsx(
                  'py-1.5',
                  !isFirstRow && 'border-t border-zinc-100 dark:border-zinc-700/50'
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={clsx(
                    'mx-auto flex size-8 flex-col items-center justify-center rounded-full text-sm transition-colors',
                    // Base colors
                    !isSelected && !day.isToday && day.isCurrentMonth && 'text-zinc-900 dark:text-zinc-100',
                    !isSelected && !day.isToday && !day.isCurrentMonth && 'text-zinc-400 dark:text-zinc-500',
                    // Hover
                    !isSelected && 'hover:bg-zinc-100 dark:hover:bg-zinc-700',
                    // Today
                    day.isToday && !isSelected && 'font-semibold text-indigo-600 dark:text-indigo-400',
                    // Selected
                    isSelected && !day.isToday && 'bg-zinc-900 font-semibold text-white dark:bg-white dark:text-zinc-900',
                    isSelected && day.isToday && 'bg-indigo-600 font-semibold text-white'
                  )}
                >
                  <time dateTime={day.dateKey}>{day.date.getDate()}</time>
                </button>
                {/* Event indicators */}
                {hasEvents && (
                  <div className="mt-0.5 flex justify-center gap-0.5">
                    {eventTypes.has('TRAIL') && (
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    )}
                    {eventTypes.has('ROAD') && (
                      <span className="size-1.5 rounded-full bg-sky-500" />
                    )}
                    {eventTypes.has('OCR') && (
                      <span className="size-1.5 rounded-full bg-orange-500" />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row lg:gap-10">
      {/* Calendar Grid */}
      <div className={clsx('w-full', viewMode === 'single' ? 'lg:w-80 xl:w-96' : 'lg:w-[600px] xl:w-[700px]')}>
        {/* View Switcher - Outside card */}
        <div className="mb-3 flex justify-end">
          <div className="flex gap-0.5 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-700">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={clsx(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                viewMode === 'single'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              1 mesec
            </button>
            <button
              type="button"
              onClick={() => setViewMode('double')}
              className={clsx(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                viewMode === 'double'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              2 meseca
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          {/* Header with Navigation */}
          <div className="relative flex items-center justify-between">
            {/* Navigation - Left */}
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            >
              <span className="sr-only">Prethodni mesec</span>
              <ChevronLeftIcon className="size-5" />
            </button>

            {/* Month indicator for single view */}
            {viewMode === 'single' && (
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                {formatMonthYear(currentMonth)}
              </h2>
            )}

            {/* Navigation - Right */}
            <button
              type="button"
              onClick={goToNextMonth}
              className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            >
              <span className="sr-only">Sledeći mesec</span>
              <ChevronRightIcon className="size-5" />
            </button>
          </div>

          {/* Calendar Grid(s) */}
          <div className={clsx('mt-4', viewMode === 'double' && 'grid grid-cols-1 gap-8 md:grid-cols-2')}>
            <MonthGrid days={calendarDays} month={currentMonth} showTitle={viewMode === 'double'} />
            {viewMode === 'double' && (
              <div className="hidden md:block">
                <MonthGrid days={nextMonthDays} month={nextMonth} showTitle />
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Trail</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-sky-500" />
            <span>Ulična</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-orange-500" />
            <span>OCR</span>
          </div>
        </div>
      </div>

      {/* Event Panel */}
      <div className="mt-8 flex-1 lg:mt-0">
        {selectedDate && (
          <>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              {formatDateWithWeekday(selectedDate)}
            </h2>

            {/* Filter Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {(['ALL', 'TRAIL', 'ROAD', 'OCR'] as const).map((type) => {
                const count =
                  type === 'ALL'
                    ? eventsForSelectedDate.length
                    : eventsForSelectedDate.filter((e) => e.event.type === type).length
                const isActive = activeFilter === type
                const label = type === 'ALL' ? 'Sve' : type === 'ROAD' ? 'Ulične' : type

                return (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={clsx(
                      'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
                    )}
                  >
                    {label} ({count})
                  </button>
                )
              })}
            </div>

            {/* Event Cards */}
            <div className="mt-6 space-y-3">
              {filteredEvents.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  {eventsForSelectedDate.length === 0
                    ? 'Nema trka ovog dana.'
                    : 'Nema trka za izabrani filter.'}
                </div>
              ) : (
                filteredEvents.map((item) => {
                  const badgeColor =
                    item.event.type === 'TRAIL' ? 'emerald' : item.event.type === 'ROAD' ? 'sky' : 'orange'
                  const typeLabel = item.event.type === 'ROAD' ? 'Ulična' : item.event.type
                  const primaryLocation = item.races.find((r) => r.startLocation)?.startLocation

                  return (
                    <div
                      key={item.event.id}
                      className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
                    >
                      {/* Event header */}
                      <Link
                        href={`/events/${item.event.slug}`}
                        className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        <Badge color={badgeColor}>{typeLabel}</Badge>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900 dark:text-white">
                          {toTitleCase(item.event.eventName)}
                        </span>
                        {primaryLocation && (
                          <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                            📍 {primaryLocation}
                          </span>
                        )}
                      </Link>

                      {/* Race rows */}
                      {item.races.length > 0 && (
                        <div className="divide-y divide-zinc-100 border-t border-zinc-100 dark:divide-zinc-700/50 dark:border-zinc-700/50">
                          {item.races.map((race) => {
                            const hasCustomName =
                              race.raceName && race.raceName !== `${race.length} km` && race.raceName !== `${race.length}.0 km`
                            return (
                              <Link
                                key={race.id}
                                href={`/races/${race.slug}`}
                                className="flex items-center justify-between px-3 py-1.5 text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="w-9 shrink-0 text-zinc-400 dark:text-zinc-500">
                                    {formatTime(race.startDateTime)}
                                  </span>
                                  {hasCustomName && (
                                    <span className="truncate text-zinc-500 dark:text-zinc-400">
                                      {toTitleCase(race.raceName)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  {race.length > 0 && (
                                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                      {race.length} km
                                    </span>
                                  )}
                                  {race.elevation != null && (
                                    <span className="text-zinc-400 dark:text-zinc-500">
                                      {race.elevation} m D+
                                    </span>
                                  )}
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
