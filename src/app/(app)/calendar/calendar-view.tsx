'use client'

import { Link } from '@/components/link'
import {
  formatDateKey,
  formatMonthYear,
  isSameDay,
  SERBIAN_WEEKDAYS_SHORT,
  toTitleCase,
} from '@/lib/formatters'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import type { EventOnDate } from './page'

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

  const startDate = new Date(firstDayOfMonth)
  const dayOfWeek = startDate.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  startDate.setDate(startDate.getDate() + mondayOffset)

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

const TYPE_COLORS: Record<string, string> = {
  TRAIL: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  ROAD: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  OCR: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
}

const TYPE_DOTS: Record<string, string> = {
  TRAIL: 'bg-emerald-500',
  ROAD: 'bg-sky-500',
  OCR: 'bg-orange-500',
}

export function CalendarView({ eventsByDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  // Mobile: expand a date to see full event list
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  const calendarDays = useMemo(
    () => generateCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  )

  // Check if last row is needed (all days in row 6 are next month)
  const visibleDays = useMemo(() => {
    const lastRowStart = 35
    const lastRow = calendarDays.slice(lastRowStart)
    if (lastRow.every((d) => !d.isCurrentMonth)) {
      return calendarDays.slice(0, 35)
    }
    return calendarDays
  }, [calendarDays])

  const weeks = useMemo(() => {
    const result: CalendarDay[][] = []
    for (let i = 0; i < visibleDays.length; i += 7) {
      result.push(visibleDays.slice(i, i + 7))
    }
    return result
  }, [visibleDays])

  function goToPreviousMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    setExpandedDate(null)
  }

  function goToNextMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    setExpandedDate(null)
  }

  return (
    <div>
      {/* Header with Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="rounded-lg border border-dark-border p-2 text-gray-400 transition-colors hover:border-dark-border-light hover:bg-dark-surface hover:text-white"
        >
          <span className="sr-only">Prethodni mesec</span>
          <ChevronLeftIcon className="size-5" />
        </button>

        <h2 className="text-lg font-bold text-white">{formatMonthYear(currentMonth)}</h2>

        <button
          type="button"
          onClick={goToNextMonth}
          className="rounded-lg border border-dark-border p-2 text-gray-400 transition-colors hover:border-dark-border-light hover:bg-dark-surface hover:text-white"
        >
          <span className="sr-only">Sledeći mesec</span>
          <ChevronRightIcon className="size-5" />
        </button>
      </div>

      {/* Desktop Calendar Grid */}
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-xl border border-dark-border">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-dark-border bg-dark-surface">
            {SERBIAN_WEEKDAYS_SHORT.map((day) => (
              <div key={day} className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className={clsx('grid grid-cols-7', weekIndex > 0 && 'border-t border-dark-border')}>
              {week.map((day, dayIndex) => {
                const events = eventsByDate[day.dateKey] ?? []
                const hasEvents = events.length > 0

                return (
                  <div
                    key={day.dateKey}
                    className={clsx(
                      'min-h-[100px] p-1.5',
                      dayIndex > 0 && 'border-l border-dark-border',
                      !day.isCurrentMonth && 'bg-dark-bg/50',
                      day.isCurrentMonth && 'bg-dark-card',
                    )}
                  >
                    {/* Date number */}
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={clsx(
                          'inline-flex size-6 items-center justify-center rounded-full text-xs font-medium',
                          day.isToday && 'bg-brand-green text-black font-bold',
                          !day.isToday && day.isCurrentMonth && 'text-gray-300',
                          !day.isToday && !day.isCurrentMonth && 'text-gray-600'
                        )}
                      >
                        {day.date.getDate()}
                      </span>
                      {events.length > 2 && (
                        <span className="text-[10px] text-gray-500">+{events.length - 2}</span>
                      )}
                    </div>

                    {/* Events in cell */}
                    {hasEvents && (
                      <div className="space-y-0.5">
                        {events.slice(0, 2).map((item) => (
                          <Link
                            key={item.event.id}
                            href={`/events/${item.event.slug}`}
                            className={clsx(
                              'block truncate rounded px-1 py-0.5 text-[11px] font-medium leading-tight transition-opacity hover:opacity-80',
                              TYPE_COLORS[item.event.type]
                            )}
                            title={toTitleCase(item.event.eventName)}
                          >
                            {toTitleCase(item.event.eventName)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Calendar Grid */}
      <div className="md:hidden">
        <div className="overflow-hidden rounded-xl border border-dark-border">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-dark-border bg-dark-surface">
            {SERBIAN_WEEKDAYS_SHORT.map((day) => (
              <div key={day} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex}>
              <div className={clsx('grid grid-cols-7', weekIndex > 0 && 'border-t border-dark-border')}>
                {week.map((day, dayIndex) => {
                  const events = eventsByDate[day.dateKey] ?? []
                  const hasEvents = events.length > 0
                  const isExpanded = expandedDate === day.dateKey

                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      onClick={() => {
                        if (hasEvents) {
                          setExpandedDate(isExpanded ? null : day.dateKey)
                        }
                      }}
                      className={clsx(
                        'flex min-h-[52px] flex-col items-center py-2',
                        dayIndex > 0 && 'border-l border-dark-border',
                        !day.isCurrentMonth && 'bg-dark-bg/50',
                        day.isCurrentMonth && 'bg-dark-card',
                        isExpanded && 'bg-dark-surface',
                        hasEvents && 'cursor-pointer'
                      )}
                    >
                      <span
                        className={clsx(
                          'inline-flex size-7 items-center justify-center rounded-full text-sm',
                          day.isToday && 'bg-brand-green text-black font-bold',
                          !day.isToday && day.isCurrentMonth && 'text-gray-300',
                          !day.isToday && !day.isCurrentMonth && 'text-gray-600'
                        )}
                      >
                        {day.date.getDate()}
                      </span>
                      {/* Event dots */}
                      {hasEvents && (
                        <div className="mt-1 flex items-center gap-0.5">
                          {events.length <= 3 ? (
                            events.map((item) => (
                              <span key={item.event.id} className={clsx('size-1.5 rounded-full', TYPE_DOTS[item.event.type])} />
                            ))
                          ) : (
                            <>
                              <span className={clsx('size-1.5 rounded-full', TYPE_DOTS[events[0].event.type])} />
                              <span className="text-[9px] text-gray-400">+{events.length - 1}</span>
                            </>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Expanded event list for mobile */}
              {week.some((d) => expandedDate === d.dateKey) && (
                <div className="border-t border-dark-border bg-dark-surface px-3 py-2">
                  {(() => {
                    const day = week.find((d) => expandedDate === d.dateKey)!
                    const events = eventsByDate[day.dateKey] ?? []
                    return (
                      <div className="space-y-1.5">
                        {events.map((item) => (
                          <Link
                            key={item.event.id}
                            href={`/events/${item.event.slug}`}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-dark-card-hover"
                          >
                            <span className={clsx('size-2 shrink-0 rounded-full', TYPE_DOTS[item.event.type])} />
                            <span className="min-w-0 truncate text-sm font-medium text-white">
                              {toTitleCase(item.event.eventName)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400">
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
  )
}
