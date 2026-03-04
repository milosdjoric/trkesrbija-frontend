'use client'

import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/16/solid'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const MESSAGES: Record<string, string> = {
  'not-found': 'Stranica koju ste tražili nije pronađena. Pogledajte sve dostupne događaje.',
}

export function InfoBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const info = searchParams.get('info')
  const [dismissed, setDismissed] = useState(false)

  if (!info || !MESSAGES[info] || dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    // Remove ?info param from URL without reload
    const params = new URLSearchParams(searchParams.toString())
    params.delete('info')
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false })
  }

  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-dark-border bg-dark-surface px-4 py-3 text-sm text-gray-300">
      <InformationCircleIcon className="size-5 shrink-0 text-brand-green" />
      <span className="flex-1">{MESSAGES[info]}</span>
      <button
        onClick={handleDismiss}
        className="shrink-0 cursor-pointer rounded p-1 hover:bg-dark-surface-hover"
        aria-label="Zatvori"
      >
        <XMarkIcon className="size-4" />
      </button>
    </div>
  )
}
