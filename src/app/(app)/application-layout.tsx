'use client'

import { WebsiteLayout } from '@/components/website-layout'

export function ApplicationLayout({
  children,
}: {
  events?: any[]
  children: React.ReactNode
}) {
  return <WebsiteLayout>{children}</WebsiteLayout>
}
