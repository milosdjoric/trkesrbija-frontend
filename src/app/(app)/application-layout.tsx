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
  Cog8ToothIcon,
  HeartIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/16/solid'
import { HomeIcon, QuestionMarkCircleIcon, SparklesIcon, Square2StackIcon, TicketIcon } from '@heroicons/react/20/solid'
import { usePathname } from 'next/navigation'

import { useAuth } from '@/app/auth/auth-context'
import { EmailVerificationBanner } from '@/components/email-verification-banner'

function AccountDropdownMenu({ anchor }: { anchor: 'top start' | 'bottom end' }) {
  const { user, logout } = useAuth()
  console.log('user', user)
  const isLoggedIn = !!user

  return (
    <DropdownMenu className="min-w-64" anchor={anchor}>
      {isLoggedIn ? (
        <>
          <DropdownItem href="#" className="hidden">
            <UserCircleIcon />
            <DropdownLabel>Moj nalog</DropdownLabel>
          </DropdownItem>
          <DropdownItem href="#" className="hidden">
            <ShieldCheckIcon />
            <DropdownLabel>Politika privatnosti</DropdownLabel>
          </DropdownItem>
          <DropdownItem href="https://tally.so/r/Y547W6" className="">
            <LightBulbIcon />
            <DropdownLabel>Pošalji povratne informacije</DropdownLabel>
          </DropdownItem>
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
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <Avatar src="/teams/catalyst.svg" />
                <SidebarLabel>Trke Srbija</SidebarLabel>
                <ChevronDownIcon />
              </DropdownButton>
              <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
                <DropdownItem href="/settings">
                  <Cog8ToothIcon />
                  <DropdownLabel>Podešavanja</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </SidebarHeader>

          <SidebarBody>
            <SidebarSection>
              <SidebarItem href="/" current={pathname === '/'} className="hidden">
                <HomeIcon />
                <SidebarLabel>Početna</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/events" current={pathname.startsWith('/events')} className="hidden">
                <Square2StackIcon />
                <SidebarLabel>Svi događaji</SidebarLabel>
              </SidebarItem>
              {user ? (
                <SidebarItem href="/favorites" current={pathname.startsWith('/favorites')}>
                  <HeartIcon />
                  <SidebarLabel>Moji favoriti</SidebarLabel>
                </SidebarItem>
              ) : (
                <SidebarItem href="/login">
                  <HeartIcon />
                  <SidebarLabel className="text-zinc-400">Moji favoriti</SidebarLabel>
                </SidebarItem>
              )}
              {user ? (
                <SidebarItem href="/my-registrations" current={pathname.startsWith('/my-registrations')}>
                  <ClipboardDocumentListIcon />
                  <SidebarLabel>Moje prijave</SidebarLabel>
                </SidebarItem>
              ) : (
                <SidebarItem href="/login">
                  <ClipboardDocumentListIcon />
                  <SidebarLabel className="text-zinc-400">Moje prijave</SidebarLabel>
                </SidebarItem>
              )}
              <SidebarItem className="hidden" href="/orders" current={pathname.startsWith('/orders')}>
                <TicketIcon />
                <SidebarLabel>Narudžbine</SidebarLabel>
              </SidebarItem>
            </SidebarSection>

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
