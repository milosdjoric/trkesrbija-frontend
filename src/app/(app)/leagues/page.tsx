'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { Text } from '@/components/text'
import { useToast } from '@/components/toast'
import { CalendarIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/16/solid'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type League = {
  id: string
  name: string
  slug: string
  description: string | null
  type: string
  status: string
  period: string
  minDistance: number | null
  maxDistance: number | null
  startDate: string
  endDate: string
  memberCount: number
  isMember: boolean
  approvalNote: string | null
}

const LEAGUES_QUERY = `
  query Leagues($status: LeagueStatus, $limit: Int) {
    leagues(status: $status, limit: $limit) {
      id name slug description type status period
      minDistance maxDistance startDate endDate
      memberCount isMember
    }
  }
`

const MY_LEAGUES_QUERY = `
  query MyLeaguesForPage {
    myLeagues {
      id name slug status approvalNote
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

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  return d.toLocaleDateString('sr-Latn-RS', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Belgrade',
  })
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return <Badge color="green">Aktivna</Badge>
    case 'COMPLETED':
      return <Badge color="zinc">Završena</Badge>
    case 'DRAFT':
      return <Badge color="yellow">Nacrt</Badge>
    case 'PENDING_APPROVAL':
      return <Badge color="orange">Na čekanju</Badge>
    case 'REJECTED':
      return <Badge color="red">Odbijena</Badge>
    default:
      return <Badge color="zinc">{status}</Badge>
  }
}

function getDistanceLabel(min: number | null, max: number | null) {
  if (min != null && max != null) {
    if (min === max) return `${min} km`
    return `${min}–${max} km`
  }
  if (min != null) return `≥ ${min} km`
  if (max != null) return `≤ ${max} km`
  return 'Bilo koja distanca'
}

const emptyForm = {
  name: '',
  description: '',
  type: 'DISTANCE' as const,
  period: 'MONTHLY' as const,
  scoringMode: 'TOTAL_DISTANCE' as const,
  minDistance: '',
  maxDistance: '',
  startDate: '',
  endDate: '',
  isPublic: true,
}

export default function LeaguesPage() {
  const { accessToken, user } = useAuth()
  const { toast } = useToast()

  const [leagues, setLeagues] = useState<League[]>([])
  const [myLeagues, setMyLeagues] = useState<Pick<League, 'id' | 'name' | 'slug' | 'status' | 'approvalNote'>[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const loadLeagues = useCallback(async () => {
    try {
      const data = await gql<{ leagues: League[] }>(LEAGUES_QUERY, { limit: 50 })
      setLeagues(data.leagues)
    } catch (err) {
      console.error('Failed to load leagues:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMyLeagues = useCallback(async () => {
    if (!accessToken) return
    try {
      const data = await gql<{ myLeagues: typeof myLeagues }>(MY_LEAGUES_QUERY, {}, { accessToken })
      // Prikaži samo pending/rejected — one koje nisu aktivne se ne vide u glavnoj listi
      setMyLeagues((data.myLeagues || []).filter((l) => l.status === 'PENDING_APPROVAL' || l.status === 'REJECTED'))
    } catch {
      // Ignoriši — nije kritično
    }
  }, [accessToken])

  useEffect(() => {
    loadLeagues()
  }, [loadLeagues])

  useEffect(() => {
    loadMyLeagues()
  }, [loadMyLeagues])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      toast('Naziv, početak i kraj su obavezni', 'error')
      return
    }

    setSubmitting(true)
    try {
      await gql(
        CREATE_LEAGUE,
        {
          input: {
            name: form.name.trim(),
            description: form.description.trim() || null,
            type: form.type,
            period: form.period,
            scoringMode: form.scoringMode,
            minDistance: form.minDistance ? parseFloat(form.minDistance) : null,
            maxDistance: form.maxDistance ? parseFloat(form.maxDistance) : null,
            startDate: new Date(form.startDate).toISOString(),
            endDate: new Date(form.endDate).toISOString(),
            isPublic: form.isPublic,
          },
        },
        { accessToken },
      )
      toast('Predlog poslat! Admin će pregledati vašu ligu.', 'success')
      setShowModal(false)
      setForm(emptyForm)
      loadMyLeagues()
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri slanju', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-text-secondary">Učitavanje...</div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <Heading>Lige</Heading>
          <Text className="mt-1">Virtuelna takmičenja — trči samostalno, takmič se na leaderboard-u</Text>
        </div>
        {user && (
          <Button color="blue" onClick={() => setShowModal(true)}>
            <PlusIcon className="size-4" />
            Predloži ligu
          </Button>
        )}
      </div>

      {/* Moje predložene/odbijene lige */}
      {myLeagues.length > 0 && (
        <div className="mt-6 space-y-2">
          {myLeagues.map((league) => (
            <div
              key={league.id}
              className={`rounded-lg border p-4 ${
                league.status === 'REJECTED'
                  ? 'border-red-700/40 bg-red-900/10'
                  : 'border-yellow-700/40 bg-yellow-900/10'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-medium text-text-primary">{league.name}</span>
                  <span className="ml-2">{getStatusBadge(league.status)}</span>
                </div>
              </div>
              {league.status === 'PENDING_APPROVAL' && (
                <p className="mt-1 text-xs text-text-secondary">Vaš predlog čeka odobrenje od admina.</p>
              )}
              {league.status === 'REJECTED' && (
                <p className="mt-1 text-xs text-red-400">
                  Odbijena.{league.approvalNote ? ` Razlog: ${league.approvalNote}` : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {leagues.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border-primary p-8 text-center">
          <UserGroupIcon className="mx-auto size-8 text-text-secondary" />
          <Text className="mt-2">Nema dostupnih liga.</Text>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.slug}`}
              className="group rounded-xl border border-border-primary bg-card p-5 transition-colors hover:border-brand-green/40"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-text-primary group-hover:text-brand-green">{league.name}</h3>
                {getStatusBadge(league.status)}
              </div>

              {league.description && (
                <Text className="mt-2 line-clamp-2 text-sm">{league.description}</Text>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-3.5" />
                  {formatDate(league.startDate)} — {formatDate(league.endDate)}
                </span>
                <span className="flex items-center gap-1">
                  <UserGroupIcon className="size-3.5" />
                  {league.memberCount} članova
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Badge color="blue">{getDistanceLabel(league.minDistance, league.maxDistance)}</Badge>
                {league.isMember && <Badge color="green">Član</Badge>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Strava attribution — required by Strava API Brand Guidelines */}
      <div className="mt-8 flex justify-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/strava/powered_by_strava_white.svg"
          alt="Powered by Strava"
          className="h-8 opacity-60"
        />
      </div>

      {/* Predloži ligu modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border-primary bg-card p-6">
            <h3 className="text-base font-semibold text-text-primary">Predloži novu ligu</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Admin će pregledati vaš predlog i odobriti ga pre nego što postane vidljiv.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
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
                  placeholder="Kratki opis..."
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
                <label className="block text-sm font-medium text-text-secondary">Scoring</label>
                <Select
                  value={form.scoringMode}
                  onChange={(e) => setForm({ ...form, scoringMode: e.target.value as any })}
                  className="mt-1"
                >
                  <option value="TOTAL_DISTANCE">Ukupna distanca</option>
                  <option value="BEST_TIME">Najbolje vreme</option>
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

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  color="zinc"
                  onClick={() => { setShowModal(false); setForm(emptyForm) }}
                  disabled={submitting}
                >
                  Otkaži
                </Button>
                <Button type="submit" color="green" disabled={submitting}>
                  {submitting ? 'Slanje...' : 'Pošalji predlog'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
