import { expect } from '@playwright/test'
import { test } from '../support/fixtures/merged-fixtures'

// Story 2.5 guardrail tests — validates logout defensive behavior
// Requires authenticated session to access /dashboard

test.describe('Logout Guardrails', () => {
  test('[P1] double-click on logout should not cause error page', async ({ adminPage }) => {
    await adminPage.goto('/dashboard')
    await expect(adminPage.getByTestId('logout-button')).toBeVisible()

    await adminPage.getByTestId('logout-button').dblclick()

    await expect(adminPage).toHaveURL(/\/auth\/login/)
    await expect(adminPage.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('[P1] dashboard should have exactly one logout form', async ({ adminPage }) => {
    await adminPage.goto('/dashboard')

    const logoutForms = adminPage.locator('form:has([data-testid="logout-button"])')
    await expect(logoutForms).toHaveCount(1)
  })

  test('[P1] logout button should be submittable via keyboard', async ({ adminPage }) => {
    await adminPage.goto('/dashboard')

    const logoutButton = adminPage.getByTestId('logout-button')
    await logoutButton.focus()
    await expect(logoutButton).toBeFocused()

    await adminPage.keyboard.press('Enter')

    await expect(adminPage).toHaveURL(/\/auth\/login/)
  })
})
