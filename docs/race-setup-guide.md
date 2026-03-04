# Vodič: Pokretanje trke na Trke Srbija

## Pregled korisničkih uloga

| Uloga | Ko je to | Šta radi |
|-------|----------|----------|
| **Admin** | Organizator / administrator platforme | Kreira događaje, trke, checkpoint-e, dodeljuje sudije, upravlja prijavama |
| **Sudija** | Obični korisnik sa dodeljenim checkpoint-om | Beleži vremena na svom checkpoint-u unosom startnih brojeva |
| **Takmičar** | Registrovani korisnik | Prijavljuje se na trke, prati svoje prijave i rezultate |
| **Posetilac** | Neregistrovani korisnik | Gleda događaje i rezultate |

---

## Korak po korak: Priprema trke

### 1. Kreiranje događaja (Admin)

**Stranica:** `/admin/events/new`

Admin kreira **događaj** (RaceEvent) — kontejner za jednu ili više trka:
- Naziv, slug, tip (TRAIL / ROAD / OCR)
- Opis, glavna slika, galerija
- Organizator (izaberi postojećeg ili kreiraj novog)
- Tagovi, linkovi ka društvenim mrežama

> **Primer:** "Avala Trail 2026" je događaj koji sadrži trke "Avala 18K" i "Avala 10K"

---

### 2. Kreiranje trka unutar događaja (Admin)

**Stranica:** `/admin/events/[eventId]/races/new`

Za svaku distancu/kategoriju admin kreira zasebnu **trku** (Race):
- Naziv trke (npr. "Avala 18K")
- Dužina (km), visinska razlika (m)
- GPX fajl sa rutom (opcionalno)
- Datum i vreme starta
- Datum i vreme završetka (cut-off)
- Start lokacija
- Da li su prijave omogućene

---

### 3. Kreiranje checkpoint lokacija (Admin)

**Stranica:** `/admin/races/[raceId]/checkpoints`

Admin dodaje fizičke **checkpoint lokacije** za događaj:
- Naziv (npr. "Start", "CP1 - Avala vrh", "Cilj")
- Checkpoint lokacije su zajedničke za sve trke u okviru istog događaja

---

### 4. Dodavanje checkpoint-a na trku (Admin)

**Stranica:** `/admin/races/[raceId]/checkpoints`

Admin definiše **raspored checkpoint-a** za konkretnu trku:
- Izaberi koje checkpoint lokacije koristi ova trka
- Postavi redosled (0 = Start, 1 = CP1, 2 = CP2, ... poslednji = Cilj)
- Opcionalno: udaljenost od starta (km)

> **Važno:** Isti checkpoint može biti na različitim pozicijama u različitim trkama

---

### 5. Dodeljivanje sudija (Admin)

**Stranica:** `/admin/races/[raceId]/checkpoints`

Za svaki checkpoint admin dodeljuje jednog ili više **sudija**:
- Sudija mora imati registrovan nalog na platformi
- Admin bira korisnika i dodeljuje ga checkpoint-u
- Korisnik dobija polje `assignedCheckpointId` u bazi
- Sudija vidi link "Sudijska tabla" u navigaciji

> **Napomena:** Jedan korisnik može biti dodeljen samo jednom checkpoint-u

---

### 6. Prijave takmičara

#### Opcija A: Korisnik se sam prijavljuje
**Stranica:** `/races/[slug]` → dugme "Prijavi se"

Takmičar popunjava:
- Ime, prezime, telefon
- Datum rođenja, pol
- Prijava dobija status **PENDING**

#### Opcija B: Admin ručno prijavljuje
**Stranica:** `/admin/races/[raceId]/registrations/new`

Admin može dodati učesnike sa svim podacima i odmah postaviti status (CONFIRMED/PAID).

---

### 7. Upravljanje prijavama (Admin)

**Stranica:** `/admin/races/[raceId]/registrations`

Admin za svaku prijavu:
1. **Menja status:** PENDING → CONFIRMED → PAID (ili CANCELLED)
2. **Dodeljuje startni broj (bib number)** — jedinstveni broj po trci
3. Može pretraživati, filtrirati po statusu, exportovati CSV

> **Kritično:** Bez dodeljenog startnog broja sudija ne može zabeležiti vreme!

---

## Dan trke

### 8. Sudija beleži vremena

**Stranica:** `/judge`

Svaki sudija na svom checkpoint-u:
1. Otvara `/judge` stranicu na telefonu/tabletu
2. Vidi naziv svog checkpoint-a i trke
3. Kada takmičar prođe:
   - Unosi **startni broj** sa grudi takmičara
   - Pritisne "Zabeleži vreme"
   - Sistem zapisuje tačan timestamp
4. Vidi listu poslednjih 20 vremena (auto-refresh svakih 10 sekundi)

> **Kako radi:** Sistem traži prijavu sa tim startnim brojem u toj trci, kreira Timing zapis sa trenutnim vremenom. Duplikati nisu dozvoljeni (jedan takmičar = jedno vreme po checkpoint-u).

---

## Posle trke

### 9. Rezultati

**Stranica:** `/races/[slug]/results` (javno dostupna)

Sistem automatski računa:
- **Ukupno vreme** = vreme na cilju − vreme na startu
- **Pozicija** = sortiranje po ukupnom vremenu (najbrži prvi)
- **DNF** = takmičar koji nema vreme na cilju
- Prikaz vremena na svim međustanicama
- Filter po polu (muški/ženski)

---

## Checklista pre trke

- [ ] Kreiran događaj sa svim informacijama
- [ ] Kreirana trka/trke sa distancama i datumima
- [ ] Kreirane checkpoint lokacije (Start, CP1, ..., Cilj)
- [ ] Checkpoint-i dodati na trku u pravom redosledu
- [ ] Sudije imaju naloge na platformi
- [ ] Sudije dodeljene odgovarajućim checkpoint-ima
- [ ] Prijave omogućene
- [ ] Svi takmičari prijavljeni (status CONFIRMED ili PAID)
- [ ] Startni brojevi dodeljeni svim takmičarima
- [ ] Sudije testirale `/judge` stranicu

## Checklista na dan trke

- [ ] Sudije na pozicijama sa otvorenom `/judge` stranicom
- [ ] Internet konekcija na svakom checkpoint-u
- [ ] Test unos (jedan probni startni broj)
- [ ] Posle trke: provera rezultata na `/races/[slug]/results`
