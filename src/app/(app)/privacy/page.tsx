import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politika privatnosti / Privacy Policy — Trke Srbija',
  description: 'Politika privatnosti platforme Trke Srbija. Privacy Policy for Trke Srbija platform.',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
        Politika privatnosti
      </h1>
      <p className="mt-1 text-sm text-text-muted">Poslednje ažuriranje: mart 2026.</p>
      <p className="mt-3 text-base text-text-secondary">
        Ova politika privatnosti opisuje kako Trke Srbija prikuplja, koristi i štiti podatke korisnika.
      </p>

      <div className="mt-10 space-y-10">
        <Section title="1. Koje podatke prikupljamo">
          <P>Prikupljamo sledeće kategorije podataka:</P>
          <Ul>
            <li><Strong>Podaci o nalogu</Strong> — ime i prezime, email adresa, šifrovana lozinka.</li>
            <li><Strong>Podaci za prijavu na trku</Strong> — datum rođenja, pol, broj telefona (opciono).</li>
            <li>
              <Strong>Podaci iz spoljnih servisa</Strong> — kada povežete Strava ili Garmin nalog, preuzimamo
              podatke o vašim trkačkim aktivnostima (naziv aktivnosti, distanca, vreme, elevacija, datum).
              Ne preuzimamo GPS koordinate, zdravstvene podatke (puls, VO2 max) niti privatne poruke.
            </li>
            <li><Strong>Tehnički podaci</Strong> — kolačići sesije potrebni za prijavu na platformu.</li>
          </Ul>
        </Section>

        <Section title="2. Kako koristimo vaše podatke">
          <Ul>
            <li>Prikaz vašeg profila i upravljanje nalogom.</li>
            <li>Obrada prijava na trke i komunikacija sa organizatorima.</li>
            <li>
              Automatski uvoz trkačkih aktivnosti iz Strave ili Garmin Connect-a radi praćenja bodova u
              virtualnim ligama na platformi. Aktivnosti se koriste <Strong>isključivo za ovu svrhu</Strong> i
              ne dele se sa trećim stranama.
            </li>
            <li>Slanje email obaveštenja (samo ako ste pristali u podešavanjima).</li>
          </Ul>
        </Section>

        <Section title="3. Deljenje podataka sa trećim stranama">
          <P>
            Vaše podatke <Strong>ne prodajemo i ne delimo</Strong> sa trećim stranama u komercijalne svrhe.
          </P>
          <P>
            Koristimo sledeće spoljne servise za funkcionisanje platforme:
          </P>
          <Ul>
            <li><Strong>Neon (PostgreSQL)</Strong> — hosting baze podataka (EU Central).</li>
            <li><Strong>Vercel</Strong> — hosting frontend aplikacije.</li>
            <li><Strong>UploadThing</Strong> — čuvanje slika i GPX fajlova.</li>
            <li><Strong>Resend</Strong> — slanje transakcijskih email poruka.</li>
            <li><Strong>Strava API</Strong> — preuzimanje aktivnosti za ligu (samo uz vašu eksplicitnu dozvolu).</li>
            <li><Strong>Garmin Connect API</Strong> — preuzimanje aktivnosti za ligu (samo uz vašu eksplicitnu dozvolu).</li>
          </Ul>
          <P>Svi navedeni servisi obrađuju podatke u skladu sa GDPR propisima.</P>
        </Section>

        <Section title="4. Vaša prava">
          <Ul>
            <li><Strong>Uvid</Strong> — možete zatražiti uvid u sve podatke koje čuvamo o vama.</li>
            <li><Strong>Ispravka</Strong> — možete izmeniti podatke profila direktno u podešavanjima.</li>
            <li>
              <Strong>Brisanje</Strong> — možete zatražiti brisanje naloga i svih povezanih podataka slanjem
              emaila na{' '}
              <a href="mailto:milos@trkesrbija.rs" className="text-brand-green hover:underline">
                milos@trkesrbija.rs
              </a>.
            </li>
            <li>
              <Strong>Odvajanje Strava / Garmin naloga</Strong> — u svakom trenutku možete odvojiti integrisani
              nalog u Podešavanjima. Nakon odvajanja, više ne preuzimamo nove aktivnosti.
            </li>
          </Ul>
        </Section>

        <Section title="5. Kolačići (cookies)">
          <P>
            Koristimo isključivo funkcionalne kolačiće neophodne za prijavu (httpOnly kolačić za refresh token
            sesije). Ne koristimo kolačiće za praćenje ili remarketing.
          </P>
        </Section>

        <Section title="6. Kontakt">
          <P>
            Za sva pitanja u vezi sa privatnošću podataka, kontaktirajte nas na:{' '}
            <a href="mailto:milos@trkesrbija.rs" className="text-brand-green hover:underline">
              milos@trkesrbija.rs
            </a>
          </P>
        </Section>

        {/* Divider */}
        <div className="border-t border-border-primary pt-10">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-1 text-sm text-text-muted">Last updated: March 2026.</p>
          <p className="mt-3 text-base text-text-secondary">
            This privacy policy describes how Trke Srbija collects, uses, and protects user data.
          </p>
        </div>

        <Section title="1. Data We Collect">
          <P>We collect the following categories of data:</P>
          <Ul>
            <li><Strong>Account data</Strong> — first and last name, email address, encrypted password.</li>
            <li><Strong>Race registration data</Strong> — date of birth, gender, phone number (optional).</li>
            <li>
              <Strong>Third-party service data</Strong> — when you connect your Strava or Garmin account, we
              retrieve data about your running activities (activity name, distance, time, elevation, date). We
              do not retrieve GPS coordinates, health metrics (heart rate, VO2 max), or private messages.
            </li>
            <li><Strong>Technical data</Strong> — session cookies required for login.</li>
          </Ul>
        </Section>

        <Section title="2. How We Use Your Data">
          <Ul>
            <li>Displaying your profile and managing your account.</li>
            <li>Processing race registrations and communicating with organizers.</li>
            <li>
              Automatically importing running activities from Strava or Garmin Connect to track points in
              virtual leagues on the platform. Activities are used <Strong>solely for this purpose</Strong> and
              are not shared with third parties.
            </li>
            <li>Sending email notifications (only if you opted in via settings).</li>
          </Ul>
        </Section>

        <Section title="3. Sharing Data with Third Parties">
          <P>
            We <Strong>do not sell or share</Strong> your data with third parties for commercial purposes.
          </P>
          <P>We use the following external services to operate the platform:</P>
          <Ul>
            <li><Strong>Neon (PostgreSQL)</Strong> — database hosting (EU Central).</li>
            <li><Strong>Vercel</Strong> — frontend application hosting.</li>
            <li><Strong>UploadThing</Strong> — storage for images and GPX files.</li>
            <li><Strong>Resend</Strong> — transactional email delivery.</li>
            <li><Strong>Strava API</Strong> — activity import for leagues (only with your explicit consent).</li>
            <li><Strong>Garmin Connect API</Strong> — activity import for leagues (only with your explicit consent).</li>
          </Ul>
          <P>All listed services process data in compliance with GDPR regulations.</P>
        </Section>

        <Section title="4. Your Rights">
          <Ul>
            <li><Strong>Access</Strong> — you may request access to all data we store about you.</li>
            <li><Strong>Correction</Strong> — you may edit your profile data directly in settings.</li>
            <li>
              <Strong>Deletion</Strong> — you may request deletion of your account and all associated data by
              sending an email to{' '}
              <a href="mailto:milos@trkesrbija.rs" className="text-brand-green hover:underline">
                milos@trkesrbija.rs
              </a>.
            </li>
            <li>
              <Strong>Disconnect Strava / Garmin</Strong> — you may disconnect your integrated account at any
              time in Settings. Once disconnected, we no longer retrieve new activities.
            </li>
          </Ul>
        </Section>

        <Section title="5. Cookies">
          <P>
            We use only functional cookies required for login (an httpOnly refresh token session cookie). We do
            not use tracking or remarketing cookies.
          </P>
        </Section>

        <Section title="6. Contact">
          <P>
            For any questions regarding data privacy, contact us at:{' '}
            <a href="mailto:milos@trkesrbija.rs" className="text-brand-green hover:underline">
              milos@trkesrbija.rs
            </a>
          </P>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
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
