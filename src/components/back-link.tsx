import { Link } from '@/components/link'
import { ChevronLeftIcon } from '@heroicons/react/16/solid'

type BackLinkProps = {
  href: string
  children: React.ReactNode
}

/**
 * Back navigation link with chevron icon
 * Used at top of detail pages to go back to list
 */
export function BackLink({ href, children }: BackLinkProps) {
  return (
    <div className="max-lg:hidden">
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400"
      >
        <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
        {children}
      </Link>
    </div>
  )
}
