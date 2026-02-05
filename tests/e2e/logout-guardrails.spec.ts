import { test, expect } from '@playwright/test'

// Story 2.5 guardrail tests — validates logout defensive behavior
// Fills E2E gaps not covered by logout.spec.ts

test.describe('Logout Guardrails', () => {
  test('[P1] double-click on logout should not cause error page', async ({ page }) => {
    // Given the dashboard page is loaded with the logout button
    await page.goto('/dashboard')
    await expect(page.getByTestId('logout-button')).toBeVisible()

    // When the user double-clicks the logout button (rapid clicks)
    await page.getByTestId('logout-button').dblclick()

    // Then the page should redirect to login without errors
    await expect(page).toHaveURL(/\/auth\/login/)

    // And the login page should render correctly (not a 500 error page)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('[P1] dashboard should have exactly one logout form', async ({ page }) => {
    // Given the dashboard page is loaded
    await page.goto('/dashboard')

    // Then there should be exactly one form containing the logout button
    const logoutForms = page.locator('form:has([data-testid="logout-button"])')
    await expect(logoutForms).toHaveCount(1)
  })

  test('[P1] logout button should be submittable via keyboard', async ({ page }) => {
    // Given the dashboard page is loaded
    await page.goto('/dashboard')

    // When the user focuses the logout button via keyboard
    const logoutButton = page.getByTestId('logout-button')
    await logoutButton.focus()
    await expect(logoutButton).toBeFocused()

    // When the user presses Enter to submit
    await page.keyboard.press('Enter')

    // Then the form should submit and redirect to login
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
