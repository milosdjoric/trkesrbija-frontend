import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'
import { TouchTarget } from './button'
import { Link } from './link'

const colors = {
  red: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 group-data-hover:bg-red-200 dark:group-data-hover:bg-red-500/20',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 group-data-hover:bg-orange-200 dark:group-data-hover:bg-orange-500/20',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400 group-data-hover:bg-amber-200 dark:group-data-hover:bg-amber-400/15',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-300 group-data-hover:bg-yellow-200 dark:group-data-hover:bg-yellow-400/15',
  lime: 'bg-lime-100 text-lime-700 dark:bg-lime-400/10 dark:text-lime-300 group-data-hover:bg-lime-200 dark:group-data-hover:bg-lime-400/15',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-brand-green/10 dark:text-brand-green group-data-hover:bg-emerald-200 dark:group-data-hover:bg-brand-green/20',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 group-data-hover:bg-emerald-200 dark:group-data-hover:bg-emerald-500/20',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300 group-data-hover:bg-teal-200 dark:group-data-hover:bg-teal-500/20',
  cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300 group-data-hover:bg-cyan-200 dark:group-data-hover:bg-cyan-400/15',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 group-data-hover:bg-sky-200 dark:group-data-hover:bg-sky-500/20',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 group-data-hover:bg-blue-200 dark:group-data-hover:bg-blue-500/20',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 group-data-hover:bg-indigo-200 dark:group-data-hover:bg-indigo-500/20',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 group-data-hover:bg-violet-200 dark:group-data-hover:bg-violet-500/20',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 group-data-hover:bg-purple-200 dark:group-data-hover:bg-purple-500/20',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-400 group-data-hover:bg-fuchsia-200 dark:group-data-hover:bg-fuchsia-400/20',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-400/10 dark:text-pink-400 group-data-hover:bg-pink-200 dark:group-data-hover:bg-pink-400/20',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-400 group-data-hover:bg-rose-200 dark:group-data-hover:bg-rose-400/20',
  zinc: 'bg-surface-hover text-text-secondary group-data-hover:bg-border-secondary',
}

type BadgeProps = { color?: keyof typeof colors }

export function Badge({ color = 'zinc', className, ...props }: BadgeProps & React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      {...props}
      className={clsx(
        className,
        'inline-flex items-center gap-x-1.5 rounded-md px-1.5 py-0.5 text-sm/5 font-medium sm:text-xs/5 forced-colors:outline',
        colors[color]
      )}
    />
  )
}

export const BadgeButton = forwardRef(function BadgeButton(
  {
    color = 'zinc',
    className,
    children,
    ...props
  }: BadgeProps & { className?: string; children: React.ReactNode } & (
      | ({ href?: never } & Omit<Headless.ButtonProps, 'as' | 'className'>)
      | ({ href: string } & Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>)
    ),
  ref: React.ForwardedRef<HTMLElement>
) {
  let classes = clsx(
    className,
    'group relative inline-flex rounded-md focus:not-data-focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500'
  )

  return typeof props.href === 'string' ? (
    <Link {...props} className={classes} ref={ref as React.ForwardedRef<HTMLAnchorElement>}>
      <TouchTarget>
        <Badge color={color}>{children}</Badge>
      </TouchTarget>
    </Link>
  ) : (
    <Headless.Button {...props} className={classes} ref={ref}>
      <TouchTarget>
        <Badge color={color}>{children}</Badge>
      </TouchTarget>
    </Headless.Button>
  )
})
