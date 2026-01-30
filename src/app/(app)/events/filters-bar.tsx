'use client'

import { Button } from '@/components/button'
import { Input, InputGroup } from '@/components/input'
import { Link } from '@/components/link'
import { Select } from '@/components/select'
import { MagnifyingGlassIcon } from '@heroicons/react/16/solid'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Competition = { id: string; name: string }

type Initial = {
  q: string
  lenMin: string
  lenMax: string
  elevMin: string
  elevMax: string
  competitionId: string
  eventType: string
  sortBy: string
}

export function FiltersBar({ initial, competitions }: { initial: Initial; competitions: Competition[] }) {
  const router = useRouter()
  const sp = useSearchParams()

  const [q, setQ] = useState(initial.q ?? '')
  const [lenMin, setLenMin] = useState(initial.lenMin ?? '')
  const [lenMax, setLenMax] = useState(initial.lenMax ?? '')
  const [elevMin, setElevMin] = useState(initial.elevMin ?? '')
  const [elevMax, setElevMax] = useState(initial.elevMax ?? '')
  const [competitionId, setCompetitionId] = useState(initial.competitionId ?? '')
  const [eventType, setEventType] = useState(initial.eventType ?? '')
  const [sortBy, setSortBy] = useState(initial.sortBy ?? '')

  // Ako se user vrati nazad/forward ili ručno menja URL, uskladi state sa URL-om.
  // (Ovo rešava “ne filtrira ništa” situacije kad URL i UI odlutaju.)
  const lastUrlRef = useRef<string>('')
  useEffect(() => {
    const url = sp.toString()
    if (url === lastUrlRef.current) return
    lastUrlRef.current = url

    setQ(sp.get('q') ?? '')
    setLenMin(sp.get('lenMin') ?? '')
    setLenMax(sp.get('lenMax') ?? '')
    setElevMin(sp.get('elevMin') ?? '')
    setElevMax(sp.get('elevMax') ?? '')
    setCompetitionId(sp.get('competitionId') ?? '')
    setEventType(sp.get('eventType') ?? '')
    setSortBy(sp.get('sortBy') ?? '')
  }, [sp])

  const dirty =
    (q ?? '').trim() !== (initial.q ?? '').trim() ||
    (lenMin ?? '').trim() !== (initial.lenMin ?? '').trim() ||
    (lenMax ?? '').trim() !== (initial.lenMax ?? '').trim() ||
    (elevMin ?? '').trim() !== (initial.elevMin ?? '').trim() ||
    (elevMax ?? '').trim() !== (initial.elevMax ?? '').trim() ||
    (competitionId ?? '').trim() !== (initial.competitionId ?? '').trim() ||
    (eventType ?? '').trim() !== (initial.eventType ?? '').trim() ||
    (sortBy ?? '').trim() !== (initial.sortBy ?? '').trim()

  const clearVisible =
    Boolean((initial.q ?? '').trim()) ||
    Boolean((initial.lenMin ?? '').trim()) ||
    Boolean((initial.lenMax ?? '').trim()) ||
    Boolean((initial.elevMin ?? '').trim()) ||
    Boolean((initial.elevMax ?? '').trim()) ||
    Boolean((initial.competitionId ?? '').trim()) ||
    Boolean((initial.eventType ?? '').trim()) ||
    Boolean((initial.sortBy ?? '').trim())

  function buildQueryString() {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (lenMin.trim()) params.set('lenMin', lenMin.trim())
    if (lenMax.trim()) params.set('lenMax', lenMax.trim())
    if (elevMin.trim()) params.set('elevMin', elevMin.trim())
    if (elevMax.trim()) params.set('elevMax', elevMax.trim())
    if (competitionId.trim()) params.set('competitionId', competitionId.trim())
    if (eventType.trim()) params.set('eventType', eventType.trim())
    if (sortBy.trim()) params.set('sortBy', sortBy.trim())
    const s = params.toString()
    return s ? `?${s}` : ''
  }

  function onApply(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/events${buildQueryString()}`)
  }

  return (
    <form onSubmit={onApply} className="mt-4 flex flex-wrap items-center gap-4">
      <div className="input w-full">
        <div className="min-w-64 flex-1">
          <InputGroup>
            <MagnifyingGlassIcon />
            <Input name="q" placeholder="Search events or races…" value={q} onChange={(e) => setQ(e.target.value)} />
          </InputGroup>
        </div>
      </div>

      <div className="filters flex w-full flex-col gap-4 md:flex-row">
        <div className="flex grow items-center gap-1">
          <Input
            name="lenMin"
            placeholder="Distance from (km)"
            inputMode="decimal"
            value={lenMin}
            onChange={(e) => setLenMin(e.target.value)}
            aria-label="Minimum length (km)"
          />
          <Input
            name="lenMax"
            placeholder="Distance to (km)"
            inputMode="decimal"
            value={lenMax}
            onChange={(e) => setLenMax(e.target.value)}
            aria-label="Maximum length (km)"
          />
        </div>

        <div className="flex grow items-center gap-1">
          <Input
            name="elevMin"
            placeholder="Elevation from (m)"
            inputMode="decimal"
            value={elevMin}
            onChange={(e) => setElevMin(e.target.value)}
            aria-label="Minimum elevation (m)"
          />
          <Input
            name="elevMax"
            placeholder="Elevation to (m)"
            inputMode="decimal"
            value={elevMax}
            onChange={(e) => setElevMax(e.target.value)}
            aria-label="Maximum elevation (m)"
          />
        </div>

        <div>
          <Select
            aria-label="Competition"
            className="min-w-80 lg:min-w-64"
            value={competitionId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCompetitionId(e.target.value)}
          >
            <option value="">All competitions</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Select
            aria-label="Event type"
            value={eventType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEventType(e.target.value)}
          >
            <option value="">All types</option>
            <option value="TRAIL">Trail</option>
            <option value="ROAD">Road</option>
          </Select>
        </div>

        <div>
          <Select
            aria-label="Sort by"
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
          >
            <option value="">Sort by date</option>
            <option value="distance_asc">Distance (shortest first)</option>
            <option value="distance_desc">Distance (longest first)</option>
            <option value="elevation_asc">Elevation (lowest first)</option>
            <option value="elevation_desc">Elevation (highest first)</option>
            <option value="name">Name (A-Z)</option>
          </Select>
        </div>
      </div>

      <div className="buttons flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Button id="applyBtn" type="submit">
            {dirty ? 'Apply changes' : 'Apply'}
          </Button>
          <span className={`text-sm/6 ${dirty ? '' : 'hidden'}`}>Changes not applied</span>
        </div>

        {clearVisible ? (
          <Link href="/events" className="text-sm">
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  )
}
