'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Button } from '@/components/button'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { useToast } from '@/components/toast'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type Competition = {
  id: string
  name: string
}

const COMPETITIONS_QUERY = `
  query Competitions {
    competitions {
      id
      name
    }
  }
`

const CREATE_COMPETITION_MUTATION = `
  mutation CreateCompetition($input: CreateCompetitionInput!) {
    createCompetition(input: $input) {
      id
      name
    }
  }
`

const DELETE_COMPETITION_MUTATION = `
  mutation DeleteCompetition($id: ID!) {
    deleteCompetition(id: $id)
  }
`

export default function CompetitionsPage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const loadedRef = useRef(false)

  const loadCompetitions = useCallback(async () => {
    if (!accessToken) return

    try {
      const data = await gql<{ competitions: Competition[] }>(COMPETITIONS_QUERY, {}, { accessToken })
      setCompetitions(data.competitions || [])
    } catch (err) {
      console.error('Failed to load competitions:', err)
      toast('Greška pri učitavanju takmičenja', 'error')
    } finally {
      setLoading(false)
    }
  }, [accessToken, toast])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
      return
    }

    if (accessToken && !loadedRef.current) {
      loadedRef.current = true
      loadCompetitions()
    }
  }, [authLoading, user, accessToken, loadCompetitions, router])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()

    if (!newName.trim()) {
      toast('Unesite naziv takmičenja', 'error')
      return
    }

    setCreating(true)
    try {
      const data = await gql<{ createCompetition: Competition }>(
        CREATE_COMPETITION_MUTATION,
        { input: { name: newName.trim() } },
        { accessToken }
      )

      setCompetitions([...competitions, data.createCompetition])
      setNewName('')
      toast('Takmičenje kreirano!', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri kreiranju', 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Da li ste sigurni da želite da obrišete "${name}"?`)) {
      return
    }

    try {
      await gql(DELETE_COMPETITION_MUTATION, { id }, { accessToken })
      setCompetitions(competitions.filter((c) => c.id !== id))
      toast('Takmičenje obrisano', 'success')
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri brisanju', 'error')
    }
  }

  if (authLoading || loading) {
    return <LoadingState />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4" />
          Admin
        </Link>
      </div>

      <Heading>Takmičenja i serije</Heading>
      <p className="mt-1 text-sm text-zinc-500">
        Upravljajte takmičenjima i serijama trka (npr. Trail Running Liga 2025)
      </p>

      {/* Create new competition */}
      <form onSubmit={handleCreate} className="mt-6 max-w-md">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <Subheading>Novo takmičenje</Subheading>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Naziv takmičenja"
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
            />
            <Button type="submit" color="blue" disabled={creating}>
              <PlusIcon className="size-4" />
              {creating ? 'Kreiranje...' : 'Dodaj'}
            </Button>
          </div>
        </div>
      </form>

      {/* List of competitions */}
      <div className="mt-8">
        <Subheading>Postojeća takmičenja ({competitions.length})</Subheading>

        {competitions.length === 0 ? (
          <div className="mt-4 rounded-lg border border-zinc-200 p-6 text-sm/6 dark:border-zinc-700">
            <div className="font-medium">Nema takmičenja</div>
            <div className="mt-1 text-zinc-500">Kreirajte prvo takmičenje iznad.</div>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <Table striped>
              <TableHead>
                <TableRow>
                  <TableHeader>Naziv</TableHeader>
                  <TableHeader className="text-right">Akcije</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {competitions.map((comp) => (
                  <TableRow key={comp.id}>
                    <TableCell className="font-medium">{comp.name}</TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(comp.id, comp.name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <TrashIcon className="size-4" />
                        Obriši
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  )
}
