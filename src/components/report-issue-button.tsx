'use client'

import { ReportIssueModal } from '@/components/report-issue-modal'
import { ExclamationTriangleIcon } from '@heroicons/react/16/solid'
import { useState } from 'react'

interface ReportIssueButtonProps {
  entityType: 'EVENT' | 'RACE'
  entityId: string
  entityName: string
}

export function ReportIssueButton({ entityType, entityId, entityName }: ReportIssueButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:border-red-900/40 dark:text-red-400/80 dark:hover:bg-red-950/30 dark:hover:text-red-400"
      >
        <ExclamationTriangleIcon className="size-4" />
        Prijavi pogrešnu informaciju
      </button>

      <ReportIssueModal
        open={open}
        onClose={() => setOpen(false)}
        entityType={entityType}
        entityId={entityId}
        entityName={entityName}
      />
    </>
  )
}
