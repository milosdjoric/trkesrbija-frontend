'use client'

import { Button } from '@/components/button'
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog'
import { ExclamationTriangleIcon } from '@heroicons/react/16/solid'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ConfirmOptions = {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
}

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    setOpen(true)
    return new Promise((resolve) => {
      setResolveRef(() => resolve)
    })
  }, [])

  const handleConfirm = () => {
    setOpen(false)
    resolveRef?.(true)
  }

  const handleCancel = () => {
    setOpen(false)
    resolveRef?.(false)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={open} onClose={handleCancel}>
        <DialogTitle className="flex items-center gap-2">
          {options?.variant === 'danger' && <ExclamationTriangleIcon className="size-5 text-red-500" />}
          {options?.variant === 'warning' && <ExclamationTriangleIcon className="size-5 text-amber-500" />}
          {options?.title}
        </DialogTitle>
        <DialogDescription>{options?.message}</DialogDescription>
        <DialogBody />
        <DialogActions>
          <Button plain onClick={handleCancel}>
            {options?.cancelText ?? 'Otkazi'}
          </Button>
          <Button
            color={options?.variant === 'danger' ? 'red' : undefined}
            onClick={handleConfirm}
          >
            {options?.confirmText ?? 'Potvrdi'}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>')
  return ctx.confirm
}
