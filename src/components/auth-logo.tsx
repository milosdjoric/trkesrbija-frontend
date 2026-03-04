import Link from 'next/link'

export function AuthLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-baseline hover:opacity-80 ${className ?? ''}`}>
      <span className="text-2xl font-extrabold tracking-tight text-brand-green">trke</span>
      <span className="text-2xl font-light tracking-tight text-text-secondary">srbija</span>
    </Link>
  )
}
