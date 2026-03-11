import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vodič za korišćenje | Trke Srbija',
  description:
    'Korisnički vodič za platformu Trke Srbija — kako pronaći trke, prijaviti se, pratiti rezultate i koristiti sve funkcionalnosti.',
}

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
