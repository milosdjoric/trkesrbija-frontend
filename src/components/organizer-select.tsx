'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { useToast } from '@/components/toast'
import { PlusIcon } from '@heroicons/react/16/solid'
import { useCallback, useEffect, useState } from 'react'

type Organizer = {
  id: string
  name: string
  contactPhone: string | null
  contactEmail: string | null
  organizerSite: string | null
}

const ORGANIZERS_QUERY = `
  query Organizers {
    organizers(limit: 200) {
      id
      name
      contactPhone
      contactEmail
      organizerSite
    }
  }
`

const CREATE_ORGANIZER_MUTATION = `
  mutation CreateOrganizer($input: CreateOrganizerInput!) {
    createOrganizer(input: $input) {
      id
      name
      contactPhone
      contactEmail
      organizerSite
    }
  }
`

interface OrganizerSelectProps {
  /** Currently selected organizer ID */
  value: string | null
  /** Called when organizer changes — returns the organizer ID or null */
  onChange: (organizerId: string | null) => void
}

export function OrganizerSelect({ value, onChange }: OrganizerSelectProps) {
  const { accessToken } = useAuth()
  const { toast } = useToast()

  const [organizers, setOrganizers] = useState<Organizer[]>([])
  const [loadingOrganizers, setLoadingOrganizers] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [creating, setCreating] = useState(false)

  // New organizer form fields
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newSite, setNewSite] = useState('')

  const loadOrganizers = useCallback(async () => {
    if (!accessToken) return
    try {
      const data = await gql<{ organizers: Organizer[] }>(ORGANIZERS_QUERY, {}, { accessToken })
      const sorted = [...(data.organizers ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'sr'))
      setOrganizers(sorted)
    } catch (err) {
      console.error('Failed to load organizers:', err)
    } finally {
      setLoadingOrganizers(false)
    }
  }, [accessToken])

  useEffect(() => {
    loadOrganizers()
  }, [loadOrganizers])

  async function handleCreateOrganizer() {
    if (!newName.trim()) {
      toast('Unesite naziv organizatora', 'error')
      return
    }

    setCreating(true)
    try {
      const data = await gql<{ createOrganizer: Organizer }>(
        CREATE_ORGANIZER_MUTATION,
        {
          input: {
            name: newName.trim(),
            contactPhone: newPhone.trim() || null,
            contactEmail: newEmail.trim() || null,
            organizerSite: newSite.trim() || null,
          },
        },
        { accessToken }
      )

      const created = data.createOrganizer
      // Add to local list and select it
      setOrganizers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'sr')))
      onChange(created.id)

      // Reset form
      setNewName('')
      setNewPhone('')
      setNewEmail('')
      setNewSite('')
      setShowNewForm(false)

      toast('Organizator kreiran', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri kreiranju organizatora', 'error')
    } finally {
      setCreating(false)
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-dark-border bg-dark-surface px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <div>
      {/* Dropdown */}
      <label className="block text-sm font-medium text-gray-300">
        Organizator
      </label>
      <div className="mt-1 flex gap-2">
        <select
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value
            onChange(val || null)
          }}
          disabled={loadingOrganizers}
          className="flex-1 rounded-lg border border-dark-border bg-dark-surface px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">
            {loadingOrganizers ? 'Učitavanje...' : '— Bez organizatora —'}
          </option>
          {organizers.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowNewForm(!showNewForm)}
          className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-dark-border px-3 py-2 text-sm font-medium text-gray-300 hover:bg-dark-surface-hover"
          title="Dodaj novog organizatora"
        >
          <PlusIcon className="size-4" />
          Novi
        </button>
      </div>

      {/* New organizer form */}
      {showNewForm && (
        <div className="mt-4 rounded-lg border border-blue-800 bg-blue-900/20 p-4">
          <p className="mb-3 text-sm font-medium text-gray-300">
            Novi organizator
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400">
                Naziv *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="npr. Trkački klub Avala"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400">
                Telefon
              </label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+381 64 123 4567"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400">
                Email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="info@organizator.rs"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400">
                Sajt
              </label>
              <input
                type="url"
                value={newSite}
                onChange={(e) => setNewSite(e.target.value)}
                placeholder="https://organizator.rs"
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleCreateOrganizer}
              disabled={creating}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Kreiranje...' : 'Kreiraj organizatora'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewForm(false)
                setNewName('')
                setNewPhone('')
                setNewEmail('')
                setNewSite('')
              }}
              className="cursor-pointer rounded-lg border border-dark-border px-4 py-2 text-sm font-medium text-gray-300 hover:bg-dark-surface-hover"
            >
              Otkaži
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
