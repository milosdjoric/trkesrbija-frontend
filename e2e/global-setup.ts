import { FullConfig, chromium } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const AUTH_FILE = path.join(__dirname, '.auth/user.json')

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
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

  console.log('[Global Setup] Test user:', testEmail)
  console.log('[Global Setup] Base URL:', baseURL)

  // Login once and save auth state for all tests
  console.log('[Global Setup] Performing initial login to save auth state...')

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto(`${baseURL}/login`)
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Lozinka').fill(testPassword)
    await page.getByRole('button', { name: /prijavi se/i }).click()

    // Wait for redirect (login successful)
    await page.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 15000 }
    )

    // Save auth state
    await context.storageState({ path: AUTH_FILE })
    console.log('[Global Setup] Auth state saved to:', AUTH_FILE)
  } catch (error) {
    console.error('[Global Setup] Login failed:', error)
    console.log('[Global Setup] Tests requiring authentication will fail.')
  } finally {
    await browser.close()
  }

  console.log('[Global Setup] Preparation complete.\n')
}

export default globalSetup
