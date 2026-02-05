/**
 * API Adapter Guardrail Tests
 *
 * These tests verify INVARIANTS that must never change.
 * Breaking these tests indicates a contract violation that will break consumers.
 */
import { describe, it, expect } from 'vitest'
import { unwrapResponse, ApiError } from './api-adapter'

describe('ApiError Guardrails', () => {
  describe('P0: Critical Invariants', () => {
    it('[P0] ApiError MUST have code property', () => {
      const error = new ApiError('TEST_CODE', 'Test message', 400)
      expect(error).toHaveProperty('code')
      expect(error.code).toBe('TEST_CODE')
    })

    it('[P0] ApiError MUST have message property', () => {
      const error = new ApiError('TEST_CODE', 'Test message', 400)
      expect(error).toHaveProperty('message')
      expect(error.message).toBe('Test message')
    })

    it('[P0] ApiError MUST have status property', () => {
      const error = new ApiError('TEST_CODE', 'Test message', 400)
      expect(error).toHaveProperty('status')
      expect(error.status).toBe(400)
    })

    it('[P0] ApiError MUST extend Error', () => {
      const error = new ApiError('TEST_CODE', 'Test message', 400)
      expect(error).toBeInstanceOf(Error)
    })
  })
})

describe('unwrapResponse Guardrails', () => {
  describe('P0: Critical Invariants', () => {
    it('[P0] unwrapResponse MUST throw ApiError when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            data: null,
            error: { code: 'SERVER_ERROR', message: 'Server error' },
          }),
      } as Response

      await expect(unwrapResponse(mockResponse)).rejects.toBeInstanceOf(ApiError)
    })

    it('[P0] unwrapResponse MUST throw ApiError when body.error is truthy even if res.ok', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: null,
            error: { code: 'VALIDATION_ERROR', message: 'Validation failed' },
          }),
      } as Response

      await expect(unwrapResponse(mockResponse)).rejects.toBeInstanceOf(ApiError)
    })

    it('[P0] unwrapResponse MUST throw with correct error properties from response', async () => {
      const mockResponse = {
        ok: false,
        status: 422,
        json: () =>
          Promise.resolve({
            data: null,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
          }),
      } as Response

      try {
        await unwrapResponse(mockResponse)
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError)
        const apiError = e as ApiError
        expect(apiError.code).toBe('VALIDATION_ERROR')
        expect(apiError.message).toBe('Invalid input')
        expect(apiError.status).toBe(422)
      }
    })
  })

  describe('P1: Important Invariants', () => {
    it('[P1] Default error code MUST be "UNKNOWN" when error has no code', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            data: null,
            error: { message: 'Some error' },
          }),
      } as Response

      try {
        await unwrapResponse(mockResponse)
        expect.fail('Should have thrown')
      } catch (e) {
        expect((e as ApiError).code).toBe('UNKNOWN')
      }
    })

    it('[P1] Default error code MUST be "UNKNOWN" when error is null', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            data: null,
            error: null,
          }),
      } as Response

      try {
        await unwrapResponse(mockResponse)
        expect.fail('Should have thrown')
      } catch (e) {
        expect((e as ApiError).code).toBe('UNKNOWN')
      }
    })

    it('[P1] Default error message MUST be "Unknown error" when error has no message', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            data: null,
            error: { code: 'SOME_ERROR' },
          }),
      } as Response

      try {
        await unwrapResponse(mockResponse)
        expect.fail('Should have thrown')
      } catch (e) {
        expect((e as ApiError).message).toBe('Unknown error')
      }
    })

    it('[P1] Default error message MUST be "Unknown error" when error is null', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            data: null,
            error: null,
          }),
      } as Response

      try {
        await unwrapResponse(mockResponse)
        expect.fail('Should have thrown')
      } catch (e) {
        expect((e as ApiError).message).toBe('Unknown error')
      }
    })
  })
})
