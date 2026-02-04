import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// TODO: Add authenticated MFA verify E2E tests (TOTP input rendering, backup code toggle, AC #1/#6)
// Requires mock auth session setup — deferred until auth test harness is available (Story 2.6+)

test.describe('MFA Verify Page', () => {
  test('[P1] unauthenticated user should be redirected to login', async ({ page }) => {
    await page.goto('/auth/mfa-verify')

    // Server-side guard redirects unauthenticated users to login
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('[P2] login page should be accessible after redirect from mfa-verify', async ({ page }) => {
    await page.goto('/auth/mfa-verify')

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('[P2] login page after redirect should have no accessibility violations', async ({
    page,
  }) => {
    await page.goto('/auth/mfa-verify')

    await expect(page).toHaveURL(/\/auth\/login/)

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })

  test('[P2] unauthenticated user accessing mfa-verify should land on functional login page', async ({
    page,
  }) => {
    await page.goto('/auth/mfa-verify')

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

    // Verify login form is functional
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })
})
