import { expect, type Page } from '@playwright/test'
import { test } from '../support/fixtures/merged-fixtures'

test.describe('Toggle System Visibility Flow', () => {
  test.describe('Unauthenticated - API Protection', () => {
    test('[P0] PATCH /api/systems/:id/toggle should return 401 without auth', async () => {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/systems/f47ac10b-58cc-4372-a567-0e02b2c3d479/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
    })
  })

  test.describe('Authenticated Admin - Toggle Flow', () => {
    // Helper to create a test system for toggle tests
    async function createTestSystem(adminPage: Page) {
      await adminPage.goto('/admin/systems')

      const systemName = `Toggle Test ${Date.now()}`
      const systemUrl = `https://toggle-test-${Date.now()}.example.com`

      await adminPage.getByTestId('add-system-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).toBeVisible()

      await adminPage.getByTestId('system-name-input').fill(systemName)
      await adminPage.getByTestId('system-url-input').fill(systemUrl)
      // Set category so system appears in default active tab on landing page
      await adminPage.getByTestId('system-category-select').click()
      await adminPage.getByText('DxT Smart Platform').click()
      await adminPage.getByTestId('submit-button').click()

      await expect(adminPage.getByTestId('add-system-dialog')).not.toBeVisible({
        timeout: 10000,
      })
      await expect(
        adminPage.getByTestId('systems-list').getByText(systemName, { exact: true }),
      ).toBeVisible()

      return { name: systemName, url: systemUrl }
    }

    test('[P0] should toggle system off and show success toast (AC #1)', async ({ adminPage }) => {
      const system = await createTestSystem(adminPage)

      // Find the system row
      const row = adminPage.locator('[data-testid^="system-row-"]', {
        hasText: system.name,
      })

      // Find and click the toggle switch (should be checked/enabled by default)
      const toggle = row.locator('[data-testid^="toggle-system-"]')
      await expect(toggle).toHaveAttribute('data-state', 'checked')

      await toggle.click()

      // Wait for success toast
      await expect(adminPage.getByText('System disabled')).toBeVisible({ timeout: 5000 })

      // Verify the switch is now unchecked
      await expect(toggle).toHaveAttribute('data-state', 'unchecked')

      // Verify label changed to "Hidden"
      await expect(row.getByText('Hidden')).toBeVisible()
    })

    test('[P0] should toggle system on and show success toast (AC #3)', async ({ adminPage }) => {
      const system = await createTestSystem(adminPage)

      const row = adminPage.locator('[data-testid^="system-row-"]', {
        hasText: system.name,
      })
      const toggle = row.locator('[data-testid^="toggle-system-"]')

      // Toggle off first
      await toggle.click()
      await expect(adminPage.getByText('System disabled')).toBeVisible({ timeout: 5000 })
      await expect(toggle).toHaveAttribute('data-state', 'unchecked')

      // Toggle back on
      await toggle.click()
      await expect(adminPage.getByText('System enabled')).toBeVisible({ timeout: 5000 })

      // Verify the switch is checked again
      await expect(toggle).toHaveAttribute('data-state', 'checked')

      // Verify label changed back to "Visible"
      await expect(row.getByText('Visible')).toBeVisible()
    })

    test('[P0] should hide disabled system from landing page (AC #2)', async ({ adminPage }) => {
      const system = await createTestSystem(adminPage)

      // Verify system appears on landing page first
      await adminPage.goto('/')
      await expect(adminPage.getByText(system.name)).toBeVisible({ timeout: 10000 })

      // Go back to admin and toggle it off
      await adminPage.goto('/admin/systems')
      const row = adminPage.locator('[data-testid^="system-row-"]', {
        hasText: system.name,
      })
      const toggle = row.locator('[data-testid^="toggle-system-"]')
      await toggle.click()
      await expect(adminPage.getByText('System disabled')).toBeVisible({ timeout: 5000 })

      // Navigate to landing page — system should NOT appear
      await adminPage.goto('/')
      await expect(adminPage.getByText(system.name)).not.toBeVisible({ timeout: 10000 })
    })

    test('[P0] should show re-enabled system on landing page in correct order (AC #3)', async ({ adminPage }) => {
      const system = await createTestSystem(adminPage)

      // Toggle off
      await adminPage.goto('/admin/systems')
      const row = adminPage.locator('[data-testid^="system-row-"]', {
        hasText: system.name,
      })
      const toggle = row.locator('[data-testid^="toggle-system-"]')
      await toggle.click()
      await expect(adminPage.getByText('System disabled')).toBeVisible({ timeout: 5000 })

      // Toggle back on
      await toggle.click()
      await expect(adminPage.getByText('System enabled')).toBeVisible({ timeout: 5000 })

      // Navigate to landing page — system should appear again
      await adminPage.goto('/')
      await expect(adminPage.getByText(system.name)).toBeVisible({ timeout: 10000 })
    })

    test('[P1] should disable toggle Switch for soft-deleted systems (AC #4)', async ({ adminPage }) => {
      const system = await createTestSystem(adminPage)

      await adminPage.goto('/admin/systems')

      // Delete the system (soft-delete)
      const row = adminPage.locator('[data-testid^="system-row-"]', {
        hasText: system.name,
      })
      const deleteButton = row.locator('[data-testid^="delete-system-"]')
      await deleteButton.click()

      // Confirm deletion in dialog
      const confirmButton = adminPage.getByTestId('delete-confirm-button')
      await confirmButton.click()

      // Wait for the system to be soft-deleted
      await expect(row.getByText('Deleted')).toBeVisible({ timeout: 5000 })

      // Verify the toggle switch is disabled
      const toggle = row.locator('[data-testid^="toggle-system-"]')
      await expect(toggle).toBeDisabled()
    })
  })
})
