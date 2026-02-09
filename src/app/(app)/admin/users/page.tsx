'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Heading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useConfirm } from '@/components/confirm-dialog'
import { useToast } from '@/components/toast'
import { ChevronLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type User = {
  id: string
  email: string
  name: string | null
  role: 'STANDARD' | 'ADMIN'
  emailVerified: boolean
  assignedCheckpointId: string | null
  createdAt: string
}

const USERS_QUERY = `
  query AdminUsers {
    users(limit: 1000) {
      id
      email
      name
      role
      emailVerified
      assignedCheckpointId
      createdAt
    }
  }
`

const UPDATE_USER_ROLE_MUTATION = `
  mutation UpdateUserRole($userId: ID!, $role: UserRole!) {
    updateUserRole(userId: $userId, role: $role) {
      id
      role
    }
  }
`

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, accessToken, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'ALL' | 'ADMIN' | 'STANDARD' | 'JUDGE'>('ALL')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!accessToken) return

    try {
      const data = await gql<{ users: User[] }>(USERS_QUERY, {}, { accessToken })
      setUsers(data.users ?? [])
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/')
      return
    }

    if (accessToken) {
      loadData()
    }
  }, [authLoading, user, accessToken, router, loadData])

  async function handleToggleAdmin(targetUser: User) {
    const newRole = targetUser.role === 'ADMIN' ? 'STANDARD' : 'ADMIN'
    const action = newRole === 'ADMIN' ? 'dodeliti admin prava' : 'ukloniti admin prava'

    const confirmed = await confirm({
      title: newRole === 'ADMIN' ? 'Dodeli admin prava' : 'Ukloni admin prava',
      message: `Da li ste sigurni da želite da ${action} korisniku ${targetUser.email}?`,
      confirmText: newRole === 'ADMIN' ? 'Dodeli' : 'Ukloni',
      variant: newRole === 'ADMIN' ? 'default' : 'danger',
    })

    if (!confirmed) return

    setUpdatingId(targetUser.id)
    try {
      await gql(UPDATE_USER_ROLE_MUTATION, { userId: targetUser.id, role: newRole }, { accessToken })

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      )

      toast(
        newRole === 'ADMIN' ? 'Korisnik je sada admin' : 'Admin prava uklonjena',
        'success'
      )
    } catch (err: any) {
      toast(err?.message ?? 'Greška pri promeni uloge', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  if (authLoading || loading) {
    return <LoadingState />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(searchLower) ||
      (u.name ?? '').toLowerCase().includes(searchLower)

    const matchesRole =
      filterRole === 'ALL' ||
      (filterRole === 'ADMIN' && u.role === 'ADMIN') ||
      (filterRole === 'STANDARD' && u.role === 'STANDARD' && !u.assignedCheckpointId) ||
      (filterRole === 'JUDGE' && u.assignedCheckpointId)

    return matchesSearch && matchesRole
  })

  function formatDate(iso: string) {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('sr-Latn-RS', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const adminCount = users.filter((u) => u.role === 'ADMIN').length
  const judgeCount = users.filter((u) => u.assignedCheckpointId).length
  const standardCount = users.filter((u) => u.role === 'STANDARD' && !u.assignedCheckpointId).length

  return (
    <>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4" />
          Admin Panel
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading>Upravljanje korisnicima</Heading>
        <div className="flex gap-2 text-sm">
          <Badge color="purple">{adminCount} admin</Badge>
          <Badge color="amber">{judgeCount} sudija</Badge>
          <Badge color="zinc">{standardCount} standard</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            placeholder="Pretraži po email ili imenu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </div>

        {/* Role filter */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as any)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="ALL">Sve uloge</option>
          <option value="ADMIN">Admini</option>
          <option value="JUDGE">Sudije</option>
          <option value="STANDARD">Standard</option>
        </select>
      </div>

      {/* Users table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Korisnik
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Uloga
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                Registrovan
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                  {search || filterRole !== 'ALL'
                    ? 'Nema korisnika koji odgovaraju filterima'
                    : 'Nema korisnika'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {u.name ?? '-'}
                    </div>
                    <div className="text-sm text-zinc-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.role === 'ADMIN' && <Badge color="purple">Admin</Badge>}
                      {u.assignedCheckpointId && <Badge color="amber">Sudija</Badge>}
                      {u.role === 'STANDARD' && !u.assignedCheckpointId && (
                        <Badge color="zinc">Standard</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.emailVerified ? (
                      <Badge color="green">Verifikovan</Badge>
                    ) : (
                      <Badge color="red">Nije verifikovan</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== user.id && (
                      <button
                        onClick={() => handleToggleAdmin(u)}
                        disabled={updatingId === u.id}
                        className={`rounded px-2 py-1 text-xs ${
                          u.role === 'ADMIN'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
                        } ${updatingId === u.id ? 'opacity-50' : ''}`}
                      >
                        {updatingId === u.id
                          ? '...'
                          : u.role === 'ADMIN'
                            ? 'Ukloni admin'
                            : 'Dodeli admin'}
                      </button>
                    )}
                    {u.id === user.id && (
                      <span className="text-xs text-zinc-400">Ti</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
