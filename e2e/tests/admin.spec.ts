import { test, expect } from '@playwright/test'

// ============================================================================
// Admin Access Control
// ============================================================================

test.describe('Admin - Kontrola pristupa', () => {
  test('neautentifikovan korisnik je redirektovan sa /admin', async ({ browser }) => {
    const context = await browser.newContext() // fresh context, no auth
    const page = await context.newPage()

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Should be redirected to login or home (not on /admin)
    await expect(page).not.toHaveURL(/\/admin$/)

    await context.close()
  })

  test('običan korisnik ne može pristupiti /admin', async ({ browser }) => {
    // Uses regular user auth state
    const context = await browser.newContext({
      storageState: './e2e/.auth/user.json',
    })
    const page = await context.newPage()

    await page.goto('/admin')
    await page.waitForTimeout(2000) // wait for client-side redirect

    // Regular user should be redirected away from /admin
    await expect(page).not.toHaveURL(/\/admin$/)

    await context.close()
  })
})

// ============================================================================
// Admin Dashboard
// ============================================================================
// NOTE: These tests require an admin user (TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD)
// with ADMIN role to be present in the database.

test.describe('Admin - Dashboard', () => {
  test('admin vidi Admin Panel naslov', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page.getByRole('heading', { name: /admin panel/i })).toBeVisible()
  })

  test('admin vidi sve brze linkove za navigaciju', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page.getByRole('link', { name: /događaji/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /trke/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /korisnici/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /import/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /prijave grešaka/i })).toBeVisible()
  })

  test('admin vidi statistike (Događaji, Trke, Prijave, Korisnici)', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Stats grid should show stat labels
    await expect(page.getByText('Događaji').first()).toBeVisible()
    await expect(page.getByText('Trke').first()).toBeVisible()
    await expect(page.getByText('Prijave').first()).toBeVisible()
    await expect(page.getByText('Korisnici').first()).toBeVisible()
  })
})

// ============================================================================
// Admin Events Management
// ============================================================================

test.describe('Admin - Upravljanje događajima', () => {
  test('učitava listu događaja', async ({ page }) => {
    await page.goto('/admin/events')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page.getByRole('heading', { name: /događaji/i })).toBeVisible()
  })

  test('prikazuje dugme za kreiranje novog događaja', async ({ page }) => {
    await page.goto('/admin/events')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const newButton = page.getByRole('link', { name: /novi događaj|dodaj/i })
      .or(page.getByRole('button', { name: /novi događaj|dodaj/i }))
      .first()

    await expect(newButton).toBeVisible()
  })

  test('forma za kreiranje događaja je dostupna', async ({ page }) => {
    await page.goto('/admin/events/new')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Should show a form with an event name field
    const nameField = page.getByLabel(/naziv događaja|ime/i).first()
    await expect(nameField).toBeVisible()
  })

  test('prikazuje polje za pretragu na listi događaja', async ({ page }) => {
    await page.goto('/admin/events')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Search input should be present
    const searchInput = page.getByPlaceholder(/pretraži|search/i)
      .or(page.locator('input[type="search"]'))
      .first()

    await expect(searchInput).toBeVisible()
  })
})

// ============================================================================
// Admin Races Management
// ============================================================================

test.describe('Admin - Upravljanje trkama', () => {
  test('učitava listu trka', async ({ page }) => {
    await page.goto('/admin/races')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page.getByRole('heading', { name: /trke/i })).toBeVisible()
  })

  test('prikazuje dugme za kreiranje nove trke', async ({ page }) => {
    await page.goto('/admin/races')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const newButton = page.getByRole('link', { name: /nova trka|dodaj/i })
      .or(page.getByRole('button', { name: /nova trka|dodaj/i }))
      .first()

    await expect(newButton).toBeVisible()
  })
})

// ============================================================================
// Admin Users
// ============================================================================

test.describe('Admin - Korisnici', () => {
  test('admin može pristupiti listi korisnika', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page.getByRole('heading', { name: /korisnici/i })).toBeVisible()
  })
})

// ============================================================================
// Admin Reports
// ============================================================================

test.describe('Admin - Prijave grešaka', () => {
  test('admin može pristupiti listi prijava', async ({ page }) => {
    await page.goto('/admin/reports')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page.getByRole('heading', { name: /prijave grešaka|reporti/i })).toBeVisible()
  })

  test('prikazuje filter za status prijave', async ({ page }) => {
    await page.goto('/admin/reports')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Status filter buttons/tabs should be present
    const pendingFilter = page.getByRole('button', { name: /na čekanju|pending/i })
      .or(page.getByText(/na čekanju/i))
      .first()

    await expect(pendingFilter).toBeVisible()
  })
})
