'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Heading, Subheading } from '@/components/heading'
import { LoadingState } from '@/components/loading-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

type EntityStat = { entityId: string; name: string; slug: string | null; count: number; uniqueCount: number }
type SearchStat = { query: string; count: number }
type DayStat = { date: string; count: number; uniqueCount: number }
type UserStat = { userId: string; email: string; name: string | null; count: number }
type LoginStat = { email: string; userId: string | null; name: string | null; loginCount: number; lastLogin: string }

type AnalyticsStats = {
  topEvents: EntityStat[]
  topRaces: EntityStat[]
  topSearches: SearchStat[]
  topFavorites: EntityStat[]
  viewsPerDay: DayStat[]
  topUsers: UserStat[]
  recentLogins: LoginStat[]
}

const ANALYTICS_QUERY = `
  query AnalyticsStats($days: Int) {
    analyticsStats(days: $days) {
      topEvents { entityId name slug count uniqueCount }
      topRaces  { entityId name slug count uniqueCount }
      topSearches { query count }
      topFavorites { entityId name slug count uniqueCount }
      viewsPerDay { date count uniqueCount }
      topUsers { userId email name count }
      recentLogins { email userId name loginCount lastLogin }
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

function CountCell({ count, uniqueCount }: { count: number; uniqueCount: number }) {
  return (
    <TableCell className="text-right tabular-nums">
      <span className="font-medium">{count}</span>
      <span className="ml-1 text-xs text-zinc-400">/ {uniqueCount}</span>
    </TableCell>
  )
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('sr-Latn-RS', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Belgrade',
  })
}

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading>Statistike</Heading>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
        >
          {DAY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : !stats ? (
        <p className="text-sm text-zinc-500">Nema podataka.</p>
      ) : (
        <>
          {/* Top events, races & views per day */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            <section>
              <Subheading>Top događaji</Subheading>
              {stats.topEvents.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">Nema podataka.</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <Table striped>
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
                              <Link href={`/events/${e.slug}`} className="hover:underline">{e.name}</Link>
                            ) : e.name}
                          </TableCell>
                          <CountCell count={e.count} uniqueCount={e.uniqueCount} />
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            <section>
              <Subheading>Top trke</Subheading>
              {stats.topRaces.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">Nema podataka.</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <Table striped>
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
                              <Link href={`/races/${r.slug}`} className="hover:underline">{r.name}</Link>
                            ) : r.name}
                          </TableCell>
                          <CountCell count={r.count} uniqueCount={r.uniqueCount} />
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            <section>
              <Subheading>Pregledi po danu</Subheading>
              {stats.viewsPerDay.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">Nema pregleda.</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <Table striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Datum</TableHeader>
                        <TableHeader className="text-right">Ukupno / Uniq.</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...stats.viewsPerDay].reverse().map((d) => (
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

          </div>

          {/* Searches, favorites & active users */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            <section>
              <Subheading>Top pretrage</Subheading>
              {stats.topSearches.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">Nema pretraga.</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <Table striped>
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

            <section>
              <Subheading>Top omiljene (sve vreme)</Subheading>
              {stats.topFavorites.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">Nema omiljenih.</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <Table striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Trka</TableHeader>
                        <TableHeader className="text-right">♥</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topFavorites.map((f) => (
                        <TableRow key={f.entityId}>
                          <TableCell className="max-w-[180px] truncate">
                            {f.slug ? (
                              <Link href={`/races/${f.slug}`} className="hover:underline">{f.name}</Link>
                            ) : f.name}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{f.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            {stats.topUsers.length > 0 && (
              <section>
                <Subheading>Najaktivniji korisnici</Subheading>
                <div className="mt-2 overflow-x-auto">
                  <Table striped>
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
                            {u.name && <span className="ml-1 text-xs text-zinc-400">{u.email}</span>}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{u.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

          </div>

          {/* Today's logins */}
          {stats.recentLogins.length > 0 && (
            <section>
              <Subheading>Ko se logovao danas</Subheading>
              <div className="mt-2 overflow-x-auto">
                <Table striped>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Korisnik</TableHeader>
                      <TableHeader className="text-right">Prijava u</TableHeader>
                      <TableHeader className="text-right">Puta</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.recentLogins.map((l) => (
                      <TableRow key={l.email}>
                        <TableCell>
                          <span className="font-medium">{l.name ?? l.email}</span>
                          {l.name && <span className="ml-1 text-xs text-zinc-400">{l.email}</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{formatTime(l.lastLogin)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{l.loginCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
