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
    <nav className="bg-dark-bg">
      <div className="mx-auto flex max-w-4xl justify-center px-4 py-2">
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-dark-surface p-1">
          {adminTabs.map((tab) => {
            const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={clsx(
                  'shrink-0 rounded-lg px-5 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
                  isActive ? 'bg-dark-border-light text-white' : 'text-gray-500 hover:text-gray-300'
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
