import { test, expect } from '../support/fixtures/merged-fixtures'
import { buildSystem } from '../factories/system-factory'

test.describe('Dashboard', () => {
  test('should display the login page for unauthenticated users', async ({ page }) => {
    // Given: an unauthenticated user
    // When: they navigate to the dashboard
    await page.goto('/dashboard')

    // Then: they are redirected to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('should show system status after login', async ({ authenticatedPage }) => {
    // Given: an authenticated user on the dashboard
    const page = authenticatedPage

    // When: the dashboard loads
    await page.waitForSelector('[data-testid="dashboard-content"]')

    // Then: the page title is visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Factory Usage Example', () => {
  test('buildSystem creates valid test data', async () => {
    // Given: a system factory with overrides
    const system = buildSystem({ name: 'Production API', status: 'healthy' })

    // Then: factory produces complete, typed data
    expect(system.id).toBeTruthy()
    expect(system.name).toBe('Production API')
    expect(system.status).toBe('healthy')
    expect(system.url).toBeTruthy()
    expect(system.checkIntervalSeconds).toBe(60)
  })
})
