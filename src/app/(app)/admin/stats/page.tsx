'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Heading, Subheading } from '@/components/heading'
import { LoadingState } from '@/components/loading-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

type EntityStat = { entityId: string; name: string; slug: string | null; count: number; uniqueCount: number }
type SearchStat = { query: string; count: number }
type DayStat = { date: string; count: number; uniqueCount: number }
type UserStat = { userId: string; email: string; name: string | null; count: number }
type LoginStat = { email: string; userId: string | null; name: string | null; loginCount: number; lastLogin: string }
type RegStatusStat = { status: string; count: number }
type RegByEventStat = { eventId: string; eventName: string; slug: string | null; count: number }
type ActivityEntry = {
  type: string
  entityType: string | null
  entityId: string | null
  entityName: string | null
  searchQuery: string | null
  createdAt: string
}

type AnalyticsStats = {
  topEvents: EntityStat[]
  topRaces: EntityStat[]
  topSearches: SearchStat[]
  topFavorites: EntityStat[]
  viewsPerDay: DayStat[]
  topUsers: UserStat[]
  recentLogins: LoginStat[]
  totalUniqueVisitors: number
  newVisitorCount: number
  newVisitorsPerDay: DayStat[]
  totalUsers: number
  userGrowthPerDay: DayStat[]
  verifiedUsersCount: number
  unverifiedUsersCount: number
  totalRegistrations: number
  registrationsByStatus: RegStatusStat[]
  registrationsByEvent: RegByEventStat[]
}

// ── Queries ──────────────────────────────────────────────────────────────────

const ANALYTICS_QUERY = `
  query AnalyticsStats($days: Int) {
    analyticsStats(days: $days) {
      topEvents { entityId name slug count uniqueCount }
      topRaces { entityId name slug count uniqueCount }
      topSearches { query count }
      topFavorites { entityId name slug count uniqueCount }
      viewsPerDay { date count uniqueCount }
      topUsers { userId email name count }
      recentLogins { email userId name loginCount lastLogin }
      totalUniqueVisitors
      newVisitorCount
      newVisitorsPerDay { date count uniqueCount }
      totalUsers
      userGrowthPerDay { date count }
      verifiedUsersCount
      unverifiedUsersCount
      totalRegistrations
      registrationsByStatus { status count }
      registrationsByEvent { eventId eventName slug count }
    }
  }
`

const USER_ACTIVITY_QUERY = `
  query UserActivity($userId: ID!, $date: String) {
    userActivity(userId: $userId, date: $date) {
      type entityType entityId entityName searchQuery createdAt
    }
  }
`

const DAY_OPTIONS = [
  { label: 'Danas', value: 1 },
  { label: 'Juce', value: -1 },
  { label: 'Poslednjih 7 dana', value: 7 },
  { label: 'Poslednjih 30 dana', value: 30 },
  { label: 'Poslednjih 90 dana', value: 90 },
]

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Na cekanju',
  CONFIRMED: 'Potvrdjeno',
  PAID: 'Placeno',
  CANCELLED: 'Otkazano',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('sr-Latn-RS', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Belgrade',
  })
}

// ── Small Components ─────────────────────────────────────────────────────────

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border-secondary bg-surface p-4">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">{value}</p>
    </div>
  )
}

function CountCell({ count, uniqueCount }: { count: number; uniqueCount: number }) {
  return (
    <TableCell className="text-right tabular-nums">
      <span className="font-medium">{count}</span>
      <span className="ml-1 text-xs text-text-secondary">/ {uniqueCount}</span>
    </TableCell>
  )
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="border-t border-border-primary pt-6">
      <Subheading className="mb-4 text-base text-text-secondary">{title}</Subheading>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="mt-1 text-sm text-text-secondary">{text}</p>
}

// ── User Activity Row ────────────────────────────────────────────────────────

function LoginRow({
  login,
  accessToken,
}: {
  login: LoginStat
  accessToken: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const [activity, setActivity] = useState<ActivityEntry[] | null>(null)
  const [loading, setLoading] = useState(false)

  const loadActivity = async () => {
    if (!login.userId || activity) {
      setExpanded(!expanded)
      return
    }
    setExpanded(true)
    setLoading(true)
    try {
      const data = await gql<{ userActivity: ActivityEntry[] }>(USER_ACTIVITY_QUERY, { userId: login.userId }, { accessToken })
      setActivity(data.userActivity)
    } catch {
      setActivity([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <TableRow className="cursor-pointer" onClick={loadActivity}>
        <TableCell>
          <span className="inline-flex items-center gap-1">
            {login.userId ? (
              expanded ? (
                <ChevronDownIcon className="size-4 text-text-secondary" />
              ) : (
                <ChevronRightIcon className="size-4 text-text-secondary" />
              )
            ) : (
              <span className="inline-block size-4" />
            )}
            <span className="font-medium">{login.name ?? login.email}</span>
            {login.name && <span className="text-xs text-text-secondary">{login.email}</span>}
          </span>
        </TableCell>
        <TableCell className="text-right tabular-nums text-sm">{formatTime(login.lastLogin)}</TableCell>
        <TableCell className="text-right font-medium tabular-nums">{login.loginCount}</TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={3} className="bg-surface-secondary px-6 py-2">
            {loading ? (
              <p className="text-xs text-text-secondary">Ucitavanje...</p>
            ) : !activity || activity.length === 0 ? (
              <p className="text-xs text-text-secondary">Nema zabelezene aktivnosti.</p>
            ) : (
              <ul className="space-y-0.5 text-xs">
                {activity.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 text-text-secondary">
                    <span className="tabular-nums text-text-tertiary">{formatTime(a.createdAt)}</span>
                    {a.type === 'SEARCH' ? (
                      <span>
                        Pretraga: <span className="font-medium text-text-primary">&ldquo;{a.searchQuery}&rdquo;</span>
                      </span>
                    ) : (
                      <span>
                        Posetio: <span className="font-medium text-text-primary">{a.entityName ?? a.entityType ?? 'Stranica'}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminStatsPage() {
  const router = useRouter()
  const { user, accessToken, isLoading } = useAuth()
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
    }
  }, [user, isLoading, router])

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const data = await gql<{ analyticsStats: AnalyticsStats }>(ANALYTICS_QUERY, { days }, { accessToken })
      setStats(data.analyticsStats)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [days, accessToken])

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchStats()
  }, [user, fetchStats])

  if (isLoading || !user) return <LoadingState />

  const totalViews = stats?.viewsPerDay.reduce((sum, d) => sum + d.count, 0) ?? 0

  return (
    <div className="space-y-6">
      {/* Header + Period Filter */}
      <div className="flex items-center justify-between">
        <Heading>Statistike</Heading>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-md border border-border-secondary bg-surface px-3 py-1.5 text-sm text-text-primary"
        >
          {DAY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : !stats ? (
        <p className="text-sm text-text-secondary">Nema podataka.</p>
      ) : (
        <>
          {/* ═══════════ KPI CARDS ═══════════ */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <KpiCard label="Pregledi" value={totalViews} />
            <KpiCard label="Jedinstveni posetioci" value={stats.totalUniqueVisitors} />
            <KpiCard label="Novi posetioci" value={stats.newVisitorCount} />
            <KpiCard label="Ukupno korisnika" value={stats.totalUsers} />
            <KpiCard label="Prijave u periodu" value={stats.totalRegistrations} />
          </div>

          {/* ═══════════ GRUPA 1: SAOBRACAJ ═══════════ */}
          <SectionDivider title="Saobracaj" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Pregledi po danu */}
            <section>
              <Subheading>Pregledi po danu</Subheading>
              {stats.viewsPerDay.length === 0 ? (
                <EmptyState text="Nema pregleda." />
              ) : (
                <div className="mt-1 overflow-x-auto">
                  <Table dense striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Datum</TableHeader>
                        <TableHeader className="text-right">Ukupno / Uniq.</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...stats.viewsPerDay]
                        .reverse()
                        .slice(0, 7)
                        .map((d) => (
                          <TableRow key={d.date}>
                            <TableCell className="text-sm">{d.date}</TableCell>
                            <CountCell count={d.count} uniqueCount={d.uniqueCount} />
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            {/* Novi posetioci po danu */}
            <section>
              <Subheading>Novi posetioci po danu</Subheading>
              {stats.newVisitorsPerDay.length === 0 ? (
                <EmptyState text="Nema novih posetilaca." />
              ) : (
                <div className="mt-1 overflow-x-auto">
                  <Table dense striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Datum</TableHeader>
                        <TableHeader className="text-right">Novi</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...stats.newVisitorsPerDay]
                        .reverse()
                        .slice(0, 7)
                        .map((d) => (
                          <TableRow key={d.date}>
                            <TableCell className="text-sm">{d.date}</TableCell>
                            <TableCell className="text-right font-medium tabular-nums">{d.count}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            {/* Top pretrage */}
            <section>
              <Subheading>Top pretrage</Subheading>
              {stats.topSearches.length === 0 ? (
                <EmptyState text="Nema pretraga." />
              ) : (
                <div className="mt-1 overflow-x-auto">
                  <Table dense striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Pretraga</TableHeader>
                        <TableHeader className="text-right">Puta</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topSearches.slice(0, 7).map((s) => (
                        <TableRow key={s.query}>
                          <TableCell className="font-mono text-xs">&ldquo;{s.query}&rdquo;</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{s.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>

          {/* ═══════════ GRUPA 2: SADRZAJ ═══════════ */}
          <SectionDivider title="Sadrzaj" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Top dogadjaji */}
            <section>
              <Subheading>Top dogadjaji</Subheading>
              {stats.topEvents.length === 0 ? (
                <EmptyState text="Nema podataka." />
              ) : (
                <div className="mt-1 overflow-x-auto">
                  <Table dense striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Dogadjaj</TableHeader>
                        <TableHeader className="text-right">Ukupno / Uniq.</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topEvents.slice(0, 7).map((e) => (
                        <TableRow key={e.entityId}>
                          <TableCell className="max-w-[180px] truncate">
                            {e.slug ? (
                              <Link href={`/events/${e.slug}`} className="hover:underline">
                                {e.name}
                              </Link>
                            ) : (
                              e.name
                            )}
                          </TableCell>
                          <CountCell count={e.count} uniqueCount={e.uniqueCount} />
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            {/* Top trke */}
            <section>
              <Subheading>Top trke</Subheading>
              {stats.topRaces.length === 0 ? (
                <EmptyState text="Nema podataka." />
              ) : (
                <div className="mt-1 overflow-x-auto">
                  <Table dense striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Trka</TableHeader>
                        <TableHeader className="text-right">Ukupno / Uniq.</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topRaces.slice(0, 7).map((r) => (
                        <TableRow key={r.entityId}>
                          <TableCell className="max-w-[180px] truncate">
                            {r.slug ? (
                              <Link href={`/races/${r.slug}`} className="hover:underline">
                                {r.name}
                              </Link>
                            ) : (
                              r.name
                            )}
                          </TableCell>
                          <CountCell count={r.count} uniqueCount={r.uniqueCount} />
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            {/* Top omiljene */}
            <section>
              <Subheading>Top omiljene</Subheading>
              {stats.topFavorites.length === 0 ? (
                <EmptyState text="Nema omiljenih." />
              ) : (
                <div className="mt-1 overflow-x-auto">
                  <Table dense striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Trka</TableHeader>
                        <TableHeader className="text-right">Broj</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topFavorites.slice(0, 7).map((f) => (
                        <TableRow key={f.entityId}>
                          <TableCell className="max-w-[180px] truncate">
                            {f.slug ? (
                              <Link href={`/races/${f.slug}`} className="hover:underline">
                                {f.name}
                              </Link>
                            ) : (
                              f.name
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{f.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>

          {/* ═══════════ GRUPA 3: KORISNICI ═══════════ */}
          <SectionDivider title="Korisnici" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Najaktivniji korisnici */}
            <section>
              <Subheading>Najaktivniji korisnici</Subheading>
              {stats.topUsers.length === 0 ? (
                <EmptyState text="Nema podataka." />
              ) : (
                <div className="mt-1 overflow-x-auto">
                  <Table dense striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Korisnik</TableHeader>
                        <TableHeader className="text-right">Pregledi</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topUsers.slice(0, 7).map((u) => (
                        <TableRow key={u.userId}>
                          <TableCell>
                            <span className="font-medium">{u.name ?? u.email}</span>
                            {u.name && <span className="ml-1 text-xs text-text-secondary">{u.email}</span>}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{u.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            {/* Rast korisnika po danu */}
            <section>
              <Subheading>Novi korisnici po danu</Subheading>
              {stats.userGrowthPerDay.length === 0 ? (
                <EmptyState text="Nema novih korisnika u periodu." />
              ) : (
                <div className="mt-1 overflow-x-auto">
                  <Table dense striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Datum</TableHeader>
                        <TableHeader className="text-right">Registracija</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...stats.userGrowthPerDay]
                        .reverse()
                        .slice(0, 7)
                        .map((d) => (
                          <TableRow key={d.date}>
                            <TableCell className="text-sm">{d.date}</TableCell>
                            <TableCell className="text-right font-medium tabular-nums">{d.count}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            {/* Verifikovani vs neverifikovani */}
            <section>
              <Subheading>Email verifikacija</Subheading>
              <div className="mt-1 overflow-x-auto">
                <Table dense striped>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Status</TableHeader>
                      <TableHeader className="text-right">Broj</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Verifikovani</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{stats.verifiedUsersCount}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Neverifikovani</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{stats.unverifiedUsersCount}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Procenat verifikacije</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {stats.totalUsers > 0 ? Math.round((stats.verifiedUsersCount / stats.totalUsers) * 100) : 0}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>

          {/* ═══════════ GRUPA 4: PRIJAVE ═══════════ */}
          <SectionDivider title="Prijave na trke" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Prijave po dogadjaju */}
            <section>
              <Subheading>Top dogadjaji po prijavama</Subheading>
              {stats.registrationsByEvent.length === 0 ? (
                <EmptyState text="Nema prijava u periodu." />
              ) : (
                <div className="mt-1 overflow-x-auto">
                  <Table dense striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Dogadjaj</TableHeader>
                        <TableHeader className="text-right">Prijave</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.registrationsByEvent.slice(0, 7).map((r) => (
                        <TableRow key={r.eventId}>
                          <TableCell className="max-w-[180px] truncate">
                            {r.slug ? (
                              <Link href={`/events/${r.slug}`} className="hover:underline">
                                {r.eventName}
                              </Link>
                            ) : (
                              r.eventName
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{r.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            {/* Registracije po statusu */}
            <section>
              <Subheading>Prijave po statusu</Subheading>
              {stats.registrationsByStatus.length === 0 ? (
                <EmptyState text="Nema prijava u periodu." />
              ) : (
                <div className="mt-1 overflow-x-auto">
                  <Table dense striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Status</TableHeader>
                        <TableHeader className="text-right">Broj</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.registrationsByStatus.map((r) => (
                        <TableRow key={r.status}>
                          <TableCell>{STATUS_LABELS[r.status] ?? r.status}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{r.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>

          {/* ═══════════ GRUPA 5: AKTIVNOST ═══════════ */}
          {stats.recentLogins.length > 0 && (
            <>
              <SectionDivider title="Aktivnost (danas)" />
              <section>
                <Subheading>Ko se logovao danas</Subheading>
                <div className="mt-1 overflow-x-auto">
                  <Table dense striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Korisnik</TableHeader>
                        <TableHeader className="text-right">Prijava u</TableHeader>
                        <TableHeader className="text-right">Puta</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.recentLogins.map((l) => (
                        <LoginRow key={l.email} login={l} accessToken={accessToken} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}
