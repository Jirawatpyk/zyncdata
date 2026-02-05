import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Note: Full authenticated E2E tests (login → MFA → dashboard → logout → verify session cleared)
// require authenticated session setup which depends on Story 2.6 route protection.
// For now, test UI elements and basic redirect behavior.

test.describe('Logout', () => {
  test('[P1] should display logout button on dashboard page', async ({ page }) => {
    await page.goto('/dashboard')

    const logoutButton = page.getByTestId('logout-button')
    await expect(logoutButton).toBeVisible()
    await expect(logoutButton).toHaveText('Logout')
  })

  test('[P1] should redirect to login page after clicking logout', async ({ page }) => {
    await page.goto('/dashboard')

    const logoutButton = page.getByTestId('logout-button')
    await logoutButton.click()

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('[P2] should have no accessibility violations on dashboard with logout button', async ({
    page,
  }) => {
    await page.goto('/dashboard')

    await expect(page.getByTestId('logout-button')).toBeVisible()

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
})
