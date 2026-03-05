# Analytics Rework Plan

## Context

Statistike sistem ima više ključnih problema koji utiču na pouzdanost podataka, performanse i bezbednost. Pored popravki, radimo i kompletno redefinisanje metrika, uvođenje novih, i reorganizaciju dashboarda.

---

## 0. Čišćenje postojećih neispravnih podataka

**Tip:** Jednokratna SQL skripta (pokreće se ručno pre deploy-a)

### Zašto?
Svi dosadašnji PAGE_VIEW zapisi sadrže botove (Googlebot, Bingbot, itd.) jer nije postojao bot filter. Ti zapisi iskrivljuju sve istorijske statistike — topEvents, topRaces, viewsPerDay, newVisitors. Nema smisla graditi nove metrike na prljavim podacima.

### Šta radimo
SQL skripta `backend/scripts/cleanup-bot-analytics.sql`:

```sql
-- 1. Obriši sve PAGE_VIEW/SEARCH evente koji nemaju visitorId NI userId
--    (to su ghost zapisi koji ne doprinose nijednoj metrici)
DELETE FROM "AnalyticsEvent"
WHERE "visitorId" IS NULL AND "userId" IS NULL;

-- 2. Obriši sve zapise gde je metadata prazan JSON ili null za SEARCH tip
DELETE FROM "AnalyticsEvent"
WHERE type = 'SEARCH'
  AND (metadata IS NULL OR metadata::text = '{}' OR metadata::text = 'null');

-- 3. Prikaži koliko je ostalo zapisa posle čišćenja
SELECT type, COUNT(*) FROM "AnalyticsEvent" GROUP BY type;
```

**Napomena:** Bot zapisi se NE mogu retroaktivno identifikovati jer User-Agent nije snimljen u bazu. Zato je ključno da se bot filter (korak 2) ugradi pre nego što se nastavi sa prikupljanjem podataka. Stari podaci ostaju "prljavi" ali se postepeno brišu kroz data retention cron (korak 5).

---

## 1. Rate limit na trackEvent

**Fajl:** `backend/src/app.ts`

### Zašto?
`trackEvent` je javni GraphQL endpoint — ne zahteva autentifikaciju. Bilo ko može napisati skriptu koja šalje hiljade lažnih page view evenata u sekundi i potpuno iskriviti statistiku. Trenutno jedina zaštita je generalni limiter od 100 req/min, što je previše za analytics spam.

### Šta radimo
Dodajemo `trackEventRateLimiter` po istom pattern-u kao postojeći `reportRateLimiter`:
- **60 req/min po IP-u** — normalan korisnik generiše 1-2 page viewa po minutu, 60 daje veliku rezervu za brzu navigaciju ali blokira skripte
- `skip`: ako query ne sadrži `trackevent` mutaciju (ne usporava ostale upite)
- `keyGenerator`: `track-${req.ip}`
- Registruje se u nizu middleware-a na `/graphql`

---

## 2. Bot filtering

**Fajlovi:** `backend/src/graphql/context.ts` + `backend/src/graphql/resolvers/analytics.resolver.ts`

### Zašto?
Google bot, Bing crawler, Facebook scraper, SEMrush, Ahrefs i drugi crawleri posećuju svaku stranicu i generišu PAGE_VIEW evente. To napumpava statistiku — umesto pravih korisnika, vidimo botove. Na sajtu sa 50+ evenata, crawleri mogu generisati stotine lažnih pregleda dnevno.

### Šta radimo
**context.ts:**
- Dodajemo `userAgent: string` u `GraphQLContext` type
- U `buildContext()`: čitamo `req.headers['user-agent']`

**analytics.resolver.ts:**
- Regex sa poznatim botovima: `googlebot|bingbot|facebookexternalhit|twitterbot|linkedinbot|semrushbot|ahrefsbot|petalbot|bytespider|spider|crawl|bot`
- U `trackEvent`: ako je bot → `return true` bez upisa u bazu (bot dobija uspešan odgovor ali se ništa ne snima)

---

## 3. Sve metrike poštuju vremenski filter

**Fajl:** `backend/src/graphql/resolvers/analytics.resolver.ts`

### Zašto?
Admin bira "Poslednjih 7 dana" ali `topSearches`, `topFavorites` i `topUsers` prikazuju all-time podatke. To zbunjuje — misliš da gledaš nedeljnu statistiku, a zapravo vidiš kumulativne brojeve od početka. Period selector deluje kao da ne radi za pola stranice.

### Šta radimo
Dodajemo `AND "createdAt" >= ${since} AND "createdAt" < ${until}` na:
- **topSearches** — raw SQL upit (trenutno bez WHERE na createdAt)
- **topUsers** — raw SQL upit (trenutno bez WHERE na createdAt)
- **topFavorites** — Prisma groupBy dodajemo `where: { createdAt: { gte: since, lt: until } }`

Posle ovoga, sve metrike na stranici reaguju na izabrani period.

---

## 4. Optimizovati new visitors upit

**Fajl:** `backend/src/graphql/resolvers/analytics.resolver.ts`

### Zašto?
Trenutni upit radi `MIN(createdAt)` po svakom `visitorId` u celoj tabeli, pa filtrira sa `HAVING`. Sa 100.000+ redova, ovo je full table scan svaki put kad admin otvori statistiku. Što više podataka, to je sporije — i nema gornje granice jer tabela raste.

### Šta radimo
Zamenjujemo `MIN(createdAt) ... HAVING` sa `NOT EXISTS` pristupom:
```sql
SELECT TO_CHAR(a."createdAt" AT TIME ZONE 'Europe/Belgrade', 'YYYY-MM-DD') AS date,
       COUNT(DISTINCT a."visitorId") AS count
FROM "AnalyticsEvent" a
WHERE a."visitorId" IS NOT NULL
  AND a."createdAt" >= ${since} AND a."createdAt" < ${until}
  AND NOT EXISTS (
      SELECT 1 FROM "AnalyticsEvent" b
      WHERE b."visitorId" = a."visitorId" AND b."createdAt" < ${since}
  )
GROUP BY date ORDER BY date ASC
```
`NOT EXISTS` koristi indeks na `visitorId` i zaustavlja se čim nađe prvi raniji zapis — umesto da skenira celu tabelu.

---

## 5. Data retention cron

**Novi fajl:** `backend/src/services/analytics-cleanup.service.ts`
**Izmena:** `backend/src/server.ts`

### Zašto?
AnalyticsEvent tabela raste neograničeno. Sa ~1000 dnevnih poseta, za 6 meseci imaš ~180.000 redova. Za godinu ~365.000. Svi upiti (topEvents, topRaces, viewsPerDay, newVisitors) postaju sve sporiji jer skeniraju veću tabelu. Nema razloga čuvati detaljne page view podatke starije od 3 meseca.

### Šta radimo
- Novi servis sa **dualnom retencijom**:
  - Zapisi sa `userId IS NOT NULL` (logovi aktivnosti korisnika) → brišu se posle **7 dana**
  - Ostali zapisi (anonimni page views, pretrage) → brišu se posle **90 dana**
- Pokreće se svaki dan u 03:00 po beogradskom vremenu (van špica)
- Pattern identičan postojećem `daily-report.service.ts`
- U `server.ts`: dodajemo `startAnalyticsCleanupCron()` pored ostalih cron-ova

---

## 6. GIN indeks na metadata

**Fajl:** `backend/prisma/schema.prisma`

### Zašto?
`topSearches` upit filtrira po `metadata->>'query'` — izvlači tekst iz JSON kolone. Bez indeksa, PostgreSQL mora da parsira JSON u svakom redu tabele. GIN (Generalized Inverted Index) indeks omogućava brze pretrage unutar JSON podataka.

### Šta radimo
Dodajemo na AnalyticsEvent model:
```prisma
@@index([metadata], type: Gin)
```
Pokrenuti `npm run prisma:migrate` nakon izmene.

---

## 7. Frontend — unifikovati layout

**Fajl:** `frontend/src/app/(app)/admin/stats/page.tsx`

### Zašto?
Trenutno su metrike podeljene u 3 sekcije: "po periodu", "sve vreme", i "danas". Posle koraka 3 (sve metrike poštuju filter), podela "po periodu" vs "sve vreme" više nema smisla — sve je po periodu. Ostavljanje stare podele zbunjuje admina.

### Šta radimo
- Ukloniti "Sve vreme" i "Danas" sekcijske dividere
- Sve metrike u jedinstvenoj grid mreži (sve sad poštuju filter)
- `recentLogins` ostaje na dnu kao posebna sekcija jer uvek prikazuje "danas" (nezavisno od filtera)
- Layout: 3-kolona grid za desktop, stack na mobilnom

---

## 8. Kompletna definicija metrika

### Postojeće metrike — šta ostaje, šta se menja

| # | Metrika | Status | Izmena |
|---|---------|--------|--------|
| 1 | **Top događaji** (topEvents) | ✅ Ostaje | Već poštuje filter — bez izmena |
| 2 | **Top trke** (topRaces) | ✅ Ostaje | Već poštuje filter — bez izmena |
| 3 | **Top pretrage** (topSearches) | ✅ Ostaje | Dodati time filter (korak 3) |
| 4 | **Top omiljene** (topFavorites) | ✅ Ostaje | Dodati time filter (korak 3) |
| 5 | **Najaktivniji korisnici** (topUsers) | ✅ Ostaje | Dodati time filter (korak 3) |
| 6 | **Pregledi po danu** (viewsPerDay) | ✅ Ostaje | Bez izmena |
| 7 | **Jedinstveni posetioci** (totalUniqueVisitors) | ✅ Ostaje | Bez izmena |
| 8 | **Novi posetioci** (newVisitorCount + newVisitorsPerDay) | ✅ Ostaje | Optimizovati upit (korak 4) |
| 9 | **Povratnici** (izračunava se na frontendu) | ✅ Ostaje | Bez izmena (unique - new) |
| 10 | **Ko se logovao danas** (recentLogins) | ✅ Ostaje | Uvek prikazuje "danas" nezavisno od filtera |

### Nove metrike — predlozi

| # | Metrika | Izvor podataka | Opis |
|---|---------|----------------|------|
| 11 | **Rast korisnika po danu** | `User.createdAt` | Broj novih registracija po danu u periodu. Pokazuje da li sajt raste. |
| 12 | **Ukupno korisnika** | `User` COUNT | Ukupan broj registrovanih korisnika. Prikazuje se kao KPI kartica. |
| 13 | **Registracije po statusu** | `RaceRegistration.status` | Koliko registracija je PENDING / CONFIRMED / PAID / CANCELLED u periodu. Pokazuje konverziju. |
| 14 | **Verifikovani vs neverifikovani** | `User.emailVerified` | Procenat korisnika koji su verifikovali email. Ukazuje na kvalitet registracija. |
| 15 | **Prijave po događaju** | `RaceRegistration` JOIN `Race` JOIN `RaceEvent` | Top događaji po broju prijava (ne pregleda). Pokazuje stvarni interes. |
| 16 | **Ukupno prijava** | `RaceRegistration` COUNT | Broj prijava u periodu. KPI kartica. |
| 17 | **Aktivnost korisnika** (user activity log) | `AnalyticsEvent` WHERE `userId` IS NOT NULL | Za svakog ulogovanog korisnika — lista stranica koje je posetio, pretrage koje je radio, sa vremenskim oznakama. Prikazuje se kao expandable row u "Ko se logovao danas" tabeli. |

---

## 9. Grupisanje dashboarda

### Zašto?
Trenutno su metrike nabacane u 3 sekcije bez jasne logike ("po periodu", "sve vreme", "danas"). Posle rework-a sve poštuju filter, pa stare sekcije gube smisao. Potrebna je semantička organizacija — admin treba na prvi pogled da vidi šta ga zanima.

### Nova organizacija

**KPI kartice** (vrh stranice, uvek vidljive)
- Ukupno pregleda u periodu (sum viewsPerDay.count)
- Jedinstveni posetioci
- Novi posetioci
- Ukupno korisnika
- Ukupno prijava u periodu

**Grupa 1: Saobraćaj**
- Pregledi po danu (tabela/grafikon)
- Novi posetioci po danu
- Top pretrage

**Grupa 2: Sadržaj**
- Top događaji (po pregledima)
- Top trke (po pregledima)
- Top omiljene trke

**Grupa 3: Korisnici**
- Najaktivniji korisnici (po pregledima)
- Rast korisnika po danu (NOVO)
- Verifikovani vs neverifikovani (NOVO)

**Grupa 4: Prijave** (NOVO)
- Prijave po događaju
- Registracije po statusu (PENDING/CONFIRMED/PAID/CANCELLED)

**Grupa 5: Aktivnost** (dno stranice)
- Ko se logovao danas (uvek prikazuje danas)
- Klikom na korisnika → expandable row sa logom aktivnosti (šta je posećivao, pretraživao)

### Layout
- KPI kartice: horizontalni red sa 5 kartica (responsive — 2 kolone na mobilnom)
- Svaka grupa: naslov + 3-kolona grid ispod
- Grupe razdvojene subtilnim dividerom

---

## 10. Log aktivnosti po korisniku

**Fajlovi:** `backend/src/graphql/resolvers/analytics.resolver.ts` + `backend/src/graphql/schema.ts` + `frontend/src/app/(app)/admin/stats/page.tsx`

### Zašto?
"Ko se logovao danas" prikazuje samo da se neko ulogovao i koliko puta. Ali admin ne vidi šta je korisnik radio — koje stranice je gledao, šta je pretraživao. Ta informacija već postoji u `AnalyticsEvent` tabeli (svaki page view i search ima `userId` ako je korisnik ulogovan), samo je ne prikazujemo.

### Šta radimo

**Backend — novi query:**
```graphql
type UserActivityEntry {
  type: String!           # PAGE_VIEW ili SEARCH
  entityType: String      # EVENT, RACE, ili null
  entityId: String
  entityName: String      # Resolovano ime događaja/trke
  searchQuery: String     # Za SEARCH tip — metadata.query
  createdAt: String!      # ISO timestamp
}

userActivity(userId: ID!, date: String): [UserActivityEntry!]!
```

**Resolver:**
```sql
SELECT type, "entityType", "entityId", metadata, "createdAt"
FROM "AnalyticsEvent"
WHERE "userId" = ${userId}
  AND "createdAt" >= ${dayStart} AND "createdAt" < ${dayEnd}
ORDER BY "createdAt" DESC
LIMIT 100
```
- Za svaki `entityId` resolovati ime iz RaceEvent/Race tabele (koristiti DataLoader za N+1 zaštitu)
- Za SEARCH tip izvući `metadata->>'query'`

**Frontend:**
- U "Ko se logovao danas" tabeli, svaki red ima chevron ikonu za expand
- Klikom se otvara nested red sa listom aktivnosti:
  ```
  14:32  📄 Posetio: Divčibare Ultra Trail 2025
  14:28  📄 Posetio: Tara Mountain Race
  14:25  🔍 Pretraga: "divčibare"
  14:20  📄 Posetio: Početna stranica
  ```
- Lazy load — `userActivity` query se poziva tek kad admin klikne expand (ne opterećuje početno učitavanje)

**Retencija:** Detaljni logovi aktivnosti korisnika se čuvaju maksimalno **7 dana**. Data retention cron (korak 4) briše `AnalyticsEvent` zapise sa `userId IS NOT NULL` starije od 7 dana. Anonimni zapisi (bez userId) ostaju na 90 dana kao u koraku 5.

---

## Redosled implementacije

| Korak | Opis | Repo |
|-------|------|------|
| 0 | Čišćenje neispravnih podataka (jednokratna skripta) | backend |
| 1 | Rate limiter + userAgent u context + bot filtering | backend |
| 2 | Time filter na sve metrike + optimizacija new visitors | backend |
| 3 | GIN indeks + Prisma migracija | backend |
| 4 | Analytics cleanup cron | backend |
| 5 | Nove metrike u resolver + GraphQL schema | backend |
| 6 | Frontend — KPI kartice, grupisanje, nove sekcije | frontend |

## Ključni fajlovi

- `backend/scripts/cleanup-bot-analytics.sql` — NOVI: jednokratna skripta za čišćenje
- `backend/src/app.ts` — rate limiter
- `backend/src/graphql/context.ts` — userAgent u kontekstu
- `backend/src/graphql/resolvers/analytics.resolver.ts` — bot filter, time filters, query optimizacija, nove metrike
- `backend/src/graphql/schema.ts` — proširiti AnalyticsStats type sa novim poljima
- `backend/prisma/schema.prisma` — GIN indeks
- `backend/src/services/analytics-cleanup.service.ts` — NOVI fajl
- `backend/src/server.ts` — registracija cron-a
- `frontend/src/app/(app)/admin/stats/page.tsx` — kompletni layout refaktor sa grupama i KPI karticama

## Verifikacija

1. `cd backend && npm run build` — kompajliranje bez grešaka
2. `cd backend && npm run prisma:migrate` — migracija prođe
3. `cd frontend && npm run build` — frontend build
4. Otvoriti /admin/stats, promeniti period filter — sve sekcije reaguju na filter
5. Test bot filtriranja: `curl` sa `User-Agent: Googlebot` → ne upisuje se u bazu
6. KPI kartice prikazuju ispravne brojeve
7. Sve grupe prikazuju podatke filtrirane po izabranom periodu
8. Nove metrike (rast korisnika, registracije po statusu) vraćaju podatke
