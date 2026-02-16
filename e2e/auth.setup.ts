import { test as setup, expect } from '@playwright/test'
import * as path from 'path'

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'e2e-test@trkesrbija.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
}

const authFile = path.join(__dirname, '.auth/user.json')

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('/login')

  // Fill credentials
  await page.getByLabel('Email').fill(TEST_USER.email)
  await page.getByLabel('Lozinka').fill(TEST_USER.password)

  // Submit login
  await page.getByRole('button', { name: /prijavi se/i }).click()

  // Wait for successful login (redirect to home)
  await page.waitForURL('/', { timeout: 15000 })

  // Verify logged in state
  await expect(page).toHaveURL('/')

  // Save authentication state (cookies, localStorage)
  await page.context().storageState({ path: authFile })
})
