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

  const navLinks = user ? [...publicLinks, ...userLinks] : publicLinks

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-950/10 bg-white dark:border-white/10 dark:bg-zinc-900">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-base font-semibold text-zinc-950 dark:text-white">
          🏃‍➡️ Trke Srbija
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
                  isActive
                    ? 'text-zinc-950 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            )
          })}

          {user && (
            <>
              <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
              {userLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-white'
                        : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300'
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
            <div className="h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          ) : user ? (
            <Dropdown>
              <DropdownButton as="button" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-950/5 dark:text-white dark:hover:bg-white/5">
                <span className="max-w-[150px] truncate">{user.name ?? user.email}</span>
                <ChevronDownIcon className="size-4 text-zinc-500" />
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
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              <ArrowRightStartOnRectangleIcon className="size-4" />
              <span>Prijavi se</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
