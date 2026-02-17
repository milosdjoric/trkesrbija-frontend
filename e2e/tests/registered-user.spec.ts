import { test, expect } from '@playwright/test'
import { TEST_USER } from '../fixtures/auth.fixture'

// NAPOMENA: Ovaj test fajl koristi sačuvan auth state iz global-setup.ts
// Testovi su već ulogovani, ne treba pozivati login()

test.describe('Registrovan korisnik - Zaštićene stranice', () => {
  test('može da pristupi /my-registrations', async ({ page }) => {
    await page.goto('/my-registrations')

    // Trebalo bi da smo na stranici, ne na login
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('može da pristupi /favorites', async ({ page }) => {
    await page.goto('/favorites')

    // Trebalo bi da smo na stranici, ne na login
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('može da pristupi /calendar', async ({ page }) => {
    await page.goto('/calendar')

    // Trebalo bi da smo na stranici
    await expect(page).toHaveURL('/calendar')
  })

  test('može da pristupi /gpx-analyzer', async ({ page }) => {
    await page.goto('/gpx-analyzer')

    // Trebalo bi da smo na stranici
    await expect(page).toHaveURL('/gpx-analyzer')
  })
})

test.describe('Registrovan korisnik - Navigacija', () => {
  test('može da pregleda događaje dok je prijavljen', async ({ page }) => {
    await page.goto('/events')

    await expect(page).toHaveURL('/events')
    await expect(page.locator('body')).toBeVisible()
  })

  test('može da se vrati na početnu stranicu', async ({ page }) => {
    await page.goto('/events')
    await page.goto('/')

    await expect(page).toHaveURL('/')
  })
})
