import { expect, type Page } from '@playwright/test'
import { test } from '../support/fixtures/merged-fixtures'
import path from 'node:path'
import fs from 'node:fs'

// Create a minimal valid PNG file for testing (1x1 pixel, transparent)
function createTestPng(filePath: string) {
  // Minimal valid PNG: 1x1 pixel, RGBA, transparent
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlz' +
    'AAAWJQAAFiUBSVIk8AAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xMkMEa+wAAAANSURBVBhXY2Bg' +
    'YPgPAAEEAQBjpHCTAAAAAElFTkSuQmCC',
    'base64',
  )
  fs.writeFileSync(filePath, png)
}

function createTestTxt(filePath: string) {
  fs.writeFileSync(filePath, 'not an image')
}

test.describe('System Logo Management', () => {
  test.describe('Unauthenticated - API Protection', () => {
    test('[P0] POST /api/systems/:id/logo should return 401 without auth', async () => {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/systems/f47ac10b-58cc-4372-a567-0e02b2c3d479/logo`, {
        method: 'POST',
        body: new FormData(),
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    test('[P0] DELETE /api/systems/:id/logo should return 401 without auth', async () => {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/systems/f47ac10b-58cc-4372-a567-0e02b2c3d479/logo`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error.code).toBe('UNAUTHORIZED')
    })
  })

  test.describe('Authenticated Admin - Logo Upload Flow', () => {
    // Helper to create a test system and return its name
    async function createTestSystem(adminPage: Page) {
      await adminPage.goto('/admin/systems')

      const systemName = `Logo Test ${Date.now()}`
      const systemUrl = `https://logo-test-${Date.now()}.example.com`

      await adminPage.getByTestId('add-system-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).toBeVisible()

      await adminPage.getByTestId('system-name-input').fill(systemName)
      await adminPage.getByTestId('system-url-input').fill(systemUrl)
      await adminPage.getByTestId('submit-button').click()

      await expect(adminPage.getByTestId('add-system-dialog')).not.toBeVisible({
        timeout: 10000,
      })
      await expect(
        adminPage.getByTestId('systems-list').getByText(systemName, { exact: true }),
      ).toBeVisible()

      return { name: systemName, url: systemUrl }
    }

    test('[P0] should upload logo via edit dialog (AC #1)', async ({ adminPage }) => {
      const system = await createTestSystem(adminPage)

      // Find the system row and open edit dialog
      const row = adminPage.locator('[data-testid^="system-row-"]', {
        hasText: system.name,
      })
      const editButton = row.locator('[data-testid^="edit-system-"]')
      await editButton.click()
      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()

      // Upload logo
      const testPngPath = path.join(__dirname, `test-logo-${Date.now()}.png`)
      createTestPng(testPngPath)

      try {
        const fileInput = adminPage.getByTestId('logo-file-input')
        await fileInput.setInputFiles(testPngPath)

        // Wait for upload success toast
        await expect(adminPage.getByText('Logo uploaded')).toBeVisible({ timeout: 10000 })
      } finally {
        fs.unlinkSync(testPngPath)
      }
    })

    test('[P0] should remove logo via edit dialog (AC #3)', async ({ adminPage }) => {
      const system = await createTestSystem(adminPage)

      // Open edit dialog
      const row = adminPage.locator('[data-testid^="system-row-"]', {
        hasText: system.name,
      })
      const editButton = row.locator('[data-testid^="edit-system-"]')
      await editButton.click()
      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()

      // Upload logo first
      const testPngPath = path.join(__dirname, `test-logo-${Date.now()}.png`)
      createTestPng(testPngPath)

      try {
        const fileInput = adminPage.getByTestId('logo-file-input')
        await fileInput.setInputFiles(testPngPath)
        await expect(adminPage.getByText('Logo uploaded')).toBeVisible({ timeout: 10000 })

        // Click remove button
        await adminPage.getByTestId('remove-logo-button').click()

        // Wait for remove success toast
        await expect(adminPage.getByText('Logo removed')).toBeVisible({ timeout: 10000 })
      } finally {
        fs.unlinkSync(testPngPath)
      }
    })

    test('[P1] should show validation error for invalid file type (AC #4)', async ({ adminPage }) => {
      const system = await createTestSystem(adminPage)

      // Open edit dialog
      const row = adminPage.locator('[data-testid^="system-row-"]', {
        hasText: system.name,
      })
      const editButton = row.locator('[data-testid^="edit-system-"]')
      await editButton.click()
      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()

      // Try to upload a text file
      const testTxtPath = path.join(__dirname, `test-invalid-${Date.now()}.txt`)
      createTestTxt(testTxtPath)

      try {
        const fileInput = adminPage.getByTestId('logo-file-input')
        await fileInput.setInputFiles(testTxtPath)

        // Should show validation error
        await expect(adminPage.getByTestId('logo-error')).toBeVisible({ timeout: 5000 })
        await expect(adminPage.getByTestId('logo-error')).toHaveText(
          'File must be JPEG, PNG, SVG, or WebP',
        )
      } finally {
        fs.unlinkSync(testTxtPath)
      }
    })

    test('[P1] should show LogoUpload component in edit dialog', async ({ adminPage }) => {
      const system = await createTestSystem(adminPage)

      // Open edit dialog
      const row = adminPage.locator('[data-testid^="system-row-"]', {
        hasText: system.name,
      })
      const editButton = row.locator('[data-testid^="edit-system-"]')
      await editButton.click()
      await expect(adminPage.getByTestId('edit-system-dialog')).toBeVisible()

      // Verify LogoUpload component is present
      await expect(adminPage.getByTestId('upload-logo-button')).toBeVisible()
      await expect(adminPage.getByText('JPEG, PNG, SVG, or WebP. Max 512KB.')).toBeVisible()
    })

    test('[P1] should show LogoUpload component in add dialog', async ({ adminPage }) => {
      await adminPage.goto('/admin/systems')

      await adminPage.getByTestId('add-system-button').click()
      await expect(adminPage.getByTestId('add-system-dialog')).toBeVisible()

      // Verify LogoUpload component is present
      await expect(adminPage.getByTestId('upload-logo-button')).toBeVisible()
      await expect(adminPage.getByText('JPEG, PNG, SVG, or WebP. Max 512KB.')).toBeVisible()
    })
  })
})
