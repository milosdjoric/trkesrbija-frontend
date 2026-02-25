'use client'

import { RouteError } from '@/components/route-error'

export default function JudgeError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Greška u sudijskom interfejsu"
      description="Nije moguće učitati interfejs za merenje vremena. Proverite internet konekciju i pokušajte ponovo."
    />
  )
}
