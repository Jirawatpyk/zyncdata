import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Route Protection', () => {
  test('[P0] should redirect unauthenticated user from /dashboard to /auth/login', async ({
    page,
  }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('[P0] should redirect unauthenticated user from /admin to /auth/login', async ({
    page,
  }) => {
    await page.goto('/admin')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('[P1] should allow unauthenticated user to access / (landing page)', async ({ page }) => {
    await page.goto('/')

    await expect(page).not.toHaveURL(/\/auth\/login/)
  })

  test('[P1] should allow unauthenticated user to access /auth/login', async ({ page }) => {
    await page.goto('/auth/login')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('[P1] should display unauthorized page content', async ({ page }) => {
    await page.goto('/unauthorized')

    await expect(page.getByTestId('unauthorized-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible()
    await expect(page.getByTestId('go-to-admin-link')).toBeVisible()
    await expect(page.getByTestId('go-to-login-link')).toBeVisible()
  })

  test('[P2] should be accessible (axe audit on unauthorized page)', async ({ page }) => {
    await page.goto('/unauthorized')

    await expect(page.getByTestId('unauthorized-page')).toBeVisible()

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
})
