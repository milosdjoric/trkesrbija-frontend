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
    const loginFn = async (
      targetPage: Page,
      email = TEST_USER.email,
      password = TEST_USER.password
    ) => {
      await targetPage.goto('/login')

      // Fill login form
      await targetPage.getByLabel('Email').fill(email)
      await targetPage.getByLabel('Lozinka').fill(password)

      // Submit and wait for navigation
      await targetPage.getByRole('button', { name: /prijavi se/i }).click()

      // Wait for redirect to home page (successful login)
      await targetPage.waitForURL('/', { timeout: 15000 })
    }

    await use(loginFn)
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
