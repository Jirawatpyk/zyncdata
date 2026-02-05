import { chromium, type FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { config as loadEnv } from 'dotenv'
import { generateTotpCode } from './totp-helper'

// Load environment variables from .env.local
loadEnv({ path: path.join(__dirname, '../../../.env.local') })

const AUTH_STATE_PATH = path.join(__dirname, '../../../playwright/.auth/admin.json')
const TOTP_SECRET_PATH = path.join(__dirname, '../../../playwright/.auth/totp-secret.txt')

/**
 * Global setup for Playwright E2E tests.
 *
 * This setup:
 * 1. Logs in as admin using seed credentials
 * 2. Handles MFA enrollment (first time) or verification
 * 3. Saves auth state for reuse across all tests
 *
 * Required env vars:
 * - SEED_ADMIN_EMAIL (or TEST_ADMIN_EMAIL)
 * - SEED_ADMIN_PASSWORD (or TEST_ADMIN_PASSWORD)
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'

  const email = process.env.TEST_ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL
  const password = process.env.TEST_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error(
      'Admin credentials required for E2E tests. Set TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD or SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD in .env.local'
    )
  }

  // Ensure auth directory exists
  const authDir = path.dirname(AUTH_STATE_PATH)
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  // Check if we already have valid auth state
  if (fs.existsSync(AUTH_STATE_PATH)) {
    const stats = fs.statSync(AUTH_STATE_PATH)
    const ageMinutes = (Date.now() - stats.mtimeMs) / 1000 / 60

    if (ageMinutes < 30) {
      // Validate the stored JWT session is still alive (Supabase restart clears sessions)
      const isValid = await validateStoredSession(AUTH_STATE_PATH, baseURL)
      if (isValid) {
        console.log('✓ Reusing existing admin auth state')
        return
      }
      console.log('⚠️ Stored auth state is stale (session expired), re-authenticating...')
    }
  }

  console.log('🔐 Setting up admin authentication...')

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Log browser console errors for debugging
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`🌐 Browser error: ${msg.text()}`)
    }
  })
  page.on('pageerror', (error) => {
    console.log(`🌐 Page error: ${error.message}`)
  })

  try {
    // Step 1: Navigate to login
    await page.goto(`${baseURL}/auth/login`)

    // Step 2: Fill login form
    await page.getByTestId('login-email').fill(email)
    await page.getByTestId('login-password').fill(password)
    await page.getByTestId('login-submit').click()

    // Step 3: Wait for navigation - could go to MFA enroll, MFA verify, or admin
    await page.waitForURL(/\/(admin|auth\/mfa-(enroll|verify))/, { timeout: 15000 })
    const currentUrl = page.url()

    // Step 4: Handle MFA if needed
    if (currentUrl.includes('/auth/mfa-enroll')) {
      console.log('📱 Enrolling MFA for test admin...')
      await handleMfaEnrollment(page)
    } else if (currentUrl.includes('/auth/mfa-verify')) {
      console.log('🔑 Verifying MFA...')
      await handleMfaVerification(page)
    }

    // Step 5: Verify we're on admin page
    await page.waitForURL(/\/admin/, { timeout: 15000 })
    console.log('✓ Admin authentication successful')

    // Step 6: Save auth state
    await context.storageState({ path: AUTH_STATE_PATH })
    console.log(`✓ Auth state saved to ${AUTH_STATE_PATH}`)

  } catch (error) {
    // Save screenshot on failure for debugging
    const screenshotPath = path.join(authDir, 'setup-failure.png')
    await page.screenshot({ path: screenshotPath })
    console.error(`❌ Auth setup failed. Screenshot saved to ${screenshotPath}`)
    console.error(`Current URL: ${page.url()}`)
    throw error
  } finally {
    await browser.close()
  }
}

/**
 * Validate that stored auth state has a valid session.
 * Supabase restart clears all sessions, making stored JWT invalid.
 */
async function validateStoredSession(authStatePath: string, baseURL: string): Promise<boolean> {
  try {
    const stateData = JSON.parse(fs.readFileSync(authStatePath, 'utf-8'))
    const cookie = stateData.cookies?.find((c: { name: string }) => c.name.startsWith('sb-'))
    if (!cookie) return false

    // Decode the Supabase auth cookie to extract the access token
    const val = cookie.value.replace('base64-', '')
    const decoded = JSON.parse(Buffer.from(val, 'base64').toString())
    if (!decoded.access_token) return false

    // Validate the token against Supabase Auth server
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
    const resp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${decoded.access_token}`,
      },
    })

    return resp.ok
  } catch {
    return false
  }
}

/**
 * Handle MFA enrollment for first-time login.
 * Extracts TOTP secret and verifies enrollment.
 */
async function handleMfaEnrollment(page: import('@playwright/test').Page): Promise<void> {
  // Wait for enrollment to complete - either QR code appears or error appears
  // The enrollment makes an API call to Supabase which can take a while
  const result = await Promise.race([
    page.waitForSelector('[data-testid="mfa-qr-code"]', { timeout: 30000 }).then(() => 'qr'),
    page.waitForSelector('[data-testid="mfa-enroll-error"]', { timeout: 30000 }).then(() => 'error'),
  ])

  if (result === 'error') {
    const errorText = await page.getByTestId('mfa-enroll-error').textContent()
    console.log(`⚠️ MFA enrollment error: ${errorText}`)

    // Try clicking retry button
    console.log('🔄 Retrying MFA enrollment...')
    await page.getByTestId('mfa-retry-enroll').click()

    // Wait for QR code after retry
    await page.waitForSelector('[data-testid="mfa-qr-code"]', { timeout: 30000 })
  }

  // Click "Can't scan? Show secret key" to reveal the secret
  await page.getByTestId('mfa-toggle-secret').click()

  // Wait for secret text to be visible
  await page.waitForSelector('[data-testid="mfa-secret-text"]', { timeout: 5000 })

  // Get the TOTP secret from the displayed text
  const secret = await page.getByTestId('mfa-secret-text').textContent()
  if (!secret) {
    throw new Error('Could not extract TOTP secret from MFA enrollment page')
  }

  await enrollWithSecret(page, secret.trim())
}

/**
 * Complete MFA enrollment with a given secret.
 */
async function enrollWithSecret(page: import('@playwright/test').Page, secret: string): Promise<void> {
  // Save the secret for future verifications
  fs.writeFileSync(TOTP_SECRET_PATH, secret)
  console.log(`✓ TOTP secret saved for future tests`)

  // Generate and enter the TOTP code
  const code = await generateTotpCode(secret)
  await page.getByTestId('mfa-code-input').fill(code)
  await page.getByTestId('mfa-verify-submit').click()

  // Wait for backup codes page (shown after successful enrollment)
  try {
    await page.waitForSelector('[data-testid="backup-codes-continue"]', { timeout: 10000 })

    // Save backup codes for reference
    const codeElements = await page.locator('[data-testid^="backup-code-"]').allTextContents()
    if (codeElements.length > 0) {
      const backupCodesPath = path.join(path.dirname(TOTP_SECRET_PATH), 'backup-codes.txt')
      fs.writeFileSync(backupCodesPath, codeElements.join('\n'))
      console.log(`✓ Backup codes saved to ${backupCodesPath}`)
    }

    // Check the acknowledgment checkbox and continue
    await page.getByTestId('backup-codes-acknowledge').check()
    await page.getByTestId('backup-codes-continue').click()
  } catch {
    // No backup codes page or already redirected, continue
  }
}

/**
 * Handle MFA verification for returning users.
 */
async function handleMfaVerification(page: import('@playwright/test').Page): Promise<void> {
  // Wait for the verification form
  await page.waitForSelector('[data-testid="mfa-verify-code-input"]', { timeout: 10000 })

  // Get saved TOTP secret
  if (!fs.existsSync(TOTP_SECRET_PATH)) {
    throw new Error(
      `TOTP secret not found at ${TOTP_SECRET_PATH}. ` +
      'MFA enrollment may be required. Delete playwright/.auth/ directory and run tests again.'
    )
  }

  const secret = fs.readFileSync(TOTP_SECRET_PATH, 'utf-8').trim()
  const code = await generateTotpCode(secret)

  await page.getByTestId('mfa-verify-code-input').fill(code)
  await page.getByTestId('mfa-verify-submit').click()
}
