import { describe, it, expect } from 'vitest'
import { unwrapResponse, ApiError } from './api-adapter'

describe('unwrapResponse', () => {
  it('should return data when response is ok', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ data: { id: 1, name: 'Test' }, error: null }),
    } as Response

    const result = await unwrapResponse<{ id: number; name: string }>(mockResponse)

    expect(result).toEqual({ id: 1, name: 'Test' })
  })

  it('should throw ApiError when response is not ok', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: { code: 'SERVER_ERROR', message: 'Internal server error' },
        }),
    } as Response

    await expect(unwrapResponse(mockResponse)).rejects.toThrow(ApiError)
    await expect(unwrapResponse(mockResponse)).rejects.toMatchObject({
      code: 'SERVER_ERROR',
      message: 'Internal server error',
      status: 500,
    })
  })

  it('should throw ApiError when body has error even if response is ok', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: null,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
        }),
    } as Response

    await expect(unwrapResponse(mockResponse)).rejects.toThrow(ApiError)
    await expect(unwrapResponse(mockResponse)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
    })
  })

  it('should use UNKNOWN code when error has no code', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'Bad request' },
        }),
    } as Response

    await expect(unwrapResponse(mockResponse)).rejects.toMatchObject({
      code: 'UNKNOWN',
      message: 'Bad request',
    })
  })

  it('should use default message when error has no message', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: { code: 'UNKNOWN' },
        }),
    } as Response

    await expect(unwrapResponse(mockResponse)).rejects.toMatchObject({
      message: 'Unknown error',
    })
  })

  it('should handle null error object', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: null,
        }),
    } as Response

    await expect(unwrapResponse(mockResponse)).rejects.toMatchObject({
      code: 'UNKNOWN',
      message: 'Unknown error',
      status: 500,
    })
  })
})

describe('ApiError', () => {
  it('should create error with correct properties', () => {
    const error = new ApiError('TEST_ERROR', 'Test message', 400)

    expect(error.code).toBe('TEST_ERROR')
    expect(error.message).toBe('Test message')
    expect(error.status).toBe(400)
    expect(error.name).toBe('ApiError')
    expect(error).toBeInstanceOf(Error)
  })
})
