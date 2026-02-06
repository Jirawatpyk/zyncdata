import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getEnabledSystems, getSystemByName, getSystems } from '@/lib/systems/queries'

const EXPECTED_SELECT =
  'id, name, url, logo_url, description, status, response_time, display_order, enabled, created_at, updated_at, deleted_at, last_checked_at'

describe('getEnabledSystems', () => {
  const mockSelect = vi.fn()
  const mockEq = vi.fn()
  const mockIs = vi.fn()
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
          response_time: 100,
          display_order: 1,
          enabled: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          deleted_at: null,
          last_checked_at: null,
        },
        {
          id: 'a23bc45d-67ef-8901-b234-5c6d7e8f9012',
          name: 'SCOPELABS',
          url: 'https://scopelabs.dxt-ai.com',
          logo_url: null,
          description: 'Analytics platform',
          status: 'coming_soon',
          response_time: null,
          display_order: 2,
          enabled: true,
          created_at: '2026-01-02T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
          deleted_at: null,
          last_checked_at: null,
        },
      ],
      error: null,
    })
    mockIs.mockReturnValue({ order: mockOrder })
    mockEq.mockReturnValue({ is: mockIs })
    mockSelect.mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  it('should query systems with correct filters', async () => {
    await getEnabledSystems()

    expect(mockSelect).toHaveBeenCalledWith(EXPECTED_SELECT)
    expect(mockEq).toHaveBeenCalledWith('enabled', true)
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
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
      responseTime: 100,
      displayOrder: 1,
      enabled: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      deletedAt: null,
      lastCheckedAt: null,
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
  const mockIs = vi.fn()
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
        response_time: 150,
        display_order: 2,
        enabled: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        deleted_at: null,
        last_checked_at: null,
      },
      error: null,
    })
    mockIs.mockReturnValue({ maybeSingle: mockMaybeSingle })
    mockEqEnabled.mockReturnValue({ is: mockIs })
    mockEqName.mockReturnValue({ eq: mockEqEnabled })
    mockSelect.mockReturnValue({ eq: mockEqName })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client mock requires partial type
    } as any)
  })

  it('should query by name with correct filters', async () => {
    await getSystemByName('VOCA')

    expect(mockSelect).toHaveBeenCalledWith(EXPECTED_SELECT)
    expect(mockEqName).toHaveBeenCalledWith('name', 'VOCA')
    expect(mockEqEnabled).toHaveBeenCalledWith('enabled', true)
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null)
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
      responseTime: 150,
      displayOrder: 2,
      enabled: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      deletedAt: null,
      lastCheckedAt: null,
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

describe('getSystems', () => {
  const mockSelect = vi.fn()
  const mockOrder = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'System 1',
          url: 'https://sys1.com',
          logo_url: null,
          description: 'Desc 1',
          status: 'operational',
          response_time: 100,
          display_order: 0,
          enabled: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          deleted_at: null,
          last_checked_at: null,
        },
        {
          id: 'a23bc45d-67ef-8901-b234-5c6d7e8f9012',
          name: 'System 2',
          url: 'https://sys2.com',
          logo_url: 'https://logo.com/img.png',
          description: null,
          status: null,
          response_time: null,
          display_order: 1,
          enabled: false,
          created_at: '2026-01-02T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
          deleted_at: null,
          last_checked_at: null,
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

  it('should query all systems ordered by display_order', async () => {
    await getSystems()

    expect(mockSelect).toHaveBeenCalledWith(EXPECTED_SELECT)
    expect(mockOrder).toHaveBeenCalledWith('display_order', { ascending: true })
  })

  it('should return all systems including disabled', async () => {
    const result = await getSystems()

    expect(result).toHaveLength(2)
    expect(result[0].enabled).toBe(true)
    expect(result[1].enabled).toBe(false)
  })

  it('should transform snake_case to camelCase', async () => {
    const result = await getSystems()

    expect(result[0]).toEqual({
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'System 1',
      url: 'https://sys1.com',
      logoUrl: null,
      description: 'Desc 1',
      status: 'operational',
      responseTime: 100,
      displayOrder: 0,
      enabled: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      deletedAt: null,
      lastCheckedAt: null,
    })
    expect(result[1]).toEqual({
      id: 'a23bc45d-67ef-8901-b234-5c6d7e8f9012',
      name: 'System 2',
      url: 'https://sys2.com',
      logoUrl: 'https://logo.com/img.png',
      description: null,
      status: null,
      responseTime: null,
      displayOrder: 1,
      enabled: false,
      createdAt: '2026-01-02T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
      deletedAt: null,
      lastCheckedAt: null,
    })
  })

  it('should return empty array when no systems', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })

    const result = await getSystems()
    expect(result).toEqual([])
  })

  it('should throw on Supabase error', async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: 'Connection failed' },
    })

    await expect(getSystems()).rejects.toThrow()
  })
})
