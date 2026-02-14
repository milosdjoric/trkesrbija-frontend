'use client'

import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { Switch } from './switch'

type FieldType = 'text' | 'number' | 'select' | 'datetime' | 'boolean'

type EditableCellProps = {
  value: string | number | boolean | null
  type: FieldType
  options?: { value: string; label: string }[]
  onSave: (newValue: string | number | boolean | null) => Promise<void>
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function EditableCell({
  value,
  type,
  options,
  onSave,
  disabled = false,
  placeholder = '-',
  className,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string>(formatEditValue(value, type))
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

  // Sync external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(formatEditValue(value, type))
    }
  }, [value, type, isEditing])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if ('select' in inputRef.current && type !== 'select') {
        inputRef.current.select()
      }
    }
  }, [isEditing, type])

  // Reset status after delay
  useEffect(() => {
    if (saveStatus !== 'idle') {
      const timer = setTimeout(() => setSaveStatus('idle'), 1500)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  async function handleSave() {
    const newValue = parseValue(editValue, type)

    // Check if value actually changed
    if (newValue === value || (newValue === null && value === null)) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(newValue)
      setSaveStatus('success')
      setIsEditing(false)
    } catch {
      setSaveStatus('error')
      // Don't exit edit mode on error so user can retry
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setEditValue(formatEditValue(value, type))
    setIsEditing(false)
    setSaveStatus('idle')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  // Boolean type uses Switch directly (single click toggle)
  if (type === 'boolean') {
    return (
      <div className={clsx('flex items-center', className)}>
        <Switch
          checked={Boolean(value)}
          onChange={async (checked) => {
            setIsSaving(true)
            try {
              await onSave(checked)
              setSaveStatus('success')
            } catch {
              setSaveStatus('error')
            } finally {
              setIsSaving(false)
            }
          }}
          disabled={disabled || isSaving}
          color="blue"
        />
        {isSaving && (
          <div className="ml-2 size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        )}
      </div>
    )
  }

  // Display mode
  if (!isEditing) {
    return (
      <div
        onDoubleClick={() => !disabled && setIsEditing(true)}
        className={clsx(
          'min-h-[20px] cursor-pointer overflow-hidden truncate rounded px-1 py-0.5 text-xs transition-colors',
          'hover:bg-zinc-100 dark:hover:bg-zinc-700',
          disabled && 'cursor-not-allowed opacity-50',
          saveStatus === 'success' && 'bg-green-100 dark:bg-green-900/30',
          saveStatus === 'error' && 'bg-red-100 dark:bg-red-900/30',
          className
        )}
        title={disabled ? undefined : 'Dupli klik za izmenu'}
      >
        <span className={clsx(!value && value !== 0 && 'text-zinc-400')}>
          {formatDisplayValue(value, type, options, placeholder)}
        </span>
      </div>
    )
  }

  // Edit mode
  return (
    <div className="relative">
      {type === 'select' ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="w-full rounded border-2 border-blue-500 bg-white px-1 py-0.5 text-xs focus:outline-none dark:bg-zinc-800"
        >
          <option value="">-</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type === 'number' ? 'number' : type === 'datetime' ? 'datetime-local' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          placeholder={placeholder}
          step={type === 'number' ? 'any' : undefined}
          className="w-full rounded border-2 border-blue-500 bg-white px-1 py-0.5 text-xs focus:outline-none dark:bg-zinc-800"
        />
      )}
      {isSaving && (
        <div className="absolute inset-0 flex items-center justify-center rounded bg-white/70 dark:bg-zinc-900/70">
          <div className="size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
    </div>
  )
}

function formatEditValue(value: string | number | boolean | null, type: FieldType): string {
  if (value === null || value === undefined) return ''

  if (type === 'datetime' && typeof value === 'string') {
    // Convert ISO string to datetime-local format
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return String(value)
}

function parseValue(editValue: string, type: FieldType): string | number | boolean | null {
  if (!editValue.trim()) return null

  if (type === 'number') {
    const num = parseFloat(editValue)
    return isNaN(num) ? null : num
  }

  if (type === 'datetime') {
    const d = new Date(editValue)
    return isNaN(d.getTime()) ? null : d.toISOString()
  }

  return editValue.trim()
}

function formatDisplayValue(
  value: string | number | boolean | null,
  type: FieldType,
  options?: { value: string; label: string }[],
  placeholder = '-'
): string {
  if (value === null || value === undefined || value === '') return placeholder

  if (type === 'select' && options) {
    const opt = options.find((o) => o.value === value)
    return opt?.label ?? String(value)
  }

  if (type === 'datetime' && typeof value === 'string') {
    const d = new Date(value)
    if (isNaN(d.getTime())) return placeholder
    return d.toLocaleString('sr-Latn-RS', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (type === 'number') {
    return String(value)
  }

  return String(value)
}
