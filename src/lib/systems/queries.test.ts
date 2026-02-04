import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getEnabledSystems, getSystemByName } from '@/lib/systems/queries'

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
          status: null,
          display_order: 1,
        },
        {
          id: 'a23bc45d-67ef-8901-b234-5c6d7e8f9012',
          name: 'SCOPELABS',
          url: 'https://scopelabs.dxt-ai.com',
          logo_url: null,
          description: 'Analytics platform',
          status: 'coming_soon',
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
      'id, name, url, logo_url, description, status, display_order',
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
      status: null,
      displayOrder: 1,
    })
    expect(result[1].logoUrl).toBeNull()
    expect(result[1].status).toBe('coming_soon')
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

describe('getSystemByName', () => {
  const mockSelect = vi.fn()
  const mockEqName = vi.fn()
  const mockEqEnabled = vi.fn()
  const mockMaybeSingle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'VOCA',
        url: 'https://voca.dxt-ai.com',
        logo_url: null,
        description: 'AI-powered vocabulary learning',
        status: 'coming_soon',
        display_order: 2,
      },
      error: null,
    })
    mockEqEnabled.mockReturnValue({ maybeSingle: mockMaybeSingle })
    mockEqName.mockReturnValue({ eq: mockEqEnabled })
    mockSelect.mockReturnValue({ eq: mockEqName })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  it('should query by name with correct filters', async () => {
    await getSystemByName('VOCA')

    expect(mockSelect).toHaveBeenCalledWith(
      'id, name, url, logo_url, description, status, display_order',
    )
    expect(mockEqName).toHaveBeenCalledWith('name', 'VOCA')
    expect(mockEqEnabled).toHaveBeenCalledWith('enabled', true)
  })

  it('should return system in camelCase when found', async () => {
    const result = await getSystemByName('VOCA')

    expect(result).toEqual({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'VOCA',
      url: 'https://voca.dxt-ai.com',
      logoUrl: null,
      description: 'AI-powered vocabulary learning',
      status: 'coming_soon',
      displayOrder: 2,
    })
  })

  it('should return null when system not found', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const result = await getSystemByName('NONEXISTENT')
    expect(result).toBeNull()
  })

  it('should throw on Supabase error', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'Connection failed' },
    })

    await expect(getSystemByName('VOCA')).rejects.toThrow()
  })
})
