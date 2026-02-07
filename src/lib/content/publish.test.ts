/**
 * Publish functions unit tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { publishAllContent, getPublishStatus } from './publish'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

describe('publishAllContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should copy draft_content → content and null draft_content for each draft row', async () => {
    const draftRows = [
      { id: 'row-1', section_name: 'hero', draft_content: { title: 'Draft Hero' } },
      { id: 'row-2', section_name: 'footer', draft_content: { copyright: 'Draft Footer' } },
    ]

    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    const mockNot = vi.fn().mockResolvedValue({ data: draftRows, error: null })
    const mockSelect = vi.fn().mockReturnValue({ not: mockNot })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect, update: mockUpdate })

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const result = await publishAllContent('user-123')

    expect(result).toHaveProperty('publishedAt')
    expect(mockUpdate).toHaveBeenCalledTimes(2)
    expect(mockUpdate).toHaveBeenCalledWith({
      content: { title: 'Draft Hero' },
      draft_content: null,
      updated_by: 'user-123',
    })
    expect(mockUpdate).toHaveBeenCalledWith({
      content: { copyright: 'Draft Footer' },
      draft_content: null,
      updated_by: 'user-123',
    })
  })

  it('should call revalidatePath after publishing', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    const mockNot = vi.fn().mockResolvedValue({
      data: [{ id: 'row-1', section_name: 'hero', draft_content: { title: 'Draft' } }],
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ not: mockNot })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect, update: mockUpdate })

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    await publishAllContent('user-123')

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('should skip update when no draft rows exist (idempotent)', async () => {
    const mockUpdate = vi.fn()
    const mockNot = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockSelect = vi.fn().mockReturnValue({ not: mockNot })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect, update: mockUpdate })

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const result = await publishAllContent('user-123')

    expect(result).toHaveProperty('publishedAt')
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('should throw on fetch error', async () => {
    const mockNot = vi.fn().mockResolvedValue({ data: null, error: { code: 'DB_ERROR', message: 'Fetch failed' } })
    const mockSelect = vi.fn().mockReturnValue({ not: mockNot })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    await expect(publishAllContent('user-123')).rejects.toEqual({ code: 'DB_ERROR', message: 'Fetch failed' })
  })

  it('should throw on update error', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: { code: 'DB_ERROR', message: 'Update failed' } })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    const mockNot = vi.fn().mockResolvedValue({
      data: [{ id: 'row-1', section_name: 'hero', draft_content: { title: 'Draft' } }],
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ not: mockNot })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect, update: mockUpdate })

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    await expect(publishAllContent('user-123')).rejects.toEqual({ code: 'DB_ERROR', message: 'Update failed' })
  })
})

describe('getPublishStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return hasDrafts: true when draft_content exists', async () => {
    const mockNot = vi.fn().mockResolvedValue({
      data: [{ section_name: 'hero', draft_content: { title: 'Draft' } }],
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ not: mockNot })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const result = await getPublishStatus()

    expect(result.hasDrafts).toBe(true)
    expect(result.draftSections).toEqual(['hero'])
  })

  it('should return hasDrafts: false when all draft_content is NULL', async () => {
    const mockNot = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockSelect = vi.fn().mockReturnValue({ not: mockNot })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const result = await getPublishStatus()

    expect(result.hasDrafts).toBe(false)
    expect(result.draftSections).toEqual([])
  })

  it('should return correct draftSections list', async () => {
    const mockNot = vi.fn().mockResolvedValue({
      data: [
        { section_name: 'hero', draft_content: {} },
        { section_name: 'footer', draft_content: {} },
        { section_name: 'theme', draft_content: {} },
      ],
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ not: mockNot })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    const result = await getPublishStatus()

    expect(result.hasDrafts).toBe(true)
    expect(result.draftSections).toEqual(['hero', 'footer', 'theme'])
  })

  it('should throw on database error', async () => {
    const mockNot = vi.fn().mockResolvedValue({ data: null, error: { code: 'DB_ERROR', message: 'Query failed' } })
    const mockSelect = vi.fn().mockReturnValue({ not: mockNot })
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never)

    await expect(getPublishStatus()).rejects.toEqual({ code: 'DB_ERROR', message: 'Query failed' })
  })
})
