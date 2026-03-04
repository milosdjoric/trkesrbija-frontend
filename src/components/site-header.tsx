'use client'

import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  Cog8ToothIcon,
  LightBulbIcon,
  MapIcon,
  ClockIcon,
  MoonIcon,
  SunIcon,
  WrenchScrewdriverIcon,
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
]

const userLinks = [
  { href: '/favorites', label: 'Omiljene trke' },
  { href: '/my-registrations', label: 'Moje prijave' },
  { href: '/training', label: 'Moji treninzi' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const { user, isLoading: authLoading, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <header className="sticky top-0 z-50 border-b border-border-primary bg-main/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-baseline">
          <span className="text-xl font-extrabold tracking-tight text-brand-green">trke</span>
          <span className="text-xl font-light tracking-tight text-text-secondary">srbija</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {publicLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-text-primary font-semibold' : 'text-text-primary/70 hover:text-text-primary'
                }`}
              >
                {link.label}
              </Link>
            )
          })}

          {user && (
            <>
              <div className="mx-1 h-4 w-px bg-border-secondary" />
              {userLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'text-brand-green font-semibold' : 'text-brand-green/70 hover:text-brand-green'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* User / Auth */}
        <div className="flex items-center gap-1">
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
          {authLoading ? (
            <div className="h-5 w-24 animate-pulse rounded bg-surface" />
          ) : user ? (
            <Dropdown>
              <DropdownButton as="button" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface">
                <span className="max-w-[150px] truncate">{user.name ?? user.email}</span>
                <ChevronDownIcon className="size-4 text-text-secondary" />
              </DropdownButton>
              <DropdownMenu anchor="bottom end" className="min-w-56">
                {/* Quick links visible only on mobile (desktop has nav bar) */}
                <div className="lg:hidden">
                  <DropdownItem href="/events">
                    <DropdownLabel>Događaji</DropdownLabel>
                  </DropdownItem>
                  <DropdownItem href="/calendar">
                    <DropdownLabel>Kalendar</DropdownLabel>
                  </DropdownItem>
                  <DropdownItem href="/gpx-analyzer">
                    <MapIcon />
                    <DropdownLabel>GPX Analyzer</DropdownLabel>
                  </DropdownItem>
                  <DropdownDivider />
                </div>

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

                {user.role === 'ADMIN' && (
                  <DropdownItem href="/admin">
                    <WrenchScrewdriverIcon />
                    <DropdownLabel>Admin Panel</DropdownLabel>
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
            <Link
              href="/login"
              className="rounded-lg bg-brand-green px-4 py-1.5 text-sm font-bold text-black transition-colors hover:bg-brand-green-dark"
            >
              Prijavi se
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
