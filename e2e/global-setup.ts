import { FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

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

  console.log('[Global Setup] Test user:', process.env.TEST_USER_EMAIL)
  console.log('[Global Setup] Preparation complete.\n')
  console.log(
    '[Global Setup] NOTE: Make sure the test user exists in your database before running tests!'
  )
  console.log('')
}

export default globalSetup
