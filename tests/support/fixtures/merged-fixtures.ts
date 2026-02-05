import { test as base, mergeTests } from '@playwright/test'
import type { Page } from '@playwright/test'
import * as path from 'path'

const AUTH_STATE_PATH = path.join(__dirname, '../../playwright/.auth/admin.json')

// Custom project fixtures
const customFixtures = base.extend<{
  /**
   * Authenticated page — logs in via UI before each test.
   * Use for tests requiring specific user credentials.
   * @deprecated Prefer adminPage fixture which uses cached auth state
   */
  authenticatedPage: Page

  /**
   * Admin authenticated page — uses cached auth state from global setup.
   * Fast and reliable for admin panel tests.
   */
  adminPage: Page
}>({
  authenticatedPage: async ({ page }, use) => {
    const email = process.env.TEST_USER_EMAIL || process.env.SEED_ADMIN_EMAIL
    const password = process.env.TEST_USER_PASSWORD || process.env.SEED_ADMIN_PASSWORD

    if (!email || !password) {
      throw new Error(
        'TEST_USER_EMAIL/TEST_USER_PASSWORD or SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD must be set in .env.local'
      )
    }

    await page.goto('/auth/login')
    await page.getByTestId('login-email').fill(email)
    await page.getByTestId('login-password').fill(password)
    await page.getByTestId('login-submit').click()

    // Wait for navigation - might go to MFA or admin
    await page.waitForURL(/\/(admin|auth\/mfa-)/, { timeout: 15000 })

    // If MFA is required, this fixture won't handle it
    // Use adminPage fixture instead which has auth state from global setup
    if (page.url().includes('/auth/mfa-')) {
      throw new Error(
        'MFA required but authenticatedPage fixture does not handle MFA. ' +
        'Use adminPage fixture instead, or run global setup first.'
      )
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture API, not a React hook
    await use(page)
  },

  adminPage: async ({ browser }, use) => {
    // Create context with saved auth state from global setup
    const context = await browser.newContext({
      storageState: AUTH_STATE_PATH,
    })
    const page = await context.newPage()

    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture API, not a React hook
    await use(page)

    // Cleanup
    await context.close()
  },
})

// Merge all fixtures into single test object
// Add more fixtures here as the project grows:
//   import { test as someFixture } from './some-fixture'
//   export const test = mergeTests(customFixtures, someFixture)
export const test = mergeTests(customFixtures)

export { expect } from '@playwright/test'
