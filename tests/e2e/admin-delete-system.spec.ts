import { expect, type Page } from '@playwright/test'
import { test } from '../support/fixtures/merged-fixtures'

test.describe('Delete System Flow', () => {
  test.describe('Unauthenticated - API Protection', () => {
    test('[P0] DELETE /api/systems/:id should return 401 without auth', async () => {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
      const response = await fetch(
        `${baseUrl}/api/systems/f47ac10b-58cc-4372-a567-0e02b2c3d479`,
        { method: 'DELETE' },
      )

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
    })
  })

  test.describe('Authenticated Admin - Delete Flow', () => {
    // Helper to create a system for deletion tests
    async function createTestSystem(adminPage: Page) {
      const systemName = `Delete Test ${Date.now()}`
      const systemUrl = 'https://delete-test.example.com'

      await adminPage.goto('/admin/systems')

      await adminPage.getByTestId('add-system-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).toBeVisible()

      await adminPage.getByTestId('system-name-input').fill(systemName)
      await adminPage.getByTestId('system-url-input').fill(systemUrl)
      await adminPage.getByTestId('submit-button').click()

      await expect(adminPage.getByTestId('add-system-dialog')).not.toBeVisible({
        timeout: 10000,
      })
      await expect(
        adminPage.getByTestId('systems-list').getByText(systemName, { exact: true }),
      ).toBeVisible()

      return { name: systemName, url: systemUrl }
    }

    test('[P0] should open confirmation dialog with system name (AC #1)', async ({
      adminPage,
    }) => {
      const system = await createTestSystem(adminPage)

      // Find the system row and click delete button
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      const deleteButton = systemRow.locator('[data-testid^="delete-system-"]')
      await deleteButton.click()

      // Verify dialog opens with system name
      await expect(adminPage.getByTestId('delete-system-dialog')).toBeVisible()
      await expect(adminPage.getByText('Delete System')).toBeVisible()
      await expect(
        adminPage.getByText(
          `Are you sure you want to delete ${system.name}? This can be undone within 30 days.`,
        ),
      ).toBeVisible()
      await expect(adminPage.getByTestId('delete-confirm-button')).toBeVisible()
      await expect(adminPage.getByTestId('delete-cancel-button')).toBeVisible()
    })

    test('[P0] should cancel without changes (AC #4)', async ({ adminPage }) => {
      const system = await createTestSystem(adminPage)

      // Open delete dialog
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      const deleteButton = systemRow.locator('[data-testid^="delete-system-"]')
      await deleteButton.click()

      await expect(adminPage.getByTestId('delete-system-dialog')).toBeVisible()

      // Cancel
      await adminPage.getByTestId('delete-cancel-button').click()
      await expect(adminPage.getByTestId('delete-system-dialog')).not.toBeVisible()

      // System should still be visible and unchanged
      await expect(
        adminPage.getByTestId('systems-list').getByText(system.name, { exact: true }),
      ).toBeVisible()
    })

    test('[P0] should soft-delete and show "Deleted" badge (AC #3)', async ({
      adminPage,
    }) => {
      const system = await createTestSystem(adminPage)

      // Open delete dialog
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      const deleteButton = systemRow.locator('[data-testid^="delete-system-"]')
      await deleteButton.click()

      await expect(adminPage.getByTestId('delete-system-dialog')).toBeVisible()

      // Confirm delete
      await adminPage.getByTestId('delete-confirm-button').click()

      // Dialog should close
      await expect(adminPage.getByTestId('delete-system-dialog')).not.toBeVisible({
        timeout: 10000,
      })

      // System should still be visible in admin list (soft-deleted)
      await expect(
        adminPage.getByTestId('systems-list').getByText(system.name, { exact: true }),
      ).toBeVisible()

      // "Deleted" badge should appear
      const updatedRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      await expect(updatedRow.getByText('Deleted')).toBeVisible({ timeout: 5000 })
    })

    test('[P1] should show success toast after delete', async ({ adminPage }) => {
      const system = await createTestSystem(adminPage)

      // Open and confirm delete
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      const deleteButton = systemRow.locator('[data-testid^="delete-system-"]')
      await deleteButton.click()

      await expect(adminPage.getByTestId('delete-system-dialog')).toBeVisible()
      await adminPage.getByTestId('delete-confirm-button').click()

      // Verify success toast
      await expect(adminPage.getByText('System deleted')).toBeVisible({ timeout: 5000 })
      await expect(
        adminPage.getByText(`${system.name} can be recovered within 30 days.`),
      ).toBeVisible()
    })

    test('[P1] should not show delete button for already-deleted systems', async ({
      adminPage,
    }) => {
      const system = await createTestSystem(adminPage)

      // Delete the system first
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      const deleteButton = systemRow.locator('[data-testid^="delete-system-"]')
      await deleteButton.click()

      await expect(adminPage.getByTestId('delete-system-dialog')).toBeVisible()
      await adminPage.getByTestId('delete-confirm-button').click()

      await expect(adminPage.getByTestId('delete-system-dialog')).not.toBeVisible({
        timeout: 10000,
      })

      // Wait for "Deleted" badge to confirm the delete completed
      const updatedRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      await expect(updatedRow.getByText('Deleted')).toBeVisible({ timeout: 5000 })

      // Delete button should no longer be visible for this system
      await expect(
        updatedRow.locator('[data-testid^="delete-system-"]'),
      ).not.toBeVisible()
    })

    test('[P1] should hide deleted system from public landing page', async ({
      adminPage,
    }) => {
      const system = await createTestSystem(adminPage)

      // Delete the system
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      const deleteButton = systemRow.locator('[data-testid^="delete-system-"]')
      await deleteButton.click()

      await expect(adminPage.getByTestId('delete-system-dialog')).toBeVisible()
      await adminPage.getByTestId('delete-confirm-button').click()

      await expect(adminPage.getByTestId('delete-system-dialog')).not.toBeVisible({
        timeout: 10000,
      })

      // Wait for "Deleted" badge
      const updatedRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      await expect(updatedRow.getByText('Deleted')).toBeVisible({ timeout: 5000 })

      // Navigate to public landing page
      // ISR stale-while-revalidate may serve cached version on first request
      // after revalidatePath('/'), so reload to get the freshly regenerated page.
      await adminPage.goto('/')
      await adminPage.reload()

      // The deleted system should NOT appear on the public page
      await expect(adminPage.getByText(system.name)).not.toBeVisible({ timeout: 10000 })
    })

    test('[P1] should recover deleted system via Edit (AC #5)', async ({
      adminPage,
    }) => {
      const system = await createTestSystem(adminPage)

      // Step 1: Delete the system
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      const deleteButton = systemRow.locator('[data-testid^="delete-system-"]')
      await deleteButton.click()

      await expect(adminPage.getByTestId('delete-system-dialog')).toBeVisible()
      await adminPage.getByTestId('delete-confirm-button').click()

      await expect(adminPage.getByTestId('delete-system-dialog')).not.toBeVisible({
        timeout: 10000,
      })

      // Wait for "Deleted" badge
      const deletedRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      await expect(deletedRow.getByText('Deleted')).toBeVisible({ timeout: 5000 })

      // Step 2: Open Edit dialog on the deleted system
      const editButton = deletedRow.locator('[data-testid^="edit-system-"]')
      await editButton.click()

      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()

      // Step 3: Toggle enabled back to true
      const enabledSwitch = adminPage.getByTestId('system-enabled-switch')
      // It should be unchecked (disabled) for deleted system
      await expect(enabledSwitch).toHaveAttribute('data-state', 'unchecked')
      await enabledSwitch.click()
      await expect(enabledSwitch).toHaveAttribute('data-state', 'checked')

      // Save
      await adminPage.getByTestId('submit-button').click()

      // Wait for dialog to close
      await expect(adminPage.getByTestId('edit-system-dialog')).not.toBeVisible({
        timeout: 10000,
      })

      // Step 4: Verify recovery — "Deleted" badge should be gone
      const recoveredRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      await expect(recoveredRow.getByText('Deleted')).not.toBeVisible()
      await expect(recoveredRow.getByText('Visible')).toBeVisible()

      // Step 5: Verify system reappears on public landing page
      await adminPage.goto('/')
      await expect(adminPage.getByText(system.name)).toBeVisible({ timeout: 5000 })
    })
  })
})
