'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Heading, Subheading } from '@/components/heading'
import { LoadingState } from '@/components/loading-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

type EntityStat = { entityId: string; name: string; slug: string | null; count: number; uniqueCount: number }
type SearchStat = { query: string; count: number }
type FilterStat = { key: string; value: string; count: number }
type DayStat = { date: string; count: number; uniqueCount: number }
type UserStat = { userId: string; email: string; name: string | null; count: number }
type LoginStat = { email: string; userId: string | null; name: string | null; loginCount: number; lastLogin: string }
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
  topFilters: FilterStat[]
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
}

// ── Queries ──────────────────────────────────────────────────────────────────

const ANALYTICS_QUERY = `
  query AnalyticsStats($days: Int) {
    analyticsStats(days: $days) {
      topSearches { query count }
      topFilters { key value count }
      topRaces { entityId name slug count uniqueCount }
      topEvents { entityId name slug count uniqueCount }
      topFavorites { entityId name slug count uniqueCount }
      viewsPerDay { date count }
      newVisitorsPerDay { date count }
      topUsers { userId email name count }
      userGrowthPerDay { date count }
      totalUsers
      verifiedUsersCount
      unverifiedUsersCount
      totalUniqueVisitors
      newVisitorCount
      recentLogins { email userId name loginCount lastLogin }
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
  { label: 'Juče', value: -1 },
  { label: 'Poslednjih 7 dana', value: 7 },
  { label: 'Poslednjih 30 dana', value: 30 },
  { label: 'Poslednjih 90 dana', value: 90 },
]

const FILTER_LABELS: Record<string, string> = {
  eventType: 'Tip',
  lenMin: 'Dužina od',
  lenMax: 'Dužina do',
  elevMin: 'Vis. razlika od',
  elevMax: 'Vis. razlika do',
  competitionId: 'Takmičenje',
  country: 'Država',
  sortBy: 'Sortiranje',
  verified: 'Verifikovan',
  showPast: 'Istekli',
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

function BarChart({ data, label }: { data: { date: string; value: number }[]; label: string }) {
  if (data.length === 0) return <EmptyState text={`Nema podataka za ${label.toLowerCase()}.`} />
  const max = Math.max(...data.map((d) => d.value), 1)
  const total = data.reduce((s, d) => s + d.value, 0)
  const avg = data.length > 0 ? (total / data.length).toFixed(1) : '0'

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-3 text-sm">
        <span className="text-text-secondary">Ukupno:</span>
        <span className="font-bold tabular-nums text-text-primary">{total}</span>
        <span className="text-text-secondary">Prosek/dan:</span>
        <span className="font-bold tabular-nums text-text-primary">{avg}</span>
      </div>
      <div className="flex items-end gap-[2px]" style={{ height: 120 }}>
        {data.map((d) => (
          <div key={d.date} className="group relative flex-1" style={{ height: '100%' }}>
            <div
              className="absolute bottom-0 w-full rounded-t bg-brand-green/70 transition-colors group-hover:bg-brand-green"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] tabular-nums text-text-primary shadow group-hover:block">
              {d.date}: {d.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-text-tertiary">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
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
              <p className="text-xs text-text-secondary">Učitavanje...</p>
            ) : !activity || activity.length === 0 ? (
              <p className="text-xs text-text-secondary">Nema zabeležene aktivnosti.</p>
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
  const { user, accessToken } = useAuth()
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

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

  if (!user || loading) return <LoadingState />

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
          {/* ═══════════ SEKCIJA 1: PRETRAGE I FILTERI ═══════════ */}
          <SectionDivider title="Pretrage i filteri" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                      {stats.topSearches.map((s) => (
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

            {/* Top filteri */}
            <section>
              <Subheading>Top filteri</Subheading>
              {stats.topFilters.length === 0 ? (
                <EmptyState text="Nema podataka o filterima." />
              ) : (
                <div className="mt-1 overflow-x-auto">
                  <Table dense striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Filter</TableHeader>
                        <TableHeader>Vrednost</TableHeader>
                        <TableHeader className="text-right">Puta</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topFilters.map((f, i) => (
                        <TableRow key={`${f.key}-${f.value}-${i}`}>
                          <TableCell className="text-sm font-medium">{FILTER_LABELS[f.key] ?? f.key}</TableCell>
                          <TableCell className="text-sm">{f.value}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{f.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>

          {/* ═══════════ SEKCIJA 2: NAJPOPULARNIJI SADRZAJ ═══════════ */}
          <SectionDivider title="Najpopularniji sadržaj" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
                      {stats.topRaces.map((r) => (
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

            {/* Top dogadjaji */}
            <section>
              <Subheading>Top događaji</Subheading>
              {stats.topEvents.length === 0 ? (
                <EmptyState text="Nema podataka." />
              ) : (
                <div className="mt-1 overflow-x-auto">
                  <Table dense striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Događaj</TableHeader>
                        <TableHeader className="text-right">Ukupno / Uniq.</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topEvents.map((e) => (
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
                      {stats.topFavorites.map((f) => (
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

          {/* ═══════════ SEKCIJA 3: SAOBRACAJ ═══════════ */}
          <SectionDivider title="Saobraćaj" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Pregledi po danu */}
            <section>
              <Subheading>Pregledi po danu</Subheading>
              <div className="mt-2">
                <BarChart data={stats.viewsPerDay.map((d) => ({ date: d.date, value: d.count }))} label="Preglede" />
              </div>
            </section>

            {/* Novi posetioci po danu */}
            <section>
              <Subheading>Novi posetioci po danu</Subheading>
              <div className="mt-2">
                <BarChart data={stats.newVisitorsPerDay.map((d) => ({ date: d.date, value: d.count }))} label="Nove posetioce" />
              </div>
            </section>
          </div>

          {/* ═══════════ SEKCIJA 4: KORISNICI ═══════════ */}
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
                      {stats.topUsers.map((u) => (
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
              <div className="mt-2">
                <BarChart data={stats.userGrowthPerDay.map((d) => ({ date: d.date, value: d.count }))} label="Nove korisnike" />
              </div>
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

          {/* ═══════════ SEKCIJA 5: AKTIVNOST (DANAS) ═══════════ */}
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
