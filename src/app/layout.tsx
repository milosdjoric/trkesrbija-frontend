import '@/styles/tailwind.css'
import { GoogleTagManager, GoogleTagManagerNoScript } from '@/components/google-tag-manager'
import { OrganizationJsonLd, WebsiteJsonLd, SiteNavigationJsonLd } from '@/components/json-ld'
import type { Metadata } from 'next'
import { Urbanist } from 'next/font/google'
import type React from 'react'
import Providers from './providers'

const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trkesrbija.rs'

export const metadata: Metadata = {
  title: {
    template: '%s - Trke Srbija',
    default: 'Trke Srbija - Trail i ulične trke u Srbiji',
  },
  description:
    'Kalendar trail i uličnih trka u Srbiji. Pronađite trke, prijavite se online, pratite rezultate i GPX rute. Maratoni, polumaratoni, ultramaratoni, OCR trke i još mnogo toga.',
  keywords: [
    'trke srbija',
    'trail trke',
    'ulične trke',
    'trcanje srbija',
    'maraton srbija',
    'polumaraton',
    'ultramaraton',
    'OCR trke',
    'kalendar trka',
    'prijava za trke',
    'rezultati trka',
    'GPX rute',
    'planinske trke',
    'beograd maraton',
    'running serbia',
    'trail running',
    'trkačka zajednica',
    'sportski događaji srbija',
  ],
  authors: [{ name: 'Trke Srbija' }],
  creator: 'Trke Srbija',
  publisher: 'Trke Srbija',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'sr_RS',
    url: siteUrl,
    siteName: 'Trke Srbija',
    title: 'Trke Srbija - Kalendar trail i uličnih trka',
    description:
      'Kalendar trail i uličnih trka u Srbiji. Pronađite trke, prijavite se online, pratite rezultate i GPX rute. Maratoni, ultramaratoni, OCR trke.',
    images: [
      {
        url: `${siteUrl}/og-image-v2.png`,
        width: 1200,
        height: 630,
        alt: 'Trke Srbija - Trail i ulične trke',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trke Srbija - Trail i ulične trke u Srbiji',
    description:
      'Kalendar trail i uličnih trka u Srbiji. Pronađite trke, prijavite se online i pratite rezultate.',
    images: [`${siteUrl}/og-image-v2.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Dodaj Google Search Console verification kod kad dobiješ
    // google: 'your-verification-code',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="sr"
      suppressHydrationWarning
      className={`${urbanist.className} bg-main text-text-primary antialiased`}
    >
      <head>
        <GoogleTagManager />
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <SiteNavigationJsonLd />
      </head>
      <body>
        <GoogleTagManagerNoScript />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
