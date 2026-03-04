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

## Ograničenja po uređajima

### File System Access API (auto-save u fajl)

| Uređaj | Podrška | Gde se čuva |
|--------|---------|-------------|
| **Windows** (Chrome/Edge) | ✅ | Korisnik bira folder (Desktop, Documents...) |
| **MacBook** (Chrome/Edge) | ✅ | Korisnik bira folder |
| **MacBook** (Safari) | ⚠️ Delimično | Samo download, ne može append u isti fajl |
| **Android** (Chrome) | ❌ | Nema File System Access API |
| **iPhone** (Safari) | ❌ | Nema File System Access API |

### IndexedDB (browser storage)

| Uređaj | Podrška | Kapacitet |
|--------|---------|-----------|
| Svi moderni browseri | ✅ 98%+ | 50MB+ (dovoljno za hiljade timinga) |

**Zaključak:** Na telefonu (Android/iPhone) jedini automatski backup je IndexedDB. Za pravi file auto-save na telefonu potreban je native wrapper (Capacitor/React Native) što zahteva App Store deploy.

### Opcije za backup na telefonu

1. **IndexedDB + ručni CSV export** — dugme "Preuzmi backup" na stranici (najjednostavnije)
2. **IndexedDB + auto-file samo na desktopu** — kombinovani pristup
3. **Capacitor native wrapper** — pravi file access svuda, ali zahteva App Store/Play Store (mnogo više posla)

---

## Fajlovi za kreiranje

| Fajl | Opis |
|------|------|
| `src/lib/offline/timing-db.ts` | IndexedDB wrapper (`idb` biblioteka) — CRUD za pending/synced timinge |
| `src/lib/offline/file-backup.ts` | File System Access API — append timing u lokalni JSONL fajl |
| `src/lib/offline/sync-queue.ts` | Queue manager — auto-sync pending timinga kad je online |
| `src/hooks/use-online-status.ts` | Hook za praćenje online/offline statusa |

## Fajlovi za izmenu

| Fajl | Izmena |
|------|--------|
| `src/app/(app)/judge/page.tsx` | Offline-first logika, status indikator, pending lista |
| `package.json` | Dodati `idb` biblioteku |

---

## Detaljan plan implementacije

### 1. `timing-db.ts` — IndexedDB storage

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
      participantName?: string  // za offline prikaz
    }
```

Funkcije:
- `saveTiming(timing)` — čuva novi timing
- `getPendingTimings()` — vraća sve nesinkovane
- `markAsSynced(localId, serverId)` — markiraj kao synced
- `markAsError(localId, error)` — markiraj grešku
- `getAllTimings(limit?)` — za prikaz u listi
- `clearSyncedTimings()` — čišćenje starih

### 2. `file-backup.ts` — Lokalni fajl backup

Koristi File System Access API (`showSaveFilePicker` / `createWritable`).

Flow:
1. Sudija jednom klikne "Izaberi folder za backup" → bira folder
2. App kreira fajl `timings-[checkpoint]-[datum].jsonl`
3. Posle SVAKOG unosa — append red u fajl:
   ```jsonl
   {"bib":"42","time":"2026-03-04T10:15:22.000Z","synced":false}
   {"bib":"103","time":"2026-03-04T10:16:45.000Z","synced":true,"serverId":"xyz"}
   ```
4. File handle se čuva u memoriji (ne traži dozvolu ponovo)

> **Fallback za telefone:** Dugme "Preuzmi backup (CSV)" — ručni download, radi svuda.

### 3. `sync-queue.ts` — Sinhronizacija

Logika:
1. Registruj `online` event listener
2. Kad postane online → uzmi sve pending timinge iz IndexedDB
3. Za svaki pending: pozovi `recordTime(bibNumber)` sa originalnim timestamp-om
4. Na success → `markAsSynced(localId, serverId)`
5. Na error (duplikat) → `markAsSynced` (već postoji na serveru)
6. Na error (ostalo) → `markAsError(localId, message)`, retry later

Retry: exponential backoff (1s, 2s, 4s, max 30s)

### 4. `use-online-status.ts` — Hook

```typescript
function useOnlineStatus(): { isOnline: boolean; pendingCount: number }
```

Prati `navigator.onLine` + `online`/`offline` eventove + broji pending iz IndexedDB.

### 5. Izmene u `judge/page.tsx`

**Novi UI elementi:**
- Status bar na vrhu: 🟢 Online / 🟡 Offline (N čeka sync) / 🔴 Greška
- Dugme "Backup fajl" za aktiviranje File System Access API (samo desktop)
- Dugme "Preuzmi CSV" za ručni export (radi svuda)
- U listi timinga: pending stavke imaju žutu oznaku, synced zelenu
- "Sinhronizuj" dugme za ručni retry

**Izmenjen flow recordTime:**
```
1. Generiši localId (UUID) i timestamp (Date.now())
2. Sačuvaj u IndexedDB (synced: false)
3. Append u lokalni fajl (ako je aktivan)
4. Optimistic UI update (prikaži odmah u listi)
5. Ako online → pošalji na server
   - Success → markAsSynced
   - Error → markAsError, prikaži grešku
6. Ako offline → ostaje pending, sync queue će poslati kad bude online
```

---

## Backend izmena (mala)

`recordTime` mutacija treba da prihvati opcioni `timestamp` parametar — da offline timings dobiju tačno vreme kad je sudija uneo broj, ne kad je sync stigao na server.

```graphql
input RecordTimeInput {
  bibNumber: String!
  timestamp: DateTime  # novo — opciono, za offline sync
}
```

Backend: `const timestamp = input.timestamp ?? new Date()`

**Fajl:** `backend/src/services/checkpoint.service.ts` — izmena u `recordTime()`
**Fajl:** `backend/src/graphql/schema.ts` — dodati `timestamp` u `RecordTimeInput`

---

## Procena kompleksnosti

| Deo | Kompleksnost | Vreme |
|-----|-------------|-------|
| IndexedDB storage | Srednja | ~1h |
| Online/offline detekcija | Niska | ~30min |
| Sync queue | Srednja | ~1-2h |
| File System Access (desktop) | Srednja | ~1h |
| CSV export fallback (telefon) | Niska | ~30min |
| UI izmene (judge page) | Srednja | ~1-2h |
| Backend timestamp podrška | Niska | ~15min |
| **Ukupno** | | **~5-7h (1-2 sesije)** |

---

## Verifikacija

1. Pokreni frontend, otvori `/judge`
2. Unesi startni broj online → proveri da se sačuva u IndexedDB + fajl + server
3. Isključi WiFi (ili DevTools → Network → Offline)
4. Unesi 3 startna broja offline → proveri da se sačuvaju lokalno + u fajl
5. Uključi WiFi → proveri da se sva 3 auto-sinhronizuju
6. Proveri rezultate na `/races/[slug]/results` — svi timings treba da budu tu
7. `npm run build` — bez grešaka
