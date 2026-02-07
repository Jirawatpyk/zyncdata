import { describe, it, expect, vi } from 'vitest'
import { isRedirectError } from 'next/dist/client/components/redirect-error'

vi.mock('next/navigation', async (importActual) => {
  const actual = await importActual<typeof import('next/navigation')>()
  return { ...actual }
})

import RegisterPage from './page'

describe('RegisterPage', () => {
  it('[P2] should redirect to /auth/login (invitation-only model)', async () => {
    try {
      RegisterPage()
      expect.unreachable('Should have thrown a redirect error')
    } catch (err) {
      expect(isRedirectError(err)).toBe(true)
    }
  })
})
