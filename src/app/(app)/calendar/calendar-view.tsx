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
} from '@/lib/formatters'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import type { RaceWithEvent } from './page'

type EventType = 'ALL' | 'TRAIL' | 'ROAD' | 'OCR'

interface CalendarViewProps {
  racesByDate: Record<string, RaceWithEvent[]>
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

export function CalendarView({ racesByDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date())
  const [activeFilter, setActiveFilter] = useState<EventType>('ALL')

  const calendarDays = useMemo(
    () => generateCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  )

  const selectedDateKey = selectedDate ? formatDateKey(selectedDate) : null

  const racesForSelectedDate = useMemo(() => {
    if (!selectedDateKey) return []
    return racesByDate[selectedDateKey] ?? []
  }, [selectedDateKey, racesByDate])

  const filteredRaces = useMemo(() => {
    if (activeFilter === 'ALL') return racesForSelectedDate
    return racesForSelectedDate.filter((r) => r.event.type === activeFilter)
  }, [racesForSelectedDate, activeFilter])

  function goToPreviousMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  function getEventTypesForDate(dateKey: string): Set<'TRAIL' | 'ROAD' | 'OCR'> {
    const races = racesByDate[dateKey] ?? []
    return new Set(races.map((r) => r.event.type))
  }

  return (
    <div className="flex flex-col lg:flex-row lg:gap-10">
      {/* Calendar Grid */}
      <div className="w-full lg:w-80 xl:w-96">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          {/* Month Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {formatMonthYear(currentMonth)}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
              >
                <span className="sr-only">Prethodni mesec</span>
                <ChevronLeftIcon className="size-5" />
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
              >
                <span className="sr-only">Sledeći mesec</span>
                <ChevronRightIcon className="size-5" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="mt-6 grid grid-cols-7 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {SERBIAN_WEEKDAYS_SHORT.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="mt-2 grid grid-cols-7">
            {calendarDays.map((day, index) => {
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
                    ? racesForSelectedDate.length
                    : racesForSelectedDate.filter((r) => r.event.type === type).length
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

            {/* Race List */}
            <div className="mt-6 space-y-3">
              {filteredRaces.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  {racesForSelectedDate.length === 0
                    ? 'Nema trka ovog dana.'
                    : 'Nema trka za izabrani filter.'}
                </div>
              ) : (
                filteredRaces.map((item) => (
                  <Link
                    key={item.race.id}
                    href={`/races/${item.race.slug}`}
                    className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            color={
                              item.event.type === 'TRAIL'
                                ? 'emerald'
                                : item.event.type === 'ROAD'
                                  ? 'sky'
                                  : 'orange'
                            }
                          >
                            {item.event.type === 'ROAD' ? 'Ulična' : item.event.type}
                          </Badge>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {formatTime(item.race.startDateTime)}
                          </span>
                        </div>
                        <h3 className="mt-1 font-medium text-zinc-900 dark:text-white">
                          {item.race.raceName || item.event.eventName}
                        </h3>
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                          {item.event.eventName}
                        </p>
                      </div>
                      <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                        <div className="font-medium text-zinc-700 dark:text-zinc-300">
                          {item.race.length} km
                        </div>
                        {item.race.elevation != null && (
                          <div className="text-xs">{item.race.elevation} m D+</div>
                        )}
                      </div>
                    </div>
                    {item.race.startLocation && (
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        📍 {item.race.startLocation}
                      </p>
                    )}
                  </Link>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
