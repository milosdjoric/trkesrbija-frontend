'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Heading } from '@/components/heading'
import {
  defaultData,
  fieldConfig,
  PostInfo,
  PostNajava,
  PostNajave,
  PostRezultati,
  StoryInfo,
  StoryNajava,
  StoryNajave,
  StoryRezultati,
  type NajaveEvent,
  type TemplateData,
  type TemplateFormat,
  type TemplateMode,
} from '@/components/instagram-templates'
import { Select } from '@/components/select'
import { ArrowTopRightOnSquareIcon, ClipboardDocumentIcon } from '@heroicons/react/16/solid'
import { Input } from '@/components/input'
import { fetchRaceResults } from '@/app/lib/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type RaceInfo = {
  id: string
  raceName: string | null
  startDateTime: string
  startLocation: string
  length: number
  elevation: number | null
}

type EventOption = {
  id: string
  eventName: string
  country: string | null
  isTraining: boolean
  races: RaceInfo[]
}

const EVENTS_QUERY = `
  query InstagramEvents {
    raceEvents(limit: 1000) {
      id
      eventName
      country
      isTraining
      races {
        id
        raceName
        startDateTime
        startLocation
        length
        elevation
      }
    }
  }
`

function formatDateSr(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  const months = [
    'januar', 'februar', 'mart', 'april', 'maj', 'jun',
    'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar',
  ]
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}.`
}

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec']
  return `${d.getDate()}. ${months[d.getMonth()]}`
}

function countryLabel(code: string | null): string {
  const map: Record<string, string> = { ser: 'Srbija', cro: 'Hrvatska', bih: 'BiH', reg: 'Region' }
  return map[code ?? ''] ?? ''
}

// ── Field Component ─────────────────────────────────────────────────────────

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-green">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border-secondary bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
      />
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function AdminInstagramPage() {
  const { accessToken } = useAuth()
  const [mode, setMode] = useState<TemplateMode>('najava')
  const [format, setFormat] = useState<TemplateFormat>('post')
  const [dark, setDark] = useState(true)
  const [data, setData] = useState<TemplateData>(defaultData)
  const [copied, setCopied] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedRaceIds, setSelectedRaceIds] = useState<Set<string>>(new Set())

  // Multi-event selection for "najave" mode
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const [najaveEvents, setNajaveEvents] = useState<NajaveEvent[]>([])
  const [eventSearch, setEventSearch] = useState('')

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  // Filter events: for rezultati show only past races, for others show future first
  const filteredEvents = useMemo(() => {
    const now = Date.now()
    let list = events

    if (mode === 'rezultati') {
      list = events.filter((e) => {
        const latestRace = e.races.reduce((latest, r) => {
          const t = new Date(r.startDateTime).getTime()
          return t > latest ? t : latest
        }, 0)
        return latestRace < now
      })
      // Sort: most recent first
      list = [...list].sort((a, b) => {
        const dateA = new Date(a.races[0]?.startDateTime ?? '').getTime()
        const dateB = new Date(b.races[0]?.startDateTime ?? '').getTime()
        return dateB - dateA
      })
    }

    if (eventSearch.trim()) {
      const q = eventSearch.toLowerCase()
      list = list.filter((e) => e.eventName.toLowerCase().includes(q))
    }

    return list
  }, [events, mode, eventSearch])

  useEffect(() => {
    if (!accessToken) return
    gql<{ raceEvents: EventOption[] }>(EVENTS_QUERY, {}, { accessToken }).then((res) => {
      const now = Date.now()
      const sorted = (res.raceEvents ?? [])
        .filter((e) => !e.isTraining && e.races.length > 0)
        .sort((a, b) => {
          const dateA = new Date(a.races[0]?.startDateTime ?? '').getTime()
          const dateB = new Date(b.races[0]?.startDateTime ?? '').getTime()
          const futureA = dateA >= now ? 0 : 1
          const futureB = dateB >= now ? 0 : 1
          if (futureA !== futureB) return futureA - futureB
          return futureA === 0 ? dateA - dateB : dateB - dateA
        })
      setEvents(sorted)
    })
  }, [accessToken])

  const populateFromEvent = useCallback(
    (event: EventOption, raceIds: Set<string>) => {
      const selectedRaces = raceIds.size > 0 ? event.races.filter((r) => raceIds.has(r.id)) : event.races
      const firstRace = selectedRaces[0] ?? event.races[0]

      const name = event.eventName
      const datum = firstRace ? formatDateSr(firstRace.startDateTime) : 'TBD'
      const location = firstRace?.startLocation || ''
      const country = countryLabel(event.country)
      const mesto = [location, country].filter(Boolean).join(', ')
      const distances = [...selectedRaces].sort((a, b) => a.length - b.length).map((r) => `${r.length} km`).join(' / ')
      const maxElevation = Math.max(...selectedRaces.map((r) => r.elevation ?? 0), 0)
      const visina = maxElevation > 0 ? `${maxElevation} m D+` : ''

      if (mode === 'najava') {
        setData((prev) => ({
          ...prev,
          najava: { naziv: name, datum, mesto, distanca: distances, cta: 'Prijavi se na trkesrbija.rs' },
        }))
      } else if (mode === 'info') {
        const startTime = firstRace
          ? new Date(firstRace.startDateTime).toLocaleTimeString('sr-Latn-RS', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Europe/Belgrade',
            })
          : ''
        setData((prev) => ({
          ...prev,
          info: {
            naziv: name,
            podnaslov: prev.info.podnaslov,
            distanca: distances,
            visina,
            start: startTime ? `${startTime}h — ${mesto}` : mesto,
            rok: 'Prijave otvorene',
          },
        }))
      } else if (mode === 'rezultati') {
        setData((prev) => ({
          ...prev,
          rezultati: { ...prev.rezultati, naziv: name, datum },
        }))

        // Auto-fetch top 3 results for the first selected race
        const raceToFetch = selectedRaces[0] ?? event.races[0]
        if (raceToFetch && accessToken) {
          fetchRaceResults(raceToFetch.id, undefined, accessToken).then((results) => {
            const sorted = results.filter((r) => r.totalTime != null).sort((a, b) => (a.totalTime ?? Infinity) - (b.totalTime ?? Infinity))
            const formatTime = (ms: number) => {
              const h = Math.floor(ms / 3600000)
              const m = Math.floor((ms % 3600000) / 60000)
              const s = Math.floor((ms % 60000) / 1000)
              return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
            }
            const top1 = sorted[0]
            const top2 = sorted[1]
            const top3 = sorted[2]
            setData((prev) => ({
              ...prev,
              rezultati: {
                ...prev.rezultati,
                prvak: top1 ? `${top1.registration.firstName} ${top1.registration.lastName}` : prev.rezultati.prvak,
                vreme: top1?.totalTime ? formatTime(top1.totalTime) : prev.rezultati.vreme,
                top2: top2
                  ? `${top2.registration.firstName} ${top2.registration.lastName} — ${top2.totalTime ? formatTime(top2.totalTime) : ''}`
                  : prev.rezultati.top2,
                top3: top3
                  ? `${top3.registration.firstName} ${top3.registration.lastName} — ${top3.totalTime ? formatTime(top3.totalTime) : ''}`
                  : prev.rezultati.top3,
              },
            }))
          })
        }
      }
    },
    [mode]
  )

  const selectEvent = useCallback(
    (eventId: string) => {
      setSelectedEventId(eventId)
      const allRaceIds = new Set<string>()

      if (eventId) {
        const event = events.find((e) => e.id === eventId)
        if (event) {
          event.races.forEach((r) => allRaceIds.add(r.id))
          setSelectedRaceIds(allRaceIds)
          populateFromEvent(event, allRaceIds)
          return
        }
      }

      setSelectedRaceIds(allRaceIds)
    },
    [events, populateFromEvent]
  )

  const toggleRace = useCallback(
    (raceId: string) => {
      setSelectedRaceIds((prev) => {
        const next = new Set(prev)
        if (next.has(raceId)) {
          next.delete(raceId)
        } else {
          next.add(raceId)
        }
        if (selectedEvent) {
          populateFromEvent(selectedEvent, next)
        }
        return next
      })
    },
    [selectedEvent, populateFromEvent]
  )

  // Toggle event for "najave" multi-select
  const toggleNajaveEvent = useCallback(
    (eventId: string) => {
      setSelectedEventIds((prev) => {
        const next = new Set(prev)
        if (next.has(eventId)) {
          next.delete(eventId)
        } else {
          next.add(eventId)
        }

        // Rebuild najave events list
        const list: NajaveEvent[] = events
          .filter((e) => next.has(e.id))
          .map((e) => ({
            naziv: e.eventName,
            datum: e.races[0] ? formatDateShort(e.races[0].startDateTime) : 'TBD',
            distance: [...e.races].sort((a, b) => a.length - b.length).map((r) => `${r.length}km`).join(' / '),
          }))
        setNajaveEvents(list)

        return next
      })
    },
    [events]
  )

  const update = useCallback((type: TemplateMode, field: string, val: string) => {
    setData((prev) => ({ ...prev, [type]: { ...prev[type], [field]: val } }))
  }, [])

  const buildPreviewUrl = useCallback(() => {
    const payload = { mode, format, dark, data, najaveEvents: mode === 'najave' ? najaveEvents : undefined }
    const json = JSON.stringify(payload)
    const encoded = btoa(unescape(encodeURIComponent(json)))
    return `${window.location.origin}/instagram-preview?d=${encodeURIComponent(encoded)}`
  }, [mode, format, dark, data, najaveEvents])

  const openPreview = useCallback(() => {
    window.open(buildPreviewUrl(), '_blank')
  }, [buildPreviewUrl])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildPreviewUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      openPreview()
    }
  }, [buildPreviewUrl, openPreview])

  const types: Array<{ key: TemplateMode; label: string }> = [
    { key: 'najava', label: 'Najava' },
    { key: 'najave', label: 'Najave' },
    { key: 'info', label: 'Info' },
    { key: 'rezultati', label: 'Rezultati' },
  ]

  const isMultiMode = mode === 'najave'

  return (
    <>
      {/* Google Font for template preview */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      <div className="flex items-center justify-between">
        <Heading>Instagram sablon</Heading>
        <div className="flex gap-2">
          <button
            onClick={() => setFormat(format === 'post' ? 'story' : 'post')}
            className="rounded-lg border border-border-secondary bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-card-hover"
          >
            {format === 'post' ? 'Story 9:16' : 'Post 1:1'}
          </button>
          <button
            onClick={() => setDark(!dark)}
            className="rounded-lg border border-border-secondary bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-card-hover"
          >
            {dark ? 'Light mod' : 'Dark mod'}
          </button>
        </div>
      </div>

      {/* Type switcher */}
      <div className="mt-4 flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t.key}
            onClick={() => { setMode(t.key); setEventSearch('') }}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              mode === t.key
                ? 'border-brand-green bg-brand-green/10 text-brand-green'
                : 'border-border-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Layout: editor + preview */}
      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        {/* Editor */}
        <div className="w-full shrink-0 lg:w-72">
          {isMultiMode ? (
            <>
              {/* Event search for najave */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-green">
                  Pretrazi
                </label>
                <Input
                  type="text"
                  placeholder="Pretrazi trke..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                />
              </div>

              {/* Multi-event checkboxes for "najave" */}
              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-green">
                  Izaberi dogadjaje ({selectedEventIds.size})
                </label>
                <div className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg border border-border-secondary p-2">
                  {filteredEvents.map((ev) => {
                    const date = ev.races[0] ? formatDateShort(ev.races[0].startDateTime) : ''
                    const distances = [...ev.races].sort((a, b) => a.length - b.length).map((r) => `${r.length}km`).join(', ')
                    return (
                      <label
                        key={ev.id}
                        className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEventIds.has(ev.id)}
                          onChange={() => toggleNajaveEvent(ev.id)}
                          className="mt-0.5 size-4 rounded border-border-secondary bg-surface text-brand-green focus:ring-brand-green"
                        />
                        <div>
                          <div className="font-medium text-text-primary">{ev.eventName}</div>
                          <div className="text-xs text-text-secondary">
                            {date} · {distances}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Event search */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-green">
                  Pretrazi
                </label>
                <Input
                  type="text"
                  placeholder="Pretrazi trke..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                />
              </div>

              {/* Single event selector */}
              <div className="mb-4">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-brand-green">
                  Izaberi dogadjaj {mode === 'rezultati' ? '(prošle trke)' : ''}
                </label>
                <Select
                  value={selectedEventId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => selectEvent(e.target.value)}
                >
                  <option value="">— Ručni unos —</option>
                  {filteredEvents.map((ev) => {
                    const date = ev.races[0] ? formatDateSr(ev.races[0].startDateTime) : ''
                    return (
                      <option key={ev.id} value={ev.id}>
                        {ev.eventName} — {date}
                      </option>
                    )
                  })}
                </Select>
              </div>

              {/* Race checkboxes */}
              {selectedEvent && selectedEvent.races.length > 1 && (
                <div className="mb-5">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-green">
                    Distance
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {selectedEvent.races.map((race) => (
                      <label key={race.id} className="flex items-center gap-2 text-sm text-text-primary">
                        <input
                          type="checkbox"
                          checked={selectedRaceIds.has(race.id)}
                          onChange={() => toggleRace(race.id)}
                          className="size-4 rounded border-border-secondary bg-surface text-brand-green focus:ring-brand-green"
                        />
                        {race.raceName ?? `${race.length} km`}
                        {race.elevation ? ` · ${race.elevation} m D+` : ''}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-secondary">Uredi sadrzaj</div>
          {fieldConfig[mode].map((f) => (
            <Field
              key={f.key}
              label={f.label}
              value={(data[mode] as Record<string, string>)[f.key] ?? ''}
              onChange={(v) => update(mode, f.key, v)}
            />
          ))}
        </div>

        {/* Preview */}
        <div className="flex flex-1 flex-col items-center gap-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Preview — {format === 'post' ? '1080 x 1080' : '1080 x 1920'}
          </div>

          <div
            ref={previewRef}
            className="overflow-hidden rounded-2xl shadow-xl transition-all duration-300"
            style={
              format === 'post'
                ? { width: 420, height: 420 }
                : { width: 420, height: 747, transform: 'scale(0.75)', transformOrigin: 'top center', marginBottom: 747 * (0.75 - 1) }
            }
          >
            {format === 'post' ? (
              <>
                {mode === 'najava' && <PostNajava data={data.najava} dark={dark} />}
                {mode === 'najave' && <PostNajave data={data.najave} events={najaveEvents} dark={dark} />}
                {mode === 'info' && <PostInfo data={data.info} dark={dark} />}
                {mode === 'rezultati' && <PostRezultati data={data.rezultati} dark={dark} />}
              </>
            ) : (
              <>
                {mode === 'najava' && <StoryNajava data={data.najava} dark={dark} />}
                {mode === 'najave' && <StoryNajave data={data.najave} events={najaveEvents} dark={dark} />}
                {mode === 'info' && <StoryInfo data={data.info} dark={dark} />}
                {mode === 'rezultati' && <StoryRezultati data={data.rezultati} dark={dark} />}
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={openPreview}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-green bg-brand-green/10 px-4 py-2 text-sm font-semibold text-brand-green transition-colors hover:bg-brand-green/20"
            >
              <ArrowTopRightOnSquareIcon className="size-4" />
              Otvori preview
            </button>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-lg border border-border-secondary bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-card-hover hover:text-text-primary"
            >
              <ClipboardDocumentIcon className="size-4" />
              {copied ? 'Kopirano!' : 'Kopiraj link'}
            </button>
          </div>

          <p className="max-w-sm text-center text-xs text-text-secondary">
            Otvori preview na telefonu i napravi screenshot za Instagram {format === 'post' ? 'post (1:1)' : 'story (9:16)'}
          </p>
        </div>
      </div>
    </>
  )
}
