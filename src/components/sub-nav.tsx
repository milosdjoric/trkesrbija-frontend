'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/app/auth/auth-context'

const adminTabs = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/events', label: 'Događaji' },
  { href: '/admin/races', label: 'Trke' },
  { href: '/admin/users', label: 'Korisnici' },
  { href: '/admin/stats', label: 'Statistike' },
  { href: '/admin/reports', label: 'Prijave' },
  { href: '/admin/import', label: 'Import' },
  { href: '/admin/trainings', label: 'Treninzi' },
]

export function SubNav() {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  if (isLoading || !user || user.role !== 'ADMIN' || !pathname.startsWith('/admin')) return null

  return (
    <nav className="border-b border-zinc-950/5 bg-white dark:border-white/5 dark:bg-zinc-900">
      <div className="mx-auto max-w-6xl px-4">
        <div className="-mb-px flex justify-center gap-1 overflow-x-auto">
          {adminTabs.map((tab) => {
            const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={clsx(
                  'shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-zinc-950 text-zinc-950 dark:border-white dark:text-white'
                    : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300'
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
