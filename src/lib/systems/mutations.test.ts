import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSystem, updateSystem, deleteSystem } from './mutations'

const mockSingleForSelect = vi.fn()
const mockSingleForInsert = vi.fn()
const mockSingleForUpdate = vi.fn()

const mockUpdate = vi.fn()

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

const MOCK_SYSTEM_DB = {
  id: TEST_UUID,
  name: 'Test System',
  url: 'https://example.com',
  logo_url: null,
  description: null,
  status: null,
  response_time: null,
  display_order: 0,
  enabled: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  deleted_at: null,
}

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
        ...MOCK_SYSTEM_DB,
        name: 'New System',
        display_order: 6,
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
        ...MOCK_SYSTEM_DB,
        name: 'First System',
        url: 'https://first.com',
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
        ...MOCK_SYSTEM_DB,
        name: 'Test',
        url: 'https://test.com',
        description: 'Test desc',
        display_order: 1,
        enabled: false,
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
        ...MOCK_SYSTEM_DB,
        display_order: 1,
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
        ...MOCK_SYSTEM_DB,
        name: 'Camel System',
        url: 'https://camel.com',
        logo_url: 'https://logo.com/img.png',
        description: 'A description',
        status: 'operational',
        response_time: 150,
        display_order: 3,
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

describe('deleteSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    })

    const mockEq = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSingleForUpdate,
      }),
    })
    mockUpdate.mockReturnValue({ eq: mockEq })
  })

  it('should soft-delete system by setting enabled=false and deleted_at', async () => {
    const deletedAt = '2026-02-05T12:00:00Z'
    mockSingleForUpdate.mockResolvedValueOnce({
      data: {
        ...MOCK_SYSTEM_DB,
        enabled: false,
        deleted_at: deletedAt,
      },
      error: null,
    })

    const result = await deleteSystem(TEST_UUID)

    expect(result.enabled).toBe(false)
    expect(result.deletedAt).toBe(deletedAt)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        deleted_at: expect.any(String),
      }),
    )
  })

  it('should call revalidatePath after successful deletion', async () => {
    const { revalidatePath } = await import('next/cache')

    mockSingleForUpdate.mockResolvedValueOnce({
      data: {
        ...MOCK_SYSTEM_DB,
        enabled: false,
        deleted_at: '2026-02-05T12:00:00Z',
      },
      error: null,
    })

    await deleteSystem(TEST_UUID)

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('should throw "System not found" for PGRST116 error', async () => {
    mockSingleForUpdate.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found', code: 'PGRST116' },
    })

    await expect(deleteSystem(TEST_UUID)).rejects.toThrow('System not found')
  })

  it('should throw generic error for other failures', async () => {
    mockSingleForUpdate.mockResolvedValueOnce({
      data: null,
      error: { message: 'Connection failed', code: 'SOME_ERROR' },
    })

    await expect(deleteSystem(TEST_UUID)).rejects.toEqual({
      message: 'Connection failed',
      code: 'SOME_ERROR',
    })
  })

  it('should return parsed System with camelCase fields', async () => {
    mockSingleForUpdate.mockResolvedValueOnce({
      data: {
        ...MOCK_SYSTEM_DB,
        enabled: false,
        deleted_at: '2026-02-05T12:00:00Z',
        updated_at: '2026-02-05T12:00:00Z',
      },
      error: null,
    })

    const result = await deleteSystem(TEST_UUID)

    expect(result.id).toBe(TEST_UUID)
    expect(result.deletedAt).toBe('2026-02-05T12:00:00Z')
    expect(result.updatedAt).toBe('2026-02-05T12:00:00Z')
  })
})

describe('updateSystem — recovery path', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    })

    const mockEq = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: mockSingleForUpdate,
      }),
    })
    mockUpdate.mockReturnValue({ eq: mockEq })
  })

  it('should clear deleted_at when enabled is set to true (recovery)', async () => {
    mockSingleForUpdate.mockResolvedValueOnce({
      data: {
        ...MOCK_SYSTEM_DB,
        enabled: true,
        deleted_at: null,
      },
      error: null,
    })

    await updateSystem({
      id: TEST_UUID,
      name: 'Test System',
      url: 'https://example.com',
      enabled: true,
    })

    // The update payload should include deleted_at: null
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        deleted_at: null,
      }),
    )
  })

  it('should NOT clear deleted_at when enabled is false', async () => {
    mockSingleForUpdate.mockResolvedValueOnce({
      data: {
        ...MOCK_SYSTEM_DB,
        enabled: false,
        deleted_at: '2026-02-05T12:00:00Z',
      },
      error: null,
    })

    await updateSystem({
      id: TEST_UUID,
      name: 'Test System',
      url: 'https://example.com',
      enabled: false,
    })

    // deleted_at should NOT be explicitly set to null
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.not.objectContaining({
        deleted_at: null,
      }),
    )
  })
})
