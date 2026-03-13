import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline',
}

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-main p-6 text-center">
      <div className="max-w-sm">
        <div className="mb-6 text-6xl">📡</div>
        <h1 className="text-2xl font-bold text-text-primary">Nema internet konekcije</h1>
        <p className="mt-3 text-text-secondary">Ova stranica nije dostupna offline. Sudijska tabla radi i bez interneta.</p>
        <a
          href="/judge"
          className="mt-6 inline-block rounded-lg bg-brand-green px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-brand-green-dark"
        >
          Otvori sudijsku tablu
        </a>
      </div>
    </div>
  )
}
