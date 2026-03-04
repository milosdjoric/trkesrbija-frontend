# Plan: Light i Dark tema sa toggle-om

## Context
Trenutno je dark tema hardcoded — `class="dark"` na `<html>`, boje poput `bg-dark-bg`, `border-dark-border`, `text-gray-400` su rasute po 87+ fajlova (500+ instanci). Treba napraviti light temu i toggle, gde je dark = trenutni izgled.

## Pristup: Semantic CSS varijable

Umesto da menjamo svaku klasu u 87 fajlova, definišemo **semantic tokene** u CSS-u koji se menjaju po temi. Tailwind čita te varijable i klase ostaju iste.

### Kako radi

**Sada:** `bg-dark-bg` → uvek #121212
**Posle:** `bg-main` → #121212 (dark) ili #F5F5F0 (light)

Jedna klasa, automatski se menja sa temom. Nema `dark:` prefiksa nigde.

---

## Faza 1: CSS infrastruktura

### `src/styles/tailwind.css`

Zamena hardcoded boja sa semantic tokenima:

```css
@import 'tailwindcss';
@source "..";

@theme {
  --font-sans: 'Urbanist', sans-serif;

  /* Brand boje (ne menjaju se po temi) */
  --color-brand-green: #00D084;
  --color-brand-green-dark: #00A86B;
  --color-brand-red: #FF4136;

  /* Semantic tokeni — čitaju CSS varijable iz :root */
  --color-main: var(--bg-main);
  --color-card: var(--bg-card);
  --color-card-hover: var(--bg-card-hover);
  --color-surface: var(--bg-surface);
  --color-surface-hover: var(--bg-surface-hover);
  --color-border-primary: var(--border-primary);
  --color-border-secondary: var(--border-secondary);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
}

/* Dark tema (default) */
:root {
  --bg-main: #121212;
  --bg-card: #1A1A1A;
  --bg-card-hover: #1F1F1F;
  --bg-surface: #1E1E1E;
  --bg-surface-hover: #252525;
  --border-primary: #2A2A2A;
  --border-secondary: #363636;
  --text-primary: #FFFFFF;
  --text-secondary: #9CA3AF;   /* gray-400 */
  --text-muted: #6B7280;       /* gray-500 */
}

/* Light tema */
:root.light {
  --bg-main: #F5F5F0;
  --bg-card: #FFFFFF;
  --bg-card-hover: #F9F9F6;
  --bg-surface: #EEEEEA;
  --bg-surface-hover: #E5E5E0;
  --border-primary: #E0E0E0;
  --border-secondary: #D0D0D0;
  --text-primary: #111111;
  --text-secondary: #4B5563;   /* gray-600 */
  --text-muted: #9CA3AF;       /* gray-400 */
}
```

### Mapiranje starih klasa → novih

| Stara klasa | Nova klasa | Dark vrednost | Light vrednost |
|-------------|-----------|---------------|----------------|
| `bg-dark-bg` | `bg-main` | #121212 | #F5F5F0 |
| `bg-dark-card` | `bg-card` | #1A1A1A | #FFFFFF |
| `bg-dark-card-hover` | `bg-card-hover` | #1F1F1F | #F9F9F6 |
| `bg-dark-surface` | `bg-surface` | #1E1E1E | #EEEEEA |
| `bg-dark-surface-hover` | `bg-surface-hover` | #252525 | #E5E5E0 |
| `border-dark-border` | `border-border-primary` | #2A2A2A | #E0E0E0 |
| `border-dark-border-light` | `border-border-secondary` | #363636 | #D0D0D0 |
| `text-white` (body) | `text-text-primary` | #FFFFFF | #111111 |
| `text-gray-400` (secondary) | `text-text-secondary` | #9CA3AF | #4B5563 |
| `text-gray-500` (muted) | `text-text-muted` | #6B7280 | #9CA3AF |

---

## Faza 2: Theme provider + toggle

### `src/lib/theme.tsx` — ThemeProvider

Koristi `next-themes` biblioteku (2KB, SSR-safe, localStorage, system preference).

```
npm install next-themes
```

- Default: `dark`
- Čuva izbor u localStorage
- Podržava system preference (`prefers-color-scheme`)
- Dodaje klasu na `<html>`: `dark` ili `light`

### `src/app/providers.tsx`

Wrap sa `ThemeProvider`:
```tsx
<ThemeProvider attribute="class" defaultTheme="dark">
  ...existing providers...
</ThemeProvider>
```

### `src/app/layout.tsx`

Ukloni hardcoded `dark bg-dark-bg text-white`:
```tsx
<html lang="sr" className={`${urbanist.className} bg-main text-text-primary antialiased`}>
```

### Toggle dugme

Dodati u header (`site-header.tsx`) — sun/moon ikonica:
- Na mobilnom: u bottom tab bar "Još" meniju
- Na desktopu: u header pored user dropdown-a

---

## Faza 3: Find & Replace — masovna zamena klasa

Ovo je mehanički posao — search & replace po celom projektu:

### Batch 1: Background boje
```
bg-dark-bg        →  bg-main
bg-dark-card      →  bg-card           (pazi: ne bg-dark-card-hover)
bg-dark-card-hover → bg-card-hover
bg-dark-surface   →  bg-surface        (pazi: ne bg-dark-surface-hover)
bg-dark-surface-hover → bg-surface-hover
```

### Batch 2: Border boje
```
border-dark-border-light → border-border-secondary  (PRVO ovo jer je duže)
border-dark-border       → border-border-primary
```

### Batch 3: Tekst boje (selektivno)
```
text-white (body/heading tekst) → text-text-primary
text-gray-400 (secondary tekst) → text-text-secondary
text-gray-500 (muted tekst) → text-text-muted
```

> **Pažnja:** `text-white` i `text-gray-400` se NE menjaju svuda:
> - `text-white` na zelenim dugmadima — ostaje (kontrast)
> - `text-gray-400` na hover state — možda ostaje
> - Treba ručna provera po fajlu

### Batch 4: Ukloni `dark:` prefix gde nije potreban
Većina `dark:` klasa postaje nepotrebna jer semantic varijable rade automatski.

---

## Faza 4: Specijalni slučajevi

### Komponente koje zahtevaju ručnu pažnju

1. **button.tsx** — primary (zeleno dugme sa crnim tekstom) ostaje isto u oba moda
2. **auth-layout.tsx** — pozadina + kartica
3. **Google Login** — `theme="filled_black"` za dark, treba `theme="outline"` za light
4. **site-header.tsx** — logo boja (trke green + srbija gray)
5. **bottom-tab-bar.tsx** — backdrop blur + border
6. **judge/page.tsx** — emerald gradijenti, ostaju ili prilagode
7. **badge.tsx** — color variants (zinc, green, red, amber...)
8. **Leaflet mapa** — tile layer URL se menja (dark vs light tiles)

### Boje koje NE zavise od teme
- `brand-green` (#00D084) — uvek isto
- `brand-red` (#FF4136) — uvek isto
- `text-red-400` (error) — uvek crveno
- `bg-brand-green` (primary button) — uvek zeleno

---

## Fajlovi po redosledu izmena

| Red | Fajl | Tip izmene |
|-----|------|-----------|
| 1 | `src/styles/tailwind.css` | Semantic tokeni + :root light/dark varijable |
| 2 | `package.json` | `npm install next-themes` |
| 3 | `src/app/providers.tsx` | ThemeProvider wrapper |
| 4 | `src/app/layout.tsx` | Ukloni hardcoded dark, koristi semantic klase |
| 5 | **87 fajlova** | Find & replace: `bg-dark-*` → `bg-*`, `border-dark-*` → `border-*` |
| 6 | `src/components/site-header.tsx` | Theme toggle dugme |
| 7 | `src/components/bottom-tab-bar.tsx` | Theme toggle u "Još" meniju |
| 8 | Specijalni slučajevi (button, badge, Google Login, Leaflet) | Ručno podešavanje |

---

## Procena

| Stavka | Fajlova | Vreme |
|--------|---------|-------|
| CSS infra + provider | 4 | ~30min |
| Masovna zamena (find/replace) | 87 | ~2-3h |
| Specijalni slučajevi | ~10 | ~1-2h |
| Theme toggle UI | 2 | ~30min |
| Testiranje oba moda | - | ~1h |
| **Ukupno** | | **~5-7h (2-3 sesije)** |

---

## Verifikacija

1. `npm run build` — bez grešaka
2. Toggle dark → light → dark — sve boje se menjaju
3. Refresh stranice — tema se pamti (localStorage)
4. System preference — ako nema saved preference, prati OS temu
5. Svaka stranica vizuelno proverena u oba moda:
   - Homepage, Events, Calendar, Event detail, Race detail, Results
   - Auth stranice, Admin panel, Judge, Settings
   - Mobile: bottom tab bar, expandable filters
6. Google Login dugme — `filled_black` (dark) / `outline` (light)
7. Leaflet mapa — odgovarajući tile layer
