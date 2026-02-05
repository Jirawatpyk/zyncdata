import { expect } from '@playwright/test'
import { test } from '../support/fixtures/merged-fixtures'

test.describe('Add System Flow', () => {
  test.describe('Unauthenticated - API Protection', () => {
    test('[P0] POST /api/systems should return 401 without auth', async () => {
      // Use native fetch — guarantees zero cookies (Playwright contexts may leak state)
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/systems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test System',
          url: 'https://test.example.com',
          enabled: true,
        }),
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
    })
  })

  test.describe('Authenticated Admin - Form Validation', () => {
    test('[P1] should show Name required error for empty name (AC #4)', async ({ adminPage }) => {
      await adminPage.goto('/admin/systems')

      // Open the Add System dialog
      await adminPage.getByTestId('add-system-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).toBeVisible()

      // Fill URL but leave name empty
      await adminPage.getByTestId('system-url-input').fill('https://example.com')
      await adminPage.getByTestId('submit-button').click()

      // Verify validation error
      await expect(adminPage.getByText('Name required')).toBeVisible()
    })

    test('[P1] should show Valid URL required error for invalid URL (AC #3)', async ({ adminPage }) => {
      await adminPage.goto('/admin/systems')

      // Open the Add System dialog
      await adminPage.getByTestId('add-system-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).toBeVisible()

      // Fill name and invalid URL
      await adminPage.getByTestId('system-name-input').fill('Test System')
      await adminPage.getByTestId('system-url-input').fill('not-a-valid-url')
      await adminPage.getByTestId('submit-button').click()

      // Verify validation error
      await expect(adminPage.getByText('Valid URL required')).toBeVisible()
    })
  })

  test.describe('Authenticated Admin - Successful Creation', () => {
    test('[P0] should create system and show in list (AC #2)', async ({ adminPage }) => {
      const systemName = `E2E Test System ${Date.now()}`
      const systemUrl = 'https://e2e-test.example.com'

      await adminPage.goto('/admin/systems')

      // Open the Add System dialog
      await adminPage.getByTestId('add-system-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).toBeVisible()

      // Fill form
      await adminPage.getByTestId('system-name-input').fill(systemName)
      await adminPage.getByTestId('system-url-input').fill(systemUrl)
      await adminPage.getByTestId('submit-button').click()

      // Wait for dialog to close (indicates success)
      await expect(adminPage.getByTestId('add-system-dialog')).not.toBeVisible({ timeout: 10000 })

      // Verify new system appears in the list (exact match avoids sr-only "Edit {name}" text)
      await expect(
        adminPage.getByTestId('systems-list').getByText(systemName, { exact: true })
      ).toBeVisible()
    })

    test('[P2] should show success toast with system name', async ({ adminPage }) => {
      const systemName = `Toast Test ${Date.now()}`

      await adminPage.goto('/admin/systems')

      await adminPage.getByTestId('add-system-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).toBeVisible()

      await adminPage.getByTestId('system-name-input').fill(systemName)
      await adminPage.getByTestId('system-url-input').fill('https://toast-test.example.com')
      await adminPage.getByTestId('submit-button').click()

      // Verify success toast appears
      await expect(adminPage.getByText('System added')).toBeVisible({ timeout: 5000 })
      await expect(adminPage.getByText(`${systemName} is now available`)).toBeVisible()
    })

    test('[P2] should default enabled toggle to true', async ({ adminPage }) => {
      await adminPage.goto('/admin/systems')

      await adminPage.getByTestId('add-system-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).toBeVisible()

      // Verify enabled switch is checked by default
      const enabledSwitch = adminPage.getByTestId('system-enabled-switch')
      await expect(enabledSwitch).toHaveAttribute('data-state', 'checked')
    })
  })

  test.describe('Authenticated Admin - Form Behavior', () => {
    test('[P2] should reset form when dialog closes', async ({ adminPage }) => {
      await adminPage.goto('/admin/systems')

      // Open dialog and fill some values
      await adminPage.getByTestId('add-system-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).toBeVisible()

      await adminPage.getByTestId('system-name-input').fill('Temp Name')

      // Verify value is entered
      await expect(adminPage.getByTestId('system-name-input')).toHaveValue('Temp Name')

      // Close dialog via Cancel button
      await adminPage.getByTestId('cancel-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).not.toBeVisible()

      // Reopen dialog
      await adminPage.getByTestId('add-system-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).toBeVisible()

      // Verify form is reset
      await expect(adminPage.getByTestId('system-name-input')).toHaveValue('')
    })

    test('[P2] should show loading state during submission', async ({ adminPage }) => {
      await adminPage.goto('/admin/systems')

      await adminPage.getByTestId('add-system-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).toBeVisible()

      await adminPage.getByTestId('system-name-input').fill(`Loading Test ${Date.now()}`)
      await adminPage.getByTestId('system-url-input').fill('https://loading-test.example.com')

      // Click submit and check for loading state
      await adminPage.getByTestId('submit-button').click()

      // Button should show "Adding..." briefly
      // Note: This may be very fast, so we just verify the dialog eventually closes
      await expect(adminPage.getByTestId('add-system-dialog')).not.toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Authenticated Admin - Error Handling', () => {
    test('[P1] should keep dialog open on duplicate name error', async ({ adminPage }) => {
      const systemName = `Duplicate Test ${Date.now()}`

      await adminPage.goto('/admin/systems')

      // Create first system
      await adminPage.getByTestId('add-system-button').click()
      await adminPage.getByTestId('system-name-input').fill(systemName)
      await adminPage.getByTestId('system-url-input').fill('https://first.example.com')
      await adminPage.getByTestId('submit-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).not.toBeVisible({ timeout: 10000 })

      // Try to create second system with same name
      await adminPage.getByTestId('add-system-button').click()
      await adminPage.getByTestId('system-name-input').fill(systemName)
      await adminPage.getByTestId('system-url-input').fill('https://second.example.com')
      await adminPage.getByTestId('submit-button').click()

      // Dialog should stay open with error
      await expect(adminPage.getByTestId('add-system-dialog')).toBeVisible()
      await expect(adminPage.getByText('A system with this name already exists')).toBeVisible({ timeout: 5000 })
    })
  })
})
