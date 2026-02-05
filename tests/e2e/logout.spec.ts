import { expect } from '@playwright/test'
import { test } from '../support/fixtures/merged-fixtures'
import AxeBuilder from '@axe-core/playwright'

// Logout tests require authenticated session to access /dashboard
// (proxy.ts redirects unauthenticated users to /auth/login)

test.describe('Logout', () => {
  test('[P1] should display logout button on dashboard page', async ({ adminPage }) => {
    await adminPage.goto('/dashboard')

    const logoutButton = adminPage.getByTestId('logout-button')
    await expect(logoutButton).toBeVisible()
    await expect(logoutButton).toHaveText('Logout')
  })

  test('[P1] should redirect to login page after clicking logout', async ({ adminPage }) => {
    await adminPage.goto('/dashboard')

    const logoutButton = adminPage.getByTestId('logout-button')
    await logoutButton.click()

    await expect(adminPage).toHaveURL(/\/auth\/login/)
  })

  test('[P2] should have no accessibility violations on dashboard with logout button', async ({
    adminPage,
  }) => {
    await adminPage.goto('/dashboard')

    await expect(adminPage.getByTestId('logout-button')).toBeVisible()

    const results = await new AxeBuilder({ page: adminPage }).analyze()
    expect(results.violations).toEqual([])
  })
})
