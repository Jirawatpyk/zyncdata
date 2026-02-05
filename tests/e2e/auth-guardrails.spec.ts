import { expect } from '@playwright/test'
import { test } from '../support/fixtures/merged-fixtures'
import AxeBuilder from '@axe-core/playwright'

// Story 2.1 guardrail tests — fills E2E coverage gaps not addressed by login.spec.ts

test.describe('Dashboard Stub Page', () => {
  test('[P2] should render dashboard heading and placeholder text', async ({ adminPage }) => {
    await adminPage.goto('/dashboard')

    await expect(adminPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(adminPage.getByText('Dashboard coming in Epic 3+')).toBeVisible()
  })

  test('[P2] should have correct page title', async ({ adminPage }) => {
    await adminPage.goto('/dashboard')

    await expect(adminPage).toHaveTitle(/Dashboard.*zyncdata/)
  })

  test('[P2] should have no accessibility violations', async ({ adminPage }) => {
    await adminPage.goto('/dashboard')

    const results = await new AxeBuilder({ page: adminPage }).analyze()
    expect(results.violations).toEqual([])
  })
})

test.describe('Auth Callback Error Handling', () => {
  test('[P2] should redirect to login with error when code is missing', async ({ page }) => {
    await page.goto('/auth/callback')

    await expect(page).toHaveURL(/\/auth\/login\?error=auth_callback_failed/)
  })
})

test.describe('MFA Pages Redirect Unauthenticated Users', () => {
  test('[P2] should redirect from MFA enrollment to login page', async ({ page }) => {
    await page.goto('/auth/mfa-enroll')

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('[P2] should redirect from MFA verification to login page', async ({ page }) => {
    await page.goto('/auth/mfa-verify')

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })
})

test.describe('Login Form Keyboard Submit', () => {
  test('[P2] should submit form when pressing Enter in the password field', async ({ page }) => {
    await page.goto('/auth/login')

    await page.getByTestId('login-email').fill('wrong@example.com')
    await page.getByTestId('login-password').fill('wrongpassword')
    await page.getByTestId('login-password').press('Enter')

    await expect(page.getByTestId('login-error')).toBeVisible()
  })
})
