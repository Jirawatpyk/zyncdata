import { expect } from '@playwright/test'
import { test } from '../support/fixtures/merged-fixtures'
import { buildSystem } from '../factories/system-factory'

test.describe('Dashboard', () => {
  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('should show dashboard content for authenticated user', async ({ adminPage }) => {
    await adminPage.goto('/dashboard')

    await expect(adminPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(adminPage.getByText('Dashboard coming in Epic 3+')).toBeVisible()
  })
})

test.describe('Factory Usage Example', () => {
  test('buildSystem creates valid test data', async () => {
    const system = buildSystem({ name: 'Production API', status: 'healthy' })

    expect(system.id).toBeTruthy()
    expect(system.name).toBe('Production API')
    expect(system.status).toBe('healthy')
    expect(system.url).toBeTruthy()
    expect(system.checkIntervalSeconds).toBe(60)
  })
})
