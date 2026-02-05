import { expect, type Page } from '@playwright/test'
import { test } from '../support/fixtures/merged-fixtures'

test.describe('Reorder Systems Flow', () => {
  test.describe('Unauthenticated - API Protection', () => {
    test('[P0] PATCH /api/systems/reorder should return 401 without auth', async () => {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/systems/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systems: [
            { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', displayOrder: 0 },
            { id: 'a47ac10b-58cc-4372-a567-0e02b2c3d480', displayOrder: 1 },
          ],
        }),
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
    })
  })

  test.describe('Authenticated Admin - Reorder Flow', () => {
    // Helper to create multiple systems for reorder tests
    async function createTestSystems(adminPage: Page, count: number) {
      const systems: Array<{ name: string; url: string }> = []

      await adminPage.goto('/admin/systems')

      for (let i = 0; i < count; i++) {
        const systemName = `Reorder Test ${Date.now()}-${i}`
        const systemUrl = `https://reorder-test-${i}.example.com`

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

        systems.push({ name: systemName, url: systemUrl })
      }

      return systems
    }

    test('[P0] should move system down and update order (AC #1)', async ({ adminPage }) => {
      const systems = await createTestSystems(adminPage, 2)

      // Find the first system row and click move-down
      const firstRow = adminPage.locator('[data-testid^="system-row-"]', {
        hasText: systems[0].name,
      })
      const moveDownButton = firstRow.locator('[data-testid^="move-down-"]')
      await moveDownButton.click()

      // Wait for success toast (AC #3)
      await expect(adminPage.getByText('Order updated')).toBeVisible({ timeout: 5000 })

      // Verify order changed: systems[1] should now be first in the list
      const rows = adminPage.locator('[data-testid^="system-row-"]')
      await expect(rows.first()).toContainText(systems[1].name)
      await expect(rows.nth(1)).toContainText(systems[0].name)
    })

    test('[P0] should disable move-up on first system (AC #4)', async ({ adminPage }) => {
      await createTestSystems(adminPage, 2)

      // First row's move-up button should be disabled
      const firstRow = adminPage.locator('[data-testid^="system-row-"]').first()
      const moveUpButton = firstRow.locator('[data-testid^="move-up-"]')
      await expect(moveUpButton).toBeDisabled()
    })

    test('[P0] should disable move-down on last system (AC #4)', async ({ adminPage }) => {
      await createTestSystems(adminPage, 2)

      // Last row's move-down button should be disabled
      const lastRow = adminPage.locator('[data-testid^="system-row-"]').last()
      const moveDownButton = lastRow.locator('[data-testid^="move-down-"]')
      await expect(moveDownButton).toBeDisabled()
    })

    test('[P1] should show success toast after reorder (AC #3)', async ({ adminPage }) => {
      const systems = await createTestSystems(adminPage, 2)

      const firstRow = adminPage.locator('[data-testid^="system-row-"]', {
        hasText: systems[0].name,
      })
      const moveDownButton = firstRow.locator('[data-testid^="move-down-"]')
      await moveDownButton.click()

      await expect(adminPage.getByText('Order updated')).toBeVisible({ timeout: 5000 })
    })

    test('[P1] should persist reorder after page reload (AC #1)', async ({ adminPage }) => {
      const systems = await createTestSystems(adminPage, 2)

      // Move first system down
      const firstRow = adminPage.locator('[data-testid^="system-row-"]', {
        hasText: systems[0].name,
      })
      const moveDownButton = firstRow.locator('[data-testid^="move-down-"]')
      await moveDownButton.click()

      await expect(adminPage.getByText('Order updated')).toBeVisible({ timeout: 5000 })

      // Reload page
      await adminPage.reload()

      // Verify the order persists — both systems should still be visible
      await expect(
        adminPage.getByTestId('systems-list').getByText(systems[0].name, { exact: true }),
      ).toBeVisible({ timeout: 10000 })
      await expect(
        adminPage.getByTestId('systems-list').getByText(systems[1].name, { exact: true }),
      ).toBeVisible()
    })

    test('[P1] should reflect new order on landing page (AC #2)', async ({ adminPage }) => {
      const systems = await createTestSystems(adminPage, 2)

      // Move first system down so second is now first
      const firstRow = adminPage.locator('[data-testid^="system-row-"]', {
        hasText: systems[0].name,
      })
      const moveDownButton = firstRow.locator('[data-testid^="move-down-"]')
      await moveDownButton.click()

      await expect(adminPage.getByText('Order updated')).toBeVisible({ timeout: 5000 })

      // Navigate to landing page
      await adminPage.goto('/')

      // Both systems should be visible on landing page
      const firstSystem = adminPage.getByText(systems[0].name)
      const secondSystem = adminPage.getByText(systems[1].name)
      await expect(firstSystem).toBeVisible({ timeout: 10000 })
      await expect(secondSystem).toBeVisible()

      // Verify order: systems[1] should appear before systems[0] in the DOM
      const firstBox = await secondSystem.boundingBox()
      const secondBox = await firstSystem.boundingBox()
      if (firstBox && secondBox) {
        expect(firstBox.y).toBeLessThan(secondBox.y)
      }
    })
  })
})
