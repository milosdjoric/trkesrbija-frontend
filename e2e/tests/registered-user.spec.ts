import { test, expect } from '@playwright/test'

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'e2e-test@trkesrbija.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
}

// Helper za login
async function login(page: any, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Lozinka').fill(password)
  await page.getByRole('button', { name: /prijavi se/i }).click()
  await page.waitForURL('/', { timeout: 15000 })
}

test.describe('Registrovan korisnik - Autentifikacija', () => {
  test('uspešna prijava sa validnim kredencijalima', async ({ page }) => {
    await login(page)

    // Trebalo bi da budemo na početnoj stranici
    await expect(page).toHaveURL('/')
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

test.describe('Registrovan korisnik - Zaštićene stranice', () => {
  test('može da pristupi /my-registrations posle prijave', async ({ page }) => {
    await login(page)

    await page.goto('/my-registrations')

    // Trebalo bi da smo na stranici, ne na login
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('može da pristupi /favorites posle prijave', async ({ page }) => {
    await login(page)

    await page.goto('/favorites')

    // Trebalo bi da smo na stranici, ne na login
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('može da pristupi /calendar posle prijave', async ({ page }) => {
    await login(page)

    await page.goto('/calendar')

    // Trebalo bi da smo na stranici
    await expect(page).toHaveURL('/calendar')
  })

  test('može da pristupi /gpx-analyzer posle prijave', async ({ page }) => {
    await login(page)

    await page.goto('/gpx-analyzer')

    // Trebalo bi da smo na stranici
    await expect(page).toHaveURL('/gpx-analyzer')
  })
})

test.describe('Registrovan korisnik - Navigacija', () => {
  test('može da pregleda događaje dok je prijavljen', async ({ page }) => {
    await login(page)

    await page.goto('/events')

    await expect(page).toHaveURL('/events')
    await expect(page.locator('body')).toBeVisible()
  })

  test('može da se vrati na početnu stranicu', async ({ page }) => {
    await login(page)

    await page.goto('/events')
    await page.goto('/')

    await expect(page).toHaveURL('/')
  })
})
