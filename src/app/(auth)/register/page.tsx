'use client'

import { useAuth } from '@/app/auth/auth-context'
import { Logo } from '@/app/logo'
import { Button } from '@/components/button'
import { Checkbox, CheckboxField } from '@/components/checkbox'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { Strong, Text, TextLink } from '@/components/text'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Register() {
  const router = useRouter()
  const { register, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    try {
      await register({ email, name, password })
      router.push('/')
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
      <Heading>Create your account</Heading>

      {error && <Text className="text-red-600 dark:text-red-500">{error}</Text>}

      <Field>
        <Label>Email</Label>
        <Input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>

      <Field>
        <Label>Full name</Label>
        <Input name="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>

      <Field>
        <Label>Password</Label>
        <Input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </Field>

      <CheckboxField>
        <Checkbox
          name="marketing"
          checked={marketingOptIn}
          onChange={(checked) => setMarketingOptIn(Boolean(checked))}
        />
        <Label>Get emails about product updates and news.</Label>
      </CheckboxField>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating…' : 'Create account'}
      </Button>

      <Text>
        Already have an account?{' '}
        <TextLink href="/login">
          <Strong>Sign in</Strong>
        </TextLink>
      </Text>
    </form>
  )
}
