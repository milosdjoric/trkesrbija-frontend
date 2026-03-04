import Link from 'next/link'

const linkClass = 'text-sm text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'

export function SiteFooter() {
  return (
    <footer className="hidden border-t border-zinc-950/5 bg-zinc-50 lg:block dark:border-white/5 dark:bg-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="text-base font-semibold text-zinc-950 dark:text-white">
              🏃‍➡️ Trke Srbija
            </Link>
            <p className="mt-3 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
              Tvoj trkački portal za trail i drumske trke u Srbiji. Pronađi trke, prijavi se online, prati rezultate i
              GPX rute.
            </p>
          </div>

          {/* Istraži */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">Istraži</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/events" className={linkClass}>
                  Svi događaji
                </Link>
              </li>
              <li>
                <Link href="/calendar" className={linkClass}>
                  Kalendar trka
                </Link>
              </li>
              <li>
                <Link href="/gpx-analyzer" className={linkClass}>
                  GPX Analyzer
                </Link>
              </li>
              <li>
                <Link href="/favorites" className={linkClass}>
                  Omiljene trke
                </Link>
              </li>
              <li>
                <Link href="/my-registrations" className={linkClass}>
                  Moje prijave
                </Link>
              </li>
              <li>
                <Link href="/training" className={linkClass}>
                  Moji treninzi
                </Link>
              </li>
            </ul>
          </div>

          {/* Tipovi trka */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">Tipovi trka</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/events?type=TRAIL" className={linkClass}>
                  Trail trke
                </Link>
              </li>
              <li>
                <Link href="/events?type=ROAD" className={linkClass}>
                  Drumske trke
                </Link>
              </li>
<li>
                <Link href="/events?type=OCR" className={linkClass}>
                  OCR trke
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontakt & Informacije */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">Kontakt</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="mailto:djoric.inbox@gmail.com?subject=Trke%20Srbija%20Support%20request"
                  className={linkClass}
                >
                  Podrška putem emaila
                </a>
              </li>
              <li>
                <a href="https://tally.so/r/Y547W6" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Pošalji povratne informacije
                </a>
              </li>
            </ul>

            <h3 className="mt-6 text-sm font-semibold text-zinc-950 dark:text-white">Za organizatore</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="mailto:djoric.inbox@gmail.com?subject=Dodavanje%20trke%20na%20Trke%20Srbija"
                  className={linkClass}
                >
                  Dodaj svoju trku
                </a>
              </li>
              <li>
                <a
                  href="mailto:djoric.inbox@gmail.com?subject=Saradnja%20-%20Trke%20Srbija"
                  className={linkClass}
                >
                  Saradnja
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-zinc-950/5 pt-6 sm:flex-row dark:border-white/5">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            v1.0 · © {new Date().getFullYear()} Trke Srbija · Napravio{' '}
            <a
              href="https://milosdjoric.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-600 dark:hover:text-zinc-400"
            >
              milosdjoric.com
            </a>
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Podaci o trkama se redovno ažuriraju. Za ispravke, kontaktirajte nas.
          </p>
        </div>
      </div>
    </footer>
  )
}
