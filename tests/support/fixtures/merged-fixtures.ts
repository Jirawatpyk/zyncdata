import { test as base, mergeTests } from '@playwright/test'
import type { Page } from '@playwright/test'

// Custom project fixtures
const customFixtures = base.extend<{
  /** Authenticated page — logs in via Supabase before each test */
  authenticatedPage: Page
}>({
  authenticatedPage: async ({ page }, use) => {
    const email = process.env.TEST_USER_EMAIL
    const password = process.env.TEST_USER_PASSWORD

    if (!email || !password) {
      throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local')
    }

    await page.goto('/login')
    await page.getByTestId('email-input').fill(email)
    await page.getByTestId('password-input').fill(password)
    await page.getByTestId('login-submit').click()
    await page.waitForURL('/dashboard/**')

    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture API, not a React hook
    await use(page)
  },
})

// Merge all fixtures into single test object
// Add more fixtures here as the project grows:
//   import { test as someFixture } from './some-fixture'
//   export const test = mergeTests(customFixtures, someFixture)
export const test = mergeTests(customFixtures)

export { expect } from '@playwright/test'
