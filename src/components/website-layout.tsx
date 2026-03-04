'use client'

import { SubNav } from '@/components/sub-nav'
import { BottomTabBar } from '@/components/bottom-tab-bar'
import { EmailVerificationBanner } from '@/components/email-verification-banner'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

export function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-dark-bg">
      <SiteHeader />
      <SubNav />
      <EmailVerificationBanner />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6 lg:py-8">{children}</div>
      </main>
      <SiteFooter />
      <BottomTabBar />
      {/* Spacer for bottom tab bar on mobile */}
      <div className="h-16 lg:hidden" />
    </div>
  )
}
