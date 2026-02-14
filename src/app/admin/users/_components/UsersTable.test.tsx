import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import UsersTable from './UsersTable'
import { createQueryWrapper } from '@/lib/test-utils'
import { createMockCmsUser, createMockCmsUserList } from '@/lib/test-utils/mock-factories'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('UsersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading skeleton initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))
    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    expect(screen.getByTestId('users-table-loading')).toBeInTheDocument()
  })

  it('should render users table when data loaded', async () => {
    const users = [
      createMockCmsUser({ id: 'u1', email: 'admin@dxt.com', role: 'admin', isConfirmed: true }),
      createMockCmsUser({ id: 'u2', email: 'viewer@dxt.com', role: 'user', isConfirmed: false }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: users, error: null }),
    })

    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('users-table')).toBeInTheDocument()
    })

    expect(screen.getByText('admin@dxt.com')).toBeInTheDocument()
    expect(screen.getByText('viewer@dxt.com')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Invited')).toBeInTheDocument()
  })

  it('should render empty state when no users exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [], error: null }),
    })

    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('users-empty-state')).toBeInTheDocument()
    })

    expect(screen.getByText(/No users found/)).toBeInTheDocument()
  })

  it('should render error state when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: { message: 'Server error', code: 'INTERNAL_ERROR' },
        }),
    })

    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('users-table-error')).toBeInTheDocument()
    })

    expect(screen.getByText(/Failed to load users/)).toBeInTheDocument()
  })

  it('should display user count', async () => {
    const users = createMockCmsUserList(3)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: users, error: null }),
    })

    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByText('3 users')).toBeInTheDocument()
    })
  })

  it('should display singular user count for 1 user', async () => {
    const users = [createMockCmsUser()]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: users, error: null }),
    })

    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByText('1 user')).toBeInTheDocument()
    })
  })

  it('should display "Never" for users who have not logged in', async () => {
    const users = [createMockCmsUser({ lastSignInAt: null })]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: users, error: null }),
    })

    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Never')).toBeInTheDocument()
    })
  })

  it('should display Super Admin role badge', async () => {
    const users = [createMockCmsUser({ role: 'super_admin' })]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: users, error: null }),
    })

    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Super Admin')).toBeInTheDocument()
    })
  })

  it('should render Add User button', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [], error: null }),
    })

    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('add-user-button')).toBeInTheDocument()
    })
  })

  it('should render actions button for other users', async () => {
    const users = [
      createMockCmsUser({ id: 'user-other', email: 'other@dxt.com', role: 'admin' }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: users, error: null }),
    })

    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('user-actions-user-other')).toBeInTheDocument()
    })
  })

  it('should NOT render actions button for current user row', async () => {
    const users = [
      createMockCmsUser({ id: 'current-user-id', email: 'me@dxt.com', role: 'super_admin' }),
      createMockCmsUser({ id: 'user-other', email: 'other@dxt.com', role: 'admin' }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: users, error: null }),
    })

    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('users-table')).toBeInTheDocument()
    })

    // Current user's row should NOT have actions
    expect(screen.queryByTestId('user-actions-current-user-id')).not.toBeInTheDocument()
    // Other user's row SHOULD have actions
    expect(screen.getByTestId('user-actions-user-other')).toBeInTheDocument()
  })

  it('should open dropdown menu with Change Role option', async () => {
    const users = [
      createMockCmsUser({ id: 'user-other', email: 'other@dxt.com', role: 'admin' }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: users, error: null }),
    })

    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('user-actions-user-other')).toBeInTheDocument()
    })

    // Open the dropdown — Radix needs pointerDown in JSDOM
    fireEvent.pointerDown(screen.getByTestId('user-actions-user-other'), { button: 0, pointerId: 1, pointerType: 'mouse' })

    await waitFor(() => {
      expect(screen.getByTestId('change-role-user-other')).toBeInTheDocument()
    })
    expect(screen.getByText('Change Role')).toBeInTheDocument()
  })

  it('should open EditRoleDialog when Change Role clicked', async () => {
    const users = [
      createMockCmsUser({ id: 'user-other', email: 'other@dxt.com', role: 'admin' }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: users, error: null }),
    })

    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('user-actions-user-other')).toBeInTheDocument()
    })

    // Open dropdown — Radix needs pointerDown in JSDOM
    fireEvent.pointerDown(screen.getByTestId('user-actions-user-other'), { button: 0, pointerId: 1, pointerType: 'mouse' })

    await waitFor(() => {
      expect(screen.getByTestId('change-role-user-other')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('change-role-user-other'))

    await waitFor(() => {
      expect(screen.getByTestId('edit-role-dialog')).toBeInTheDocument()
    })
    // Email appears both in table row and dialog
    expect(screen.getAllByText('other@dxt.com').length).toBeGreaterThanOrEqual(2)
  })

  it('should show Reset Password option in dropdown', async () => {
    const users = [
      createMockCmsUser({ id: 'user-other', email: 'other@dxt.com', role: 'admin' }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: users, error: null }),
    })

    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('user-actions-user-other')).toBeInTheDocument()
    })

    fireEvent.pointerDown(screen.getByTestId('user-actions-user-other'), { button: 0, pointerId: 1, pointerType: 'mouse' })

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-user-other')).toBeInTheDocument()
    })
    expect(screen.getByText('Reset Password')).toBeInTheDocument()
  })

  it('should open ResetPasswordDialog when Reset Password clicked', async () => {
    const users = [
      createMockCmsUser({ id: 'user-other', email: 'other@dxt.com', role: 'admin' }),
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: users, error: null }),
    })

    render(<UsersTable currentAuthUserId="current-user-id" />, { wrapper: createQueryWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('user-actions-user-other')).toBeInTheDocument()
    })

    fireEvent.pointerDown(screen.getByTestId('user-actions-user-other'), { button: 0, pointerId: 1, pointerType: 'mouse' })

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-user-other')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('reset-password-user-other'))

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-dialog')).toBeInTheDocument()
    })
  })
})
