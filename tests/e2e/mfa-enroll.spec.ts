import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('MFA Enrollment Page', () => {
  test('[P1] unauthenticated user should be redirected to login', async ({ page }) => {
    await page.goto('/auth/mfa-enroll')

    // Server-side guard redirects unauthenticated users to login
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('[P2] login page should be accessible after redirect from mfa-enroll', async ({ page }) => {
    await page.goto('/auth/mfa-enroll')

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('[P2] login page after redirect should have no accessibility violations', async ({
    page,
  }) => {
    await page.goto('/auth/mfa-enroll')

    await expect(page).toHaveURL(/\/auth\/login/)

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })

  test('[P2] unauthenticated user accessing mfa-enroll should land on functional login page', async ({
    page,
  }) => {
    // Server-side auth guard redirects to login — no auth cookies present.
    // Authenticated MFA enrollment E2E requires test user setup with real Supabase session.
    await page.goto('/auth/mfa-enroll')

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

    // Verify login form is functional
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })
})
