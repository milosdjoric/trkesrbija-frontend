'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading, Subheading } from '@/components/heading'
import { Input } from '@/components/input'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { Select } from '@/components/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { useToast } from '@/components/toast'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import { useCallback, useEffect, useRef, useState } from 'react'

type League = {
  id: string
  name: string
  slug: string
  status: string
  type: string
  period: string
  minDistance: number | null
  maxDistance: number | null
  startDate: string
  endDate: string
  isPublic: boolean
  memberCount: number
}

const LEAGUES_QUERY = `
  query AdminLeagues {
    leagues(limit: 100) {
      id name slug status type period
      minDistance maxDistance startDate endDate
      isPublic memberCount
    }
  }
`

const CREATE_LEAGUE = `
  mutation CreateLeague($input: CreateLeagueInput!) {
    createLeague(input: $input) {
      id name slug status
    }
  }
`

const UPDATE_LEAGUE = `
  mutation UpdateLeague($leagueId: ID!, $input: UpdateLeagueInput!) {
    updateLeague(leagueId: $leagueId, input: $input) {
      id status
    }
  }
`

const DELETE_LEAGUE = `
  mutation DeleteLeague($leagueId: ID!) {
    deleteLeague(leagueId: $leagueId)
  }
`

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sr-Latn-RS', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Belgrade',
  })
}

export default function AdminLeaguesPage() {
  const { accessToken } = useAuth()
  const { toast } = useToast()

  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const loadedRef = useRef(false)

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'DISTANCE' as const,
    period: 'MONTHLY' as const,
    minDistance: '',
    maxDistance: '',
    startDate: '',
    endDate: '',
    isPublic: true,
  })

  const loadLeagues = useCallback(async () => {
    if (!accessToken) return
    try {
      const data = await gql<{ leagues: League[] }>(LEAGUES_QUERY, {}, { accessToken })
      setLeagues(data.leagues || [])
    } catch (err) {
      console.error('Failed to load leagues:', err)
      toast('Greška pri učitavanju liga', 'error')
    } finally {
      setLoading(false)
    }
  }, [accessToken, toast])

  useEffect(() => {
    if (accessToken && !loadedRef.current) {
      loadedRef.current = true
      loadLeagues()
    }
  }, [accessToken, loadLeagues])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast('Unesite naziv lige', 'error')
      return
    }

    setCreating(true)
    try {
      await gql(
        CREATE_LEAGUE,
        {
          input: {
            name: form.name.trim(),
            description: form.description.trim() || null,
            type: form.type,
            period: form.period,
            minDistance: form.minDistance ? parseFloat(form.minDistance) : null,
            maxDistance: form.maxDistance ? parseFloat(form.maxDistance) : null,
            startDate: new Date(form.startDate).toISOString(),
            endDate: new Date(form.endDate).toISOString(),
            isPublic: form.isPublic,
          },
        },
        { accessToken },
      )
      toast('Liga kreirana!', 'success')
      setShowForm(false)
      setForm({
        name: '',
        description: '',
        type: 'DISTANCE',
        period: 'MONTHLY',
        minDistance: '',
        maxDistance: '',
        startDate: '',
        endDate: '',
        isPublic: true,
      })
      loadedRef.current = false
      loadLeagues()
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri kreiranju', 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleStatusChange(leagueId: string, status: string) {
    try {
      await gql(UPDATE_LEAGUE, { leagueId, input: { status } }, { accessToken })
      setLeagues(leagues.map((l) => (l.id === leagueId ? { ...l, status } : l)))
      toast('Status ažuriran', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Greška', 'error')
    }
  }

  async function handleDelete(league: League) {
    if (!confirm(`Da li ste sigurni da želite da obrišete "${league.name}"?`)) return
    try {
      await gql(DELETE_LEAGUE, { leagueId: league.id }, { accessToken })
      setLeagues(leagues.filter((l) => l.id !== league.id))
      toast('Liga obrisana', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri brisanju', 'error')
    }
  }

  if (loading) return <LoadingState />

  return (
    <>
      <div className="mb-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ChevronLeftIcon className="size-4" />
          Admin
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Heading>Lige</Heading>
          <p className="mt-1 text-sm text-text-secondary">Upravljajte offline ligama sa Strava integracijom</p>
        </div>
        <Button color="blue" onClick={() => setShowForm(!showForm)}>
          <PlusIcon className="size-4" />
          Nova liga
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 rounded-lg border border-border-primary p-5">
          <Subheading>Nova liga</Subheading>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-secondary">Naziv *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="npr. Beogradska 10K Liga"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-text-secondary">Opis</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Kratki opis lige..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary">Period</label>
              <Select
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value as any })}
                className="mt-1"
              >
                <option value="WEEKLY">Nedeljno</option>
                <option value="MONTHLY">Mesečno</option>
                <option value="SEASONAL">Sezonski</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary">Javna</label>
              <Select
                value={form.isPublic ? 'true' : 'false'}
                onChange={(e) => setForm({ ...form, isPublic: e.target.value === 'true' })}
                className="mt-1"
              >
                <option value="true">Da</option>
                <option value="false">Ne (invite code)</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary">Min distanca (km)</label>
              <Input
                type="number"
                step="0.1"
                value={form.minDistance}
                onChange={(e) => setForm({ ...form, minDistance: e.target.value })}
                placeholder="npr. 9"
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary">Max distanca (km)</label>
              <Input
                type="number"
                step="0.1"
                value={form.maxDistance}
                onChange={(e) => setForm({ ...form, maxDistance: e.target.value })}
                placeholder="npr. 11"
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary">Početak *</label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary">Kraj *</label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" color="green" disabled={creating}>
              {creating ? 'Kreiranje...' : 'Kreiraj ligu'}
            </Button>
            <Button type="button" color="zinc" onClick={() => setShowForm(false)}>
              Otkaži
            </Button>
          </div>
        </form>
      )}

      {/* Leagues Table */}
      <div className="mt-8">
        <Subheading>Sve lige ({leagues.length})</Subheading>
        {leagues.length === 0 ? (
          <div className="mt-4 rounded-lg border border-border-primary p-6 text-sm/6">
            <div className="font-medium">Nema liga</div>
            <div className="mt-1 text-text-secondary">Kreirajte prvu ligu.</div>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <Table striped>
              <TableHead>
                <TableRow>
                  <TableHeader>Naziv</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Period</TableHeader>
                  <TableHeader>Distanca</TableHeader>
                  <TableHeader>Članovi</TableHeader>
                  <TableHeader className="text-right">Akcije</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {leagues.map((league) => (
                  <TableRow key={league.id}>
                    <TableCell>
                      <Link href={`/leagues/${league.slug}`} className="font-medium text-brand-green hover:underline">
                        {league.name}
                      </Link>
                      <div className="text-xs text-text-secondary">
                        {formatDate(league.startDate)} — {formatDate(league.endDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={league.status}
                        onChange={(e) => handleStatusChange(league.id, e.target.value)}
                        className="w-32 text-xs"
                      >
                        <option value="DRAFT">Nacrt</option>
                        <option value="ACTIVE">Aktivna</option>
                        <option value="COMPLETED">Završena</option>
                        <option value="ARCHIVED">Arhivirana</option>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm">{league.period}</TableCell>
                    <TableCell className="text-sm">
                      {league.minDistance ?? '—'} — {league.maxDistance ?? '—'} km
                    </TableCell>
                    <TableCell className="text-sm">{league.memberCount}</TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(league)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-700 px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/20"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  )
}
