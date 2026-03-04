'use client'

import { useAuth } from '@/app/auth/auth-context'
import { gql } from '@/app/lib/api'
import { Badge } from '@/components/badge'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { LoadingState } from '@/components/loading-state'
import { useToast } from '@/components/toast'
import { ChevronLeftIcon } from '@heroicons/react/16/solid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type Report = {
 id: string
 entityType: string
 entityId: string
 entityName: string
 fields: string[]
 message: string | null
 reporterEmail: string | null
 status: string
 createdAt: string
}

const REPORTS_QUERY = `
 query Reports($status: String) {
  reports(status: $status, limit: 100) {
   id
   entityType
   entityId
   entityName
   fields
   message
   reporterEmail
   status
   createdAt
  }
 }
`

const UPDATE_STATUS_MUTATION = `
 mutation UpdateReportStatus($id: ID!, $status: String!) {
  updateReportStatus(id: $id, status: $status) {
   id
   status
  }
 }
`

const FIELD_LABELS: Record<string, string> = {
 eventName: 'Naziv događaja',
 startDateTime: 'Datum/vreme',
 startLocation: 'Lokacija',
 description: 'Opis',
 organizer: 'Organizator',
 type: 'Tip događaja',
 raceName: 'Naziv trke',
 length: 'Distanca',
 elevation: 'Visinska razlika',
 registrationSite: 'Link za prijave',
 other: 'Ostalo',
}

export default function AdminReportsPage() {
 const router = useRouter()
 const { user, accessToken, isLoading: authLoading } = useAuth()
 const { toast } = useToast()

 const [reports, setReports] = useState<Report[]>([])
 const [loading, setLoading] = useState(true)
 const [filterStatus, setFilterStatus] = useState<string>('')
 const [updatingId, setUpdatingId] = useState<string | null>(null)

 const loadReports = useCallback(async () => {
  if (!accessToken) return
  try {
   const data = await gql<{ reports: Report[] }>(
    REPORTS_QUERY,
    { status: filterStatus || null },
    { accessToken }
   )
   setReports(data.reports ?? [])
  } catch (err) {
   console.error('Failed to load reports:', err)
  } finally {
   setLoading(false)
  }
 }, [accessToken, filterStatus])

 useEffect(() => {
  if (!authLoading && (!user || user.role !== 'ADMIN')) {
   router.push('/')
   return
  }
  if (accessToken) loadReports()
 }, [authLoading, user, accessToken, router, loadReports])

 async function handleUpdateStatus(id: string, status: string) {
  setUpdatingId(id)
  try {
   await gql(UPDATE_STATUS_MUTATION, { id, status }, { accessToken })
   setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
   toast(`Status promenjen na ${status === 'RESOLVED' ? 'Rešeno' : 'Odbačeno'}`, 'success')
  } catch (err: any) {
   toast(err?.message ?? 'Greška', 'error')
  } finally {
   setUpdatingId(null)
  }
 }

 function formatDate(iso: string) {
  const d = new Date(iso)
  const day = parseInt(d.toLocaleDateString('sr-Latn-RS', { day: 'numeric', timeZone: 'Europe/Belgrade' }))
  const month = d.toLocaleDateString('sr-Latn-RS', { month: 'short', timeZone: 'Europe/Belgrade' }).replace('.', '')
  const year = parseInt(d.toLocaleDateString('sr-Latn-RS', { year: 'numeric', timeZone: 'Europe/Belgrade' }))
  const time = d.toLocaleTimeString('sr-Latn-RS', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Belgrade' })
  return `${day}. ${month} ${year}. ${time}`
 }

 if (authLoading || loading) return <LoadingState />
 if (!user || user.role !== 'ADMIN') return null

 const pendingCount = reports.filter((r) => r.status === 'PENDING').length

 return (
  <>
   <div className="mb-4">
    <Link
     href="/admin"
     className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300"
    >
     <ChevronLeftIcon className="size-4" />
     Admin Panel
    </Link>
   </div>

   <Heading>Prijave grešaka</Heading>
   <p className="mt-1 text-sm text-gray-400">
    {pendingCount > 0 ? `${pendingCount} neobrađenih prijava` : 'Nema neobrađenih prijava'}
   </p>

   {/* Filter */}
   <div className="mt-6">
    <select
     value={filterStatus}
     onChange={(e) => {
      setFilterStatus(e.target.value)
      setLoading(true)
     }}
     className="rounded-lg border border-dark-border-light px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green bg-dark-surface"
    >
     <option value="">Sve prijave</option>
     <option value="PENDING">Neobrađene</option>
     <option value="RESOLVED">Rešene</option>
     <option value="DISMISSED">Odbačene</option>
    </select>
   </div>

   {/* Reports list */}
   <div className="mt-6 space-y-4">
    {reports.length === 0 ? (
     <p className="py-8 text-center text-sm text-gray-400">Nema prijava</p>
    ) : (
     reports.map((report) => (
      <div
       key={report.id}
       className="rounded-lg border border-dark-border p-4"
      >
       <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
         <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-white">
           {report.entityName}
          </span>
          <Badge color={report.entityType === 'EVENT' ? 'blue' : 'purple'}>
           {report.entityType === 'EVENT' ? 'Događaj' : 'Trka'}
          </Badge>
          <Badge
           color={
            report.status === 'PENDING'
             ? 'amber'
             : report.status === 'RESOLVED'
              ? 'green'
              : 'zinc'
           }
          >
           {report.status === 'PENDING'
            ? 'Neobrađeno'
            : report.status === 'RESOLVED'
             ? 'Rešeno'
             : 'Odbačeno'}
          </Badge>
         </div>

         {/* Fields */}
         {report.fields.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
           {report.fields.map((f) => (
            <span
             key={f}
             className="inline-block rounded bg-red-900/20 px-2 py-0.5 text-xs font-medium text-red-400"
            >
             {FIELD_LABELS[f] || f}
            </span>
           ))}
          </div>
         )}

         {/* Message */}
         {report.message && (
          <p className="mt-2 text-sm text-gray-400 whitespace-pre-wrap">
           {report.message}
          </p>
         )}

         {/* Meta */}
         <div className="mt-2 text-xs text-gray-400">
          {formatDate(report.createdAt)}
          {report.reporterEmail && (
           <>
            {' · '}
            <a
             href={`mailto:${report.reporterEmail}`}
             className="text-blue-500 hover:underline"
            >
             {report.reporterEmail}
            </a>
           </>
          )}
         </div>
        </div>

        {/* Actions */}
        {report.status === 'PENDING' && (
         <div className="flex gap-2 shrink-0">
          <button
           onClick={() => handleUpdateStatus(report.id, 'RESOLVED')}
           disabled={updatingId === report.id}
           className="cursor-pointer rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
           Rešeno
          </button>
          <button
           onClick={() => handleUpdateStatus(report.id, 'DISMISSED')}
           disabled={updatingId === report.id}
           className="cursor-pointer rounded-lg bg-dark-surface px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-dark-card-hover disabled:opacity-50"
          >
           Odbaci
          </button>
         </div>
        )}
       </div>
      </div>
     ))
    )}
   </div>
  </>
 )
}
