import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Story 2.3 E2E guardrail tests — Backup Codes Generation & Usage
// Validates security headers, accessibility, and redirect behaviour
// for MFA pages without requiring authenticated sessions.

test.describe('MFA Backup Codes - Security Guardrails', () => {
  test('[P0] unauthenticated user accessing mfa-enroll should redirect to login', async ({
    page,
  }) => {
    await page.goto('/auth/mfa-enroll')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('[P0] unauthenticated user accessing mfa-verify should redirect to login', async ({
    page,
  }) => {
    await page.goto('/auth/mfa-verify')

    // Real MFA verify page requires authentication — redirects to login
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('[P1] security headers should be present on mfa-verify redirect', async ({ page }) => {
    const response = await page.goto('/auth/mfa-verify')
    const headers = response?.headers() ?? {}

    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
  })
})

test.describe('MFA Backup Codes - Redirect Verification', () => {
  test('[P1] mfa-verify redirect should land on functional login page', async ({ page }) => {
    await page.goto('/auth/mfa-verify')

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByTestId('login-email')).toBeVisible()
    await expect(page.getByTestId('login-password')).toBeVisible()
  })

  test('[P1] mfa-verify redirect should have correct page title', async ({ page }) => {
    await page.goto('/auth/mfa-verify')
    await expect(page).toHaveURL(/\/auth\/login/)

    await expect(page).toHaveTitle(/Login.*zyncdata/)
  })
})

test.describe('MFA Backup Codes - Accessibility', () => {
  test('[P0] mfa-enroll redirect should have no accessibility violations', async ({ page }) => {
    await page.goto('/auth/mfa-enroll')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page }).exclude('.animate-spin').analyze()
    expect(results.violations).toEqual([])
  })

  test('[P0] mfa-verify redirect should have no accessibility violations', async ({ page }) => {
    await page.goto('/auth/mfa-verify')
    await expect(page).toHaveURL(/\/auth\/login/)

    const results = await new AxeBuilder({ page }).exclude('.animate-spin').analyze()
    expect(results.violations).toEqual([])
  })
})

test.describe('MFA Backup Codes - No JS Errors', () => {
  test('[P1] mfa-verify redirect should have no critical console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto('/auth/mfa-verify')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('hydration') && !e.includes('Warning:'),
    )
    expect(criticalErrors).toEqual([])
  })
})
