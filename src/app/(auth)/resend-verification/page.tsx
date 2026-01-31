'use client'

import { Logo } from '@/app/logo'
import { Button } from '@/components/button'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Strong, Text, TextLink } from '@/components/text'
import { useState } from 'react'

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql'

export default function ResendVerification() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation ResendVerificationEmail($input: ResendVerificationInput!) {
              resendVerificationEmail(input: $input) {
                success
                message
              }
            }
          `,
          variables: { input: { email: email.trim() } },
        }),
      })

      const json = await res.json()

      if (json.errors?.length) {
        throw new Error(json.errors[0].message)
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
        <Heading>Check your email</Heading>
        <Text>
          If an account exists for <Strong>{email}</Strong> and is not yet verified, we&apos;ve sent a new verification
          link.
        </Text>
        <Text className="text-sm text-zinc-500">
          Didn&apos;t receive the email? Check your spam folder or{' '}
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="font-semibold text-zinc-950 hover:underline dark:text-white"
          >
            try again
          </button>
        </Text>
        <Text>
          <TextLink href="/login">
            <Strong>Back to login</Strong>
          </TextLink>
        </Text>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
      <div>
        <Heading>Resend verification email</Heading>
        <Text className="mt-2">Enter your email address and we&apos;ll send a new verification link.</Text>
      </div>

      {error && <Text className="text-red-600 dark:text-red-500">{error}</Text>}

      <Field>
        <Label>Email</Label>
        <Input
          type="email"
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError(null)
          }}
          autoComplete="email"
          required
          disabled={loading}
        />
      </Field>

      <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
        {loading ? 'Sending...' : 'Send verification link'}
      </Button>

      <Text>
        Already verified?{' '}
        <TextLink href="/login">
          <Strong>Sign in</Strong>
        </TextLink>
      </Text>
    </form>
  )
}
