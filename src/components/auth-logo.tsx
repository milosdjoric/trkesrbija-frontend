import Link from 'next/link'

export function AuthLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 text-zinc-950 hover:opacity-80 dark:text-white ${className ?? ''}`}
    >
      <span className="text-xl font-bold">🏃‍➡️ Trke Srbija</span>
    </Link>
  )
}
