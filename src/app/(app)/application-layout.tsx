'use client'

import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '@/components/dropdown'
import { Navbar, NavbarSection, NavbarSpacer } from '@/components/navbar'
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from '@/components/sidebar'
import { SidebarLayout } from '@/components/sidebar-layout'
import {
  ArrowRightStartOnRectangleIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog8ToothIcon,
  HeartIcon,
  LightBulbIcon,
  MapIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
} from '@heroicons/react/16/solid'
import { QuestionMarkCircleIcon, SparklesIcon, Square2StackIcon } from '@heroicons/react/20/solid'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/app/auth/auth-context'
import { EmailVerificationBanner } from '@/components/email-verification-banner'

function AccountDropdownMenu({ anchor }: { anchor: 'top start' | 'bottom end' }) {
  const { user, logout } = useAuth()
  const isLoggedIn = !!user

  return (
    <DropdownMenu className="min-w-64" anchor={anchor}>
      {isLoggedIn ? (
        <>
          <DropdownItem href="/settings">
            <Cog8ToothIcon />
            <DropdownLabel>Podešavanja</DropdownLabel>
          </DropdownItem>
          <DropdownItem href="https://tally.so/r/Y547W6">
            <LightBulbIcon />
            <DropdownLabel>Pošalji povratne informacije</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem
            href="#"
            onClick={(e) => {
              e.preventDefault()
              logout()
            }}
          >
            <ArrowRightStartOnRectangleIcon />
            <DropdownLabel>Odjavi se</DropdownLabel>
          </DropdownItem>
        </>
      ) : (
        <>
          <DropdownItem href="https://tally.so/r/Y547W6">
            <LightBulbIcon />
            <DropdownLabel>Pošalji povratne informacije</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem href="/login">
            <ArrowRightStartOnRectangleIcon />
            <DropdownLabel>Prijavi se</DropdownLabel>
          </DropdownItem>
        </>
      )}
    </DropdownMenu>
  )
}

export function ApplicationLayout({
  events,
  children,
}: {
  // NOTE: `events` are now provided by the server/layout using the backend fetcher.
  // Shape expected (minimum): { id, eventName|name, slug?, url?, races?: Array<{ id, raceName|name, url? }> }
  events: any[]
  children: React.ReactNode
}) {
  let pathname = usePathname()
  const { user, isLoading: authLoading } = useAuth()
  const isAdmin = !authLoading && user?.role === 'ADMIN'

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            {authLoading ? (
              <div className="h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            ) : user ? (
              <Dropdown>
                <DropdownButton as={SidebarItem}>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="min-w-0">
                      <span className="font-sm block truncate text-sm/5 text-zinc-950 dark:text-white">
                        {user.name ?? user.email}
                      </span>
                    </span>
                  </span>
                  <ChevronDownIcon />
                </DropdownButton>
                <AccountDropdownMenu anchor="top start" />
              </Dropdown>
            ) : (
              <SidebarItem href="/login">
                <ArrowRightStartOnRectangleIcon />
                <SidebarLabel>Prijavi se</SidebarLabel>
              </SidebarItem>
            )}
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <SidebarItem href="/" current={pathname === '/'}>
              <SidebarLabel>🏃‍➡️ Trke Srbija</SidebarLabel>
            </SidebarItem>
          </SidebarHeader>

          <SidebarBody>
            <div className={isAdmin ? 'opacity-40' : undefined}>
              {/* Opšte - svi vide */}
              <SidebarSection>
                <SidebarHeading>Opšte</SidebarHeading>
                <SidebarItem href="/events" current={pathname === '/events' || pathname.startsWith('/events/')}>
                  <Square2StackIcon />
                  <SidebarLabel>Svi događaji</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="/calendar" current={pathname === '/calendar'}>
                  <CalendarIcon />
                  <SidebarLabel>Kalendar</SidebarLabel>
                </SidebarItem>
              </SidebarSection>

              {/* Moji linkovi - prijavljeni korisnici */}
              <SidebarSection className="mt-8">
                <SidebarHeading>Moji linkovi</SidebarHeading>
                {authLoading ? (
                  <>
                    <div className="flex items-center gap-3 px-2 py-1">
                      <div className="h-4 w-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                      <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                    <div className="flex items-center gap-3 px-2 py-1">
                      <div className="h-4 w-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                      <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                    <div className="flex items-center gap-3 px-2 py-1">
                      <div className="h-4 w-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                      <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                  </>
                ) : user ? (
                  <>
                    <SidebarItem href="/favorites" current={pathname.startsWith('/favorites')}>
                      <HeartIcon />
                      <SidebarLabel>Omiljene trke</SidebarLabel>
                    </SidebarItem>
                    <SidebarItem href="/my-registrations" current={pathname.startsWith('/my-registrations')}>
                      <ClipboardDocumentListIcon />
                      <SidebarLabel>Prijave na trke</SidebarLabel>
                    </SidebarItem>
                    <SidebarItem href="/training" current={pathname.startsWith('/training')}>
                      <MapIcon />
                      <SidebarLabel>Treninzi</SidebarLabel>
                    </SidebarItem>
                  </>
                ) : (
                  <>
                    <SidebarItem href="/login">
                      <HeartIcon />
                      <SidebarLabel className="text-zinc-400">Omiljene trke</SidebarLabel>
                      <span className="text-xs text-zinc-500">(potrebna prijava)</span>
                    </SidebarItem>
                    <SidebarItem href="/login">
                      <ClipboardDocumentListIcon />
                      <SidebarLabel className="text-zinc-400">Prijave na trke</SidebarLabel>
                      <span className="text-xs text-zinc-500">(potrebna prijava)</span>
                    </SidebarItem>
                    <SidebarItem href="/login">
                      <MapIcon />
                      <SidebarLabel className="text-zinc-400">Treninzi</SidebarLabel>
                      <span className="text-xs text-zinc-500">(potrebna prijava)</span>
                    </SidebarItem>
                  </>
                )}
              </SidebarSection>

              {/* Alati */}
              <SidebarSection className="mt-8">
                <SidebarHeading>Alati</SidebarHeading>
                <SidebarItem href="/gpx-analyzer" current={pathname === '/gpx-analyzer'}>
                  <MapIcon />
                  <SidebarLabel>GPX Analyzer</SidebarLabel>
                </SidebarItem>
              </SidebarSection>

              {/* Sudija - samo korisnici sa dodeljenim checkpoint-om */}
              {!authLoading && user?.assignedCheckpointId && (
                <SidebarSection className="mt-8">
                  <SidebarHeading>Sudija</SidebarHeading>
                  <SidebarItem href="/judge" current={pathname.startsWith('/judge')}>
                    <ClockIcon />
                    <SidebarLabel>Sudijska tabla</SidebarLabel>
                  </SidebarItem>
                </SidebarSection>
              )}
            </div>

            {/* Admin - samo admin */}
            {!authLoading && user?.role === 'ADMIN' && (
              <SidebarSection className="mt-8">
                <SidebarHeading>Admin</SidebarHeading>
                <SidebarItem href="/admin" current={pathname === '/admin'}>
                  <WrenchScrewdriverIcon />
                  <SidebarLabel>Admin Panel</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="/admin/stats" current={pathname === '/admin/stats'}>
                  <ChartBarIcon />
                  <SidebarLabel>Statistike</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
            )}

            <SidebarSection className="hidden max-lg:hidden">
              <SidebarHeading>Predstojeći događaji</SidebarHeading>
              {events.map((event: any) => {
                const eventLabel = (event?.eventName ?? event?.name ?? '').toString()
                const eventUrl = (
                  event?.url ?? (event?.slug ? `/events#${event.slug}` : `/events#${event.id}`)
                ).toString()

                return (
                  <div key={event.id}>
                    <SidebarItem href={eventUrl}>{eventLabel}</SidebarItem>

                    {Array.isArray(event.races) && event.races.length > 0 && (
                      <div className="pl-6">
                        {event.races.map((race: any) => {
                          const raceLabel = (race?.raceName ?? race?.name ?? '').toString()
                          const raceUrl = race?.url
                            ? race.url
                            : event?.slug
                              ? `/events#${event.slug}`
                              : `/events#${event.id}`

                          return race?.url ? (
                            <SidebarItem key={race.id} href={raceUrl}>
                              {raceLabel}
                            </SidebarItem>
                          ) : (
                            <SidebarItem key={race.id}>{raceLabel}</SidebarItem>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </SidebarSection>

            <SidebarSpacer />

            <SidebarSection>
              <SidebarItem href="mailto:djoric.inbox@gmail.com?subject=Tkre%20Srbija%20Support%20request">
                <QuestionMarkCircleIcon />
                <SidebarLabel>Podrška putem emaila</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="#" className="hidden">
                <SparklesIcon />
                <SidebarLabel>Dnevnik promena</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>

          <SidebarFooter className="max-lg:hidden">
            {authLoading ? (
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              </div>
            ) : user ? (
              <Dropdown>
                <DropdownButton as={SidebarItem}>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
                        {user.name ?? user.email}
                      </span>
                      <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                        {user.email}
                      </span>
                    </span>
                  </span>
                  <ChevronUpIcon />
                </DropdownButton>
                <AccountDropdownMenu anchor="top start" />
              </Dropdown>
            ) : (
              <SidebarItem href="/login">
                <ArrowRightStartOnRectangleIcon />
                <SidebarLabel>Prijavi se</SidebarLabel>
              </SidebarItem>
            )}
          </SidebarFooter>
        </Sidebar>
      }
    >
      <EmailVerificationBanner />
      {children}
    </SidebarLayout>
  )
}
