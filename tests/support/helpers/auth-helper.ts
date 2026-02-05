import type { Page } from '@playwright/test'

/**
 * Login via UI using Supabase email/password auth.
 * Prefer the `adminPage` fixture from merged-fixtures.ts instead.
 * Use this helper when you need login with custom credentials per-test.
 *
 * Note: This does NOT handle MFA. For admin access with MFA,
 * use the adminPage fixture which has pre-authenticated state.
 */
export async function loginAsUser(
  page: Page,
  credentials: { email: string; password: string },
): Promise<void> {
  await page.goto('/auth/login')
  await page.getByTestId('login-email').fill(credentials.email)
  await page.getByTestId('login-password').fill(credentials.password)
  await page.getByTestId('login-submit').click()

  // Wait for navigation - could go to MFA or admin
  await page.waitForURL(/\/(admin|auth\/mfa-)/, { timeout: 15000 })
}

/**
 * Login as admin and handle MFA verification.
 * Use when you need fresh login with MFA in a specific test.
 *
 * @param totpSecret - The TOTP secret for generating MFA codes
 */
export async function loginAsAdmin(
  page: Page,
  credentials: { email: string; password: string },
  totpSecret?: string,
): Promise<void> {
  await loginAsUser(page, credentials)

  // Handle MFA if redirected
  if (page.url().includes('/auth/mfa-verify')) {
    if (!totpSecret) {
      throw new Error('MFA verification required but no TOTP secret provided')
    }

    // Dynamic import to avoid bundling otplib in tests that don't need it
    const { generateTotpCode } = await import('../auth/totp-helper')
    const code = await generateTotpCode(totpSecret)

    await page.getByTestId('mfa-verify-code-input').fill(code)
    await page.getByTestId('mfa-verify-submit').click()
    await page.waitForURL('/admin/**', { timeout: 10000 })
  }
}

/**
 * Logout the current user via UI.
 */
export async function logout(page: Page): Promise<void> {
  await page.getByTestId('user-menu').click()
  await page.getByTestId('logout-button').click()
  await page.waitForURL('/auth/login')
}
