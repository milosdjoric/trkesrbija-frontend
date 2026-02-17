import { test, expect } from '@playwright/test'
import { TEST_USER } from '../fixtures/auth.fixture'

// NAPOMENA: Ovi testovi KORISTE fresh session (bez auth state)
// jer testiraju sam proces logina/logouta

test.describe('Autentifikacija - Login', () => {
  test('uspešna prijava sa validnim kredencijalima', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Lozinka').fill(TEST_USER.password)
    await page.getByRole('button', { name: /prijavi se/i }).click()

    // Čekamo redirect sa login stranice
    await page.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 15000 }
    )

    // Trebalo bi da nismo više na login stranici
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('greška za pogrešnu lozinku', async ({ page }) => {
    await page.goto('/login')

    // Unesemo pogrešnu lozinku
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Lozinka').fill('PogresnaLozinka123!')

    // Submit
    await page.getByRole('button', { name: /prijavi se/i }).click()

    // Sačekamo malo za response
    await page.waitForTimeout(2000)

    // Trebalo bi da ostanemo na login stranici
    await expect(page).toHaveURL('/login')
  })

  test('greška za nepostojeći email', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('nepostoji@test.com')
    await page.getByLabel('Lozinka').fill('BilokojeLozinka123!')

    await page.getByRole('button', { name: /prijavi se/i }).click()

    // Sačekamo malo za response
    await page.waitForTimeout(2000)

    // Trebalo bi da ostanemo na login stranici
    await expect(page).toHaveURL('/login')
  })
})
