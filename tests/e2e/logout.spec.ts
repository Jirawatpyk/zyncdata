import { expect } from '@playwright/test'
import { test } from '../support/fixtures/merged-fixtures'
import AxeBuilder from '@axe-core/playwright'

// Logout tests use /admin/systems (the actual authenticated landing page)
// proxy.ts redirects unauthenticated users to /auth/login
//
// IMPORTANT: signOut() revokes the server-side session, invalidating the JWT
// for ALL subsequent tests. Non-destructive tests MUST run first, and only
// ONE destructive test (the actual logout click) runs last.

test.describe('Logout', () => {
  // --- Non-destructive tests (session stays alive) ---

  test('[P1] should display logout button on admin page', async ({ adminPage }) => {
    await adminPage.goto('/admin/systems')
    await adminPage.getByTestId('logout-button').waitFor({ state: 'visible' })

    const logoutButton = adminPage.getByTestId('logout-button')
    await expect(logoutButton).toBeVisible()
    await expect(logoutButton).toHaveText('Logout')
  })

  test('[P1] admin page should have exactly one logout form', async ({ adminPage }) => {
    await adminPage.goto('/admin/systems')
    await adminPage.getByTestId('logout-button').waitFor({ state: 'visible' })

    const logoutForms = adminPage.locator('form:has([data-testid="logout-button"])')
    await expect(logoutForms).toHaveCount(1)
  })

  test('[P2] should have no accessibility violations on admin page with logout button', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/systems')
    await adminPage.getByTestId('logout-button').waitFor({ state: 'visible' })

    await expect(adminPage.getByTestId('logout-button')).toBeVisible()

    const results = await new AxeBuilder({ page: adminPage }).analyze()
    expect(results.violations).toEqual([])
  })

  // --- Destructive test (kills server-side session — MUST be last) ---

  test('[P1] should redirect to login page after clicking logout', async ({ adminPage }) => {
    await adminPage.goto('/admin/systems')
    await adminPage.getByTestId('logout-button').waitFor({ state: 'visible' })

    const logoutButton = adminPage.getByTestId('logout-button')

    // Verify keyboard accessibility before clicking (guardrail coverage)
    await logoutButton.focus()
    await expect(logoutButton).toBeFocused()

    // Click logout — this revokes the session server-side
    await logoutButton.click()

    await expect(adminPage).toHaveURL(/\/auth\/login/)
    await expect(adminPage.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })
})
