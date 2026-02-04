import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Story 2.1 guardrail tests — fills E2E coverage gaps not addressed by login.spec.ts

test.describe('Dashboard Stub Page', () => {
  test('[P2] should render dashboard heading and placeholder text', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Dashboard coming in Epic 3+')).toBeVisible()
  })

  test('[P2] should have correct page title', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveTitle(/Dashboard.*zyncdata/)
  })

  test('[P2] should have no accessibility violations', async ({ page }) => {
    await page.goto('/dashboard')

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
})

test.describe('Auth Callback Error Handling', () => {
  test('[P2] should redirect to login with error when code is missing', async ({ page }) => {
    await page.goto('/auth/callback')

    await expect(page).toHaveURL(/\/auth\/login\?error=auth_callback_failed/)
  })
})

test.describe('MFA Stub Back-to-Login Navigation', () => {
  test('[P2] should navigate from MFA enrollment stub to login page', async ({ page }) => {
    await page.goto('/auth/mfa-enroll')

    const backLink = page.getByRole('link', { name: 'Back to Login' })
    await expect(backLink).toBeVisible()
    await backLink.click()

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('[P2] should navigate from MFA verification stub to login page', async ({ page }) => {
    await page.goto('/auth/mfa-verify')

    const backLink = page.getByRole('link', { name: 'Back to Login' })
    await expect(backLink).toBeVisible()
    await backLink.click()

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
