import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiGet, apiPost } from '@/lib/api/client'
import { ErrorCode } from '@/lib/errors/codes'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('apiGet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return data on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: '1', name: 'Test' } }),
    })

    const result = await apiGet<{ id: string; name: string }>('/api/test')

    expect(result).toEqual({ data: { id: '1', name: 'Test' }, error: null })
    expect(mockFetch).toHaveBeenCalledWith('/api/test')
  })

  it('should return data when response has no data wrapper', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '1', name: 'Test' }),
    })

    const result = await apiGet<{ id: string; name: string }>('/api/test')

    expect(result.data).toEqual({ id: '1', name: 'Test' })
    expect(result.error).toBeNull()
  })

  it('should return error on HTTP error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          error: { message: 'Not found', code: ErrorCode.NOT_FOUND },
        }),
    })

    const result = await apiGet('/api/test')

    expect(result.data).toBeNull()
    expect(result.error).toEqual({ message: 'Not found', code: 'NOT_FOUND' })
  })

  it('should return INTERNAL_ERROR when HTTP error has no error code', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    })

    const result = await apiGet('/api/test')

    expect(result.data).toBeNull()
    expect(result.error).toEqual({ message: 'Request failed', code: 'INTERNAL_ERROR' })
  })

  it('should return error on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Failed to fetch'))

    const result = await apiGet('/api/test')

    expect(result.data).toBeNull()
    expect(result.error).toEqual({ message: 'Failed to fetch', code: 'INTERNAL_ERROR' })
  })

  it('should return generic message for non-Error throws', async () => {
    mockFetch.mockRejectedValue('unexpected')

    const result = await apiGet('/api/test')

    expect(result.data).toBeNull()
    expect(result.error).toEqual({ message: 'Network error', code: 'INTERNAL_ERROR' })
  })

  it('should return null data when response has explicit data: null', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    })

    const result = await apiGet('/api/test')

    expect(result).toEqual({ data: null, error: null })
  })

  it('should handle non-JSON response gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('Unexpected token < in JSON')),
    })

    const result = await apiGet('/api/test')

    expect(result.data).toBeNull()
    expect(result.error).toEqual({
      message: 'Unexpected token < in JSON',
      code: 'INTERNAL_ERROR',
    })
  })
})

describe('apiPost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return data on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: '1' } }),
    })

    const result = await apiPost<{ id: string }>('/api/test', { name: 'Test' })

    expect(result).toEqual({ data: { id: '1' }, error: null })
  })

  it('should send correct headers and body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    })

    await apiPost('/api/test', { name: 'Test' })

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('should return error on HTTP error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          error: { message: 'Validation failed', code: ErrorCode.VALIDATION_ERROR },
        }),
    })

    const result = await apiPost('/api/test', { name: '' })

    expect(result.data).toBeNull()
    expect(result.error).toEqual({ message: 'Validation failed', code: 'VALIDATION_ERROR' })
  })

  it('should return error on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network timeout'))

    const result = await apiPost('/api/test', { name: 'Test' })

    expect(result.data).toBeNull()
    expect(result.error).toEqual({ message: 'Network timeout', code: 'INTERNAL_ERROR' })
  })

  it('should not send body or Content-Type header when body is undefined', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: '1' } }),
    })

    const result = await apiPost<{ id: string }>('/api/test')

    expect(result).toEqual({ data: { id: '1' }, error: null })
    expect(mockFetch).toHaveBeenCalledWith('/api/test', { method: 'POST' })
  })

  it('should handle non-JSON response gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('Unexpected token < in JSON')),
    })

    const result = await apiPost('/api/test', { name: 'Test' })

    expect(result.data).toBeNull()
    expect(result.error).toEqual({
      message: 'Unexpected token < in JSON',
      code: 'INTERNAL_ERROR',
    })
  })

  it('should send body when body is null (null is not undefined)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    })

    await apiPost('/api/test', null)

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: JSON.stringify(null),
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('should send body when body is empty string', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    })

    await apiPost('/api/test', '')

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: JSON.stringify(''),
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('should send body when body is 0', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    })

    await apiPost('/api/test', 0)

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: JSON.stringify(0),
      headers: { 'Content-Type': 'application/json' },
    })
  })
})
