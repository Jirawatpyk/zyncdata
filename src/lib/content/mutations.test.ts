/**
 * Content mutations unit tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock modules — factory can't reference outer variables
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { updateSectionContent } from './mutations'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function setupMockSupabase(result: { data: unknown; error: unknown }) {
  const mockSingle = vi.fn().mockResolvedValue(result)
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

  vi.mocked(createClient).mockResolvedValue({
    from: mockFrom,
  } as never)

  return { mockFrom, mockUpdate, mockEq, mockSelect, mockSingle }
}

describe('updateSectionContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update section content and return the row', async () => {
    const mockRow = {
      id: '1',
      section_name: 'hero',
      content: { title: 'New' },
      metadata: null,
      updated_by: 'user-123',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    }
    const { mockUpdate, mockEq } = setupMockSupabase({ data: mockRow, error: null })

    const result = await updateSectionContent('hero', { title: 'New' }, 'user-123')

    expect(result).toEqual(mockRow)
    expect(mockUpdate).toHaveBeenCalledWith({ content: { title: 'New' }, updated_by: 'user-123' })
    expect(mockEq).toHaveBeenCalledWith('section_name', 'hero')
  })

  it('should call revalidatePath after successful update', async () => {
    setupMockSupabase({
      data: { id: '1', section_name: 'hero', content: {}, metadata: null, updated_by: 'user-123', created_at: '', updated_at: '' },
      error: null,
    })

    await updateSectionContent('hero', { title: 'New' }, 'user-123')

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('should throw "Section not found" for PGRST116 error', async () => {
    setupMockSupabase({ data: null, error: { code: 'PGRST116', message: 'Not found' } })

    await expect(updateSectionContent('nonexistent', {}, 'user-123'))
      .rejects.toThrow('Section not found: nonexistent')
  })

  it('should throw on other database errors', async () => {
    const dbError = { code: 'OTHER', message: 'DB Error' }
    setupMockSupabase({ data: null, error: dbError })

    await expect(updateSectionContent('hero', {}, 'user-123'))
      .rejects.toEqual(dbError)
  })
})
