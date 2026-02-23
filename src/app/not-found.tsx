import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-zinc-300 dark:text-zinc-700">404</h1>
      <h2 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Stranica nije pronađena
      </h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Stranica koju ste tražili ne postoji ili je premeštena.
      </p>
      <Link
        href="/events"
        className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Pogledaj sve događaje
      </Link>
    </div>
  )
}
