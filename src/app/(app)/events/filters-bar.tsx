'use client'

import { useAuth } from '@/app/auth/auth-context'
import { trackEvent } from '@/app/lib/analytics'
import { Button } from '@/components/button'
import { Input, InputGroup } from '@/components/input'
import { Link } from '@/components/link'
import { Select } from '@/components/select'
import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/16/solid'
import NextLink from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

type Competition = { id: string; name: string }

type Initial = {
  q: string
  lenMin: string
  lenMax: string
  elevMin: string
  elevMax: string
  competitionId: string
  eventType: string
  country: string
  sortBy: string
  showPast: string
  tag: string
  verified: string
}

export function FiltersBar({ initial, competitions }: { initial: Initial; competitions: Competition[] }) {
  const router = useRouter()
  const sp = useSearchParams()
  const { user } = useAuth()
  const [isPending, startTransition] = useTransition()

  const [q, setQ] = useState(initial.q ?? '')
  const [lenMin, setLenMin] = useState(initial.lenMin ?? '')
  const [lenMax, setLenMax] = useState(initial.lenMax ?? '')
  const [elevMin, setElevMin] = useState(initial.elevMin ?? '')
  const [elevMax, setElevMax] = useState(initial.elevMax ?? '')
  const [competitionId, setCompetitionId] = useState(initial.competitionId ?? '')
  const [eventType, setEventType] = useState(initial.eventType ?? '')
  const [country, setCountry] = useState(initial.country ?? '')
  const [sortBy, setSortBy] = useState(initial.sortBy ?? '')
  const [showPast, setShowPast] = useState(initial.showPast === 'true')
  const [verified, setVerified] = useState(initial.verified ?? '')
  const activeTag = initial.tag ?? ''

  const [filtersOpen, setFiltersOpen] = useState(false)

  // Count active advanced filters (excluding search query)
  const advancedFilterCount = [
    initial.lenMin,
    initial.lenMax,
    initial.elevMin,
    initial.elevMax,
    initial.competitionId,
    initial.eventType,
    initial.country,
    initial.sortBy,
    initial.verified,
    initial.showPast === 'true' ? 'true' : '',
  ].filter((v) => Boolean((v ?? '').trim())).length

  // Ako se user vrati nazad/forward ili ručno menja URL, uskladi state sa URL-om.
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
    setCountry(sp.get('country') ?? '')
    setSortBy(sp.get('sortBy') ?? '')
    setShowPast(sp.get('showPast') === 'true')
    setVerified(sp.get('verified') ?? '')
  }, [sp])

  const dirty =
    (q ?? '').trim() !== (initial.q ?? '').trim() ||
    (lenMin ?? '').trim() !== (initial.lenMin ?? '').trim() ||
    (lenMax ?? '').trim() !== (initial.lenMax ?? '').trim() ||
    (elevMin ?? '').trim() !== (initial.elevMin ?? '').trim() ||
    (elevMax ?? '').trim() !== (initial.elevMax ?? '').trim() ||
    (competitionId ?? '').trim() !== (initial.competitionId ?? '').trim() ||
    (eventType ?? '').trim() !== (initial.eventType ?? '').trim() ||
    (country ?? '').trim() !== (initial.country ?? '').trim() ||
    (sortBy ?? '').trim() !== (initial.sortBy ?? '').trim() ||
    showPast !== (initial.showPast === 'true') ||
    (verified ?? '').trim() !== (initial.verified ?? '').trim()

  const clearVisible =
    Boolean((initial.q ?? '').trim()) ||
    Boolean((initial.lenMin ?? '').trim()) ||
    Boolean((initial.lenMax ?? '').trim()) ||
    Boolean((initial.elevMin ?? '').trim()) ||
    Boolean((initial.elevMax ?? '').trim()) ||
    Boolean((initial.competitionId ?? '').trim()) ||
    Boolean((initial.eventType ?? '').trim()) ||
    Boolean((initial.country ?? '').trim()) ||
    Boolean((initial.sortBy ?? '').trim()) ||
    Boolean((initial.tag ?? '').trim()) ||
    initial.showPast === 'true' ||
    Boolean((initial.verified ?? '').trim())

  function buildQueryString() {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (lenMin.trim()) params.set('lenMin', lenMin.trim())
    if (lenMax.trim()) params.set('lenMax', lenMax.trim())
    if (elevMin.trim()) params.set('elevMin', elevMin.trim())
    if (elevMax.trim()) params.set('elevMax', elevMax.trim())
    if (competitionId.trim()) params.set('competitionId', competitionId.trim())
    if (eventType.trim()) params.set('eventType', eventType.trim())
    if (country.trim()) params.set('country', country.trim())
    if (sortBy.trim()) params.set('sortBy', sortBy.trim())
    if (showPast) params.set('showPast', 'true')
    if (verified.trim()) params.set('verified', verified.trim())
    const s = params.toString()
    return s ? `?${s}` : ''
  }

  function onApply(e: React.FormEvent) {
    e.preventDefault()
    if (q.trim()) {
      trackEvent({ type: 'SEARCH', metadata: { query: q.trim(), eventType }, userId: user?.id })
    }
    // Track active filters
    const activeFilters: Record<string, string> = {}
    if (eventType.trim()) activeFilters.eventType = eventType.trim()
    if (lenMin.trim()) activeFilters.lenMin = lenMin.trim()
    if (lenMax.trim()) activeFilters.lenMax = lenMax.trim()
    if (elevMin.trim()) activeFilters.elevMin = elevMin.trim()
    if (elevMax.trim()) activeFilters.elevMax = elevMax.trim()
    if (competitionId.trim()) activeFilters.competitionId = competitionId.trim()
    if (country.trim()) activeFilters.country = country.trim()
    if (sortBy.trim()) activeFilters.sortBy = sortBy.trim()
    if (verified.trim()) activeFilters.verified = verified.trim()
    if (showPast) activeFilters.showPast = 'true'
    if (Object.keys(activeFilters).length > 0) {
      trackEvent({ type: 'FILTER', metadata: activeFilters, userId: user?.id })
    }
    startTransition(() => {
      router.push(`/events${buildQueryString()}`)
    })
  }

  return (
    <form onSubmit={onApply} className="mt-4 flex flex-col gap-4">
      {/* Active tag filter */}
      {activeTag && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Filtriranje po tagu:</span>
          <NextLink
            href="/events"
            className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover"
          >
            {activeTag}
            <XMarkIcon className="size-4" />
          </NextLink>
        </div>
      )}

      {/* Search + mobile filter toggle */}
      <div className="flex gap-2">
        <div className="flex-1">
          <InputGroup>
            <MagnifyingGlassIcon />
            <Input name="q" placeholder="Pretraži događaje ili trke…" value={q} onChange={(e) => setQ(e.target.value)} />
          </InputGroup>
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="relative flex items-center gap-1.5 rounded-lg border border-border-secondary bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:border-gray-500 hover:text-text-primary md:hidden"
        >
          <AdjustmentsHorizontalIcon className="size-4" />
          Filteri
          {advancedFilterCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-black">
              {advancedFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced filters — always visible on desktop, collapsible on mobile */}
      <div className={`flex flex-col gap-4 ${filtersOpen ? '' : 'hidden md:flex'}`}>
        {/* Distance & elevation inputs */}
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
              placeholder="Vis. razlika od (m)"
              inputMode="decimal"
              value={elevMin}
              onChange={(e) => setElevMin(e.target.value)}
              aria-label="Minimalna visinska razlika (m)"
            />
            <Input
              name="elevMax"
              placeholder="Vis. razlika do (m)"
              inputMode="decimal"
              value={elevMax}
              onChange={(e) => setElevMax(e.target.value)}
              aria-label="Maksimalna visinska razlika (m)"
            />
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex flex-col gap-2 md:flex-row md:gap-4">
          <div className="flex-1">
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
          <div className="flex-1">
            <Select
              aria-label="Tip događaja"
              value={eventType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEventType(e.target.value)}
            >
              <option value="">Svi tipovi</option>
              <option value="TRAIL">Trail</option>
              <option value="ROAD">Ulična</option>
              <option value="OCR">OCR</option>
            </Select>
          </div>
          <div className="flex-1">
            <Select
              aria-label="Država"
              value={country}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCountry(e.target.value)}
            >
              <option value="">Sve države</option>
              <option value="ser">Srbija</option>
              <option value="cro">Hrvatska</option>
              <option value="bih">BiH</option>
              <option value="reg">Region</option>
            </Select>
          </div>
          <div className="flex-1">
            <Select
              aria-label="Verifikacija"
              value={verified}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVerified(e.target.value)}
            >
              <option value="">Svi (verifikovani i ne)</option>
              <option value="true">Samo verifikovani</option>
              <option value="false">Samo neverifikovani</option>
            </Select>
          </div>
          <div className="flex-1">
            <Select
              aria-label="Sortiraj po"
              value={sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
            >
              <option value="">Sortiraj po datumu</option>
              <option value="distance_asc">Dužina (najkraće prvo)</option>
              <option value="distance_desc">Dužina (najduže prvo)</option>
              <option value="elevation_asc">Vis. razlika (najniže prvo)</option>
              <option value="elevation_desc">Vis. razlika (najviše prvo)</option>
              <option value="name">Naziv (A-Ž)</option>
            </Select>
          </div>
        </div>

        {/* Buttons and toggle */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Button id="applyBtn" type="submit" disabled={isPending}>
              {isPending ? 'Učitavanje...' : dirty ? 'Primeni izmene' : 'Primeni'}
            </Button>
            <span className={`text-sm/6 ${dirty ? '' : 'hidden'}`}>Izmene nisu primenjene</span>
            {clearVisible ? (
              <Link href="/events" className="text-sm">
                Očisti
              </Link>
            ) : null}
          </div>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="size-4 rounded border-border-primary bg-surface text-brand-green focus:ring-brand-green"
            />
            Prikaži istekle događaje
          </label>
        </div>
      </div>
    </form>
  )
}
