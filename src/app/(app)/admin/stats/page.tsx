'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Heading, Subheading } from '@/components/heading'
import { LoadingState } from '@/components/loading-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

type EntityStat = { entityId: string; name: string; slug: string | null; count: number }
type SearchStat = { query: string; count: number }
type DayStat = { date: string; count: number }

type AnalyticsStats = {
  topEvents: EntityStat[]
  topRaces: EntityStat[]
  topSearches: SearchStat[]
  topFavorites: EntityStat[]
  viewsPerDay: DayStat[]
}

const ANALYTICS_QUERY = `
  query AnalyticsStats($days: Int) {
    analyticsStats(days: $days) {
      topEvents { entityId name slug count }
      topRaces  { entityId name slug count }
      topSearches { query count }
      topFavorites { entityId name slug count }
      viewsPerDay { date count }
    }
  }
`

const DAY_OPTIONS = [
  { label: 'Poslednjih 7 dana', value: 7 },
  { label: 'Poslednjih 30 dana', value: 30 },
  { label: 'Poslednjih 90 dana', value: 90 },
]

export default function AdminStatsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
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
      const data = await gql<{ analyticsStats: AnalyticsStats }>(ANALYTICS_QUERY, { days })
      setStats(data.analyticsStats)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchStats()
  }, [user, fetchStats])

  if (isLoading || !user) return <LoadingState />

  return (
    <div className="space-y-10">
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
          {/* Views per day */}
          <section>
            <Subheading>Pregledi po danu</Subheading>
            {stats.viewsPerDay.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">Nema pregleda u izabranom periodu.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <Table striped>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Datum</TableHeader>
                      <TableHeader className="text-right">Pregledi</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...stats.viewsPerDay].reverse().map((d) => (
                      <TableRow key={d.date}>
                        <TableCell>{d.date}</TableCell>
                        <TableCell className="text-right font-medium">{d.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {/* Top events & races */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <section>
              <Subheading>Top događaji po pregledima</Subheading>
              {stats.topEvents.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">Nema podataka.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <Table striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>#</TableHeader>
                        <TableHeader>Događaj</TableHeader>
                        <TableHeader className="text-right">Pregledi</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topEvents.map((e, i) => (
                        <TableRow key={e.entityId}>
                          <TableCell className="text-zinc-400">{i + 1}</TableCell>
                          <TableCell>
                            {e.slug ? (
                              <Link href={`/events/${e.slug}`} className="hover:underline">
                                {e.name}
                              </Link>
                            ) : (
                              e.name
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{e.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            <section>
              <Subheading>Top trke po pregledima</Subheading>
              {stats.topRaces.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">Nema podataka.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <Table striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>#</TableHeader>
                        <TableHeader>Trka</TableHeader>
                        <TableHeader className="text-right">Pregledi</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topRaces.map((r, i) => (
                        <TableRow key={r.entityId}>
                          <TableCell className="text-zinc-400">{i + 1}</TableCell>
                          <TableCell>
                            {r.slug ? (
                              <Link href={`/races/${r.slug}`} className="hover:underline">
                                {r.name}
                              </Link>
                            ) : (
                              r.name
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{r.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>

          {/* Top searches & favorites */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <section>
              <Subheading>Top pretrage</Subheading>
              {stats.topSearches.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">Nema pretraga u izabranom periodu.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <Table striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>#</TableHeader>
                        <TableHeader>Pretraga</TableHeader>
                        <TableHeader className="text-right">Puta</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topSearches.map((s, i) => (
                        <TableRow key={s.query}>
                          <TableCell className="text-zinc-400">{i + 1}</TableCell>
                          <TableCell className="font-mono text-sm">&ldquo;{s.query}&rdquo;</TableCell>
                          <TableCell className="text-right font-medium">{s.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            <section>
              <Subheading>Top omiljene trke (sve vreme)</Subheading>
              {stats.topFavorites.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">Nema omiljenih.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <Table striped>
                    <TableHead>
                      <TableRow>
                        <TableHeader>#</TableHeader>
                        <TableHeader>Trka</TableHeader>
                        <TableHeader className="text-right">♥</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topFavorites.map((f, i) => (
                        <TableRow key={f.entityId}>
                          <TableCell className="text-zinc-400">{i + 1}</TableCell>
                          <TableCell>
                            {f.slug ? (
                              <Link href={`/races/${f.slug}`} className="hover:underline">
                                {f.name}
                              </Link>
                            ) : (
                              f.name
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{f.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
