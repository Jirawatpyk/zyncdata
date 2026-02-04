import { describe, it, expect, vi } from 'vitest'

const mockRedirect = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

describe('RegisterPage', () => {
  it('[P2] should redirect to /auth/login (invitation-only model)', async () => {
    const { default: RegisterPage } = await import('./page')
    RegisterPage()

    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
  })
})
