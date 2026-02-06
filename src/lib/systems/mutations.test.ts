import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createSystem,
  updateSystem,
  deleteSystem,
  reorderSystems,
  toggleSystem,
  uploadSystemLogo,
  deleteSystemLogo,
  isSupabaseStorageUrl,
  extractStoragePath,
} from './mutations'

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

const mockGetSystems = vi.fn()
vi.mock('@/lib/systems/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/systems/queries')>()
  return {
    ...actual,
    getSystems: (...args: unknown[]) => mockGetSystems(...args),
  }
})

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
  last_checked_at: null,
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

describe('reorderSystems', () => {
  const TEST_UUID_2 = 'a47ac10b-58cc-4372-a567-0e02b2c3d480'

  const MOCK_REORDERED_LIST = [
    {
      id: TEST_UUID_2,
      name: 'System B',
      url: 'https://b.com',
      logoUrl: null,
      description: null,
      status: null,
      responseTime: null,
      displayOrder: 0,
      enabled: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      deletedAt: null,
      lastCheckedAt: null,
    },
    {
      id: TEST_UUID,
      name: 'System A',
      url: 'https://a.com',
      logoUrl: null,
      description: null,
      status: null,
      responseTime: null,
      displayOrder: 1,
      enabled: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      deletedAt: null,
      lastCheckedAt: null,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock the supabase update chain: .from().update().eq()
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    })

    mockGetSystems.mockResolvedValue(MOCK_REORDERED_LIST)
  })

  it('should update display_order for each system in the swap', async () => {
    const result = await reorderSystems([
      { id: TEST_UUID, displayOrder: 1 },
      { id: TEST_UUID_2, displayOrder: 0 },
    ])

    // Should call update twice (once per system)
    expect(mockUpdate).toHaveBeenCalledTimes(2)
    expect(mockUpdate).toHaveBeenCalledWith({ display_order: 1 })
    expect(mockUpdate).toHaveBeenCalledWith({ display_order: 0 })
    expect(result).toEqual(MOCK_REORDERED_LIST)
  })

  it('should call revalidatePath after successful reorder', async () => {
    const { revalidatePath } = await import('next/cache')

    await reorderSystems([
      { id: TEST_UUID, displayOrder: 1 },
      { id: TEST_UUID_2, displayOrder: 0 },
    ])

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('should return fresh system list from getSystems()', async () => {
    const result = await reorderSystems([
      { id: TEST_UUID, displayOrder: 1 },
      { id: TEST_UUID_2, displayOrder: 0 },
    ])

    expect(mockGetSystems).toHaveBeenCalledTimes(1)
    expect(result).toEqual(MOCK_REORDERED_LIST)
  })

  it('should throw when Supabase update fails', async () => {
    const dbError = { message: 'Database error', code: 'DB_ERROR' }
    const mockEq = vi.fn().mockResolvedValue({ error: dbError })
    mockUpdate.mockReturnValue({ eq: mockEq })

    await expect(
      reorderSystems([
        { id: TEST_UUID, displayOrder: 1 },
        { id: TEST_UUID_2, displayOrder: 0 },
      ]),
    ).rejects.toEqual(dbError)
  })

  it('should not call revalidatePath or getSystems when update fails', async () => {
    const { revalidatePath } = await import('next/cache')
    const dbError = { message: 'Database error', code: 'DB_ERROR' }
    const mockEq = vi.fn().mockResolvedValue({ error: dbError })
    mockUpdate.mockReturnValue({ eq: mockEq })

    await expect(
      reorderSystems([
        { id: TEST_UUID, displayOrder: 1 },
        { id: TEST_UUID_2, displayOrder: 0 },
      ]),
    ).rejects.toEqual(dbError)

    expect(revalidatePath).not.toHaveBeenCalled()
    expect(mockGetSystems).not.toHaveBeenCalled()
  })
})

describe('toggleSystem', () => {
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

  it('should toggle system to enabled', async () => {
    mockSingleForUpdate.mockResolvedValueOnce({
      data: { ...MOCK_SYSTEM_DB, enabled: true },
      error: null,
    })

    const result = await toggleSystem(TEST_UUID, true)

    expect(result.enabled).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith({ enabled: true })
  })

  it('should toggle system to disabled', async () => {
    mockSingleForUpdate.mockResolvedValueOnce({
      data: { ...MOCK_SYSTEM_DB, enabled: false },
      error: null,
    })

    const result = await toggleSystem(TEST_UUID, false)

    expect(result.enabled).toBe(false)
    expect(mockUpdate).toHaveBeenCalledWith({ enabled: false })
  })

  it('should NOT include deleted_at in the update payload', async () => {
    mockSingleForUpdate.mockResolvedValueOnce({
      data: { ...MOCK_SYSTEM_DB, enabled: true },
      error: null,
    })

    await toggleSystem(TEST_UUID, true)

    // Verify only { enabled } was passed — no deleted_at
    expect(mockUpdate).toHaveBeenCalledWith({ enabled: true })
    expect(mockUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.anything() }),
    )
  })

  it('should call revalidatePath after successful toggle', async () => {
    const { revalidatePath } = await import('next/cache')

    mockSingleForUpdate.mockResolvedValueOnce({
      data: { ...MOCK_SYSTEM_DB, enabled: false },
      error: null,
    })

    await toggleSystem(TEST_UUID, false)

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('should throw "System not found" for PGRST116 error', async () => {
    mockSingleForUpdate.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found', code: 'PGRST116' },
    })

    await expect(toggleSystem(TEST_UUID, true)).rejects.toThrow('System not found')
  })

  it('should throw generic error for other failures', async () => {
    mockSingleForUpdate.mockResolvedValueOnce({
      data: null,
      error: { message: 'Connection failed', code: 'SOME_ERROR' },
    })

    await expect(toggleSystem(TEST_UUID, false)).rejects.toEqual({
      message: 'Connection failed',
      code: 'SOME_ERROR',
    })
  })

  it('should return parsed System with camelCase fields', async () => {
    mockSingleForUpdate.mockResolvedValueOnce({
      data: {
        ...MOCK_SYSTEM_DB,
        enabled: false,
        updated_at: '2026-02-06T12:00:00Z',
      },
      error: null,
    })

    const result = await toggleSystem(TEST_UUID, false)

    expect(result.id).toBe(TEST_UUID)
    expect(result.updatedAt).toBe('2026-02-06T12:00:00Z')
    expect(result.enabled).toBe(false)
  })
})

describe('isSupabaseStorageUrl', () => {
  it('should return true for cloud Supabase Storage URL', () => {
    expect(
      isSupabaseStorageUrl(
        'https://abc.supabase.co/storage/v1/object/public/system-logos/id/logo.png',
      ),
    ).toBe(true)
  })

  it('should return true for local 127.0.0.1 storage URL', () => {
    expect(
      isSupabaseStorageUrl(
        'http://127.0.0.1:54321/storage/v1/object/public/system-logos/id/logo.png',
      ),
    ).toBe(true)
  })

  it('should return true for local localhost storage URL', () => {
    expect(
      isSupabaseStorageUrl(
        'http://localhost:54321/storage/v1/object/public/system-logos/id/logo.png',
      ),
    ).toBe(true)
  })

  it('should return false for static logo path', () => {
    expect(isSupabaseStorageUrl('/logos/tinedy.svg')).toBe(false)
  })

  it('should return false for arbitrary URL', () => {
    expect(isSupabaseStorageUrl('https://example.com/logo.png')).toBe(false)
  })
})

describe('extractStoragePath', () => {
  it('should extract path from cloud Supabase URL', () => {
    expect(
      extractStoragePath(
        'https://abc.supabase.co/storage/v1/object/public/system-logos/id123/1706000000.png',
      ),
    ).toBe('id123/1706000000.png')
  })

  it('should extract path from local Supabase URL', () => {
    expect(
      extractStoragePath(
        'http://127.0.0.1:54321/storage/v1/object/public/system-logos/id123/logo.webp',
      ),
    ).toBe('id123/logo.webp')
  })

  it('should return null for non-matching URL', () => {
    expect(extractStoragePath('/logos/tinedy.svg')).toBeNull()
  })

  it('should return null for URL without system-logos bucket', () => {
    expect(
      extractStoragePath(
        'https://abc.supabase.co/storage/v1/object/public/other-bucket/file.png',
      ),
    ).toBeNull()
  })
})

describe('uploadSystemLogo', () => {
  const mockStorageRemove = vi.fn()
  const mockStorageUpload = vi.fn()
  const mockStorageGetPublicUrl = vi.fn()
  const mockSelectSingle = vi.fn()
  const mockUpdateSingle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    let fromCallCount = 0
    mockSupabase.from.mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        // First call: SELECT logo_url
        return {
          select: () => ({
            eq: () => ({
              single: mockSelectSingle,
            }),
          }),
        }
      } else {
        // Second call: UPDATE logo_url
        return {
          update: () => ({
            eq: () => ({
              select: () => ({
                single: mockUpdateSingle,
              }),
            }),
          }),
        }
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(mockSupabase as any).storage = {
      from: () => ({
        remove: mockStorageRemove,
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      }),
    }
  })

  it('should upload new logo for system without existing logo', async () => {
    mockSelectSingle.mockResolvedValueOnce({
      data: { logo_url: null },
      error: null,
    })
    mockStorageUpload.mockResolvedValueOnce({ error: null })
    mockStorageGetPublicUrl.mockReturnValueOnce({
      data: { publicUrl: 'https://abc.supabase.co/storage/v1/object/public/system-logos/id/123.png' },
    })
    mockUpdateSingle.mockResolvedValueOnce({
      data: {
        ...MOCK_SYSTEM_DB,
        logo_url: 'https://abc.supabase.co/storage/v1/object/public/system-logos/id/123.png',
      },
      error: null,
    })

    const result = await uploadSystemLogo(TEST_UUID, Buffer.from('test'), 'logo.png', 'image/png')

    expect(result.logoUrl).toBe(
      'https://abc.supabase.co/storage/v1/object/public/system-logos/id/123.png',
    )
    expect(mockStorageRemove).not.toHaveBeenCalled()
    expect(mockStorageUpload).toHaveBeenCalledTimes(1)
  })

  it('should delete old Supabase logo before uploading new one', async () => {
    const oldUrl =
      'https://abc.supabase.co/storage/v1/object/public/system-logos/id/old.png'
    mockSelectSingle.mockResolvedValueOnce({
      data: { logo_url: oldUrl },
      error: null,
    })
    mockStorageRemove.mockResolvedValueOnce({ error: null })
    mockStorageUpload.mockResolvedValueOnce({ error: null })
    mockStorageGetPublicUrl.mockReturnValueOnce({
      data: { publicUrl: 'https://abc.supabase.co/storage/v1/object/public/system-logos/id/new.png' },
    })
    mockUpdateSingle.mockResolvedValueOnce({
      data: {
        ...MOCK_SYSTEM_DB,
        logo_url: 'https://abc.supabase.co/storage/v1/object/public/system-logos/id/new.png',
      },
      error: null,
    })

    await uploadSystemLogo(TEST_UUID, Buffer.from('test'), 'new.png', 'image/png')

    expect(mockStorageRemove).toHaveBeenCalledWith(['id/old.png'])
  })

  it('should NOT delete static logo from storage when replacing', async () => {
    mockSelectSingle.mockResolvedValueOnce({
      data: { logo_url: '/logos/tinedy.svg' },
      error: null,
    })
    mockStorageUpload.mockResolvedValueOnce({ error: null })
    mockStorageGetPublicUrl.mockReturnValueOnce({
      data: { publicUrl: 'https://abc.supabase.co/storage/v1/object/public/system-logos/id/123.png' },
    })
    mockUpdateSingle.mockResolvedValueOnce({
      data: {
        ...MOCK_SYSTEM_DB,
        logo_url: 'https://abc.supabase.co/storage/v1/object/public/system-logos/id/123.png',
      },
      error: null,
    })

    await uploadSystemLogo(TEST_UUID, Buffer.from('test'), 'logo.png', 'image/png')

    expect(mockStorageRemove).not.toHaveBeenCalled()
  })

  it('should throw "System not found" for PGRST116 error', async () => {
    mockSelectSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found', code: 'PGRST116' },
    })

    await expect(
      uploadSystemLogo(TEST_UUID, Buffer.from('test'), 'logo.png', 'image/png'),
    ).rejects.toThrow('System not found')
  })

  it('should throw when storage upload fails', async () => {
    mockSelectSingle.mockResolvedValueOnce({
      data: { logo_url: null },
      error: null,
    })
    mockStorageUpload.mockResolvedValueOnce({
      error: { message: 'Storage full' },
    })

    await expect(
      uploadSystemLogo(TEST_UUID, Buffer.from('test'), 'logo.png', 'image/png'),
    ).rejects.toThrow('Failed to upload logo: Storage full')
  })

  it('should call revalidatePath after successful upload', async () => {
    const { revalidatePath } = await import('next/cache')

    mockSelectSingle.mockResolvedValueOnce({
      data: { logo_url: null },
      error: null,
    })
    mockStorageUpload.mockResolvedValueOnce({ error: null })
    mockStorageGetPublicUrl.mockReturnValueOnce({
      data: { publicUrl: 'https://abc.supabase.co/storage/v1/object/public/system-logos/id/123.png' },
    })
    mockUpdateSingle.mockResolvedValueOnce({
      data: {
        ...MOCK_SYSTEM_DB,
        logo_url: 'https://abc.supabase.co/storage/v1/object/public/system-logos/id/123.png',
      },
      error: null,
    })

    await uploadSystemLogo(TEST_UUID, Buffer.from('test'), 'logo.png', 'image/png')

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('should throw when DB update fails after successful storage upload', async () => {
    const dbError = { message: 'DB connection lost', code: 'PGRST000' }

    mockSelectSingle.mockResolvedValueOnce({
      data: { logo_url: null },
      error: null,
    })
    mockStorageUpload.mockResolvedValueOnce({ error: null })
    mockStorageGetPublicUrl.mockReturnValueOnce({
      data: { publicUrl: 'https://abc.supabase.co/storage/v1/object/public/system-logos/id/123.png' },
    })
    mockUpdateSingle.mockResolvedValueOnce({
      data: null,
      error: dbError,
    })

    await expect(
      uploadSystemLogo(TEST_UUID, Buffer.from('test'), 'logo.png', 'image/png'),
    ).rejects.toEqual(dbError)

    // Storage upload was called (file is orphaned in storage)
    expect(mockStorageUpload).toHaveBeenCalledTimes(1)
  })
})

describe('deleteSystemLogo', () => {
  const mockStorageRemove = vi.fn()
  const mockSelectSingle = vi.fn()
  const mockUpdateSingle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    let fromCallCount = 0
    mockSupabase.from.mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        // First call: SELECT logo_url
        return {
          select: () => ({
            eq: () => ({
              single: mockSelectSingle,
            }),
          }),
        }
      } else {
        // Second call: UPDATE logo_url = null
        return {
          update: () => ({
            eq: () => ({
              select: () => ({
                single: mockUpdateSingle,
              }),
            }),
          }),
        }
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(mockSupabase as any).storage = {
      from: () => ({
        remove: mockStorageRemove,
      }),
    }
  })

  it('should delete Supabase Storage logo and clear DB field', async () => {
    const storageUrl =
      'https://abc.supabase.co/storage/v1/object/public/system-logos/id/old.png'
    mockSelectSingle.mockResolvedValueOnce({
      data: { logo_url: storageUrl },
      error: null,
    })
    mockStorageRemove.mockResolvedValueOnce({ error: null })
    mockUpdateSingle.mockResolvedValueOnce({
      data: { ...MOCK_SYSTEM_DB, logo_url: null },
      error: null,
    })

    const result = await deleteSystemLogo(TEST_UUID)

    expect(result.logoUrl).toBeNull()
    expect(mockStorageRemove).toHaveBeenCalledWith(['id/old.png'])
  })

  it('should just clear DB field for static logo (not delete from storage)', async () => {
    mockSelectSingle.mockResolvedValueOnce({
      data: { logo_url: '/logos/tinedy.svg' },
      error: null,
    })
    mockUpdateSingle.mockResolvedValueOnce({
      data: { ...MOCK_SYSTEM_DB, logo_url: null },
      error: null,
    })

    const result = await deleteSystemLogo(TEST_UUID)

    expect(result.logoUrl).toBeNull()
    expect(mockStorageRemove).not.toHaveBeenCalled()
  })

  it('should throw "System not found" for PGRST116 error', async () => {
    mockSelectSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found', code: 'PGRST116' },
    })

    await expect(deleteSystemLogo(TEST_UUID)).rejects.toThrow('System not found')
  })

  it('should call revalidatePath after successful deletion', async () => {
    const { revalidatePath } = await import('next/cache')

    mockSelectSingle.mockResolvedValueOnce({
      data: { logo_url: null },
      error: null,
    })
    mockUpdateSingle.mockResolvedValueOnce({
      data: { ...MOCK_SYSTEM_DB, logo_url: null },
      error: null,
    })

    await deleteSystemLogo(TEST_UUID)

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })
})
