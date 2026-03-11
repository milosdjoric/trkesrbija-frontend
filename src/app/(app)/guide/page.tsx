'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronUpIcon } from '@heroicons/react/16/solid'

const sections = [
  { id: 'pregled', label: 'Pregled' },
  { id: 'registracija', label: 'Registracija' },
  { id: 'dogadjaji', label: 'Događaji i trke' },
  { id: 'prijava-na-trku', label: 'Prijava na trku' },
  { id: 'omiljene', label: 'Omiljene trke' },
  { id: 'rezultati', label: 'Rezultati' },
  { id: 'lige', label: 'Lige' },
  { id: 'gpx', label: 'GPX Analyzer' },
  { id: 'treninzi', label: 'Treninzi' },
  { id: 'podesavanja', label: 'Podešavanja' },
  { id: 'sudije', label: 'Sudijska tabla' },
  { id: 'faq', label: 'Česta pitanja' },
]

export default function GuidePage() {
  const [activeId, setActiveId] = useState<string>('pregled')
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    // Set čuva ID-jeve svih sekcija koje su trenutno vidljive u viewportu.
    // Kad IO javi da je sekcija ušla/izašla, ažuriramo set.
    // Aktivna sekcija = prva vidljiva po redosledu u `sections` nizu.
    const visibleIds = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleIds.add(entry.target.id)
          } else {
            visibleIds.delete(entry.target.id)
          }
        }
        // Prva vidljiva sekcija po DOM redosledu = aktivna
        const first = sections.find((s) => visibleIds.has(s.id))
        if (first) setActiveId(first.id)
      },
      // rootMargin: gornji offset za sticky header, donji -40% da sekcija
      // postane aktivna čim joj se heading pojavi u gornjoj polovini ekrana
      { rootMargin: '-100px 0px -40% 0px', threshold: 0 }
    )

    for (const section of sections) {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:flex lg:gap-10">
      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Vodič za korišćenje</h1>
        <p className="mt-3 text-base text-text-secondary">
          Sve što treba da znaš o platformi Trke Srbija — od pretrage trka do prijave, rezultata i liga.
        </p>

        {/* Content */}
        <div className="mt-12 space-y-14">
          {/* 1. Pregled */}
          <Section id="pregled" title="Šta je Trke Srbija?">
            <P>
              Trke Srbija je trkački portal koji pokriva trail, drumske i OCR trke u Srbiji. Na jednom mestu možeš
              pronaći sve nadolazeće trke, prijaviti se online, pratiti rezultate, analizirati GPX rute i takmičiti se u
              virtualnim ligama.
            </P>
            <P>Platforma je namenjena svim trkačima — od rekreativaca do takmičara.</P>
          </Section>

          {/* 2. Registracija */}
          <Section id="registracija" title="Registracija i prijava">
            <P>Da bi se prijavio na trke, pratio omiljene i koristio sve funkcionalnosti, potreban ti je nalog.</P>
            <H3>Kreiranje naloga</H3>
            <Ul>
              <li>
                Idi na <InternalLink href="/register">stranicu za registraciju</InternalLink>
              </li>
              <li>Unesi ime, email adresu i lozinku</li>
              <li>Na email ćeš dobiti link za verifikaciju — klikni na njega da aktiviraš nalog</li>
            </Ul>
            <H3>Google prijava</H3>
            <P>
              Umesto kreiranja novog naloga, možeš se prijaviti jednim klikom preko Google naloga. Ovo automatski kreira
              nalog i verifikuje email.
            </P>
            <H3>Zaboravljena lozinka</H3>
            <P>
              Na <InternalLink href="/login">stranici za prijavu</InternalLink> klikni na &quot;Zaboravili ste
              lozinku?&quot; i unesi email. Dobićeš link za resetovanje lozinke.
            </P>
          </Section>

          {/* 3. Događaji i trke */}
          <Section id="dogadjaji" title="Događaji i trke">
            <H3>Svi događaji</H3>
            <P>
              Na stranici <InternalLink href="/events">Svi događaji</InternalLink> možeš pretražiti i filtrirati sve
              trke u Srbiji:
            </P>
            <Ul>
              <li>Po tipu — Trail, Drumske, OCR</li>
              <li>Po distanci i elevaciji (min/max)</li>
              <li>Po takmičenju — TTLS, NSPT i druga</li>
              <li>Samo verifikovane trke</li>
              <li>Sortiraj po datumu, distanci, elevaciji ili imenu</li>
            </Ul>
            <P>Događaji su grupisani po mesecima radi lakšeg pregleda.</P>

            <H3>Kalendar</H3>
            <P>
              <InternalLink href="/calendar">Kalendar trka</InternalLink> prikazuje mesečni pregled svih događaja —
              idealno za planiranje sezone.
            </P>

            <H3>Detalji događaja</H3>
            <P>Klikni na bilo koji događaj da vidiš:</P>
            <Ul>
              <li>Datum, lokaciju i opis</li>
              <li>Sve trke u okviru događaja (sa distancom, elevacijom i vremenom starta)</li>
              <li>Galeriju slika</li>
              <li>Informacije o organizatoru i kontakt</li>
              <li>Dugme za dodavanje u Google ili Apple Calendar</li>
            </Ul>

            <H3>Detalji trke</H3>
            <P>Svaka trka ima svoju stranicu sa:</P>
            <Ul>
              <li>GPX stazom prikazanom na interaktivnoj mapi</li>
              <li>Checkpoint-ovima</li>
              <li>Takmičenjima/serijama u kojima učestvuje</li>
              <li>Dugmetom &quot;Vodi me do starta&quot; (otvara Google Maps navigaciju)</li>
              <li>Dugmetom za prijavu</li>
            </Ul>
          </Section>

          {/* 4. Prijava na trku */}
          <Section id="prijava-na-trku" title="Prijava na trku">
            <P>Na stranici trke klikni dugme &quot;Prijavi se&quot;. Popuni formu sa:</P>
            <Ul>
              <li>Ime i prezime (automatski popunjeno sa profila)</li>
              <li>Email (automatski sa naloga)</li>
              <li>Telefon (opciono)</li>
              <li>Datum rođenja (minimalno 16 godina)</li>
              <li>Pol</li>
            </Ul>
            <P>
              Sve svoje prijave možeš videti na stranici{' '}
              <InternalLink href="/my-registrations">Moje prijave</InternalLink>. Tu možeš i otkazati prijavu ako se
              predomisliš.
            </P>
          </Section>

          {/* 5. Omiljene */}
          <Section id="omiljene" title="Omiljene trke">
            <P>
              Svaka trka ima ikonu srca — klikni je da sačuvaš trku u omiljene. Sve sačuvane trke možeš videti na
              stranici <InternalLink href="/favorites">Omiljene trke</InternalLink>.
            </P>
            <P>Ovo je korisno za praćenje trka koje te zanimaju, ali se još nisi prijavio.</P>
          </Section>

          {/* 6. Rezultati */}
          <Section id="rezultati" title="Rezultati">
            <P>Nakon završetka trke, rezultati se objavljuju na stranici trke. Tabela sa rezultatima prikazuje:</P>
            <Ul>
              <li>Poziciju i startni broj (bib)</li>
              <li>Ime takmičara i pol</li>
              <li>Vremena prolaska na svakom checkpoint-u</li>
              <li>Ukupno vreme</li>
            </Ul>
            <P>Rezultate možeš filtrirati po polu i pretraživati po imenu. Top 3 takmičara dobijaju medalje.</P>
          </Section>

          {/* 7. Lige */}
          <Section id="lige" title="Lige (Strava takmičenja)">
            <P>
              Lige su virtuelna takmičenja gde se takmičiš samostalno — nema organizovanih trka, sudija ni
              checkpoint-ova. Trčiš kad hoćeš i gde hoćeš, a podaci se automatski sinhronizuju sa Strave.
            </P>

            <H3>Kako početi</H3>
            <Ol>
              <li>
                Poveži Strava nalog u <InternalLink href="/settings">Podešavanjima</InternalLink>
              </li>
              <li>
                Idi na <InternalLink href="/leagues">Lige</InternalLink> i izaberi ligu
              </li>
              <li>Klikni &quot;Pridruži se&quot;</li>
              <li>Trči — tvoje Strava aktivnosti se automatski beleže</li>
            </Ol>

            <H3>Javne i privatne lige</H3>
            <P>
              Javnim ligama se svako može pridružiti. Privatne lige zahtevaju pozivni kod — ako imaš link sa kodom,
              automatski će se popuniti.
            </P>

            <H3>Bodovanje</H3>
            <Ul>
              <li>
                <Strong>Ukupna distanca</Strong> — zbir svih validnih distanci, najviše km = prvo mesto
              </li>
              <li>
                <Strong>Najbolje vreme</Strong> — najkraće moving time na jednoj aktivnosti = prvo mesto
              </li>
            </Ul>

            <H3>Moje aktivnosti</H3>
            <P>
              Na stranici lige imaš sekciju &quot;Moje aktivnosti&quot; gde možeš videti sve sinhronizovane aktivnosti,
              njihov status (validna, odbijena, na čekanju) i linkove na Stravu.
            </P>
          </Section>

          {/* 8. GPX Analyzer */}
          <Section id="gpx" title="GPX Analyzer">
            <P>
              <InternalLink href="/gpx-analyzer">GPX Analyzer</InternalLink> ti omogućava da analiziraš bilo koju GPX
              rutu:
            </P>
            <Ul>
              <li>Prevuci GPX fajl ili ga izaberi sa računara</li>
              <li>Vidi ukupnu distancu, elevaciju i broj tačaka</li>
              <li>Ruta se prikazuje na interaktivnoj mapi</li>
              <li>Analiza najvećih uspona (top climbs)</li>
              <li>Preuzmi analizirani GPX fajl</li>
            </Ul>
            <P>Ova funkcionalnost je dostupna svima — nije potrebna registracija.</P>
          </Section>

          {/* 9. Treninzi */}
          <Section id="treninzi" title="Treninzi">
            <P>
              Na stranici <InternalLink href="/training">Moji treninzi</InternalLink> možeš kreirati privatne treninge
              sa GPX fajlovima. Ovo je korisno za planiranje ruta i praćenje treninga.
            </P>
            <Ul>
              <li>Kreiraj novi trening sa nazivom i GPX fajlom</li>
              <li>Izaberi tip (Trail, Drumska, OCR)</li>
              <li>Pregledaj, izmeni ili obriši postojeće treninge</li>
            </Ul>
          </Section>

          {/* 10. Podešavanja */}
          <Section id="podesavanja" title="Podešavanja">
            <P>
              U <InternalLink href="/settings">Podešavanjima</InternalLink> možeš upravljati svojim nalogom:
            </P>

            <H3>Profil</H3>
            <P>Pregled osnovnih informacija — ime, email, uloga i status verifikacije.</P>

            <H3>Email obaveštenja</H3>
            <Ul>
              <li>Mesečni raspored trka (šalje se 1. svakog meseca)</li>
              <li>Vesti i novosti sa platforme</li>
              <li>Obaveštenje o novim trkama na sajtu</li>
            </Ul>

            <H3>Strava integracija</H3>
            <P>Poveži ili odvoji Strava nalog. Povezivanje je obavezno za učešće u ligama.</P>

            <H3>Tema</H3>
            <P>Izaberi tamnu, svetlu ili sistemsku temu.</P>
          </Section>

          {/* 11. Sudijska tabla */}
          <Section id="sudije" title="Sudijska tabla">
            <P>
              Sudijska tabla je namenjena sudijama na checkpoint-ovima. Pristup ima samo korisnik kome je administrator
              dodelio checkpoint.
            </P>
            <H3>Kako radi</H3>
            <Ul>
              <li>Unesi startni broj (bib) takmičara na numpad-u</li>
              <li>Vreme se automatski beleži</li>
              <li>Radi i bez interneta — podaci se čuvaju lokalno</li>
              <li>Kad se internet vrati, podaci se automatski sinhronizuju sa serverom</li>
            </Ul>
            <P>Status bar prikazuje da li si online ili offline i koliko stavki čeka na sinhronizaciju.</P>
          </Section>

          {/* 12. FAQ */}
          <Section id="faq" title="Česta pitanja">
            <Faq question="Da li je registracija besplatna?">
              Da, registracija i korišćenje platforme su potpuno besplatni.
            </Faq>
            <Faq question="Da li mogu da se prijavim na trku bez naloga?">
              Ne, potreban ti je nalog da bi se prijavio na trku, pratio omiljene i koristio lige.
            </Faq>
            <Faq question="Kako da povežem Strava nalog?">
              Idi u Podešavanja i klikni na &quot;Connect with Strava&quot; dugme. Bićeš preusmeren na Stravu gde ćeš
              odobriti pristup.
            </Faq>
            <Faq question="Šta ako nemam internet na trci (sudijska tabla)?">
              Sudijska tabla radi offline. Svi unosi se čuvaju lokalno i automatski se šalju na server kad se internet
              vrati.
            </Faq>
            <Faq question="Kako da otkazem prijavu na trku?">
              Idi na Moje prijave i klikni dugme &quot;Otkaži prijavu&quot; pored trke koju želiš da otkažeš.
            </Faq>
            <Faq question="Kako da dodam svoju trku na platformu?">
              Kontaktiraj nas putem emaila na{' '}
              <a href="mailto:djoric.inbox@gmail.com" className="text-brand-green hover:underline">
                djoric.inbox@gmail.com
              </a>{' '}
              sa detaljima o trci.
            </Faq>
            <Faq question="Da li mogu da koristim GPX Analyzer bez naloga?">
              Da, GPX Analyzer je dostupan svima — nije potrebna registracija.
            </Faq>
          </Section>
        </div>
      </div>

      {/* Floating sidebar — table of contents */}
      <aside className="hidden w-52 shrink-0 lg:block">
        <nav className="sticky top-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Sadržaj</p>
          <ul className="space-y-0.5 border-l border-border-primary">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`block border-l-2 py-1 pl-3 text-sm transition-colors ${
                    activeId === s.id
                      ? 'border-brand-green font-medium text-brand-green'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 rounded-full border border-border-primary bg-surface p-3 shadow-lg transition-colors hover:bg-surface-hover"
          aria-label="Nazad na vrh"
        >
          <ChevronUpIcon className="size-5 text-text-primary" />
        </button>
      )}
    </div>
  )
}

/* ─── Helper components ─── */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-5 text-base font-semibold text-text-primary">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-base/7 text-text-secondary">{children}</p>
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium text-text-primary">{children}</strong>
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5 text-base/7 text-text-secondary">{children}</ul>
}

function Ol({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal space-y-1 pl-5 text-base/7 text-text-secondary">{children}</ol>
}

function InternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-brand-green underline decoration-brand-green/50 hover:decoration-brand-green">
      {children}
    </Link>
  )
}

function Faq({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-border-primary bg-surface p-4">
      <p className="font-medium text-text-primary">{question}</p>
      <p className="mt-2 text-sm/6 text-text-secondary">{children}</p>
    </div>
  )
}
