import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility @a11y', () => {
  test('login page should have no accessibility violations', async ({ page }) => {
    await page.goto('/login')

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })

  test('dashboard should have no accessibility violations', async ({ page }) => {
    // Skip if not authenticated — this test requires login setup
    test.skip(!process.env.TEST_USER_EMAIL, 'TEST_USER_EMAIL not set')

    await page.goto('/login')
    await page.getByTestId('email-input').fill(process.env.TEST_USER_EMAIL!)
    await page.getByTestId('password-input').fill(process.env.TEST_USER_PASSWORD!)
    await page.getByTestId('login-submit').click()
    await page.waitForURL('/dashboard/**')

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })
})
