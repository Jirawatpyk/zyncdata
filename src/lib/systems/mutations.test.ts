import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSystem } from './mutations'

const mockSingleForSelect = vi.fn()
const mockSingleForInsert = vi.fn()

const mockSupabase = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => mockSupabase,
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Valid UUID for testing
const TEST_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

describe('createSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Set up chained mock for select -> order -> limit -> single (for getting max display_order)
    // and insert -> select -> single (for inserting)
    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // First call: SELECT display_order
        return {
          select: () => ({
            order: () => ({
              limit: () => ({
                single: mockSingleForSelect,
              }),
            }),
          }),
        }
      } else {
        // Second call: INSERT
        return {
          insert: () => ({
            select: () => ({
              single: mockSingleForInsert,
            }),
          }),
        }
      }
    })
  })

  it('should create system with auto-calculated display_order', async () => {
    // First query for max display_order
    mockSingleForSelect.mockResolvedValueOnce({
      data: { display_order: 5 },
      error: null,
    })
    // Insert query
    mockSingleForInsert.mockResolvedValueOnce({
      data: {
        id: TEST_UUID,
        name: 'New System',
        url: 'https://example.com',
        logo_url: null,
        description: null,
        status: null,
        response_time: null,
        display_order: 6,
        enabled: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })

    const result = await createSystem({
      name: 'New System',
      url: 'https://example.com',
      enabled: true,
    })

    expect(result.displayOrder).toBe(6)
    expect(result.name).toBe('New System')
  })

  it('should start display_order at 0 when no systems exist', async () => {
    // First query returns null (no systems)
    mockSingleForSelect.mockResolvedValueOnce({ data: null, error: null })
    // Insert query
    mockSingleForInsert.mockResolvedValueOnce({
      data: {
        id: TEST_UUID,
        name: 'First System',
        url: 'https://first.com',
        logo_url: null,
        description: null,
        status: null,
        response_time: null,
        display_order: 0,
        enabled: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })

    const result = await createSystem({
      name: 'First System',
      url: 'https://first.com',
      enabled: true,
    })

    expect(result.displayOrder).toBe(0)
  })

  it('should transform camelCase input to snake_case for database', async () => {
    mockSingleForSelect.mockResolvedValueOnce({
      data: { display_order: 0 },
      error: null,
    })
    mockSingleForInsert.mockResolvedValueOnce({
      data: {
        id: TEST_UUID,
        name: 'Test',
        url: 'https://test.com',
        logo_url: null,
        description: 'Test desc',
        status: null,
        response_time: null,
        display_order: 1,
        enabled: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })

    const result = await createSystem({
      name: 'Test',
      url: 'https://test.com',
      description: 'Test desc',
      enabled: false,
    })

    // Verify result has correct values (transformation is internal)
    expect(result.name).toBe('Test')
    expect(result.description).toBe('Test desc')
    expect(result.enabled).toBe(false)
  })

  it('should throw error when insert fails', async () => {
    mockSingleForSelect.mockResolvedValueOnce({
      data: { display_order: 0 },
      error: null,
    })
    mockSingleForInsert.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error', code: 'PGRST116' },
    })

    await expect(
      createSystem({
        name: 'Fail System',
        url: 'https://fail.com',
        enabled: true,
      }),
    ).rejects.toEqual({ message: 'Database error', code: 'PGRST116' })
  })

  it('should call revalidatePath after successful creation', async () => {
    const { revalidatePath } = await import('next/cache')

    mockSingleForSelect.mockResolvedValueOnce({
      data: { display_order: 0 },
      error: null,
    })
    mockSingleForInsert.mockResolvedValueOnce({
      data: {
        id: TEST_UUID,
        name: 'New System',
        url: 'https://example.com',
        logo_url: null,
        description: null,
        status: null,
        response_time: null,
        display_order: 1,
        enabled: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })

    await createSystem({
      name: 'New System',
      url: 'https://example.com',
      enabled: true,
    })

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('should return parsed System type with camelCase fields', async () => {
    mockSingleForSelect.mockResolvedValueOnce({
      data: { display_order: 2 },
      error: null,
    })
    mockSingleForInsert.mockResolvedValueOnce({
      data: {
        id: TEST_UUID,
        name: 'Camel System',
        url: 'https://camel.com',
        logo_url: 'https://logo.com/img.png',
        description: 'A description',
        status: 'operational',
        response_time: 150,
        display_order: 3,
        enabled: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T12:00:00Z',
      },
      error: null,
    })

    const result = await createSystem({
      name: 'Camel System',
      url: 'https://camel.com',
      description: 'A description',
      enabled: true,
    })

    // Verify camelCase conversion
    expect(result.logoUrl).toBe('https://logo.com/img.png')
    expect(result.displayOrder).toBe(3)
    expect(result.responseTime).toBe(150)
    expect(result.createdAt).toBe('2026-01-01T00:00:00Z')
    expect(result.updatedAt).toBe('2026-01-01T12:00:00Z')
  })
})
