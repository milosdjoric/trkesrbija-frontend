import { test, expect } from '@playwright/test'

test.describe('Neregistrovan korisnik - Pregled sadržaja', () => {
  test('može da vidi listu događaja na /events', async ({ page }) => {
    await page.goto('/events')

    // Stranica se učitala
    await expect(page).toHaveURL('/events')

    // Naslov ili sadržaj je vidljiv
    await expect(page.locator('body')).toBeVisible()
  })

  test('može da otvori detalje događaja', async ({ page }) => {
    await page.goto('/events')

    // Sačekaj da se stranica učita
    await page.waitForLoadState('networkidle')

    // Pronađi prvi link ka događaju (ako postoji)
    const eventLink = page.locator('a[href^="/events/"]').first()

    if (await eventLink.isVisible()) {
      await eventLink.click()

      // Proverimo da smo na stranici događaja
      await expect(page).toHaveURL(/\/events\/[\w-]+/)
    } else {
      // Nema događaja - test prolazi jer je to validno stanje
      console.log('Nema događaja za prikaz')
    }
  })

  test('može da vidi detalje trke', async ({ page }) => {
    await page.goto('/events')

    await page.waitForLoadState('networkidle')

    // Pronađi link ka trci
    const raceLink = page.locator('a[href^="/races/"]').first()

    if (await raceLink.isVisible()) {
      await raceLink.click()

      // Proverimo da smo na stranici trke
      await expect(page).toHaveURL(/\/races\/[\w-]+/)
    } else {
      console.log('Nema trka za prikaz')
    }
  })
})

test.describe('Neregistrovan korisnik - Zaštićene stranice', () => {
  test('redirect na login kada pokušava /my-registrations', async ({ page }) => {
    await page.goto('/my-registrations')

    // Trebalo bi da bude redirektovan na login
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirect na login kada pokušava /favorites', async ({ page }) => {
    await page.goto('/favorites')

    // Trebalo bi da bude redirektovan na login
    await expect(page).toHaveURL(/\/login/)
  })

  // Note: /calendar i /gpx-analyzer nisu zaštićene stranice - dostupne su svima
  test('može da pristupi /calendar bez prijave', async ({ page }) => {
    await page.goto('/calendar')

    // Ostaje na calendar stranici
    await expect(page).toHaveURL('/calendar')
  })

  test('može da pristupi /gpx-analyzer bez prijave', async ({ page }) => {
    await page.goto('/gpx-analyzer')

    // Ostaje na gpx-analyzer stranici
    await expect(page).toHaveURL('/gpx-analyzer')
  })
})

test.describe('Neregistrovan korisnik - Login stranica', () => {
  test('može da vidi login formu', async ({ page }) => {
    await page.goto('/login')

    // Login forma je vidljiva
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Lozinka')).toBeVisible()
    await expect(page.getByRole('button', { name: /prijavi se/i })).toBeVisible()
  })

  test('može da vidi link za registraciju', async ({ page }) => {
    await page.goto('/login')

    // Link za registraciju postoji
    await expect(page.getByRole('link', { name: /registruj se/i })).toBeVisible()
  })

  test('može da vidi link za zaboravljenu lozinku', async ({ page }) => {
    await page.goto('/login')

    // Link za zaboravljenu lozinku postoji
    await expect(page.getByRole('link', { name: /zaboravljena lozinka/i })).toBeVisible()
  })
})
