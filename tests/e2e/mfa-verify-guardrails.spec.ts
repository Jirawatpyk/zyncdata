import { test, expect } from '@playwright/test'

// Story 2.4 guardrail tests — validates MFA verify auth guard cannot be bypassed
// Fills E2E gaps not covered by mfa-verify.spec.ts

test.describe('MFA Verify Auth Guard Bypass Prevention', () => {
  test('[P2] direct URL with query params should not bypass auth guard', async ({ page }) => {
    // Attempt to bypass server-side auth guard with crafted query parameters
    await page.goto('/auth/mfa-verify?bypass=true')
    await expect(page).toHaveURL(/\/auth\/login/)

    await page.goto('/auth/mfa-verify?token=fake')
    await expect(page).toHaveURL(/\/auth\/login/)

    await page.goto('/auth/mfa-verify?authenticated=1&role=admin')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('[P2] direct URL with hash fragment should not bypass auth guard', async ({ page }) => {
    // Hash fragments are client-side only, but verify the page still redirects
    await page.goto('/auth/mfa-verify#admin')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('[P2] rapid sequential navigations to mfa-verify should all redirect to login', async ({
    page,
  }) => {
    // Rapid navigations should not bypass auth guard due to race conditions
    await page.goto('/auth/mfa-verify')
    await expect(page).toHaveURL(/\/auth\/login/)

    // Navigate again immediately after redirect completes
    await page.goto('/auth/mfa-verify')
    await expect(page).toHaveURL(/\/auth\/login/)

    // Verify login page is fully functional after repeated redirects
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })
})
