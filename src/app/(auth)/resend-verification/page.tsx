'use client'

import { AuthLogo } from '@/components/auth-logo'
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
      setError(err?.message ?? 'Došlo je do greške')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="grid w-full max-w-sm grid-cols-1 gap-8">
        <AuthLogo />
        <Heading>Proveri svoju email poštu</Heading>
        <Text>
          Ako postoji nalog za <Strong>{email}</Strong> koji još nije verifikovan, poslali smo novi verifikacioni
          link.
        </Text>
        <Text className="text-sm text-text-muted">
          Niste primili email? Proverite spam folder ili{' '}
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="font-semibold text-text-primary hover:underline"
          >
            pokušajte ponovo
          </button>
        </Text>
        <Text>
          <TextLink href="/login">
            <Strong>Nazad na prijavu</Strong>
          </TextLink>
        </Text>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <AuthLogo />
      <div>
        <Heading>Pošalji ponovo verifikacioni email</Heading>
        <Text className="mt-2">Unesi svoju email adresu i poslaćemo ti novi verifikacioni link.</Text>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-5 w-5 shrink-0 text-red-400">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          <Text className="text-red-300">{error}</Text>
        </div>
      )}

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
        {loading ? 'Slanje…' : 'Pošalji verifikacioni link'}
      </Button>

      <Text>
        Već ste verifikovani?{' '}
        <TextLink href="/login">
          <Strong>Prijavi se</Strong>
        </TextLink>
      </Text>
    </form>
  )
}
