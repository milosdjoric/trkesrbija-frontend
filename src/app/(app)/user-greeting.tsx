'use client'

import { useAuth } from '@/app/auth/auth-context'
import { Heading } from '@/components/heading'

export function UserGreeting() {
  const { user, isLoading } = useAuth()

  if (isLoading || !user) {
    return <Heading>Good afternoon</Heading>
  }

  return <Heading>Good afternoon, {user.name}</Heading>
}
