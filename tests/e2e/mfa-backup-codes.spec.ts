import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * E2E tests for MFA Backup Codes.
 *
 * NOTE: Full backup codes flow (code grid, copy, download, checkbox → continue)
 * requires an authenticated session with completed MFA enrollment. These tests
 * verify the page structure and accessibility of the unauthenticated entry points.
 *
 * TODO: Once E2E auth helpers are available (Story 2.6+), expand with:
 * - Authenticated flow: TOTP enroll → backup codes display → copy/download → continue
 * - Backup code verify: submit code → success/error/rate-limit feedback
 * - Checkbox enables continue button interaction
 */
test.describe('MFA Backup Codes Display', () => {
  test('mfa-enroll page renders and is accessible', async ({ page }) => {
    await page.goto('/auth/mfa-enroll')
    await page.waitForLoadState('networkidle')

    const title = page.locator('h1')
    await expect(title).toBeVisible()

    const accessibilityResults = await new AxeBuilder({ page })
      .exclude('.animate-spin')
      .analyze()

    expect(accessibilityResults.violations).toEqual([])
  })

  test('mfa-verify page renders and is accessible', async ({ page }) => {
    await page.goto('/auth/mfa-verify')
    await page.waitForLoadState('networkidle')

    const title = page.locator('h1')
    await expect(title).toBeVisible()

    const accessibilityResults = await new AxeBuilder({ page })
      .exclude('.animate-spin')
      .analyze()

    expect(accessibilityResults.violations).toEqual([])
  })
})
