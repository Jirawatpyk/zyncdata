import { test, expect } from '@playwright/test'

test.describe('Admin Layout & Navigation', () => {
  test.describe('Unauthenticated', () => {
    test('[P0] should redirect unauthenticated user from /admin/systems to /auth/login', async ({
      page,
    }) => {
      await page.goto('/admin/systems')

      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('[P0] should redirect from /admin/content to /auth/login', async ({ page }) => {
      await page.goto('/admin/content')

      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('[P0] should redirect from /admin/analytics to /auth/login', async ({ page }) => {
      await page.goto('/admin/analytics')

      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('[P0] should redirect from /admin/settings to /auth/login', async ({ page }) => {
      await page.goto('/admin/settings')

      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })

  // Note: Authenticated tests require E2E auth setup with test user
  // These tests would run with authenticated state from auth-setup fixture
  test.describe('Navigation structure (requires auth fixture)', () => {
    test.skip('[P1] should display sidebar with all 4 navigation items', async () => {
      // This test requires authenticated admin user
      // Implement with auth fixture when available
    })

    test.skip('[P1] should show empty state on systems page when no systems exist', async () => {
      // This test requires authenticated admin user + empty database
    })
  })
})
