# Plan: Offline-first sudijska tabla (/judge)

## Problem
Sudije na checkpoint-ima često nemaju stabilan internet (planine, šume). Beleženje rezultata mora raditi i offline. Kad se internet vrati, podaci se automatski sinhronizuju sa serverom.

Trenutno `/judge` stranica je 100% online — nema PWA, nema offline storage, nema service workera.

---

## Arhitektura

```
Sudija unese startni broj
        ↓
   ┌────┴────┐
   ↓         ↓
IndexedDB   Lokalni fajl (ako je podržano)
   ↓
Online? ──→ Da ──→ Pošalji na server → Markiraj kao synced
   │
   └──→ Ne ──→ Čuvaj u queue → Prikaži "Offline" indikator
                    ↓
              Kad se net vrati → Auto-sync → Markiraj kao synced
```

---

## Faze implementacije

Plan je podeljen u **3 faze** po prioritetu. Svaka faza je nezavisno deployable.

### Faza 1: Core offline (MUST HAVE)
IndexedDB + sync queue + backend timestamp podrška. Ovo je minimum da sudija može da radi offline.

### Faza 2: UI poboljšanja
Status bar, pending/synced oznake u listi, ručni retry dugme, CSV export.

### Faza 3: Bonus (NICE TO HAVE)
Service worker (PWA) za offline page load, File System Access API za desktop auto-backup.

---

## Faza 1: Core offline

### 1.1 Backend: timestamp podrška u `recordTime`

`recordTime` mutacija treba da prihvati opcioni `timestamp` parametar — da offline timings dobiju tačno vreme kad je sudija uneo broj, ne kad je sync stigao na server.

```graphql
input RecordTimeInput {
  bibNumber: String!
  timestamp: DateTime  # novo — opciono, za offline sync
}
```

Backend logika: `const timestamp = input.timestamp ?? new Date()`

**Fajlovi:**
- `backend/src/graphql/schema.ts` — dodati `timestamp` u `RecordTimeInput`
- `backend/src/services/checkpoint.service.ts` — koristiti `input.timestamp` ako postoji
- `frontend/src/app/lib/api.ts` — proslediti `timestamp` u `RECORD_TIME_MUTATION` i `recordTime()` funkciju

### 1.2 IndexedDB storage (`src/lib/offline/timing-db.ts`)

Koristi `idb` biblioteku (lightweight IndexedDB wrapper, ~1KB gzipped).

```typescript
Database: "judge-timings", version 1
Stores:
  - "timings": {
      localId: string (UUID, primary key)
      bibNumber: string
      timestamp: string (ISO)
      checkpointId: string
      raceId: string
      synced: boolean
      syncedAt?: string
      serverId?: string
      error?: string
    }
  Indexes:
    - "by-synced": synced (za brzo filtriranje pending stavki)
    - "by-timestamp": timestamp (za sortiran prikaz)
```

Funkcije:
- `saveTiming(timing)` — čuva novi timing
- `getPendingTimings()` — vraća sve nesinkovane (synced === false)
- `markAsSynced(localId, serverId)` — markiraj kao synced
- `markAsError(localId, error)` — markiraj grešku
- `getAllTimings(limit?)` — za prikaz u listi (sortirano po timestamp DESC)
- `deletePendingTiming(localId)` — za brisanje pogrešnog unosa pre synca
- `clearSyncedTimings(olderThan?)` — čišćenje starih synced stavki

### 1.3 Online status hook (`src/hooks/use-online-status.ts`)

```typescript
function useOnlineStatus(): {
  isOnline: boolean
  pendingCount: number
}
```

Prati `navigator.onLine` + `online`/`offline` eventove + broji pending iz IndexedDB.

### 1.4 Sync queue (`src/lib/offline/sync-queue.ts`)

Logika:
1. Registruj `online` event listener
2. Kad postane online → uzmi sve pending timinge iz IndexedDB
3. Za svaki pending: pozovi `recordTime(bibNumber, timestamp)` sa originalnim timestamp-om
4. Na success → `markAsSynced(localId, serverId)`
5. Na error (duplikat, tj. "already recorded") → `markAsSynced` (već postoji na serveru)
6. Na error (ostalo) → `markAsError(localId, message)`, retry later

Retry: exponential backoff (1s, 2s, 4s, max 30s), max 5 pokušaja po timing-u.

**Važno:** Sync radi sekvencijalno (jedan po jedan), ne paralelno — da se izbegnu race conditions na serveru.

### 1.5 Izmena `judge/page.tsx` — offline-first flow

**Izmenjen `handleSubmit` flow:**
```
1. Generiši localId (crypto.randomUUID()) i timestamp (new Date().toISOString())
2. Sačuvaj u IndexedDB (synced: false)
3. Optimistic UI update (prikaži odmah u lokalnoj listi)
4. Ako online → pošalji na server
   - Success → markAsSynced
   - Error → markAsError (stavka ostaje u listi sa error oznakom)
5. Ako offline → ostaje pending, sync queue će poslati kad bude online
```

**Promena u prikazivanju liste:**
Umesto da se lista učitava isključivo sa servera (`fetchRecentTimings`), lista se gradi iz IndexedDB + server podataka:
- Lokalne pending stavke se prikazuju odmah (žuta oznaka)
- Server timings se mergeuju pri online refreshu
- Auto-refresh (svaki 10s) ostaje ali samo kad je online

---

## Faza 2: UI poboljšanja

### 2.1 Status bar
Na vrhu judge stranice, ispod checkpoint headera:
- **Online:** zeleni bar "Online — sve sinhronizovano"
- **Offline:** žuti bar "Offline — N unosa čeka sinhronizaciju"
- **Greška:** crveni bar "Greška pri sinhronizaciji — pokušaj ponovo"

### 2.2 Oznake u listi
- Pending stavke: žuta `⏳` oznaka
- Synced stavke: zelena `✓` oznaka
- Error stavke: crvena `!` oznaka sa tooltip-om greške

### 2.3 Brisanje pending stavki
Swipe-to-delete ili dugme `✕` samo za pending stavke (koje još nisu synced).
Za slučaj kad sudija pogrešno unese broj offline.

### 2.4 Ručni retry dugme
"Sinhronizuj sada" dugme — trigeruje sync queue ručno (za slučaj kad auto-sync ne radi).

### 2.5 CSV export
Dugme "Preuzmi CSV" — generise CSV sa svim timingima iz IndexedDB. Radi na svim uređajima (telefon + desktop). Format:
```csv
bibNumber,timestamp,synced,serverId
42,2026-03-04T10:15:22.000Z,true,abc123
103,2026-03-04T10:16:45.000Z,false,
```

---

## Faza 3: Bonus (PWA + File backup)

### 3.1 Service Worker / PWA
Bez service workera, stranica se neće ni učitati kad je offline. Next.js opcije:
- **`next-pwa`** paket — automatski generiše SW koji kešira app shell
- **`@serwist/next`** — modernija alternativa za `next-pwa` (aktivno održavana)
- **Ručni SW** — precache samo `/judge` route i njen JS bundle

Minimum: keširati `/judge` stranicu + JS/CSS bundle + ikonice tako da se stranica otvori offline.

> **Napomena:** PWA zahteva HTTPS u produkciji (već imamo) i `manifest.json` fajl.

### 3.2 File System Access API (samo desktop)
Koristi File System Access API (`showSaveFilePicker` / `createWritable`).

Flow:
1. Sudija jednom klikne "Izaberi folder za backup" → bira folder
2. App kreira fajl `timings-[checkpoint]-[datum].jsonl`
3. Posle SVAKOG unosa — append red u fajl
4. File handle se čuva u memoriji (ne traži dozvolu ponovo)

| Uređaj | Podrška |
|--------|---------|
| **Windows/Mac** (Chrome/Edge) | ✅ |
| **Safari** | ⚠️ Samo download |
| **Android/iPhone** | ❌ |

> Za telefone CSV export iz Faze 2 je dovoljan.

---

## Fajlovi — pregled

### Novi fajlovi
| Fajl | Faza | Opis |
|------|------|------|
| `src/lib/offline/timing-db.ts` | 1 | IndexedDB wrapper — CRUD za timinge |
| `src/lib/offline/sync-queue.ts` | 1 | Auto-sync pending timinga kad je online |
| `src/hooks/use-online-status.ts` | 1 | Hook za online/offline + pending count |
| `src/lib/offline/file-backup.ts` | 3 | File System Access API (desktop only) |

### Izmene postojećih
| Fajl | Faza | Izmena |
|------|------|--------|
| `backend/src/graphql/schema.ts` | 1 | `timestamp` u `RecordTimeInput` |
| `backend/src/services/checkpoint.service.ts` | 1 | Koristiti custom timestamp |
| `frontend/src/app/lib/api.ts` | 1 | Proslediti `timestamp` u mutaciju |
| `frontend/src/app/(app)/judge/page.tsx` | 1+2 | Offline-first logika + UI |
| `frontend/package.json` | 1 | Dodati `idb` |
| `frontend/next.config.mjs` | 3 | PWA konfiguracija |

---

## Procena kompleksnosti

| Deo | Faza | Kompleksnost |
|-----|------|-------------|
| Backend timestamp podrška | 1 | Niska |
| IndexedDB storage + `idb` | 1 | Srednja |
| Online/offline hook | 1 | Niska |
| Sync queue | 1 | Srednja-Visoka |
| Judge page refaktor (offline-first) | 1 | Srednja |
| **Faza 1 ukupno** | | **~4-5h** |
| Status bar + oznake | 2 | Niska |
| Delete pending + retry | 2 | Niska |
| CSV export | 2 | Niska |
| **Faza 2 ukupno** | | **~2h** |
| Service worker / PWA | 3 | Srednja |
| File System Access | 3 | Srednja |
| **Faza 3 ukupno** | | **~3h** |
| **SVE UKUPNO** | | **~9-10h (2-3 sesije)** |

---

## Edge cases za testiranje

1. **Browser tab close mid-sync** — pending stavke ostaju u IndexedDB, sync nastavlja pri sledećem otvaranju
2. **Dupli tab** — dva taba otvorena istovremeno, oba pišu u istu IndexedDB → sync queue mora biti idempotent
3. **Pogrešan bib number offline** — sudija mora moći da obriše pending stavku pre synca
4. **Server vrati duplikat** — "already recorded" error treba tretirati kao success (markAsSynced)
5. **IndexedDB nedostupan** — Safari private browsing ne dozvoljava IndexedDB → fallback na in-memory niz + upozorenje korisniku
6. **Veliki broj pending stavki** — ako se nakupi 100+ offline unosa, sync ne sme blokirati UI

---

## Verifikacija

### Faza 1
1. Pokreni frontend, otvori `/judge`
2. Unesi startni broj online → proveri da se sačuva u IndexedDB + server
3. Isključi WiFi (ili DevTools → Network → Offline)
4. Unesi 3 startna broja offline → proveri da se sačuvaju u IndexedDB
5. Uključi WiFi → proveri da se sva 3 auto-sinhronizuju sa tačnim timestamp-om
6. Proveri da server timings imaju originalno vreme unosa, ne vreme synca
7. `npm run build` — bez grešaka

### Faza 2
8. Proveri status bar menja boju (zelena/žuta/crvena)
9. Obriši pending stavku — proveri da nestane iz liste i IndexedDB
10. Preuzmi CSV — proveri format i podatke
11. Klikni "Sinhronizuj" — proveri da trigeruje sync

### Faza 3
12. Otvori `/judge` → isključi WiFi → refreshuj stranicu → stranica se mora učitati iz cache-a
13. Na desktopu: aktiviraj file backup → unesi timing → proveri da se append-uje u fajl
