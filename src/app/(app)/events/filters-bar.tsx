'use client'

import { Button } from '@/components/button'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/dropdown'
import { Input, InputGroup } from '@/components/input'
import { Link } from '@/components/link'
import { MagnifyingGlassIcon } from '@heroicons/react/16/solid'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

type Competition = { id: string; name: string }

type Initial = {
  q: string
  lenMin: string
  lenMax: string
  elevMin: string
  elevMax: string
  competitionId: string
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
  }, [sp])

  const competitionNameById = useMemo(() => {
    return new Map<string, string>(competitions.map((c) => [c.id, c.name]))
  }, [competitions])

  const dirty =
    (q ?? '').trim() !== (initial.q ?? '').trim() ||
    (lenMin ?? '').trim() !== (initial.lenMin ?? '').trim() ||
    (lenMax ?? '').trim() !== (initial.lenMax ?? '').trim() ||
    (elevMin ?? '').trim() !== (initial.elevMin ?? '').trim() ||
    (elevMax ?? '').trim() !== (initial.elevMax ?? '').trim() ||
    (competitionId ?? '').trim() !== (initial.competitionId ?? '').trim()

  const clearVisible =
    Boolean((initial.q ?? '').trim()) ||
    Boolean((initial.lenMin ?? '').trim()) ||
    Boolean((initial.lenMax ?? '').trim()) ||
    Boolean((initial.elevMin ?? '').trim()) ||
    Boolean((initial.elevMax ?? '').trim()) ||
    Boolean((initial.competitionId ?? '').trim())

  function buildQueryString() {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (lenMin.trim()) params.set('lenMin', lenMin.trim())
    if (lenMax.trim()) params.set('lenMax', lenMax.trim())
    if (elevMin.trim()) params.set('elevMin', elevMin.trim())
    if (elevMax.trim()) params.set('elevMax', elevMax.trim())
    if (competitionId.trim()) params.set('competitionId', competitionId.trim())
    const s = params.toString()
    return s ? `?${s}` : ''
  }

  function onApply(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/events${buildQueryString()}`)
  }

  const competitionLabel = competitionId
    ? (competitionNameById.get(competitionId) ?? 'All competitions')
    : 'All competitions'

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

        <div className="flex grow items-center gap-1">
          <Dropdown>
            <DropdownButton type="button" aria-label="Competition">
              <span className="truncate">{competitionLabel}</span>
            </DropdownButton>

            <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
              <DropdownItem
                href="#"
                onClick={(e: any) => {
                  e?.preventDefault?.()
                  setCompetitionId('')
                }}
              >
                All competitions
              </DropdownItem>

              {competitions.map((c) => (
                <DropdownItem
                  key={c.id}
                  href="#"
                  onClick={(e: any) => {
                    e?.preventDefault?.()
                    setCompetitionId(c.id)
                  }}
                >
                  {c.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      <div className="buttons flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Button id="applyBtn" type="submit">
            {dirty ? 'Apply changes' : 'Apply'}
          </Button>
          <span className={`text-sm/6 text-zinc-500 ${dirty ? '' : 'hidden'}`}>Changes not applied</span>
        </div>

        {clearVisible ? (
          <Link href="/events" className="text-sm/6 text-zinc-500 hover:text-zinc-700">
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  )
}
