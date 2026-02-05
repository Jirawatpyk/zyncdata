import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logoutAction } from './logout'

const mockSignOut = vi.fn()
const mockCreateClient = vi.fn()
const mockRedirect = vi.fn()
const mockRevalidatePath = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateClient.mockResolvedValue({
    auth: { signOut: mockSignOut },
  })
  mockSignOut.mockResolvedValue({ error: null })
  mockRedirect.mockImplementation(() => {
    throw new Error('NEXT_REDIRECT')
  })
})

describe('logoutAction — guardrail edge cases', () => {
  it('[P1] should execute signOut before revalidatePath and redirect in correct order', async () => {
    // Given a normal logout flow with call-order tracking
    const callOrder: string[] = []
    mockSignOut.mockImplementation(async () => {
      callOrder.push('signOut')
      return { error: null }
    })
    mockRevalidatePath.mockImplementation(() => {
      callOrder.push('revalidatePath')
    })
    mockRedirect.mockImplementation(() => {
      callOrder.push('redirect')
      throw new Error('NEXT_REDIRECT')
    })

    // When logoutAction is called
    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT')

    // Then the operations should execute in the correct security order
    expect(callOrder).toEqual(['signOut', 'revalidatePath', 'redirect'])
  })

  it('[P1] should propagate error when createClient fails', async () => {
    // Given createClient rejects (e.g., cookie store unavailable in edge runtime)
    mockCreateClient.mockRejectedValue(new Error('Cookie store unavailable'))

    // When logoutAction is called
    await expect(logoutAction()).rejects.toThrow('Cookie store unavailable')

    // Then signOut, revalidatePath, and redirect should NOT have been called
    expect(mockSignOut).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('[P1] should proceed when signOut returns error object without throwing', async () => {
    // Given signOut returns { error: AuthApiError } without throwing
    // (Supabase signOut returns error in response, does not always throw)
    mockSignOut.mockResolvedValue({
      error: { message: 'Session not found', status: 403 },
    })

    // When logoutAction is called
    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT')

    // Then it should still revalidate cache and redirect (error return is ignored by design)
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('[P1] should be idempotent — concurrent calls should all redirect', async () => {
    // Given multiple concurrent logout calls (rapid clicks or retries)
    const results = await Promise.allSettled([
      logoutAction(),
      logoutAction(),
      logoutAction(),
    ])

    // Then all calls should have thrown NEXT_REDIRECT (all succeeded)
    results.forEach((result) => {
      expect(result.status).toBe('rejected')
      expect((result as PromiseRejectedResult).reason.message).toBe('NEXT_REDIRECT')
    })

    // And each call should have independently executed signOut and redirect
    expect(mockSignOut).toHaveBeenCalledTimes(3)
    expect(mockRedirect).toHaveBeenCalledTimes(3)
  })
})
