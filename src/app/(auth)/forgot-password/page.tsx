'use client'

import { AuthLogo } from '@/components/auth-logo'
import { Button } from '@/components/button'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Strong, Text, TextLink } from '@/components/text'
import { useState } from 'react'

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql'

export default function ForgotPassword() {
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
            mutation ForgotPassword($input: ForgotPasswordInput!) {
              forgotPassword(input: $input) {
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
          Ako postoji nalog za <Strong>{email}</Strong>, poslali smo link za resetovanje lozinke.
          Molimo proverite inbox i spam folder.
        </Text>
        <Text className="text-sm text-zinc-500">
          Niste primili email?{' '}
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="font-semibold text-zinc-950 hover:underline dark:text-white"
          >
            Pokušaj ponovo
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
        <Heading>Zaboravljena lozinka?</Heading>
        <Text className="mt-2">
          Unesi svoju email adresu i poslaćemo ti link za resetovanje lozinke.
        </Text>
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
        {loading ? 'Slanje…' : 'Pošalji link za resetovanje'}
      </Button>

      <Text>
        Sećaš se lozinke?{' '}
        <TextLink href="/login">
          <Strong>Prijavi se</Strong>
        </TextLink>
      </Text>
    </form>
  )
}
