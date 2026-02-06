import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Prerequisites: Supabase local (`supabase start`) and Upstash Redis env vars
// (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) must be configured.
// Tests that submit the login form depend on these backend services.

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })

  test('should render login form with email and password fields', async ({ page }) => {
    await expect(page.getByTestId('login-email')).toBeVisible()
    await expect(page.getByTestId('login-password')).toBeVisible()
    await expect(page.getByTestId('login-submit')).toBeVisible()
  })

  test('should render heading and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByText('Smart Platform & Solutions')).toBeVisible()
  })

  test('should have correct input types', async ({ page }) => {
    await expect(page.getByTestId('login-email')).toHaveAttribute('type', 'email')
    await expect(page.getByTestId('login-password')).toHaveAttribute('type', 'password')
  })

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByTestId('login-password')
    const toggleButton = page.getByTestId('toggle-password')

    await expect(passwordInput).toHaveAttribute('type', 'password')
    await expect(toggleButton).toHaveAttribute('aria-label', 'Show password')

    await toggleButton.click()

    await expect(passwordInput).toHaveAttribute('type', 'text')
    await expect(toggleButton).toHaveAttribute('aria-label', 'Hide password')
  })

  test('should show error on invalid credentials', async ({ page }) => {
    await page.getByTestId('login-email').fill('wrong@example.com')
    await page.getByTestId('login-password').fill('wrongpassword')
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('login-error')).toBeVisible()
  })

  test('should have no accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })

  test('should have correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Login.*zyncdata/)
  })
})

test.describe('/auth/register redirect', () => {
  test('should redirect /auth/register to /auth/login', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

test.describe('MFA pages redirect unauthenticated users', () => {
  test('should redirect from MFA enrollment to login', async ({ page }) => {
    await page.goto('/auth/mfa-enroll')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('should redirect from MFA verification to login', async ({ page }) => {
    await page.goto('/auth/mfa-verify')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
