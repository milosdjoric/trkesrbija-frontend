'use client'

import { useAuth } from '@/app/auth/auth-context'
import { Heading } from '@/components/heading'

export function UserGreeting() {
  const { user, isLoading } = useAuth()

  // If the user does not yet have a name, fall back to email prefix
  if (isLoading || !user) {
    return <Heading>Good afternoon</Heading>
  }

  const displayName = user.name && user.name.trim().length > 0 ? user.name : user.email.split('@')[0]

  return <Heading>Good afternoon, {displayName}</Heading>
}
