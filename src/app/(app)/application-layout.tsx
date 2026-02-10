'use client'

import { Avatar } from '@/components/avatar'
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
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog8ToothIcon,
  HeartIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/16/solid'
import { HomeIcon, QuestionMarkCircleIcon, SparklesIcon, Square2StackIcon, TicketIcon } from '@heroicons/react/20/solid'
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
  const { user } = useAuth()

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            {user ? (
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
              <Avatar src="/teams/catalyst.svg" />
              <SidebarLabel>Trke Srbija</SidebarLabel>
            </SidebarItem>
          </SidebarHeader>

          <SidebarBody>
            {/* Opšte - svi vide */}
            <SidebarSection>
              <SidebarHeading>Opšte</SidebarHeading>
              <SidebarItem href="/events" current={pathname === '/events' || pathname.startsWith('/events/')}>
                <Square2StackIcon />
                <SidebarLabel>Svi događaji</SidebarLabel>
              </SidebarItem>
            </SidebarSection>

            {/* Moji linkovi - prijavljeni korisnici */}
            <SidebarSection>
              <SidebarHeading>Moji linkovi</SidebarHeading>
              {user ? (
                <>
                  <SidebarItem href="/favorites" current={pathname.startsWith('/favorites')}>
                    <HeartIcon />
                    <SidebarLabel>Favoriti</SidebarLabel>
                  </SidebarItem>
                  <SidebarItem href="/my-registrations" current={pathname.startsWith('/my-registrations')}>
                    <ClipboardDocumentListIcon />
                    <SidebarLabel>Prijave na trke</SidebarLabel>
                  </SidebarItem>
                </>
              ) : (
                <>
                  <SidebarItem href="/login">
                    <HeartIcon />
                    <SidebarLabel className="text-zinc-400">Favoriti</SidebarLabel>
                  </SidebarItem>
                  <SidebarItem href="/login">
                    <ClipboardDocumentListIcon />
                    <SidebarLabel className="text-zinc-400">Prijave na trke</SidebarLabel>
                  </SidebarItem>
                  <p className="px-2 text-xs text-zinc-500 dark:text-zinc-500">Potrebna prijava</p>
                </>
              )}
            </SidebarSection>

            {/* Sudija - samo korisnici sa dodeljenim checkpoint-om */}
            {user?.assignedCheckpointId && (
              <SidebarSection>
                <SidebarHeading>Sudija</SidebarHeading>
                <SidebarItem href="/judge" current={pathname.startsWith('/judge')}>
                  <ClockIcon />
                  <SidebarLabel>Sudijska tabla</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
            )}

            {/* Admin - samo admin */}
            {user?.role === 'ADMIN' && (
              <SidebarSection>
                <SidebarHeading>Admin</SidebarHeading>
                <SidebarItem href="/admin" current={pathname === '/admin'}>
                  <WrenchScrewdriverIcon />
                  <SidebarLabel>Admin Panel</SidebarLabel>
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
            {user ? (
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
