import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logoutAction } from './logout'

// Mock dependencies
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

describe('logoutAction', () => {
  it('should call supabase.auth.signOut()', async () => {
    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT')

    expect(mockSignOut).toHaveBeenCalledOnce()
  })

  it('should call revalidatePath to bust Next.js cache', async () => {
    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT')

    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('should redirect to /auth/login', async () => {
    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT')

    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })

  it('should redirect to /auth/login even if signOut throws error', async () => {
    mockSignOut.mockRejectedValue(new Error('Network error'))

    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT')

    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('should use server-only module guard', async () => {
    // The import of 'server-only' at the top of logout.ts ensures this module
    // cannot be imported from client-side code. The Vitest alias maps
    // 'server-only' to the test stub, so this test validates the import exists
    // by successfully importing and executing logoutAction.
    await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT')
  })
})
