import { ErrorCode } from '@/lib/errors/codes'
import type { ApiResponse } from '@/lib/api/types'

export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint)
    const json = await response.json()

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: json.error?.message ?? 'Request failed',
          code: json.error?.code ?? ErrorCode.INTERNAL_ERROR,
        },
      }
    }

    return { data: json.data !== undefined ? json.data : json, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'Network error',
        code: ErrorCode.INTERNAL_ERROR,
      },
    }
  }
}

export async function apiPost<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
  try {
    const options: RequestInit = { method: 'POST' }
    if (body !== undefined) {
      options.body = JSON.stringify(body)
      options.headers = { 'Content-Type': 'application/json' }
    }
    const response = await fetch(endpoint, options)
    const json = await response.json()

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: json.error?.message ?? 'Request failed',
          code: json.error?.code ?? ErrorCode.INTERNAL_ERROR,
        },
      }
    }

    return { data: json.data !== undefined ? json.data : json, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'Network error',
        code: ErrorCode.INTERNAL_ERROR,
      },
    }
  }
}
