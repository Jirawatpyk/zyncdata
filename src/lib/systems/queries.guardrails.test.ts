/**
 * Systems Queries Guardrail Tests
 *
 * These tests verify INVARIANTS that must never change.
 * Breaking these tests indicates a contract violation that will break consumers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getSystems } from '@/lib/systems/queries'

describe('getSystems Guardrails', () => {
  const mockSelect = vi.fn()
  const mockOrder = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'Test System',
          url: 'https://test.com',
          logo_url: 'https://logo.com/img.png',
          description: 'Test description',
          status: 'operational',
          response_time: 150,
          display_order: 1,
          enabled: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
          deleted_at: null,
        },
      ],
      error: null,
    })
    mockSelect.mockReturnValue({ order: mockOrder })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  describe('P0: Critical Invariants', () => {
    it('[P0] getSystems MUST transform snake_case to camelCase', async () => {
      const result = await getSystems()

      // Verify snake_case fields do NOT exist
      expect(result[0]).not.toHaveProperty('logo_url')
      expect(result[0]).not.toHaveProperty('response_time')
      expect(result[0]).not.toHaveProperty('display_order')
      expect(result[0]).not.toHaveProperty('created_at')
      expect(result[0]).not.toHaveProperty('updated_at')

      // Verify camelCase fields DO exist
      expect(result[0]).toHaveProperty('logoUrl')
      expect(result[0]).toHaveProperty('responseTime')
      expect(result[0]).toHaveProperty('displayOrder')
      expect(result[0]).toHaveProperty('createdAt')
      expect(result[0]).toHaveProperty('updatedAt')
    })

    it('[P0] Field mapping: logo_url MUST become logoUrl', async () => {
      const result = await getSystems()
      expect(result[0].logoUrl).toBe('https://logo.com/img.png')
    })

    it('[P0] Field mapping: response_time MUST become responseTime', async () => {
      const result = await getSystems()
      expect(result[0].responseTime).toBe(150)
    })

    it('[P0] Field mapping: display_order MUST become displayOrder', async () => {
      const result = await getSystems()
      expect(result[0].displayOrder).toBe(1)
    })

    it('[P0] Field mapping: created_at MUST become createdAt', async () => {
      const result = await getSystems()
      expect(result[0].createdAt).toBe('2026-01-01T00:00:00Z')
    })

    it('[P0] Field mapping: updated_at MUST become updatedAt', async () => {
      const result = await getSystems()
      expect(result[0].updatedAt).toBe('2026-01-02T00:00:00Z')
    })
  })

  describe('P1: Important Invariants', () => {
    it('[P1] getSystems MUST return empty array (not null) when no data', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null })

      const result = await getSystems()

      expect(result).not.toBeNull()
      expect(result).not.toBeUndefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toEqual([])
    })

    it('[P1] getSystems result MUST always be an array', async () => {
      const result = await getSystems()

      expect(Array.isArray(result)).toBe(true)
    })
  })
})
