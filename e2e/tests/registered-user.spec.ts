import { test, expect } from '../fixtures/auth.fixture'

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'e2e-test@trkesrbija.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
}

test.describe('Registrovan korisnik - Autentifikacija', () => {
  test('uspešna prijava sa validnim kredencijalima', async ({ page, login }) => {
    await login(page, TEST_USER.email, TEST_USER.password)

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

    // Trebalo bi da ostanemo na login stranici sa greškom
    await expect(page).toHaveURL('/login')

    // Poruka o grešci
    await expect(page.getByText(/prijava nije uspela|pogrešna|neispravna/i)).toBeVisible({
      timeout: 5000,
    })
  })

  test('greška za nepostojeći email', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('nepostoji@test.com')
    await page.getByLabel('Lozinka').fill('BilokojeLozinka123!')

    await page.getByRole('button', { name: /prijavi se/i }).click()

    // Trebalo bi da ostanemo na login stranici
    await expect(page).toHaveURL('/login')

    // Poruka o grešci
    await expect(page.getByText(/prijava nije uspela|nije pronađen|neispravna/i)).toBeVisible({
      timeout: 5000,
    })
  })
})

test.describe('Registrovan korisnik - Zaštićene stranice', () => {
  test('može da pristupi /my-registrations posle prijave', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/my-registrations')

    // Trebalo bi da smo na stranici, ne na login
    await expect(authenticatedPage).not.toHaveURL(/\/login/)

    // Stranica se učitala
    await expect(authenticatedPage.locator('body')).toBeVisible()
  })

  test('može da pristupi /favorites posle prijave', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/favorites')

    // Trebalo bi da smo na stranici, ne na login
    await expect(authenticatedPage).not.toHaveURL(/\/login/)
  })

  test('može da pristupi /calendar posle prijave', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/calendar')

    // Trebalo bi da smo na stranici, ne na login
    await expect(authenticatedPage).not.toHaveURL(/\/login/)
  })

  test('može da pristupi /gpx-analyzer posle prijave', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/gpx-analyzer')

    // Trebalo bi da smo na stranici, ne na login
    await expect(authenticatedPage).not.toHaveURL(/\/login/)
  })
})

test.describe('Registrovan korisnik - Navigacija', () => {
  test('može da pregleda događaje dok je prijavljen', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/events')

    await expect(authenticatedPage).toHaveURL('/events')
    await expect(authenticatedPage.locator('body')).toBeVisible()
  })

  test('može da se vrati na početnu stranicu', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/events')
    await authenticatedPage.goto('/')

    await expect(authenticatedPage).toHaveURL('/')
  })
})
