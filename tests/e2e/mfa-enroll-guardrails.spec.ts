import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Story 2.2 guardrail tests — validates security headers and MFA page integrity
// Fills E2E gaps not covered by mfa-enroll.spec.ts or auth-guardrails.spec.ts

test.describe('CSP and Security Headers', () => {
  test('[P1] CSP header should include connect-src for Supabase', async ({ page }) => {
    const response = await page.goto('/auth/login')

    const cspHeader = response?.headers()['content-security-policy']
    expect(cspHeader).toBeDefined()
    expect(cspHeader).toContain('connect-src')
    expect(cspHeader).toContain('supabase.co')
    // Verify both HTTPS and WSS are allowed (required for Realtime subscriptions)
    expect(cspHeader).toContain('https://*.supabase.co')
    expect(cspHeader).toContain('wss://*.supabase.co')
  })

  test('[P1] security headers should be present on auth pages', async ({ page }) => {
    const response = await page.goto('/auth/login')
    const headers = response?.headers() ?? {}

    // X-Frame-Options prevents clickjacking attacks on login/MFA forms
    expect(headers['x-frame-options']).toBe('DENY')

    // X-Content-Type-Options prevents MIME-type sniffing
    expect(headers['x-content-type-options']).toBe('nosniff')

    // Referrer-Policy controls referrer information leakage
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })

  test('[P1] security headers should be present on MFA enrollment page', async ({ page }) => {
    // MFA enrollment redirects to login for unauthenticated users,
    // but the redirect response itself should carry security headers
    const response = await page.goto('/auth/mfa-enroll')
    const headers = response?.headers() ?? {}

    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['content-security-policy']).toBeDefined()
    expect(headers['content-security-policy']).toContain('supabase.co')
  })
})

test.describe('MFA Verify Redirect', () => {
  test('[P2] unauthenticated user should be redirected to login from mfa-verify', async ({ page }) => {
    await page.goto('/auth/mfa-verify')

    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('[P2] login page after redirect should have no accessibility violations', async ({ page }) => {
    await page.goto('/auth/mfa-verify')
    await expect(page).toHaveURL(/\/auth\/login/)

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
})
