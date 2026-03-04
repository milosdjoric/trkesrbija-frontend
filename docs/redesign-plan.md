# Redizajn: Sidebar → Website navigacija

## Kontekst

Trenutno aplikacija koristi fiksni sidebar (w-64) sa leve strane na desktopu i hamburger meni na mobilnom. To daje "app/dashboard" izgled, a cilj je preci na klasican **website look** sa top navigacijom.

**Figma wireframe:** https://www.figma.com/design/sFHiN1va26MqtnpFvs8DwI/Untitled

## Trenutna struktura sidebara

| Sekcija | Linkovi | Vidljivost |
|---------|---------|------------|
| **Header** | Logo "Trke Srbija" → `/` | Svi |
| **Opste** | Svi dogadjaji `/events`, Kalendar `/calendar` | Svi |
| **Moji linkovi** | Omiljene `/favorites`, Prijave `/my-registrations`, Treninzi `/training` | Auth |
| **Alati** | GPX Analyzer `/gpx-analyzer` | Svi |
| **Sudija** | Sudijska tabla `/judge` | Korisnici sa checkpoint-om |
| **Admin** | Admin Panel `/admin`, Statistike `/admin/stats` | ADMIN role |
| **Footer** | Email podrska, Verzija, User dropdown (settings, feedback, logout) | Razni |

## Nova navigaciona struktura

### 1. Top Header Bar (sticky)

```
+------------------------------------------------------------------+
|  Trke Srbija    Dogadjaji  Kalendar  GPX Analyzer       [User v] |
|                                                    ili [Prijava]  |
+------------------------------------------------------------------+
```

**Leva strana:** Logo + naziv sajta → `/`

**Centar/glavna nav:**
- **Dogadjaji** → `/events`
- **Kalendar** → `/calendar`
- **GPX Analyzer** → `/gpx-analyzer`

**Desna strana (ulogovan):**
- User dropdown (ime/avatar) sa:
  - Omiljene trke → `/favorites`
  - Moje prijave → `/my-registrations`
  - Treninzi → `/training`
  - Podesavanja → `/settings`
  - Sudijska tabla → `/judge` (samo ako ima checkpoint)
  - ---
  - Admin Panel → `/admin` (samo ADMIN)
  - ---
  - Posalji feedback
  - Odjavi se

**Desna strana (neulogovan):**
- Prijavi se / Registruj se dugmad

### 2. Mobilna navigacija — Bottom Tab Bar

Fiksna traka na dnu ekrana sa ikonicama (vidljiva samo na mobilnom `lg:hidden`):

```
+-----------------------------------------+
|  Pocetna  Dogadjaji  Kalendar  Profil  Jos  |
+-----------------------------------------+
```

**Tabovi:**
1. **Pocetna** (HomeIcon) → `/`
2. **Dogadjaji** (Square2StackIcon) → `/events`
3. **Kalendar** (CalendarIcon) → `/calendar`
4. **Profil** (UserIcon) → user dropdown ili `/login` ako nije ulogovan
5. **Jos** (EllipsisHorizontalIcon) → bottom sheet sa: GPX Analyzer, Treninzi, Prijave, Sudijska tabla, Admin, Feedback

Active tab se highlightuje bojom. Na mobilnom, top header ostaje ali bez nav linkova — samo logo + search ikonica.

### 3. Admin rute — isti website layout

Admin rute koriste isti top navbar. Admin linkovi (Events, Races, Users, Competitions, Stats, Reports, Import) se prikazuju kao **sekundarni nav** (tab bar ispod glavnog headera) na `/admin/**` rutama. Horizontalni scroll na mobilnom.

### 4. Footer sekcija (novi)

- Logo + kratki opis
- Linkovi: Dogadjaji, Kalendar, GPX Analyzer
- Kontakt: Email podrska
- Copyright + verzija info

## Layout promena

**Trenutno (sidebar):**
```
+---------+------------------------------+
|         |                              |
| SIDEBAR |       MAIN CONTENT           |
|  w-64   |     (max-w-6xl, padded)      |
|  fixed  |                              |
+---------+------------------------------+
```

**Novo (website):**
```
+----------------------------------------+
|        TOP NAVBAR (sticky)             |
+----------------------------------------+
|                                        |
|           MAIN CONTENT                 |
|      (full-width, max-w-7xl)           |
|                                        |
+----------------------------------------+
|             FOOTER                     |
+----------------------------------------+
```

## Fajlovi koji se menjaju

| Fajl | Akcija |
|------|--------|
| `src/components/sidebar-layout.tsx` | Zamenjuje se novim `website-layout.tsx` |
| `src/app/(app)/application-layout.tsx` | Refaktorisanje — koristi `<WebsiteLayout>` |
| `src/components/sidebar.tsx` | Uklanja se |
| `src/components/navbar.tsx` | Prosiruje se — postaje glavna navigacija |
| `src/app/(app)/page.tsx` | Prilagodi hero za full-width |

## Redosled implementacije

1. Kreirati `site-header.tsx` — sticky header sa logo, nav linkovi, user dropdown, responsive
2. Kreirati `bottom-tab-bar.tsx` — mobilna bottom navigacija sa 5 tabova
3. Kreirati `site-footer.tsx` — footer komponenta
4. Kreirati `website-layout.tsx` — novi layout: header + main + bottom tabs + footer
5. Refaktorisati `application-layout.tsx` — zameniti SidebarLayout sa WebsiteLayout
6. Kreirati admin sub-nav — sekundarni tab bar za `/admin/**` rute
7. Prilagoditi homepage — iskoristiti full-width layout
8. Ocistiti sidebar komponente

## Verifikacija

- Proveriti sve rute rade (`/events`, `/calendar`, `/gpx-analyzer`, `/favorites`, `/my-registrations`, `/training`, `/judge`, `/admin`)
- Testirati responsive ponasanje (desktop, tablet, mobile)
- Proveriti auth state — ulogovani vs neulogovani korisnici
- Proveriti admin sekundarni nav funkcionise na `/admin/**` rutama
- Pokrenuti `npm run build` i `npm run lint`
