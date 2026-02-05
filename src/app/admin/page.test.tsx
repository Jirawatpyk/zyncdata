import { describe, it, expect, vi } from 'vitest'
import { metadata } from './page'

const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}))

describe('AdminPage', () => {
  it('should redirect to /admin/systems', async () => {
    const { default: AdminPage } = await import('./page')

    AdminPage()

    expect(mockRedirect).toHaveBeenCalledWith('/admin/systems')
  })

  it('should export correct metadata', () => {
    expect(metadata).toEqual({
      title: 'Admin | zyncdata',
    })
  })
})
