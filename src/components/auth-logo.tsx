import Link from 'next/link'

export function AuthLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 text-white hover:opacity-80 ${className ?? ''}`}
    >
      <span className="text-xl font-bold">🏃‍➡️ Trke Srbija</span>
    </Link>
  )
}
