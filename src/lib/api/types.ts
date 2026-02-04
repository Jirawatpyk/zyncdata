import type { ErrorCodeType } from '@/lib/errors/codes'

export type ApiResponse<T> = {
  data: T | null
  error: { message: string; code: ErrorCodeType } | null
}
