import Link from 'next/link'

export function RunnerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="48"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* glava */}
      <circle cx="340" cy="96" r="48" />
      {/* ruka */}
      <path d="M120 200 C200 160, 300 160, 380 190" />
      {/* noga 1 */}
      <path d="M80 440 L260 260" />
      {/* noga 2 */}
      <path d="M260 260 L360 340 L260 340" />
    </svg>
  )
}

export function AuthLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 text-zinc-950 hover:opacity-80 dark:text-white ${className ?? ''}`}
    >
      <span className="flex size-8 items-center justify-center rounded-md bg-zinc-900 dark:bg-white">
        <RunnerIcon className="size-5 text-white dark:text-zinc-900" />
      </span>
      <span className="text-xl font-bold">Trke Srbija</span>
    </Link>
  )
}
