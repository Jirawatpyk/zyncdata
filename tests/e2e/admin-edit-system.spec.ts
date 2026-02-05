import { expect, type Page } from '@playwright/test'
import { test } from '../support/fixtures/merged-fixtures'

test.describe('Edit System Flow', () => {
  test.describe('Unauthenticated - API Protection', () => {
    test('[P0] PATCH /api/systems/:id should return 401 without auth', async ({ playwright, baseURL }) => {
      const unauthRequest = await playwright.request.newContext({ baseURL: baseURL! })
      const response = await unauthRequest.patch('/api/systems/f47ac10b-58cc-4372-a567-0e02b2c3d479', {
        data: {
          name: 'Updated System',
          url: 'https://updated.example.com',
          enabled: true,
        },
      })

      expect(response.status()).toBe(401)
      const body = await response.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
    })
  })

  test.describe('Authenticated Admin - Edit Flow', () => {
    // Helper to create a system for editing
    async function createTestSystem(adminPage: Page) {
      const systemName = `Edit Test ${Date.now()}`
      const systemUrl = 'https://edit-test.example.com'

      await adminPage.goto('/admin/systems')

      await adminPage.getByTestId('add-system-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).toBeVisible()

      await adminPage.getByTestId('system-name-input').fill(systemName)
      await adminPage.getByTestId('system-url-input').fill(systemUrl)
      await adminPage.getByTestId('submit-button').click()

      await expect(adminPage.getByTestId('add-system-dialog')).not.toBeVisible({ timeout: 10000 })
      await expect(adminPage.getByText(systemName)).toBeVisible()

      return { name: systemName, url: systemUrl }
    }

    test('[P0] should open edit dialog with pre-populated data (AC #1)', async ({ adminPage }) => {
      // Create a system to edit
      const system = await createTestSystem(adminPage)

      // Find the system row and click edit button
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      const editButton = systemRow.locator('[data-testid^="edit-system-"]')
      await editButton.click()

      // Verify dialog opens with pre-populated values
      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()
      await expect(adminPage.getByTestId('system-name-input')).toHaveValue(system.name)
      await expect(adminPage.getByTestId('system-url-input')).toHaveValue(system.url)
    })

    test('[P0] should update system and show in list (AC #2)', async ({ adminPage }) => {
      // Create a system to edit
      const system = await createTestSystem(adminPage)
      const updatedName = `Updated ${Date.now()}`

      // Open edit dialog
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      const editButton = systemRow.locator('[data-testid^="edit-system-"]')
      await editButton.click()

      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()

      // Modify the name
      await adminPage.getByTestId('system-name-input').clear()
      await adminPage.getByTestId('system-name-input').fill(updatedName)

      // Submit
      await adminPage.getByTestId('submit-button').click()

      // Wait for dialog to close
      await expect(adminPage.getByTestId('edit-system-dialog')).not.toBeVisible({ timeout: 10000 })

      // Verify updated name appears in list
      await expect(adminPage.getByText(updatedName)).toBeVisible()
      // Original name should no longer be visible
      await expect(adminPage.getByText(system.name)).not.toBeVisible()
    })

    test('[P1] should show success toast on update', async ({ adminPage }) => {
      // Create a system to edit
      const system = await createTestSystem(adminPage)
      const updatedName = `Toast Update ${Date.now()}`

      // Open edit dialog
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system.name,
      })
      const editButton = systemRow.locator('[data-testid^="edit-system-"]')
      await editButton.click()

      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()

      // Modify
      await adminPage.getByTestId('system-name-input').clear()
      await adminPage.getByTestId('system-name-input').fill(updatedName)
      await adminPage.getByTestId('submit-button').click()

      // Verify success toast
      await expect(adminPage.getByText('System updated')).toBeVisible({ timeout: 5000 })
      await expect(adminPage.getByText(`${updatedName} has been updated`)).toBeVisible()
    })
  })

  test.describe('Authenticated Admin - Form Validation (AC #3)', () => {
    async function createAndOpenEditDialog(adminPage: Page) {
      const systemName = `Validation Test ${Date.now()}`

      await adminPage.goto('/admin/systems')

      await adminPage.getByTestId('add-system-button').click()
      await adminPage.getByTestId('system-name-input').fill(systemName)
      await adminPage.getByTestId('system-url-input').fill('https://validation-test.example.com')
      await adminPage.getByTestId('submit-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).not.toBeVisible({ timeout: 10000 })

      // Open edit dialog
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: systemName,
      })
      const editButton = systemRow.locator('[data-testid^="edit-system-"]')
      await editButton.click()
      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()

      return systemName
    }

    test('[P1] should show Name required error when name cleared (AC #3)', async ({ adminPage }) => {
      await createAndOpenEditDialog(adminPage)

      // Clear the name
      await adminPage.getByTestId('system-name-input').clear()
      await adminPage.getByTestId('submit-button').click()

      // Verify validation error
      await expect(adminPage.getByText('Name required')).toBeVisible()
    })

    test('[P1] should show Valid URL required error for invalid URL (AC #3)', async ({ adminPage }) => {
      await createAndOpenEditDialog(adminPage)

      // Clear URL and enter invalid
      await adminPage.getByTestId('system-url-input').clear()
      await adminPage.getByTestId('system-url-input').fill('not-a-valid-url')
      await adminPage.getByTestId('submit-button').click()

      // Verify validation error
      await expect(adminPage.getByText('Valid URL required')).toBeVisible()
    })
  })

  test.describe('Authenticated Admin - Save Button Disabled (AC #5)', () => {
    test('[P1] should have save button disabled when no changes made (AC #5)', async ({ adminPage }) => {
      const systemName = `No Changes Test ${Date.now()}`

      await adminPage.goto('/admin/systems')

      // Create system
      await adminPage.getByTestId('add-system-button').click()
      await adminPage.getByTestId('system-name-input').fill(systemName)
      await adminPage.getByTestId('system-url-input').fill('https://no-changes-test.example.com')
      await adminPage.getByTestId('submit-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).not.toBeVisible({ timeout: 10000 })

      // Open edit dialog
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: systemName,
      })
      const editButton = systemRow.locator('[data-testid^="edit-system-"]')
      await editButton.click()
      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()

      // Verify save button is disabled (no changes made)
      const submitButton = adminPage.getByTestId('submit-button')
      await expect(submitButton).toBeDisabled()
    })

    test('[P2] should enable save button after making changes', async ({ adminPage }) => {
      const systemName = `Enable Button Test ${Date.now()}`

      await adminPage.goto('/admin/systems')

      // Create system
      await adminPage.getByTestId('add-system-button').click()
      await adminPage.getByTestId('system-name-input').fill(systemName)
      await adminPage.getByTestId('system-url-input').fill('https://enable-button-test.example.com')
      await adminPage.getByTestId('submit-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).not.toBeVisible({ timeout: 10000 })

      // Open edit dialog
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: systemName,
      })
      const editButton = systemRow.locator('[data-testid^="edit-system-"]')
      await editButton.click()
      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()

      // Initially disabled
      const submitButton = adminPage.getByTestId('submit-button')
      await expect(submitButton).toBeDisabled()

      // Make a change
      await adminPage.getByTestId('system-name-input').fill(`${systemName} Modified`)

      // Should now be enabled
      await expect(submitButton).toBeEnabled()
    })
  })

  test.describe('Authenticated Admin - Form Behavior', () => {
    test('[P2] should reset form to original values on cancel', async ({ adminPage }) => {
      const systemName = `Reset Test ${Date.now()}`

      await adminPage.goto('/admin/systems')

      // Create system
      await adminPage.getByTestId('add-system-button').click()
      await adminPage.getByTestId('system-name-input').fill(systemName)
      await adminPage.getByTestId('system-url-input').fill('https://reset-test.example.com')
      await adminPage.getByTestId('submit-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).not.toBeVisible({ timeout: 10000 })

      // Open edit dialog
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: systemName,
      })
      const editButton = systemRow.locator('[data-testid^="edit-system-"]')
      await editButton.click()
      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()

      // Modify values
      await adminPage.getByTestId('system-name-input').clear()
      await adminPage.getByTestId('system-name-input').fill('Modified Name')

      // Cancel
      await adminPage.getByTestId('cancel-button').click()
      await expect(adminPage.getByTestId('edit-system-dialog')).not.toBeVisible()

      // Reopen and verify original values
      await editButton.click()
      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()
      await expect(adminPage.getByTestId('system-name-input')).toHaveValue(systemName)
    })
  })

  test.describe('Authenticated Admin - Error Handling', () => {
    test('[P1] should keep dialog open on duplicate name error', async ({ adminPage }) => {
      const system1Name = `Dup Edit Test 1 ${Date.now()}`
      const system2Name = `Dup Edit Test 2 ${Date.now()}`

      await adminPage.goto('/admin/systems')

      // Create first system
      await adminPage.getByTestId('add-system-button').click()
      await adminPage.getByTestId('system-name-input').fill(system1Name)
      await adminPage.getByTestId('system-url-input').fill('https://dup-edit-1.example.com')
      await adminPage.getByTestId('submit-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).not.toBeVisible({ timeout: 10000 })

      // Create second system
      await adminPage.getByTestId('add-system-button').click()
      await adminPage.getByTestId('system-name-input').fill(system2Name)
      await adminPage.getByTestId('system-url-input').fill('https://dup-edit-2.example.com')
      await adminPage.getByTestId('submit-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).not.toBeVisible({ timeout: 10000 })

      // Try to rename second system to first system's name
      const systemRow = adminPage.locator(`[data-testid^="system-row-"]`, {
        hasText: system2Name,
      })
      const editButton = systemRow.locator('[data-testid^="edit-system-"]')
      await editButton.click()
      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()

      // Change name to duplicate
      await adminPage.getByTestId('system-name-input').clear()
      await adminPage.getByTestId('system-name-input').fill(system1Name)
      await adminPage.getByTestId('submit-button').click()

      // Dialog should stay open with error
      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()
      await expect(adminPage.getByText('A system with this name already exists')).toBeVisible({ timeout: 5000 })
    })
  })
})
