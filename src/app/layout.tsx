import '@/styles/tailwind.css'
import { GoogleTagManager, GoogleTagManagerNoScript } from '@/components/google-tag-manager'
import type { Metadata } from 'next'
import type React from 'react'
import Providers from './providers'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trkesrbija.rs'

export const metadata: Metadata = {
  title: {
    template: '%s - Trke Srbija',
    default: 'Trke Srbija - Trail i ulične trke u Srbiji',
  },
  description:
    'Pronađite i prijavite se za trail i ulične trke širom Srbije. Pratite rezultate, otkrijte nove izazove i pridružite se trkačkoj zajednici.',
  keywords: ['trke', 'trail', 'running', 'srbija', 'trcanje', 'maraton', 'ultramaraton', 'ulicna'],
  authors: [{ name: 'Trke Srbija' }],
  creator: 'Trke Srbija',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'sr_RS',
    url: siteUrl,
    siteName: 'Trke Srbija',
    title: 'Trke Srbija - Trail i ulične trke u Srbiji',
    description:
      'Pronađite i prijavite se za trail i ulične trke širom Srbije. Pratite rezultate i pridružite se trkačkoj zajednici.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trke Srbija - Trail i ulične trke u Srbiji',
    description:
      'Pronađite i prijavite se za trail i ulične trke širom Srbije. Pratite rezultate i pridružite se trkačkoj zajednici.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="sr"
      className="text-zinc-950 antialiased lg:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:lg:bg-zinc-950"
    >
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <GoogleTagManager />
      </head>
      <body>
        <GoogleTagManagerNoScript />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
