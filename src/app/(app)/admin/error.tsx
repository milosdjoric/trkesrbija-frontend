'use client'

import { RouteError } from '@/components/route-error'

export default function AdminError({
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
   title="Greška u admin panelu"
   description="Nije moguće učitati ovu stranicu. Pokušajte ponovo ili se obratite administratoru."
  />
 )
}
