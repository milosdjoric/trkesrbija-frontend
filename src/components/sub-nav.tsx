'use client'

import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/app/auth/auth-context'

const adminTabs = [
  { href: '/admin/stats', label: 'Statistike', exact: true },
  { href: '/admin/events', label: 'Događaji' },
  { href: '/admin/races', label: 'Trke' },
  { href: '/admin/trainings', label: 'Treninzi' },
  { href: '/admin/users', label: 'Korisnici' },
  { href: '/admin/reports', label: 'Prijave grešaka' },
  { href: '/admin/import', label: 'Import' },
  { href: '/admin/instagram', label: 'Instagram' },
]

export function SubNav() {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  if (isLoading || !user || user.role !== 'ADMIN') return null

  return (
    <nav className="border-b border-border-primary">
      <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-1 px-4 py-2">
        {adminTabs.map((tab) => {
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                'rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-border-secondary text-text-primary'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
