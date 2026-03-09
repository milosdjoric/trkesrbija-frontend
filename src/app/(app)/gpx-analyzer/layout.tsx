import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GPX Analyzer',
  description:
    'Analizirajte GPX fajlove vaših trka — pregledajte nadmorsku visinu, udaljenost, tempo i rutu na interaktivnoj mapi.',
  alternates: {
    canonical: '/gpx-analyzer',
  },
  openGraph: {
    title: 'GPX Analyzer - Trke Srbija',
    description: 'Analizirajte GPX fajlove vaših trka — nadmorska visina, udaljenost, tempo i ruta na mapi.',
  },
}

export default function GpxAnalyzerLayout({ children }: { children: React.ReactNode }) {
  return children
}
