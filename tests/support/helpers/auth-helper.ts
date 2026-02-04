import type { Page } from '@playwright/test'

/**
 * Login via UI using Supabase email/password auth.
 * Prefer the `authenticatedPage` fixture from merged-fixtures.ts instead.
 * Use this helper when you need login with custom credentials per-test.
 */
export async function loginAsUser(
  page: Page,
  credentials: { email: string; password: string },
): Promise<void> {
  await page.goto('/login')
  await page.getByTestId('email-input').fill(credentials.email)
  await page.getByTestId('password-input').fill(credentials.password)
  await page.getByTestId('login-submit').click()
  await page.waitForURL('/dashboard/**')
}

/**
 * Logout the current user via UI.
 */
export async function logout(page: Page): Promise<void> {
  await page.getByTestId('user-menu').click()
  await page.getByTestId('logout-button').click()
  await page.waitForURL('/login')
}
