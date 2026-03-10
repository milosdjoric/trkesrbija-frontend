# Lokalne Offline Lige — Strava integracija

## Ideja

Korisnici se prijavljuju u lige i trče samostalno — nema organizovanih trka, sudija ni checkpoint-a. Podaci se automatski sinhronizuju sa Strave. Takmičari se rangiraju na leaderboard-u po najbržem vremenu.

**Primer:** Admin kreira ligu "Beogradska 10K Liga — Mart 2026". Korisnici se pridruže, povežu Strava nalog, i svaki put kad istrče 10km — vreme se automatski pojavi na leaderboard-u.

---

## Faze razvoja

### Faza 1 (MVP): Distance-based lige + Strava sync
- Liga se definiše po distanci (npr. 10km ± tolerancija)
- Strava OAuth za sinhronizaciju aktivnosti
- Leaderboard po najbržem vremenu (BEST_TIME)
- Admin kreira lige, korisnici se prijavljivaju

### Faza 2: Route-based lige (GPS matching)
- Liga se vezuje za specifičnu GPX rutu
- GPS corridor matching — validacija da je korisnik zaista trčao tu rutu
- Korišćenje `@turf/turf` za geo kalkulacije

### Faza 3: Napredne funkcionalnosti
- Više scoring modova (ukupno vreme, ukupna kilometraža, bodovi)
- Age group kategorije
- Sezonska rangiranja
- Manual GPX upload (bez Strave)
- Liga chat / social features
- Achievements / badges

---

## MVP arhitektura

### Novi Prisma modeli

```
League
├── name, slug, description
├── type: DISTANCE | ROUTE
├── status: DRAFT | ACTIVE | COMPLETED | ARCHIVED
├── period: WEEKLY | MONTHLY | SEASONAL
├── minDistance, maxDistance (km)
├── startDate, endDate
├── isPublic, inviteCode (za privatne lige)
└── createdById → User

LeagueMembership
├── userId → User
├── leagueId → League
├── role: MEMBER | ADMIN
├── gender (unosi se pri joinu)
└── unique: [userId, leagueId]

LeagueActivity
├── leagueId → League
├── userId → User
├── source: STRAVA | MANUAL
├── stravaActivityId (unique)
├── distance, elapsedTime, movingTime, elevationGain
├── startDate
└── status: PENDING | VALID | REJECTED

StravaConnection
├── userId → User (unique)
├── stravaAthleteId (unique)
├── accessToken, refreshToken, expiresAt
└── scope
```

### Strava integracija

**OAuth flow:**
1. Korisnik klikne "Poveži Strava" na Settings stranici
2. Redirect na Strava authorization page
3. Korisnik odobri pristup
4. Callback sa auth code → zamena za access/refresh token
5. Tokeni se čuvaju u `StravaConnection`

**Webhook za aktivnosti:**
1. Strava šalje POST webhook kad korisnik završi trku
2. Backend fetchuje detalje aktivnosti sa Strava API-ja
3. Provera: u kojim aktivnim ligama je korisnik član?
4. Za svaku ligu: da li distanca zadovoljava min/max kriterijum?
5. Kreiranje `LeagueActivity` sa statusom VALID ili REJECTED

**REST endpointi (ne GraphQL):**
- `GET /strava/auth` — redirect na Strava
- `GET /strava/callback` — primi code, sačuvaj tokene
- `POST /strava/webhook` — primi nove aktivnosti
- `GET /strava/webhook` — verifikacija subscription-a

### GraphQL API

**Queries:**
- `leagues(status, limit, skip)` — javne lige
- `league(slug)` — detalji
- `myLeagues` — moje lige
- `leagueLeaderboard(leagueId, gender, limit)` — rangiranje
- `myStravaConnection` — status konekcije

**Mutations:**
- `createLeague`, `updateLeague`, `deleteLeague` (admin only)
- `joinLeague(leagueId, inviteCode?)`, `leaveLeague(leagueId)`
- `disconnectStrava`

### Frontend stranice

| Ruta | Opis | Pristup |
|------|------|---------|
| `/leagues` | Pregled javnih liga | Javno |
| `/leagues/[slug]` | Detalji lige + leaderboard | Javno |
| `/leagues/[slug]/activities` | Sve aktivnosti u ligi | Članovi |
| `/admin/leagues` | CRUD za lige | Admin |
| `/admin/leagues/new` | Kreiranje lige | Admin |
| `/settings` (sekcija) | Strava connect/disconnect | Auth |

---

## Ključne odluke (MVP)

| Pitanje | Odluka | Obrazloženje |
|---------|--------|--------------|
| Ko kreira lige? | Samo admin | Kontrola kvaliteta, korisnici se prijavljivaju |
| Scoring | Samo BEST_TIME | Ostali modovi dolaze sa pravilima kasnije |
| Navigacija | Hidden (direktan URL) | Dok ne bude potpuno spremno |
| Validacija | Distance-based | GPS matching je Faza 2 |
| Bez Strave? | Ne u MVP | Manual upload je Faza 3 |
| Anti-cheat | Verujemo Stravi | Strava ima svoj sistem |

---

## Potencijalni rizici

| Rizik | Mitigacija |
|-------|-----------|
| Strava webhook ne pošalje event | Dnevni cron sync job kao backup |
| Token refresh race condition | Mutex/lock po userId |
| Leaderboard spor za velike lige | Cache ili materialized view |
| Strava rate limit (100/15min) | `bottleneck` queue za API pozive |
| Strava promeni API uslove | Apstrakcija Strava servisa, lako zamenljiv |

---

## Solo projekat potencijal

### Zašto bi ovo bio dobar standalone projekat:

1. **Tržišna niša** — Strava Clubs i Garmin Challenges nemaju pravi "liga" sistem za lokalne zajednice
2. **Jasan MVP** — Distance-based lige sa leaderboard-om su dovoljne za lansiranje
3. **Monetizacija:**
   - Freemium: besplatne javne lige, premium privatne lige
   - Sponzorisane lige (brendovi, prodavnice opreme)
   - PRO plan za napredne statistike
4. **Skalabilnost** — nije ograničen na Srbiju, može globalno
5. **Tech stack** — Next.js + GraphQL + Prisma je moderan i zapošljiv za portfolio
6. **Community-driven** — korisnici sami kreiraju sadržaj (lige), platforma raste organski

### Izazovi:
- Strava API approval proces može trajati (review za production pristup)
- Zavisnost od Strava ekosistema — ako promene uslove, treba backup plan
- Konkurencija od samog Strave ako dodaju sličnu funkcionalnost

### Preporuka:
Počni kao modul u Trke Srbija za validaciju koncepta. Ako zaživi, izdvoji u standalone SaaS sa širim tržištem.

---

## Env varijable

```
# Backend (.env)
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_WEBHOOK_VERIFY_TOKEN=     # Random string za webhook verifikaciju
```

## Tehnički detalji

### Strava API limiti
- 100 requests / 15 minuta
- 1000 requests / dan
- Webhook subscription: 1 po aplikaciji
- Activity detalji: 1 request po aktivnosti

### Leaderboard kalkulacija (BEST_TIME)
```sql
SELECT user_id, MIN(moving_time) as best_time, COUNT(*) as activity_count
FROM league_activities
WHERE league_id = ? AND status = 'VALID'
GROUP BY user_id
ORDER BY best_time ASC
```
