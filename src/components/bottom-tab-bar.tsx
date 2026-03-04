'use client'

import * as Headless from '@headlessui/react'
import {
  CalendarIcon,
  HomeIcon,
  Square2StackIcon,
  UserCircleIcon,
  EllipsisHorizontalIcon,
  MapIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  LightBulbIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { useAuth } from '@/app/auth/auth-context'

const tabs = [
  { href: '/', label: 'Početna', icon: HomeIcon, exact: true },
  { href: '/events', label: 'Događaji', icon: Square2StackIcon },
  { href: '/calendar', label: 'Kalendar', icon: CalendarIcon },
]

export function BottomTabBar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)

  const profileHref = user ? '/settings' : '/login'
  const profileLabel = user ? 'Profil' : 'Prijava'

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border-primary bg-main/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-around px-1">
          {tabs.map((tab) => {
            const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={clsx(
                  'relative flex flex-1 flex-col items-center gap-1 py-3 text-[11px] transition-colors',
                  isActive ? 'font-bold text-brand-green' : 'font-medium text-text-muted'
                )}
              >
                <tab.icon className={clsx('size-6', isActive && 'drop-shadow-[0_0_6px_rgba(0,208,132,0.5)]')} />
                {tab.label}
                {isActive && (
                  <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand-green" />
                )}
              </Link>
            )
          })}

          {/* Profile tab */}
          {(() => {
            const isActive = pathname === '/settings' || pathname === '/login'
            return (
              <Link
                href={profileHref}
                className={clsx(
                  'relative flex flex-1 flex-col items-center gap-1 py-3 text-[11px] transition-colors',
                  isActive ? 'font-bold text-brand-green' : 'font-medium text-text-muted'
                )}
              >
                <UserCircleIcon className={clsx('size-6', isActive && 'drop-shadow-[0_0_6px_rgba(0,208,132,0.5)]')} />
                {profileLabel}
                {isActive && (
                  <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand-green" />
                )}
              </Link>
            )
          })()}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen(true)}
            className={clsx(
              'relative flex flex-1 flex-col items-center gap-1 py-3 text-[11px] transition-colors',
              moreOpen ? 'font-bold text-brand-green' : 'font-medium text-text-muted'
            )}
          >
            <EllipsisHorizontalIcon className={clsx('size-6', moreOpen && 'drop-shadow-[0_0_6px_rgba(0,208,132,0.5)]')} />
            Još
            {moreOpen && (
              <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand-green" />
            )}
          </button>
        </div>
      </nav>

      {/* "Još" bottom sheet */}
      <Headless.Dialog open={moreOpen} onClose={() => setMoreOpen(false)} className="relative z-50 lg:hidden">
        <Headless.DialogBackdrop className="fixed inset-0 bg-black/50 transition-opacity data-closed:opacity-0" />
        <div className="fixed inset-x-0 bottom-0">
          <Headless.DialogPanel className="w-full rounded-t-2xl border-t border-border-primary bg-card pb-8">
            {/* Handle bar */}
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-border-secondary" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3">
              <Headless.DialogTitle className="text-base font-semibold text-text-primary">
                Još opcija
              </Headless.DialogTitle>
              <button
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-1.5 text-text-secondary hover:text-text-primary"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>

            <div className="space-y-1 px-3">
              <SheetLink href="/gpx-analyzer" icon={MapIcon} onClick={() => setMoreOpen(false)}>
                GPX Analyzer
              </SheetLink>

              {user && (
                <>
                  <SheetLink href="/favorites" icon={MapIcon} onClick={() => setMoreOpen(false)}>
                    Omiljene trke
                  </SheetLink>
                  <SheetLink href="/my-registrations" icon={ClipboardDocumentListIcon} onClick={() => setMoreOpen(false)}>
                    Moje prijave
                  </SheetLink>
                  <SheetLink href="/training" icon={MapIcon} onClick={() => setMoreOpen(false)}>
                    Moji treninzi
                  </SheetLink>
                </>
              )}

              {user?.assignedCheckpointId && (
                <SheetLink href="/judge" icon={ClockIcon} onClick={() => setMoreOpen(false)}>
                  Sudijska tabla
                </SheetLink>
              )}

              {user?.role === 'ADMIN' && (
                <SheetLink href="/admin" icon={WrenchScrewdriverIcon} onClick={() => setMoreOpen(false)}>
                  Admin Panel
                </SheetLink>
              )}

              <SheetLink href="https://tally.so/r/Y547W6" icon={LightBulbIcon} onClick={() => setMoreOpen(false)}>
                Pošalji povratne informacije
              </SheetLink>
            </div>
          </Headless.DialogPanel>
        </div>
      </Headless.Dialog>
    </>
  )
}

function SheetLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface"
    >
      <Icon className="size-5 text-text-secondary" />
      {children}
    </Link>
  )
}
