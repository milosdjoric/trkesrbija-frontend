'use client'

import { useAuth } from '@/app/auth/auth-context'
import { Logo } from '@/app/logo'
import { Button } from '@/components/button'
import { Checkbox, CheckboxField } from '@/components/checkbox'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { PasswordStrength, validatePassword } from '@/components/password-strength'
import { Strong, Text, TextLink } from '@/components/text'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Register() {
  const router = useRouter()
  const { register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordValidation = validatePassword(password)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Validate password before submit
    if (!passwordValidation.isValid) {
      setError('Please meet all password requirements')
      return
    }

    const emailTrimmed = email.trim()
    const nameTrimmed = name.trim()

    setLoading(true)
    try {
      await register({
        email: emailTrimmed,
        password,
        ...(nameTrimmed ? { name: nameTrimmed } : {}),
      })
      router.push('/')
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <Logo className="h-6 text-zinc-950 dark:text-white forced-colors:text-[CanvasText]" />
      <Heading>Create your account</Heading>

      {error && <Text className="!dark:text-red-500 !text-red-600 capitalize">{error}</Text>}

      <Field>
        <Label>Email</Label>
        <Input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={loading}
        />
      </Field>

      <Field>
        <Label>Full name</Label>
        <Input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          disabled={loading}
        />
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
          disabled={loading}
        />
        <PasswordStrength password={password} className="mt-2" />
      </Field>

      <CheckboxField className="hidden">
        <Checkbox
          name="marketing"
          checked={marketingOptIn}
          onChange={(checked) => setMarketingOptIn(Boolean(checked))}
        />
        <Label>Get emails about product updates and news.</Label>
      </CheckboxField>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !passwordValidation.isValid || !email.trim()}
      >
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
