'use client'

import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  Cog8ToothIcon,
  LightBulbIcon,

  ClockIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/16/solid'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/app/auth/auth-context'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '@/components/dropdown'

const publicLinks = [
  { href: '/events', label: 'Događaji' },
  { href: '/calendar', label: 'Kalendar' },
  { href: '/gpx-analyzer', label: 'GPX Analyzer' },
  { href: '/guide', label: 'Dokumentacija' },
]

const userLinks = [
  { href: '/favorites', label: 'Omiljene trke' },
  { href: '/my-registrations', label: 'Moje prijave' },
  { href: '/training', label: 'Moji treninzi' },
]

const adminLinks = [
  { href: '/admin/stats', label: 'Statistike', exact: true },
  { href: '/admin/events', label: 'Događaji' },
  { href: '/admin/races', label: 'Trke' },
  { href: '/admin/trainings', label: 'Treninzi' },
  { href: '/admin/users', label: 'Korisnici' },
  { href: '/admin/reports', label: 'Prijave grešaka' },
  { href: '/admin/ads', label: 'Oglasi' },
  { href: '/admin/import', label: 'Import' },
  { href: '/admin/instagram', label: 'Instagram' },
  { href: '/admin/leagues', label: 'Lige' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { user, isLoading: authLoading, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isAdmin = user?.role === 'ADMIN'

  return (
    <header className="sticky top-0 z-50 border-b border-border-primary bg-main/95 backdrop-blur-md">
      {/* Red 1: Logo + javni linkovi + Dokumentacija + user dropdown */}
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-baseline">
          <span className="text-xl font-extrabold tracking-tight text-brand-green">trke</span>
          <span className="text-xl font-light tracking-tight text-text-secondary">srbija</span>
        </Link>

        {/* Desktop nav — javni linkovi */}
        <nav className="hidden items-center gap-1 lg:flex">
          {publicLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-text-primary' : 'text-text-primary hover:text-brand-green'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* User / Auth */}
        <div className="flex items-center gap-1">
          {authLoading ? (
            <div className="h-5 w-24 animate-pulse rounded bg-surface" />
          ) : user ? (
            <Dropdown>
              <DropdownButton as="button" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface">
                <span className="max-w-[150px] truncate">{user.name ?? user.email}</span>
                <ChevronDownIcon className="size-4 text-text-secondary" />
              </DropdownButton>
              <DropdownMenu anchor="bottom end" className="min-w-56">
                <DropdownItem href="/settings">
                  <Cog8ToothIcon />
                  <DropdownLabel>Podešavanja</DropdownLabel>
                </DropdownItem>

                {user.assignedCheckpointId && (
                  <DropdownItem href="/judge">
                    <ClockIcon />
                    <DropdownLabel>Sudijska tabla</DropdownLabel>
                  </DropdownItem>
                )}

                {mounted && (
                  <DropdownItem
                    href="#"
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault()
                      setTheme(theme === 'dark' ? 'light' : 'dark')
                    }}
                  >
                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    <DropdownLabel>{theme === 'dark' ? 'Svetla tema' : 'Tamna tema'}</DropdownLabel>
                  </DropdownItem>
                )}

                <DropdownDivider />

                <DropdownItem href="https://tally.so/r/Y547W6">
                  <LightBulbIcon />
                  <DropdownLabel>Pošalji povratne informacije</DropdownLabel>
                </DropdownItem>

                <DropdownItem
                  href="#"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    logout()
                  }}
                >
                  <ArrowRightStartOnRectangleIcon />
                  <DropdownLabel>Odjavi se</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <>
              {mounted && (
                <button
                  type="button"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="rounded-lg p-2 text-text-secondary transition-colors hover:text-text-primary"
                  title={theme === 'dark' ? 'Svetla tema' : 'Tamna tema'}
                >
                  {theme === 'dark' ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
                </button>
              )}
              <Link
                href="/login"
                className="rounded-lg bg-brand-green px-4 py-1.5 text-sm font-bold text-black transition-colors hover:bg-brand-green-dark"
              >
                Prijavi se
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Red 2: User linkovi (samo za ulogovane) */}
      {user && (
        <div className="hidden border-t border-border-primary lg:block">
          <nav className="mx-auto flex max-w-4xl items-center justify-center gap-1 px-6 py-1.5">
            {userLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'text-brand-green font-semibold' : 'text-brand-green hover:text-brand-green-dark'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {/* Red 3: Admin linkovi (samo za admine) */}
      {isAdmin && (
        <div className="hidden border-t border-border-primary lg:block">
          <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-1 px-6 py-1.5">
            {adminLinks.map((link) => {
              const isActive = link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
