'use client'

import clsx from 'clsx'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/16/solid'

type PasswordRequirement = {
  label: string
  test: (password: string) => boolean
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%^&*)', test: (p) => /[^a-zA-Z0-9]/.test(p) },
]

export function validatePassword(password: string): {
  isValid: boolean
  passedCount: number
  totalCount: number
} {
  const passedCount = PASSWORD_REQUIREMENTS.filter((req) => req.test(password)).length
  return {
    isValid: passedCount === PASSWORD_REQUIREMENTS.length,
    passedCount,
    totalCount: PASSWORD_REQUIREMENTS.length,
  }
}

type PasswordStrengthProps = {
  password: string
  showRequirements?: boolean
  className?: string
}

export function PasswordStrength({ password, showRequirements = true, className }: PasswordStrengthProps) {
  const { passedCount, totalCount } = validatePassword(password)

  // Calculate strength percentage
  const strengthPercent = (passedCount / totalCount) * 100

  // Determine color based on strength
  const getStrengthColor = () => {
    if (strengthPercent === 0) return 'bg-zinc-200 dark:bg-zinc-700'
    if (strengthPercent <= 40) return 'bg-red-500'
    if (strengthPercent <= 60) return 'bg-orange-500'
    if (strengthPercent <= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthLabel = () => {
    if (strengthPercent === 0) return ''
    if (strengthPercent <= 40) return 'Weak'
    if (strengthPercent <= 60) return 'Fair'
    if (strengthPercent <= 80) return 'Good'
    return 'Strong'
  }

  if (!password) return null

  return (
    <div className={clsx('space-y-2', className)}>
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className={clsx('h-full transition-all duration-300', getStrengthColor())}
            style={{ width: `${strengthPercent}%` }}
          />
        </div>
        <span
          className={clsx(
            'text-xs font-medium',
            strengthPercent <= 40 && 'text-red-600 dark:text-red-400',
            strengthPercent > 40 && strengthPercent <= 60 && 'text-orange-600 dark:text-orange-400',
            strengthPercent > 60 && strengthPercent <= 80 && 'text-yellow-600 dark:text-yellow-400',
            strengthPercent > 80 && 'text-green-600 dark:text-green-400'
          )}
        >
          {getStrengthLabel()}
        </span>
      </div>

      {/* Requirements list */}
      {showRequirements && (
        <ul className="grid grid-cols-1 gap-1 text-xs">
          {PASSWORD_REQUIREMENTS.map((req, i) => {
            const passed = req.test(password)
            return (
              <li key={i} className="flex items-center gap-1.5">
                {passed ? (
                  <CheckCircleIcon className="size-3.5 text-green-500" />
                ) : (
                  <XCircleIcon className="size-3.5 text-zinc-400 dark:text-zinc-500" />
                )}
                <span
                  className={clsx(
                    passed ? 'text-green-600 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'
                  )}
                >
                  {req.label}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
