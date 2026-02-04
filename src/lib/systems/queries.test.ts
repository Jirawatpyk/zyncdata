import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getEnabledSystems } from '@/lib/systems/queries'

describe('getEnabledSystems', () => {
  const mockSelect = vi.fn()
  const mockEq = vi.fn()
  const mockOrder = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'TINEDY',
          url: 'https://tinedy.dxt-ai.com',
          logo_url: null,
          description: 'Task management',
          display_order: 1,
        },
        {
          id: 'a23bc45d-67ef-8901-b234-5c6d7e8f9012',
          name: 'SCOPELABS',
          url: 'https://scopelabs.dxt-ai.com',
          logo_url: null,
          description: 'Analytics platform',
          display_order: 2,
        },
      ],
      error: null,
    })
    mockEq.mockReturnValue({ order: mockOrder })
    mockSelect.mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  it('should query systems with correct filters', async () => {
    await getEnabledSystems()

    expect(mockSelect).toHaveBeenCalledWith(
      'id, name, url, logo_url, description, display_order',
    )
    expect(mockEq).toHaveBeenCalledWith('enabled', true)
    expect(mockOrder).toHaveBeenCalledWith('display_order', { ascending: true })
  })

  it('should return enabled systems in camelCase', async () => {
    const result = await getEnabledSystems()

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'TINEDY',
      url: 'https://tinedy.dxt-ai.com',
      logoUrl: null,
      description: 'Task management',
      displayOrder: 1,
    })
    expect(result[1].logoUrl).toBeNull()
    expect(result[1].displayOrder).toBe(2)
  })

  it('should throw on Supabase error', async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: 'Connection failed' },
    })

    await expect(getEnabledSystems()).rejects.toThrow()
  })

  it('should return empty array when no systems exist', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })

    const result = await getEnabledSystems()
    expect(result).toEqual([])
  })
})
