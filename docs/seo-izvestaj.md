# SEO Izveštaj — Trke Srbija

## Stanje pre optimizacije

Sajt je već imao solidnu SEO osnovu:
- Root metadata sa OG, Twitter, keywords, description
- `generateMetadata()` na dinamičkim rutama (events, races, calendar)
- JSON-LD: Organization, Website, SiteNavigation, SportsEvent, Breadcrumb
- GTM sa exclude listom za admin/judge
- Semantic HTML (header, nav, main, footer)
- ARIA atributi i alt tekstovi
- Canonical URLs na ključnim stranicama
- ISR (Incremental Static Regeneration) sa razumnim revalidate vremenima
- Admin zaštita od indeksiranja (noindex, nofollow)
- robots.txt i dinamički sitemap.xml
- 404 i error stranice

---

## Implementirane optimizacije

### 1. `next/image` umesto `<img>` za galeriju slika
**Fajl:** `src/components/image-slider.tsx`

Galerija slika na stranicama događaja je konvertovana sa sirovog `<img>` taga na Next.js `Image` komponentu.

**Šta donosi:**
- Automatska konverzija u WebP/AVIF format (manja veličina fajla)
- Lazy loading (slike se učitavaju tek kad su vidljive)
- Responsive `srcset` (browser bira optimalnu rezoluciju)
- Priority loading za prvu sliku (poboljšava LCP metriku)

**Uticaj:** Direktno poboljšava **Largest Contentful Paint (LCP)** — jedna od tri Core Web Vitals metrike koje Google koristi za rangiranje.

---

### 2. Preconnect i DNS-prefetch za eksterne servise
**Fajl:** `src/app/layout.tsx`

Dodati `preconnect` i `dns-prefetch` hintovi za:
- **UploadThing CDN** (`utfs.io`) — odakle se učitavaju sve slike
- **Google Tag Manager** (`googletagmanager.com`) — analytics skript

**Šta donosi:**
- Browser unapred uspostavlja TCP/TLS konekciju sa eksternim serverima
- Smanjuje latenciju za prvi zahtev ka tim domenima za ~100-300ms
- DNS-prefetch kao fallback za browsere koji ne podržavaju preconnect

**Uticaj:** Poboljšava **Time to First Byte (TTFB)** za slike i analytics, ubrzava inicijalno učitavanje stranice.

---

### 3. Security headeri
**Fajl:** `next.config.mjs`

Dodati HTTP security headeri na sve stranice:

| Header | Vrednost | Svrha |
|--------|----------|-------|
| X-Content-Type-Options | `nosniff` | Sprečava MIME type sniffing |
| X-Frame-Options | `DENY` | Sprečava iframe embedding (clickjacking zaštita) |
| Referrer-Policy | `strict-origin-when-cross-origin` | Kontroliše koliko referrer info se šalje |

**Uticaj:** Poboljšava **trust score** sajta. Google ne rangira direktno po headerima, ali security signali indirektno utiču na ranking. Takođe štiti korisnike.

---

### 4. GPX Analyzer metadata
**Fajl:** `src/app/(app)/gpx-analyzer/layout.tsx` (novi)

GPX Analyzer stranica je bila bez SEO metapodataka jer je `'use client'` komponenta. Dodat je layout.tsx sa:
- Title: "GPX Analyzer"
- Description: "Analizirajte GPX fajlove vaših trka..."
- Canonical URL: `/gpx-analyzer`
- OpenGraph tagovi

**Uticaj:** Google sada ima relevantan snippet za prikaz u rezultatima pretrage umesto auto-generisanog teksta.

---

### 5. Loading states za ključne rute
**Fajlovi:** 4 nova `loading.tsx` fajla

Dodati Suspense loading states za:
- `/events/[slug]` — stranica događaja
- `/races/[slug]` — stranica trke
- `/calendar` — kalendar
- `/gpx-analyzer` — GPX analyzer

**Šta donosi:**
- Instant vizuelni feedback dok se podaci učitavaju
- Next.js automatski streamuje HTML sa loading state-om pre nego što podaci stignu

**Uticaj:** Poboljšava **Interaction to Next Paint (INP)** i **First Input Delay (FID)** — perceived performance je bolja.

---

### 6. Remote image patterns
**Fajl:** `next.config.mjs`

Konfiguracija za `next/image` da prihvata slike sa UploadThing domena (`utfs.io`, `*.ufs.sh`).

**Šta donosi:** Omogućava korišćenje Next.js image optimizacije za sve slike koje se hostuju na UploadThing CDN-u.

---

## Šta je već bilo implementirano

| Stavka | Status | Napomena |
|--------|--------|----------|
| robots.txt | ✅ Postoji | Disallow za admin, judge, settings, favorites, training, api |
| sitemap.xml | ✅ Dinamički | Statičke + dinamičke rute (events, races), ISR 1h |
| Root metadata | ✅ Kompletno | Title template, description, keywords, OG, Twitter |
| Dinamički metadata | ✅ Na ključnim rutama | events, events/[slug], races/[slug], calendar |
| JSON-LD structured data | ✅ 5 šema | Organization, Website, SiteNavigation, SportsEvent, Breadcrumb |
| Breadcrumb JSON-LD | ✅ Na detaljima | events/[slug], races/[slug] |
| Canonical URLs | ✅ Na ključnim stranicama | /, /events, /events/[slug], /races/[slug], /calendar |
| ISR | ✅ Konfigurisano | Homepage/events 5min, race/event detail 1min, sitemap 1h |
| lang atribut | ✅ `sr` | Na `<html>` tagu |

---

## Preporuke za dalje

### Kratkoročno
- **Google Search Console** — verifikovati sajt i submit-ovati sitemap
- **PageSpeed Insights** — izmeriti CWV pre i posle deploy-a za baseline
- **Rich Results Test** — proveriti da Google pravilno čita JSON-LD šeme

### Srednjoročno
- Konvertovati preostale `<img>` tagove na `next/image` (avatar, ad baneri)
- Dodati `generateMetadata` za `/races/[slug]/results` stranicu
- Razmotriti OG sliku generisanje po stranici (custom OG za svaki event)

### Dugoročno
- Blog/sadržaj sekcija za organski saobraćaj (vodiči za trke, saveti za trening)
- Internal linking strategija između povezanih trka
- Schema.org `Course` markup za GPX rute
