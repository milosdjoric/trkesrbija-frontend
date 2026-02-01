'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql, registerForRace, type Gender, type SelfRegistrationInput } from '@/app/lib/api'
import { Button } from '@/components/button'
import { Field, Label, Description } from '@/components/fieldset'
import { Heading, Subheading } from '@/components/heading'
import { Input } from '@/components/input'
import { Radio, RadioField, RadioGroup } from '@/components/radio'
import { Text, TextLink } from '@/components/text'
import { ChevronLeftIcon } from '@heroicons/react/16/solid'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type RaceInfo = {
  id: string
  raceName: string | null
  length: number
  elevation: number | null
  startDateTime: string
  startLocation: string
  raceEvent: {
    id: string
    eventName: string
    slug: string
  }
}

const RACE_QUERY = `
  query Race($raceId: ID!) {
    races(raceEventId: null, limit: 1000) {
      id
      raceName
      length
      elevation
      startDateTime
      startLocation
    }
  }
`

const RACE_WITH_EVENT_QUERY = `
  query RaceEvents {
    raceEvents(limit: 100) {
      id
      eventName
      slug
      races {
        id
        raceName
        length
        elevation
        startDateTime
        startLocation
      }
    }
  }
`

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'TBD'
  return d.toLocaleDateString('sr-RS', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function RaceRegistrationPage() {
  const params = useParams()
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()

  const raceId = params.raceId as string

  const [race, setRace] = useState<RaceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<Gender>('MALE')

  // Load race info
  useEffect(() => {
    async function loadRace() {
      try {
        const data = await gql<{
          raceEvents: Array<{
            id: string
            eventName: string
            slug: string
            races: Array<{
              id: string
              raceName: string | null
              length: number
              elevation: number | null
              startDateTime: string
              startLocation: string
            }>
          }>
        }>(RACE_WITH_EVENT_QUERY)

        // Find the race
        for (const event of data.raceEvents) {
          const foundRace = event.races.find((r) => r.id === raceId)
          if (foundRace) {
            setRace({
              ...foundRace,
              raceEvent: {
                id: event.id,
                eventName: event.eventName,
                slug: event.slug,
              },
            })
            break
          }
        }
      } catch (err) {
        console.error('Failed to load race:', err)
      } finally {
        setLoading(false)
      }
    }

    loadRace()
  }, [raceId])

  // Prefill name from user
  useEffect(() => {
    if (user?.name) {
      const parts = user.name.split(' ')
      if (parts.length >= 2) {
        setFirstName(parts[0])
        setLastName(parts.slice(1).join(' '))
      } else if (parts.length === 1) {
        setFirstName(parts[0])
      }
    }
  }, [user])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/races/${raceId}/register`)
    }
  }, [authLoading, user, router, raceId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim() || !dateOfBirth) {
      setError('Molimo popunite sva obavezna polja')
      return
    }

    setSubmitting(true)

    try {
      const input: SelfRegistrationInput = {
        raceId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        dateOfBirth: new Date(dateOfBirth).toISOString(),
        gender,
      }

      await registerForRace(input, accessToken)
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message ?? 'Prijava nije uspela. Pokušajte ponovo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-zinc-500">Učitavanje...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  if (!race) {
    return (
      <div className="py-12 text-center">
        <Heading>Trka nije pronađena</Heading>
        <Text className="mt-2">Ova trka ne postoji ili je uklonjena.</Text>
        <Link href="/events" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Nazad na događaje
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg py-12">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
          <div className="text-4xl">🎉</div>
          <Heading className="mt-4">Uspešna prijava!</Heading>
          <Text className="mt-2">
            Vaša prijava za trku <strong>{race.raceName ?? race.raceEvent.eventName}</strong> je primljena.
          </Text>
          <Text className="mt-1 text-sm text-zinc-500">
            Status prijave možete pratiti na stranici &ldquo;Moje prijave&rdquo;.
          </Text>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button href="/my-registrations">Moje prijave</Button>
            <Button href={`/events/${race.raceEvent.slug}`} outline>
              Nazad na događaj
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-lg:hidden">
        <Link
          href={`/events/${race.raceEvent.slug}`}
          className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          {race.raceEvent.eventName}
        </Link>
      </div>

      <div className="mx-auto mt-6 max-w-lg">
        <Heading>Prijava za trku</Heading>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <Subheading>{race.raceName ?? race.raceEvent.eventName}</Subheading>
          <div className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <div>
              <strong>Datum:</strong> {formatDate(race.startDateTime)}
            </div>
            <div>
              <strong>Distanca:</strong> {race.length} km
              {race.elevation && ` • ${race.elevation}m D+`}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <Label>Ime *</Label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={submitting}
              />
            </Field>

            <Field>
              <Label>Prezime *</Label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={submitting}
              />
            </Field>
          </div>

          <Field>
            <Label>Email</Label>
            <Input type="email" value={user.email} disabled className="bg-zinc-100 dark:bg-zinc-800" />
            <Description>Email se preuzima iz vašeg naloga</Description>
          </Field>

          <Field>
            <Label>Telefon</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+381 60 123 4567"
              disabled={submitting}
            />
          </Field>

          <Field>
            <Label>Datum rođenja *</Label>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              disabled={submitting}
              max={new Date().toISOString().split('T')[0]}
            />
          </Field>

          <Field>
            <Label>Pol *</Label>
            <RadioGroup value={gender} onChange={(value) => setGender(value as Gender)} className="mt-2">
              <RadioField>
                <Radio value="MALE" disabled={submitting} />
                <Label>Muški</Label>
              </RadioField>
              <RadioField>
                <Radio value="FEMALE" disabled={submitting} />
                <Label>Ženski</Label>
              </RadioField>
            </RadioGroup>
          </Field>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
            {submitting ? (
              <Button type="button" outline disabled>
                Odustani
              </Button>
            ) : (
              <Button href={`/events/${race.raceEvent.slug}`} outline>
                Odustani
              </Button>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Prijava u toku...' : 'Prijavi se'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
