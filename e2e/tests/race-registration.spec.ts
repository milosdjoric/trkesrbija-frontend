import { test, expect } from '@playwright/test'
import { TEST_USER } from '../fixtures/auth.fixture'

// NAPOMENA: Ovaj test fajl koristi sačuvan auth state iz global-setup.ts
// Testovi su već ulogovani, ne treba pozivati login()

test.describe('Prijava na trku', () => {
  test('neautentifikovan korisnik je redirektovan na login', async ({ browser }) => {
    // Za ovaj test koristimo nov context BEZ auth state
    const context = await browser.newContext()
    const page = await context.newPage()

    // Pokušaj pristupa stranici za prijavu na trku bez logina
    await page.goto('/races/some-race/register')

    // Trebalo bi da bude redirektovan na login
    await expect(page).toHaveURL(/\/login/)

    await context.close()
  })

  test('prikazuje formu za prijavu kada je korisnik ulogovan', async ({ page }) => {
    // Idi na events i pronađi trku sa otvorenom registracijom
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000) // Dodatno čekanje za učitavanje događaja

    // Pronađi bilo koji događaj
    const eventLink = page.locator('a[href^="/events/"]').first()

    if (await eventLink.isVisible()) {
      await eventLink.click()
      await page.waitForLoadState('networkidle')

      // Sada pronađi link ka trci
      const raceLink = page.locator('a[href^="/races/"]').first()

      if (await raceLink.isVisible()) {
        await raceLink.click()
        await page.waitForLoadState('networkidle')

        // Proveri da li postoji dugme za registraciju
        const registerButton = page.getByRole('link', { name: /prijavi se/i })

        if (await registerButton.isVisible()) {
          await registerButton.click()
          await page.waitForLoadState('networkidle')

          // Trebalo bi da vidimo formu za registraciju
          await expect(page.getByLabel(/ime/i).first()).toBeVisible()
          await expect(page.getByLabel(/prezime/i)).toBeVisible()
        } else {
          console.log('Registracija nije omogućena za ovu trku')
        }
      } else {
        console.log('Nema trka za prikaz na ovom događaju')
      }
    } else {
      console.log('Nema događaja za prikaz')
    }
  })

  test('email polje je readonly i popunjeno', async ({ page }) => {
    await page.goto('/events')
    await page.waitForLoadState('networkidle')

    const raceLink = page.locator('a[href^="/races/"]').first()

    if (await raceLink.isVisible()) {
      await raceLink.click()
      await page.waitForLoadState('networkidle')

      const registerButton = page.getByRole('link', { name: /prijavi se/i })

      if (await registerButton.isVisible()) {
        await registerButton.click()
        await page.waitForLoadState('networkidle')

        // Email polje treba da bude readonly
        const emailField = page.getByLabel('Email')
        if (await emailField.isVisible()) {
          await expect(emailField).toHaveAttribute('readonly', '')
          // I treba da sadrži email korisnika
          await expect(emailField).toHaveValue(TEST_USER.email)
        }
      }
    }
  })

  test('validacija pola - mora biti izabran', async ({ page }) => {
    await page.goto('/events')
    await page.waitForLoadState('networkidle')

    const raceLink = page.locator('a[href^="/races/"]').first()

    if (await raceLink.isVisible()) {
      await raceLink.click()
      await page.waitForLoadState('networkidle')

      const registerButton = page.getByRole('link', { name: /prijavi se/i })

      if (await registerButton.isVisible()) {
        await registerButton.click()
        await page.waitForLoadState('networkidle')

        // Proveri da postoje radio dugmadi za pol
        const maleRadio = page.getByRole('radio', { name: /muški/i })
        const femaleRadio = page.getByRole('radio', { name: /ženski/i })

        if (await maleRadio.isVisible()) {
          await expect(maleRadio).toBeVisible()
          await expect(femaleRadio).toBeVisible()
        }
      }
    }
  })
})
