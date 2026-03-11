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
  { id: 'faq', label: 'Česta pitanja' },
]

export default function GuidePage() {
  const [activeId, setActiveId] = useState<string>('pregled')
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      let current = sections[0].id
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= 130) {
          current = s.id
        }
      }
      setActiveId(current)
      setShowBackToTop(window.scrollY > 400)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:flex lg:gap-10">
      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Vodič za korišćenje</h1>
        <p className="mt-3 text-base text-text-secondary">
          Sve što treba da znaš o platformi Trke Srbija — od pretrage trka do prijave, rezultata i liga. Ovaj vodič
          pokriva sve funkcionalnosti platforme v1.1.
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
            <H3>Šta sve možeš na platformi</H3>
            <Ul>
              <li>Pretraži i filtriraj sve nadolazeće trail, drumske i OCR trke u Srbiji</li>
              <li>Pregledaj kalendar trka po mesecima za lakše planiranje sezone</li>
              <li>Prijavi se na trku online — bez papira i čekanja</li>
              <li>Sačuvaj omiljene trke i prati ih na jednom mestu</li>
              <li>Prati rezultate i pogledaj rang liste sa medalljama za top 3</li>
              <li>Učestvuj u virtualnim ligama povezanim sa Stravom</li>
              <li>Analiziraj GPX rute — distanca, elevacija, najveći usponi</li>
              <li>Kreiraj privatne treninge sa GPX fajlovima</li>
            </Ul>
            <P>
              Platforma je potpuno besplatna za korišćenje. Registracija je potrebna samo za prijavu na trke, omiljene i
              lige — pregledanje događaja, kalendar i GPX Analyzer su dostupni svima.
            </P>
          </Section>

          {/* 2. Registracija */}
          <Section id="registracija" title="Registracija i prijava">
            <P>
              Da bi se prijavio na trke, pratio omiljene i koristio sve funkcionalnosti, potreban ti je nalog.
              Registracija je besplatna i traje manje od minut.
            </P>

            <H3>Kreiranje naloga putem email-a</H3>
            <Ol>
              <li>
                Idi na <InternalLink href="/register">stranicu za registraciju</InternalLink>
              </li>
              <li>Unesi ime i prezime, email adresu i lozinku (minimum 8 karaktera)</li>
              <li>Klikni na &quot;Registruj se&quot;</li>
              <li>Na email ćeš dobiti link za verifikaciju — klikni na njega da aktiviraš nalog</li>
              <li>Nakon verifikacije, možeš se prijaviti sa email-om i lozinkom</li>
            </Ol>
            <P>
              Verifikacija email-a je obavezna. Dok ne verifikuješ email, na vrhu stranice će se prikazivati žuti baner
              sa podsetniком. Možeš zatražiti novi verifikacioni email ako ti prethodni istekne.
            </P>

            <H3>Google prijava</H3>
            <P>
              Umesto kreiranja novog naloga, možeš se prijaviti jednim klikom preko Google naloga. Ovo automatski kreira
              nalog i verifikuje email — ne moraš ništa dodatno da potvrđuješ. Ako već imaš nalog sa istim email-om,
              Google prijava će se povezati sa postojećim nalogom.
            </P>

            <H3>Zaboravljena lozinka</H3>
            <P>
              Na <InternalLink href="/login">stranici za prijavu</InternalLink> klikni na &quot;Zaboravili ste
              lozinku?&quot; i unesi email adresu povezanu sa tvojim nalogom. Dobićeš email sa linkom za resetovanje
              lozinke. Link važi ograničeno vreme — ako istekne, zatraži novi.
            </P>

            <H3>Sigurnost naloga</H3>
            <P>
              Tvoja lozinka je šifrovana i ne može se videti ni od strane administratora. Sesija se automatski obnavlja
              dok si aktivan, ali iz sigurnosnih razloga može isteći nakon dužeg perioda neaktivnosti — u tom slučaju
              ćeš biti preusmeren na prijavu.
            </P>
          </Section>

          {/* 3. Događaji i trke */}
          <Section id="dogadjaji" title="Događaji i trke">
            <P>
              Događaji su centralni deo platforme. Svaki događaj predstavlja jednu trkačku manifestaciju (npr.
              &quot;Fruška Gora Trail 2026&quot;) koja može sadržati više trka različitih distanci.
            </P>

            <H3>Pregled svih događaja</H3>
            <P>
              Na stranici <InternalLink href="/events">Svi događaji</InternalLink> možeš pretražiti i filtrirati sve
              trke u Srbiji. Dostupni filteri:
            </P>
            <Ul>
              <li>
                <Strong>Tip trke</Strong> — Trail, Drumske ili OCR
              </li>
              <li>
                <Strong>Distanca</Strong> — minimalna i maksimalna dužina staze u km
              </li>
              <li>
                <Strong>Elevacija</Strong> — minimalni i maksimalni visinski metar
              </li>
              <li>
                <Strong>Takmičenje/serija</Strong> — TTLS, NSPT i druga takmičenja
              </li>
              <li>
                <Strong>Samo verifikovane trke</Strong> — trke čije su informacije potvrđene od strane organizatora
              </li>
              <li>
                <Strong>Sortiranje</Strong> — po datumu, distanci, elevaciji ili imenu
              </li>
            </Ul>
            <P>
              Događaji su grupisani po mesecima radi lakšeg pregleda. Prošli događaji se automatski prebacuju na dno
              liste.
            </P>

            <H3>Kalendar</H3>
            <P>
              <InternalLink href="/calendar">Kalendar trka</InternalLink> prikazuje mesečni pregled svih događaja u
              vizuelnom formatu. Možeš se kretati napred i nazad po mesecima, a klik na događaj te vodi na njegovu
              stranicu. Idealno za planiranje trkačke sezone i izbegavanje preklapanja termina.
            </P>

            <H3>Detalji događaja</H3>
            <P>Klikni na bilo koji događaj da vidiš sve informacije:</P>
            <Ul>
              <li>Datum, tačnu lokaciju i detaljan opis</li>
              <li>
                Sve trke u okviru događaja — svaka sa svojom distancom, elevacijom, tipom terena i vremenom starta
              </li>
              <li>Galeriju slika sa događaja</li>
              <li>Informacije o organizatoru — ime, kontakt, veb sajt</li>
              <li>Dugme za dodavanje u Google Calendar ili Apple Calendar (preuzimanje .ics fajla)</li>
              <li>Takmičenja/serije u kojima događaj učestvuje</li>
            </Ul>

            <H3>Detalji trke</H3>
            <P>Svaka trka unutar događaja ima svoju detaljnu stranicu sa:</P>
            <Ul>
              <li>
                <Strong>GPX stazom na interaktivnoj mapi</Strong> — vizuelni prikaz cele rute sa profilom visine
              </li>
              <li>
                <Strong>Checkpoint-ovima</Strong> — sve kontrolne tačke na stazi sa rastojanjem od starta
              </li>
              <li>
                <Strong>Takmičenjima/serijama</Strong> — u kojim serijama trka učestvuje (TTLS, NSPT, itd.)
              </li>
              <li>
                <Strong>&quot;Vodi me do starta&quot;</Strong> — otvara Google Maps navigaciju do startne lokacije
              </li>
              <li>
                <Strong>Dugme za prijavu</Strong> — direktna prijava na trku
              </li>
              <li>
                <Strong>Rezultati</Strong> — ako je trka završena, prikaz kompletnih rezultata
              </li>
            </Ul>
          </Section>

          {/* 4. Prijava na trku */}
          <Section id="prijava-na-trku" title="Prijava na trku">
            <P>
              Online prijava ti omogućava da se registruješ za trku bez papira i čekanja. Ceo proces traje manje od
              minut.
            </P>

            <H3>Kako se prijaviti</H3>
            <Ol>
              <li>Otvori stranicu trke na koju želiš da se prijaviš</li>
              <li>Klikni dugme &quot;Prijavi se&quot;</li>
              <li>Popuni formu — većina polja je automatski popunjena sa tvog profila</li>
              <li>Potvrdi prijavu</li>
            </Ol>

            <H3>Podaci za prijavu</H3>
            <Ul>
              <li>
                <Strong>Ime i prezime</Strong> — automatski popunjeno sa profila
              </li>
              <li>
                <Strong>Email</Strong> — automatski sa naloga
              </li>
              <li>
                <Strong>Telefon</Strong> — opciono, za kontakt od strane organizatora
              </li>
              <li>
                <Strong>Datum rođenja</Strong> — minimalno 16 godina starosti
              </li>
              <li>
                <Strong>Pol</Strong> — za kategorizaciju u rezultatima
              </li>
            </Ul>

            <H3>Pregled i upravljanje prijavama</H3>
            <P>
              Sve svoje prijave možeš videti na stranici{' '}
              <InternalLink href="/my-registrations">Moje prijave</InternalLink>. Tu imaš pregled svih trka na koje si
              prijavljen, sa datumima i statusom svake prijave. Ako se predomisliš, možeš otkazati prijavu klikom na
              dugme &quot;Otkaži prijavu&quot;.
            </P>
          </Section>

          {/* 5. Omiljene */}
          <Section id="omiljene" title="Omiljene trke">
            <P>
              Omiljene trke ti omogućavaju da sačuvaš trke koje te zanimaju na jedno mesto, čak i ako se još nisi
              prijavio.
            </P>

            <H3>Kako dodati u omiljene</H3>
            <P>
              Na stranici bilo kog događaja ili trke, klikni na ikonu srca da je sačuvaš. Klikni ponovo da je ukloniš
              iz omiljenih. Ikona srca se pojavljuje pored svake trke u listi događaja i na detaljnoj stranici.
            </P>

            <H3>Pregled omiljenih</H3>
            <P>
              Sve sačuvane trke možeš videti na stranici{' '}
              <InternalLink href="/favorites">Omiljene trke</InternalLink>. Korisno je za:
            </P>
            <Ul>
              <li>Praćenje trka koje razmatraš za prijavu</li>
              <li>Podsećanje na trke koje su ti interesantne</li>
              <li>Brz pristup detaljima trka bez ponovnog pretraživanja</li>
            </Ul>
          </Section>

          {/* 6. Rezultati */}
          <Section id="rezultati" title="Rezultati">
            <P>
              Nakon završetka trke, organizator objavljuje rezultate koji su dostupni na stranici trke. Rezultati su
              javni — ne trebaš biti prijavljen da ih vidiš.
            </P>

            <H3>Tabela rezultata</H3>
            <P>Svaka tabela rezultata prikazuje:</P>
            <Ul>
              <li>
                <Strong>Poziciju</Strong> — rang u ukupnom plasmanu
              </li>
              <li>
                <Strong>Startni broj (bib)</Strong> — broj koji je takmičar nosio na trci
              </li>
              <li>
                <Strong>Ime i prezime</Strong> takmičara
              </li>
              <li>
                <Strong>Pol</Strong> — za filtriranje po kategoriji
              </li>
              <li>
                <Strong>Vremena na checkpoint-ovima</Strong> — vreme prolaska na svakoj kontrolnoj tački
              </li>
              <li>
                <Strong>Ukupno vreme</Strong> — od starta do cilja
              </li>
            </Ul>

            <H3>Filtriranje i pretraga</H3>
            <P>
              Rezultate možeš filtrirati po polu (muški/ženski) da vidiš kategorijske plasmane. Takođe možeš
              pretraživati po imenu takmičara da brzo pronađeš sebe ili nekog drugog.
            </P>

            <H3>Medalje</H3>
            <P>
              Top 3 takmičara u ukupnom plasmanu i po kategorijama dobijaju medalje — zlato, srebro i bronzu. Medalje su
              vizuelno istaknute u tabeli rezultata.
            </P>
          </Section>

          {/* 7. Lige */}
          <Section id="lige" title="Lige (Strava takmičenja)">
            <P>
              Lige su virtuelna takmičenja gde se takmičiš samostalno — nema organizovanih trka, sudija ni
              checkpoint-ova. Trčiš kad hoćeš i gde hoćeš, a tvoje aktivnosti se automatski sinhronizuju sa Strave.
            </P>

            <H3>Kako početi</H3>
            <Ol>
              <li>
                Poveži Strava nalog u <InternalLink href="/settings">Podešavanjima</InternalLink> (obavezno za
                učestvovanje)
              </li>
              <li>
                Idi na <InternalLink href="/leagues">Lige</InternalLink> i izaberi ligu koja te zanima
              </li>
              <li>Klikni &quot;Pridruži se&quot;</li>
              <li>Trči — tvoje Strava aktivnosti se automatski beleže i računaju u ligu</li>
            </Ol>

            <H3>Javne i privatne lige</H3>
            <P>
              Javnim ligama se svako može pridružiti. Privatne lige zahtevaju pozivni kod — ako imaš link sa kodom,
              automatski će se popuniti. Privatne lige su idealne za trkačke klubove ili grupe prijatelja.
            </P>

            <H3>Tipovi bodovanja</H3>
            <P>Svaka liga ima definisan način bodovanja:</P>
            <Ul>
              <li>
                <Strong>Ukupna distanca</Strong> — sabira se ukupna distanca svih validnih aktivnosti tokom trajanja
                lige. Takmičar sa najviše kilometara je prvi na listi.
              </li>
              <li>
                <Strong>Najbolje vreme</Strong> — računa se najkraće moving time na jednoj aktivnosti. Takmičar sa
                najbržom aktivnošću je prvi.
              </li>
            </Ul>

            <H3>Leaderboard</H3>
            <P>
              Svaka liga ima leaderboard koji se automatski ažurira sa svakom novom sinhronizovanom aktivnošću. Možeš
              videti svoju poziciju, ukupan skor i koliko si daleko od lidera.
            </P>

            <H3>Moje aktivnosti</H3>
            <P>
              Na stranici lige imaš sekciju &quot;Moje aktivnosti&quot; gde možeš videti sve sinhronizovane aktivnosti.
              Svaka aktivnost ima status:
            </P>
            <Ul>
              <li>
                <Strong>Validna</Strong> — aktivnost je prihvaćena i računa se u ligu
              </li>
              <li>
                <Strong>Odbijena</Strong> — aktivnost ne zadovoljava pravila lige
              </li>
              <li>
                <Strong>Na čekanju</Strong> — aktivnost čeka pregled
              </li>
            </Ul>
            <P>Svaka aktivnost ima direktan link na Stravu gde možeš videti detalje.</P>

            <H3>Pravila liga</H3>
            <P>
              Svaka liga može imati specifična pravila — minimalna distanca, tip aktivnosti (trčanje, hodanje), vremenski
              period trajanja i slično. Pravila su vidljiva na stranici lige pre pridruživanja.
            </P>
          </Section>

          {/* 8. GPX Analyzer */}
          <Section id="gpx" title="GPX Analyzer">
            <P>
              <InternalLink href="/gpx-analyzer">GPX Analyzer</InternalLink> je alat za analizu GPX ruta. Dostupan je
              svima bez registracije — idealan za pripremu za trku ili analizu završene rute.
            </P>

            <H3>Kako koristiti</H3>
            <Ol>
              <li>Otvori GPX Analyzer stranicu</li>
              <li>Prevuci GPX fajl na upload zonu ili klikni da ga izabereš sa računara</li>
              <li>Sačekaj da se fajl učita i analizira</li>
            </Ol>

            <H3>Šta dobijaš</H3>
            <Ul>
              <li>
                <Strong>Ukupna distanca</Strong> — tačna dužina staze u kilometrima
              </li>
              <li>
                <Strong>Ukupna elevacija</Strong> — zbir svih uspona (D+) i spustova (D-)
              </li>
              <li>
                <Strong>Broj tačaka</Strong> — koliko GPS tačaka sadrži fajl
              </li>
              <li>
                <Strong>Interaktivna mapa</Strong> — vizuelni prikaz kompletne rute na mapi koju možeš zumirati i
                pomerati
              </li>
              <li>
                <Strong>Top Climbs</Strong> — analiza najvećih uspona na ruti sa detaljima (dužina, visinska razlika,
                prosečan nagib)
              </li>
            </Ul>

            <H3>Preuzimanje</H3>
            <P>
              Nakon analize možeš preuzeti analizirani GPX fajl sa dodatnim podacima. Ovo je korisno ako želiš da
              sačuvaš analizu ili podeliš sa prijateljima.
            </P>
          </Section>

          {/* 9. Treninzi */}
          <Section id="treninzi" title="Treninzi">
            <P>
              Na stranici <InternalLink href="/training">Moji treninzi</InternalLink> možeš kreirati i čuvati privatne
              treninge sa GPX fajlovima. Ovo je tvoj lični prostor za organizaciju trkačkih ruta.
            </P>

            <H3>Kreiranje treninga</H3>
            <Ol>
              <li>Klikni &quot;Novi trening&quot;</li>
              <li>Unesi naziv treninga</li>
              <li>Izaberi tip — Trail, Drumska ili OCR</li>
              <li>Upload-uj GPX fajl sa rutom</li>
              <li>Sačuvaj</li>
            </Ol>

            <H3>Šta možeš raditi sa treninzima</H3>
            <Ul>
              <li>
                <Strong>Pregledaj</Strong> — vidi rutu na mapi sa svim detaljima (distanca, elevacija)
              </li>
              <li>
                <Strong>Izmeni</Strong> — promeni naziv, tip ili GPX fajl
              </li>
              <li>
                <Strong>Obriši</Strong> — ukloni trening koji ti više ne treba
              </li>
            </Ul>
            <P>
              Treninzi su privatni — samo ti možeš da ih vidiš. Korisni su za planiranje ruta, čuvanje omiljenih
              trkačkih staza i praćenje treninga.
            </P>
          </Section>

          {/* 10. Podešavanja */}
          <Section id="podesavanja" title="Podešavanja">
            <P>
              U <InternalLink href="/settings">Podešavanjima</InternalLink> možeš upravljati svim aspektima svog naloga.
            </P>

            <H3>Profil</H3>
            <P>
              Pregled osnovnih informacija o tvom nalogu — ime i prezime, email adresa, uloga (standardni korisnik ili
              administrator) i status verifikacije email-a.
            </P>

            <H3>Email obaveštenja</H3>
            <P>Kontroliši koja obaveštenja primaš na email:</P>
            <Ul>
              <li>
                <Strong>Mesečni raspored trka</Strong> — pregled svih trka za naredni mesec, šalje se 1. svakog meseca
              </li>
              <li>
                <Strong>Vesti i novosti</Strong> — obaveštenja o novim funkcionalnostima i ažuriranjima platforme
              </li>
              <li>
                <Strong>Nove trke</Strong> — obaveštenje kada se nova trka doda na platformu
              </li>
            </Ul>
            <P>Svako obaveštenje možeš pojedinačno uključiti ili isključiti.</P>

            <H3>Strava integracija</H3>
            <P>
              Poveži ili odvoji svoj Strava nalog. Povezivanje je obavezno za učešće u ligama — bez Strave, liga ne može
              da preuzme tvoje aktivnosti. Kad povežeš Stravu, videćeš status konekcije i ime povezanog Strava naloga.
              Možeš u svakom trenutku odvojiti nalog.
            </P>

            <H3>Tema</H3>
            <P>
              Izaberi vizuelnu temu platforme — tamna, svetla ili sistemska (automatski prati podešavanja tvog uređaja).
              Temu možeš promeniti i iz dropdown menija u headeru.
            </P>
          </Section>

          {/* 11. FAQ */}
          <Section id="faq" title="Česta pitanja">
            <Faq question="Da li je registracija besplatna?">
              Da, registracija i korišćenje platforme su potpuno besplatni. Nema skrivenih troškova ni premium planova.
            </Faq>
            <Faq question="Da li mogu da pregledam trke bez naloga?">
              Da, pregledanje događaja, kalendar, detalji trka, rezultati i GPX Analyzer su dostupni svima bez
              registracije. Nalog je potreban samo za prijavu na trke, omiljene, treninge i lige.
            </Faq>
            <Faq question="Da li mogu da se prijavim na trku bez naloga?">
              Ne, potreban ti je nalog da bi se prijavio na trku. Registracija traje manje od minut — možeš koristiti
              email ili Google nalog.
            </Faq>
            <Faq question="Kako da povežem Strava nalog?">
              Idi u Podešavanja i klikni na &quot;Connect with Strava&quot; dugme. Bićeš preusmeren na Stravu gde ćeš
              odobriti pristup. Nakon toga, tvoje aktivnosti se automatski sinhronizuju sa ligama.
            </Faq>
            <Faq question="Kako da otkazem prijavu na trku?">
              Idi na Moje prijave i klikni dugme &quot;Otkaži prijavu&quot; pored trke koju želiš da otkažeš. Otkazivanje
              je moguće u bilo kom trenutku pre trke.
            </Faq>
            <Faq question="Da li mogu da koristim GPX Analyzer bez naloga?">
              Da, GPX Analyzer je dostupan svima — nije potrebna registracija. Samo upload-uj GPX fajl i dobićeš
              kompletnu analizu.
            </Faq>
            <Faq question="Kako da dodam svoju trku na platformu?">
              Kontaktiraj nas putem emaila na{' '}
              <a href="mailto:djoric.inbox@gmail.com" className="text-brand-green hover:underline">
                djoric.inbox@gmail.com
              </a>{' '}
              sa detaljima o trci (naziv, datum, lokacija, distance). Trke dodajemo besplatno.
            </Faq>
            <Faq question="Šta ako ne dobijem verifikacioni email?">
              Proveri spam/junk folder. Ako email nije stigao, na vrhu stranice imaš baner gde možeš zatražiti novi
              verifikacioni email. Ako problem potraje, kontaktiraj nas.
            </Faq>
            <Faq question="Kako da promenim temu (tamna/svetla)?">
              Klikni na svoje ime u headeru i izaberi opciju za promenu teme, ili idi u Podešavanja. Možeš izabrati
              tamnu, svetlu ili sistemsku temu.
            </Faq>
            <Faq question="Da li su moji treninzi vidljivi drugima?">
              Ne, treninzi su potpuno privatni. Samo ti možeš da ih vidiš i upravljaš njima.
            </Faq>
          </Section>
        </div>
      </div>

      {/* Floating sidebar — table of contents */}
      <aside className="hidden w-52 shrink-0 lg:block">
        <nav className="sticky top-[50vh] -translate-y-1/2">
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
