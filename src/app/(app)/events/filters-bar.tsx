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
    <form onSubmit={onApply} className="mt-4 flex flex-col gap-4">
      {/* Row 1: Search input */}
      <div className="w-full">
        <InputGroup>
          <MagnifyingGlassIcon />
          <Input name="q" placeholder="Pretraži događaje ili trke…" value={q} onChange={(e) => setQ(e.target.value)} />
        </InputGroup>
      </div>

      {/* Row 2: Input filters (distance, elevation) */}
      <div className="flex flex-col gap-2 md:flex-row md:gap-4">
        <div className="flex grow items-center gap-1">
          <Input
            name="lenMin"
            placeholder="Dužina od (km)"
            inputMode="decimal"
            value={lenMin}
            onChange={(e) => setLenMin(e.target.value)}
            aria-label="Minimalna dužina (km)"
          />
          <Input
            name="lenMax"
            placeholder="Dužina do (km)"
            inputMode="decimal"
            value={lenMax}
            onChange={(e) => setLenMax(e.target.value)}
            aria-label="Maksimalna dužina (km)"
          />
        </div>
        <div className="flex grow items-center gap-1">
          <Input
            name="elevMin"
            placeholder="Elevacija od (m)"
            inputMode="decimal"
            value={elevMin}
            onChange={(e) => setElevMin(e.target.value)}
            aria-label="Minimalna elevacija (m)"
          />
          <Input
            name="elevMax"
            placeholder="Elevacija do (m)"
            inputMode="decimal"
            value={elevMax}
            onChange={(e) => setElevMax(e.target.value)}
            aria-label="Maksimalna elevacija (m)"
          />
        </div>
      </div>

      {/* Row 3: Dropdowns (competition, type, sort) */}
      <div className="flex flex-col gap-2 md:flex-row md:gap-4">
        <div className="grow">
          <Select
            aria-label="Takmičenje"
            value={competitionId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCompetitionId(e.target.value)}
          >
            <option value="">Sva takmičenja</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grow">
          <Select
            aria-label="Tip događaja"
            value={eventType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEventType(e.target.value)}
          >
            <option value="">Svi tipovi</option>
            <option value="TRAIL">Trail</option>
            <option value="ROAD">Asfalt</option>
          </Select>
        </div>
        <div className="grow">
          <Select
            aria-label="Sortiraj po"
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
          >
            <option value="">Sortiraj po datumu</option>
            <option value="distance_asc">Dužina (najkraće prvo)</option>
            <option value="distance_desc">Dužina (najduže prvo)</option>
            <option value="elevation_asc">Elevacija (najniže prvo)</option>
            <option value="elevation_desc">Elevacija (najviše prvo)</option>
            <option value="name">Naziv (A-Ž)</option>
          </Select>
        </div>
      </div>

      {/* Row 4: Buttons */}
      <div className="flex items-center gap-2">
        <Button id="applyBtn" type="submit">
          {dirty ? 'Primeni izmene' : 'Primeni'}
        </Button>
        <span className={`text-sm/6 ${dirty ? '' : 'hidden'}`}>Izmene nisu primenjene</span>
        {clearVisible ? (
          <Link href="/events" className="text-sm">
            Očisti
          </Link>
        ) : null}
      </div>
    </form>
  )
}
