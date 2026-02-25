import { FullConfig, chromium } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const AUTH_FILE = path.join(__dirname, '.auth/user.json')
const ADMIN_AUTH_FILE = path.join(__dirname, '.auth/admin.json')

async function globalSetup(config: FullConfig) {
  console.log('\n[Global Setup] Starting E2E test preparation...')

  // Ensure .auth directory exists
  const authDir = path.join(__dirname, '.auth')
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  // Load test environment variables
  const envTestPath = path.join(__dirname, '../.env.test')
  if (fs.existsSync(envTestPath)) {
    const envContent = fs.readFileSync(envTestPath, 'utf-8')
    const lines = envContent.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=')
        if (key && value) {
          process.env[key] = value
        }
      }
    }

    console.log('[Global Setup] Loaded .env.test variables')
  }

  const testEmail = process.env.TEST_USER_EMAIL || 'e2e-test@trkesrbija.com'
  const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!'
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'e2e-admin@trkesrbija.com'
  const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!'
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

  console.log('[Global Setup] Test user:', testEmail)
  console.log('[Global Setup] Admin user:', adminEmail)
  console.log('[Global Setup] Base URL:', baseURL)

  const browser = await chromium.launch()

  // --- Regular user login ---
  console.log('[Global Setup] Performing initial login (regular user)...')
  const userContext = await browser.newContext()
  const userPage = await userContext.newPage()

  try {
    await userPage.goto(`${baseURL}/login`)
    await userPage.getByLabel('Email').fill(testEmail)
    await userPage.getByLabel('Lozinka').fill(testPassword)
    await userPage.getByRole('button', { name: /prijavi se/i }).click()

    await userPage.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 15000 }
    )

    await userContext.storageState({ path: AUTH_FILE })
    console.log('[Global Setup] Regular user auth state saved to:', AUTH_FILE)
  } catch (error) {
    console.error('[Global Setup] Regular user login failed:', error)
    console.log('[Global Setup] Tests requiring authentication will fail.')
  } finally {
    await userContext.close()
  }

  // --- Admin user login ---
  console.log('[Global Setup] Performing initial login (admin user)...')
  const adminContext = await browser.newContext()
  const adminPage = await adminContext.newPage()

  try {
    await adminPage.goto(`${baseURL}/login`)
    await adminPage.getByLabel('Email').fill(adminEmail)
    await adminPage.getByLabel('Lozinka').fill(adminPassword)
    await adminPage.getByRole('button', { name: /prijavi se/i }).click()

    await adminPage.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 15000 }
    )

    await adminContext.storageState({ path: ADMIN_AUTH_FILE })
    console.log('[Global Setup] Admin auth state saved to:', ADMIN_AUTH_FILE)
  } catch (error) {
    console.error('[Global Setup] Admin login failed:', error)
    console.log('[Global Setup] Admin tests will be skipped or fail.')
  } finally {
    await adminContext.close()
  }

  await browser.close()
  console.log('[Global Setup] Preparation complete.\n')
}

export default globalSetup
