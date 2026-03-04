'use client'

import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  Cog8ToothIcon,
  LightBulbIcon,
  MapIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/16/solid'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

  return (
    <header className="sticky top-0 z-50 border-b border-dark-border bg-dark-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-baseline">
          <span className="text-xl font-extrabold tracking-tight text-brand-green">trke</span>
          <span className="text-xl font-light tracking-tight text-gray-400">srbija</span>
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
                  isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            )
          })}

          {user && (
            <>
              <div className="mx-1 h-4 w-px bg-dark-border-light" />
              {userLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'text-brand-green' : 'text-brand-green/50 hover:text-brand-green'
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
        <div className="flex items-center">
          {authLoading ? (
            <div className="h-5 w-24 animate-pulse rounded bg-dark-surface" />
          ) : user ? (
            <Dropdown>
              <DropdownButton as="button" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-dark-surface">
                <span className="max-w-[150px] truncate">{user.name ?? user.email}</span>
                <ChevronDownIcon className="size-4 text-gray-400" />
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
