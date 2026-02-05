import { test, expect } from '@playwright/test'

// Story 2.6 guardrail tests — validates RBAC enforcement and security headers
// Fills E2E gaps not covered by route-protection.spec.ts

test.describe('RBAC Enforcement Guardrails', () => {
  test('[P0] direct URL with crafted query params should not bypass RBAC guard', async ({
    page,
  }) => {
    // Attempt to bypass server-side RBAC guard with crafted query parameters
    await page.goto('/admin?role=super_admin')
    await expect(page).toHaveURL(/\/auth\/login/)

    await page.goto('/admin?bypass=true&authenticated=1')
    await expect(page).toHaveURL(/\/auth\/login/)

    await page.goto('/dashboard?admin=true')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('[P0] direct URL with hash fragment should not bypass RBAC guard', async ({ page }) => {
    // Hash fragments are client-side only, but verify the page still redirects
    await page.goto('/admin#super_admin')
    await expect(page).toHaveURL(/\/auth\/login/)

    await page.goto('/dashboard#authenticated')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('[P0] rapid sequential navigations to protected routes should all redirect to login', async ({
    page,
  }) => {
    // Rapid navigations should not bypass auth guard due to race conditions
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/auth\/login/)

    // Navigate again immediately after redirect completes
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)

    // Navigate to admin again
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/auth\/login/)

    // Verify login page is fully functional after repeated redirects
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('[P1] POST/PUT/DELETE methods to protected routes should redirect unauthenticated users', async ({
    page,
  }) => {
    // Test that form submissions to protected routes also get redirected
    // This validates that the proxy.ts matcher handles all HTTP methods

    // Navigate to login page first (valid starting point)
    await page.goto('/auth/login')

    // Attempt form submission via JavaScript to a protected route
    const response = await page.evaluate(async () => {
      const res = await fetch('/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
        redirect: 'follow',
      })
      return { url: res.url, status: res.status }
    })

    // Should be redirected or show login page content
    expect(response.url).toMatch(/\/auth\/login/)
  })

  test('[P1] unauthorized page dashboard link should navigate correctly', async ({ page }) => {
    // Given the unauthorized page is loaded
    await page.goto('/unauthorized')
    await expect(page.getByTestId('unauthorized-page')).toBeVisible()

    // When the user clicks "Go to Dashboard"
    await page.getByTestId('go-to-dashboard-link').click()

    // Then unauthenticated user should be redirected to login
    // (since /dashboard requires authentication)
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('[P1] unauthorized page login link should navigate correctly', async ({ page }) => {
    // Given the unauthorized page is loaded
    await page.goto('/unauthorized')
    await expect(page.getByTestId('unauthorized-page')).toBeVisible()

    // When the user clicks "Go to Login"
    await page.getByTestId('go-to-login-link').click()

    // Then the login page should be displayed
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })
})

test.describe('Security Headers Guardrails', () => {
  test('[P1] should return X-Frame-Options DENY header on all pages', async ({ page }) => {
    // Test on landing page (public)
    const landingResponse = await page.goto('/')
    expect(landingResponse?.headers()['x-frame-options']).toBe('DENY')

    // Test on login page (public)
    const loginResponse = await page.goto('/auth/login')
    expect(loginResponse?.headers()['x-frame-options']).toBe('DENY')

    // Test on unauthorized page (public)
    const unauthorizedResponse = await page.goto('/unauthorized')
    expect(unauthorizedResponse?.headers()['x-frame-options']).toBe('DENY')
  })

  test('[P1] should return X-Content-Type-Options nosniff header', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.headers()['x-content-type-options']).toBe('nosniff')
  })

  test('[P1] should return Referrer-Policy header', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })

  test('[P1] should return Content-Security-Policy header with frame-ancestors none', async ({
    page,
  }) => {
    const response = await page.goto('/')
    const csp = response?.headers()['content-security-policy']

    expect(csp).toBeDefined()
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("form-action 'self'")
  })

  test('[P1] should return Permissions-Policy header disabling unused features', async ({
    page,
  }) => {
    const response = await page.goto('/')
    const permissionsPolicy = response?.headers()['permissions-policy']

    expect(permissionsPolicy).toBeDefined()
    expect(permissionsPolicy).toContain('camera=()')
    expect(permissionsPolicy).toContain('microphone=()')
    expect(permissionsPolicy).toContain('geolocation=()')
    expect(permissionsPolicy).toContain('interest-cohort=()')
  })

  test('[P2] security headers should be present on all route types', async ({ page }) => {
    const routes = [
      '/', // Landing page
      '/auth/login', // Auth page
      '/unauthorized', // Error page
      '/coming-soon', // Static page
    ]

    for (const route of routes) {
      const response = await page.goto(route)
      expect(
        response?.headers()['x-frame-options'],
        `X-Frame-Options missing on ${route}`,
      ).toBe('DENY')
      expect(
        response?.headers()['x-content-type-options'],
        `X-Content-Type-Options missing on ${route}`,
      ).toBe('nosniff')
      expect(
        response?.headers()['referrer-policy'],
        `Referrer-Policy missing on ${route}`,
      ).toBeDefined()
    }
  })
})

test.describe('Proxy and Session Guardrails', () => {
  test('[P2] static assets should not be processed by proxy matcher', async ({ page }) => {
    // Navigate to a page first to ensure static assets are served
    await page.goto('/')

    // Static assets should have fast response times (not going through auth check)
    const faviconResponse = await page.goto('/favicon.ico')

    // Favicon should return 200 (exists) or 404 (doesn't exist), but not redirect to login
    expect([200, 404]).toContain(faviconResponse?.status())
    expect(faviconResponse?.url()).not.toMatch(/\/auth\/login/)
  })

  test('[P2] Next.js internal routes should not be processed by proxy matcher', async ({
    page,
  }) => {
    // _next/static files should bypass proxy
    await page.goto('/')

    // Get any static file from the page
    const staticFiles = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src*="/_next/static"]'))
      return scripts.map((s) => (s as HTMLScriptElement).src)
    })

    // If static files exist, they should load successfully
    if (staticFiles.length > 0) {
      for (const file of staticFiles.slice(0, 2)) {
        // Test first 2 files
        const response = await page.goto(file)
        expect(response?.status()).toBe(200)
        expect(response?.url()).not.toMatch(/\/auth\/login/)
      }
    }
  })

  test('[P2] unauthorized page should be accessible without authentication', async ({ page }) => {
    // Unauthorized page must be public so users can see the "Access Denied" message
    await page.goto('/unauthorized')

    // Should NOT redirect to login
    await expect(page).toHaveURL('/unauthorized')
    await expect(page.getByTestId('unauthorized-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible()
  })
})
