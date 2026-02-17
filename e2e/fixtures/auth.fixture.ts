import { test as base, expect, Page } from '@playwright/test'
import * as path from 'path'

// Test user credentials from .env.test
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'e2e-test@trkesrbija.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
  name: process.env.TEST_USER_NAME || 'E2E Test User',
}

// Path to store authenticated state
const AUTH_FILE = path.join(__dirname, '../.auth/user.json')

/**
 * Shared login helper that handles rate limiting with retry
 * Can be used from fixtures or directly in tests
 */
export async function loginWithRetry(
  targetPage: Page,
  email = TEST_USER.email,
  password = TEST_USER.password,
  maxRetries = 3
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await targetPage.goto('/login')

    // Fill login form
    await targetPage.getByLabel('Email').fill(email)
    await targetPage.getByLabel('Lozinka').fill(password)

    // Submit
    await targetPage.getByRole('button', { name: /prijavi se/i }).click()

    // Wait a bit for response
    await targetPage.waitForTimeout(1000)

    // Check for rate limiting error
    const rateLimitError = await targetPage.getByText(/too many|rate.?limit|previše pokušaja/i).isVisible()

    if (rateLimitError) {
      console.log(`Login attempt ${attempt} hit rate limit, waiting before retry...`)
      if (attempt < maxRetries) {
        // Wait longer between retries (exponential backoff)
        await targetPage.waitForTimeout(2000 * attempt)
        continue
      } else {
        throw new Error('Rate limited after maximum retries')
      }
    }

    // Check if login was successful (not on login page anymore)
    const currentUrl = targetPage.url()
    if (!currentUrl.includes('/login')) {
      return // Success!
    }

    // Wait for redirect if still on login page
    try {
      await targetPage.waitForFunction(
        () => !window.location.pathname.includes('/login'),
        { timeout: 10000 }
      )
      return // Success!
    } catch (e) {
      // Check for error message
      const hasError = await targetPage.getByText(/greška|error|neuspešno|pogrešna/i).isVisible()
      if (hasError && attempt < maxRetries) {
        console.log(`Login attempt ${attempt} failed, retrying...`)
        await targetPage.waitForTimeout(1000)
        continue
      }
      throw e
    }
  }
}

export type AuthFixtures = {
  // Authenticated page - already logged in
  authenticatedPage: Page

  // Login helper function
  login: (page: Page, email?: string, password?: string) => Promise<void>

  // Logout helper function
  logout: (page: Page) => Promise<void>
}

export const test = base.extend<AuthFixtures>({
  // Provide an already-authenticated page
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: AUTH_FILE,
    })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },

  // Login helper function
  login: async ({}, use) => {
    await use(loginWithRetry)
  },

  // Logout helper function
  logout: async ({}, use) => {
    const logoutFn = async (targetPage: Page) => {
      // Open user dropdown/menu and click logout
      // This depends on your app's UI structure
      await targetPage.getByRole('button', { name: /moj profil|nalog/i }).click()
      await targetPage.getByRole('menuitem', { name: /odjavi se/i }).click()

      // Wait for redirect
      await targetPage.waitForURL(/\/(login)?$/)
    }

    await use(logoutFn)
  },
})

export { expect }
