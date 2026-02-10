import Link from 'next/link'

function RunnerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" className={className}>
      {/* Head */}
      <path d="M368 96a48 48 0 1 0-96 0 48 48 0 1 0 96 0z" />
      {/* Body/Arms - curved line */}
      <path
        d="M120 360c-13.3 0-24-10.7-24-24s10.7-24 24-24c36.4 0 70.7-13.8 96.8-38.6l36.4-34.5c11-10.4 26.3-14.7 41-11.5l79.2 17.2c13 2.8 21.3 15.6 18.5 28.6s-15.6 21.3-28.6 18.5l-71.5-15.5-42.1 39.9c-37.9 35.9-88.2 55.9-140.7 55.9z"
        fillRule="evenodd"
      />
      {/* Legs - triangle shape */}
      <path
        d="M272 416v32c0 13.3-10.7 24-24 24s-24-10.7-24-24v-32l-72 72H96c-13.3 0-24-10.7-24-24s10.7-24 24-24h37.5l101.1-101.1c4.7-4.7 11-7.4 17.6-7.8l.8 0 .8 0c6.6.4 12.9 3.1 17.6 7.8L372.5 440H416c13.3 0 24 10.7 24 24s-10.7 24-24 24h-56l-88-88z"
        fillRule="evenodd"
      />
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
