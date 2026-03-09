import { AdSlot } from '@/components/ad-slot'
import Link from 'next/link'

const linkClass = 'text-sm text-text-secondary hover:text-text-primary transition-colors'

export function SiteFooter() {
  return (
    <footer className="hidden border-t border-border-primary bg-main lg:block">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-baseline">
              <span className="text-base font-extrabold tracking-tight text-brand-green">trke</span>
              <span className="text-base font-light tracking-tight text-text-secondary">srbija</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-text-secondary">
              Tvoj trkački portal za trail i drumske trke u Srbiji. Pronađi trke, prijavi se online, prati rezultate i
              GPX rute.
            </p>
          </div>

          {/* Istraži */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Istraži</h3>
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
            <h3 className="text-sm font-semibold text-text-primary">Tipovi trka</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/events?eventType=TRAIL" className={linkClass}>
                  Trail trke
                </Link>
              </li>
              <li>
                <Link href="/events?eventType=ROAD" className={linkClass}>
                  Drumske trke
                </Link>
              </li>
              <li>
                <Link href="/events?eventType=OCR" className={linkClass}>
                  OCR trke
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontakt & Informacije */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Kontakt</h3>
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

            <h3 className="mt-6 text-sm font-semibold text-text-primary">Za organizatore</h3>
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

        {/* Footer Ad */}
        <div className="mt-8">
          <AdSlot placement="FOOTER_BANNER" />
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border-primary pt-6 sm:flex-row">
          <p className="text-xs text-text-muted">
            v1.0 · © {new Date().getFullYear()} Trke Srbija · Napravio{' '}
            <a
              href="https://milosdjoric.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-primary"
            >
              milosdjoric.com
            </a>
          </p>
          <p className="text-xs text-text-muted">Podaci o trkama se redovno ažuriraju. Za ispravke, kontaktirajte nas.</p>
        </div>
      </div>
    </footer>
  )
}
