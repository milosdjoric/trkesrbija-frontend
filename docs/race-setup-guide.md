# Vodič: Pokretanje trke na Trke Srbija

## Pregled korisničkih uloga

| Uloga | Ko je to | Šta radi |
|-------|----------|----------|
| **Admin** | Organizator / administrator platforme | Kreira događaje, trke, checkpoint-e, dodeljuje sudije, upravlja prijavama, oglasima, ligama i importom |
| **Sudija** | Obični korisnik sa dodeljenim checkpoint-om | Beleži vremena na svom checkpoint-u unosom startnih brojeva (radi i offline) |
| **Takmičar** | Registrovani korisnik | Prijavljuje se na trke, prati svoje prijave i rezultate, učestvuje u ligama |
| **Posetilac** | Neregistrovani korisnik | Gleda događaje, kalendar, rezultate i koristi GPX Analyzer |

---

## Admin panel — pregled svih sekcija

Admin panel (`/admin`) sadrži sledeće sekcije:

| Sekcija | Putanja | Opis |
|---------|---------|------|
| **Statistike** | `/admin/stats` | Dashboard sa pregledom ukupnog broja korisnika, događaja, trka, prijava |
| **Događaji** | `/admin/events` | CRUD za sve događaje, masovno uređivanje, detekcija duplikata |
| **Trke** | `/admin/races` | Pregled svih trka, masovno uređivanje, pristup checkpoint-ima i prijavama |
| **Korisnici** | `/admin/users` | Pregled i upravljanje korisnicima (uloge, verifikacija) |
| **Takmičenja** | `/admin/competitions` | Upravljanje serijama/takmičenjima (TTLS, NSPT, itd.) |
| **Lige** | `/admin/leagues` | Upravljanje Strava ligama (kreiranje, pravila, učesnici) |
| **Treninzi** | `/admin/trainings` | Pregled svih korisničkih treninga |
| **Oglasi** | `/admin/ads` | Upravljanje reklamnim banerima (paketi, pozicije, statistike) |
| **Prijave grešaka** | `/admin/reports` | Pregled korisničkih prijava problema |
| **Import** | `/admin/import` | Masovni import podataka (događaji, trke) |
| **Instagram** | `/admin/instagram` | Instagram integracija |

---

## Korak po korak: Priprema trke

### 1. Kreiranje događaja (Admin)

**Stranica:** `/admin/events/new`

Admin kreira **događaj** (RaceEvent) — kontejner za jednu ili više trka:
- Naziv i slug (URL-friendly identifikator, mora biti jedinstven)
- Tip (TRAIL / ROAD / OCR)
- Opis (markdown format)
- Glavna slika i galerija fotografija
- Organizator (izaberi postojećeg ili kreiraj novog)
- Tagovi za kategorizaciju
- Linkovi ka društvenim mrežama
- Država (opcionalno)
- Link za eksternu registraciju (opcionalno — ako organizator ima svoj sistem prijava)
- Verifikovan status (da li su informacije potvrđene od organizatora)

> **Primer:** "Avala Trail 2026" je događaj koji sadrži trke "Avala 18K" i "Avala 10K"

> **Masovno uređivanje:** Za izmenu više događaja odjednom koristi `/admin/events/mass-edit`. Za pronalaženje potencijalnih duplikata koristi `/admin/events/duplicates`.

---

### 2. Kreiranje trka unutar događaja (Admin)

**Stranica:** `/admin/events/[eventId]/races/new`

Za svaku distancu/kategoriju admin kreira zasebnu **trku** (Race):
- Naziv trke (npr. "Avala 18K") — opcionalno, može se koristiti samo distanca
- Slug (jedinstven URL identifikator)
- Dužina (km) — obavezno
- Visinska razlika (m) — opcionalno
- GPX fajl sa rutom — opcionalno, ali preporučeno za mapu na stranici trke
- Datum i vreme starta — obavezno
- Datum i vreme završetka (cut-off) — opcionalno
- Start lokacija — obavezno (koristi se za "Vodi me do starta" navigaciju)
- Da li su prijave omogućene (toggle)
- Link za eksternu registraciju — overriduje link sa događaja ako je različit
- Takmičenje/serija — opcionalna veza sa takmičenjem (TTLS, NSPT, itd.)

> **Masovno uređivanje:** Za izmenu više trka odjednom koristi `/admin/races/mass-edit`.

---

### 3. Kreiranje checkpoint lokacija (Admin)

**Stranica:** `/admin/races/[raceId]/checkpoints`

Admin dodaje fizičke **checkpoint lokacije** za događaj:
- Naziv (npr. "Start", "CP1 - Avala vrh", "Cilj")
- Checkpoint lokacije su zajedničke za sve trke u okviru istog događaja
- Ovo su fizička mesta na terenu — isti checkpoint može biti korišćen u više trka

---

### 4. Dodavanje checkpoint-a na trku (Admin)

**Stranica:** `/admin/races/[raceId]/checkpoints`

Admin definiše **raspored checkpoint-a** za konkretnu trku:
- Izaberi koje checkpoint lokacije koristi ova trka
- Postavi redosled (0 = Start, 1 = CP1, 2 = CP2, ... poslednji = Cilj)
- Opcionalno: udaljenost od starta (km)
- Koristi dugmiće za pomeranje gore/dole za promenu redosleda

> **Važno:** Isti checkpoint može biti na različitim pozicijama u različitim trkama. Na primer, "CP1 - Avala vrh" može biti checkpoint #2 u 18K trci i checkpoint #4 u 30K trci.

---

### 5. Dodeljivanje sudija (Admin)

**Stranica:** `/admin/races/[raceId]/checkpoints`

Za svaki checkpoint admin dodeljuje jednog ili više **sudija**:
- Sudija mora imati registrovan nalog na platformi (uloga STANDARD je dovoljna)
- Admin bira korisnika i dodeljuje ga checkpoint-u
- Korisnik dobija polje `assignedCheckpointId` u bazi
- Sudija vidi link "Sudijska tabla" u navigaciji nakon dodele
- Admin može u svakom trenutku ukloniti dodelu

> **Napomena:** Jedan korisnik može biti dodeljen samo jednom checkpoint-u u isto vreme.

---

### 6. Prijave takmičara

#### Opcija A: Korisnik se sam prijavljuje
**Stranica:** `/races/[slug]` → dugme "Prijavi se"

Takmičar popunjava:
- Ime i prezime (automatski popunjeno sa profila)
- Email (automatski sa naloga)
- Telefon (opciono)
- Datum rođenja (minimalno 16 godina)
- Pol (muški/ženski)
- Prijava dobija status **PENDING**

#### Opcija B: Admin ručno prijavljuje
**Stranica:** `/admin/races/[raceId]/registrations/new`

Admin može dodati učesnike sa svim podacima i dodatnim opcijama:
- Sva polja kao kod korisničke prijave
- Status — može odmah postaviti (PENDING / CONFIRMED / PAID), default: CONFIRMED
- Startni broj (bib number) — može odmah dodeliti
- Admin beleške (notes) — interno polje vidljivo samo adminu

---

### 7. Upravljanje prijavama (Admin)

**Stranica:** `/admin/races/[raceId]/registrations`

Admin za svaku prijavu:
1. **Menja status:** PENDING → CONFIRMED → PAID (ili CANCELLED)
2. **Dodeljuje startni broj (bib number)** — jedinstveni broj po trci
3. Može pretraživati po imenu, filtrirati po statusu
4. Može exportovati CSV sa svim prijavama

> **Kritično:** Bez dodeljenog startnog broja sudija ne može zabeležiti vreme! Proveri da svi takmičari imaju bib pre dana trke.

---

## Dan trke

### 8. Sudija beleži vremena

**Stranica:** `/judge`

Svaki sudija na svom checkpoint-u:
1. Otvara `/judge` stranicu na telefonu/tabletu
2. Vidi naziv svog checkpoint-a i trke
3. Kada takmičar prođe:
   - Unosi **startni broj** sa grudi takmičara na numpad-u (dugmići 0-9)
   - Pritisne zeleno dugme ✓ za potvrdu
   - Sistem zapisuje tačan timestamp
   - Za ispravku koristi dugme ⌫ (backspace)
4. Vidi listu poslednjih zabeleženih vremena

#### Offline podrška

Sudijska tabla **radi i bez interneta**:
- Sva vremena se čuvaju lokalno u IndexedDB (browser storage)
- Status bar na vrhu prikazuje online/offline status
- Kad je offline, prikazuje koliko stavki čeka na sinhronizaciju
- Kad se internet vrati, podaci se **automatski sinhronizuju** sa serverom
- Postoji i dugme za ručnu sinhronizaciju ako je potrebno
- Čak i bez interneta, sudija vidi listu lokalno sačuvanih vremena

> **Kako radi u pozadini:** Sistem traži prijavu sa tim startnim brojem u toj trci i kreira Timing zapis sa trenutnim vremenom. Duplikati nisu dozvoljeni — jedan takmičar može imati samo jedno vreme po checkpoint-u (`@@unique([registrationId, checkpointId])`).

---

## Posle trke

### 9. Rezultati

**Stranica:** `/races/[slug]/results` (javno dostupna)

Sistem automatski računa i prikazuje:
- **Ukupno vreme** = vreme na cilju − vreme na startu
- **Pozicija** = sortiranje po ukupnom vremenu (najbrži prvi)
- **DNF** = takmičar koji nema vreme na cilju (prikazuje se na dnu tabele)
- Prikaz vremena na svim međustanicama (checkpoint-ovima)
- **Medalje** — zlato, srebro i bronza za top 3 (vizuelno istaknute)
- **Statistika** — ukupan broj učesnika, koliko je završilo, koliko checkpoint-a, koliko DNF

#### Filtriranje
- Filter po polu (Muškarci / Žene / Svi) — prikazuje kategorijske plasmane
- Pretraga po imenu takmičara (accent-insensitive — "đ" pronalazi "dj" i obrnuto)

---

## Checklista pre trke

- [ ] Kreiran događaj sa svim informacijama (naziv, opis, slike, organizator)
- [ ] Kreirana trka/trke sa distancama, elevacijom i datumima
- [ ] Upload-ovan GPX fajl za svaku trku (za mapu na stranici)
- [ ] Kreirane checkpoint lokacije (Start, CP1, ..., Cilj)
- [ ] Checkpoint-i dodati na trku u pravom redosledu
- [ ] Sudije imaju naloge na platformi
- [ ] Sudije dodeljene odgovarajućim checkpoint-ima
- [ ] Prijave omogućene (toggle na trci)
- [ ] Svi takmičari prijavljeni (status CONFIRMED ili PAID)
- [ ] Startni brojevi dodeljeni **svim** takmičarima
- [ ] Sudije testirale `/judge` stranicu (probni unos)
- [ ] Proverene informacije na javnoj stranici događaja

## Checklista na dan trke

- [ ] Sudije na pozicijama sa otvorenom `/judge` stranicom
- [ ] Internet konekcija na svakom checkpoint-u (poželjno, ali nije obavezno — offline radi)
- [ ] Sudije imaju napunjene telefone/tablete
- [ ] Test unos (jedan probni startni broj) — obrisati pre starta ili koristiti nepostojeći broj
- [ ] Start sudija beleži vreme za svakog takmičara na startu
- [ ] Cilj sudija beleži vreme za svakog takmičara na cilju

## Checklista posle trke

- [ ] Sve sudije proverile da nemaju pending stavki za sync
- [ ] Provereni rezultati na `/races/[slug]/results`
- [ ] Provera DNF takmičara — da li neko zaista nije završio ili je propušten unos
- [ ] Objava rezultata na društvenim mrežama / obaveštenje učesnicima

---

## Demo podaci za testiranje

Demo podaci se mogu kreirati skriptom `backend/scripts/seed-judge-demo.js`.

```bash
node scripts/seed-judge-demo.js          # Dry run — prikaži šta će se kreirati
node scripts/seed-judge-demo.js --apply  # Upiši u bazu
```

### Demo event

| | |
|---|---|
| **Događaj** | RCN Trail 2026 |
| **Organizator** | Staza Srbije |
| **Tip** | TRAIL |
| **Trke** | RCN Trail 15K (15km, 480m D+) · RCN Trail 30K (30km, 1150m D+) |
| **Checkpoints** | Start — RCN baza · CP1 — Vidikovac · Cilj — RCN baza |

### Demo nalozi

| Uloga | Email | Lozinka | Opis |
|-------|-------|---------|------|
| **Sudija** | sudija@trkesrbija.rs | sudija123! | Dodeljen na CP1 — Vidikovac. Otvara `/judge` i unosi startne brojeve. |
| **Takmičar** | takmicar@trkesrbija.rs | takmicar123! | Povezan sa registracijom #101 na 15K trku. Vidi svoju prijavu u `/my-registrations` i rezultate. |
| **Posetilac** | posetilac@trkesrbija.rs | posetilac123! | Samo nalog bez prijava. Gleda događaje, kalendar i rezultate. |

### Demo učesnici

| Startni broj | Ime | Pol | Trka |
|:---:|---|---|---|
| 101 | Nikola Jovanović | M | RCN Trail 15K |
| 102 | Stefan Petrović | M | RCN Trail 15K |
| 103 | Ana Đorđević | Ž | RCN Trail 15K |
| 104 | Milica Nikolić | Ž | RCN Trail 15K |
| 201 | Luka Stojanović | M | RCN Trail 30K |
| 202 | Jelena Ilić | Ž | RCN Trail 30K |
| 203 | Marko Popović | M | RCN Trail 30K |
| 204 | Tamara Stanković | Ž | RCN Trail 30K |

### Scenario za testiranje

1. **Sudija:** Uloguj se kao `sudija@trkesrbija.rs` → otvori `/judge` → unesi brojeve 101, 102, 103
2. **Takmičar:** Uloguj se kao `takmicar@trkesrbija.rs` → otvori `/my-registrations` → vidi prijavu na 15K
3. **Posetilac:** Uloguj se kao `posetilac@trkesrbija.rs` → pretraži događaje, otvori RCN Trail, pogledaj rezultate
4. **Offline test:** Kao sudija, isključi internet → unesi broj 104 → uključi internet → proveri da se sinhronizovao
