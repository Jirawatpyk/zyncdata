export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ApiErrorResponse {
  code?: string
  message?: string
}

interface ApiResponseBody<T> {
  data: T | null
  error: ApiErrorResponse | null
}

export async function unwrapResponse<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponseBody<T>

  if (!res.ok || body.error) {
    throw new ApiError(
      body.error?.code ?? 'UNKNOWN',
      body.error?.message ?? 'Unknown error',
      res.status,
    )
  }

  return body.data as T
}
