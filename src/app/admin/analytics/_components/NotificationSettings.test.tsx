import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotificationSettings from './NotificationSettings'
import { createQueryWrapper } from '@/lib/test-utils'

let mockFetch: ReturnType<typeof vi.fn>

const mockSettings = {
  id: 'settings-1',
  notificationEmails: ['admin@test.com'],
  notifyOnFailure: true,
  notifyOnRecovery: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function mockFetchResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve({ data, error: ok ? null : { message: 'Error', code: 'ERROR' } }),
  }
}

describe('NotificationSettings', () => {
  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders collapsed by default', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))
    render(<NotificationSettings />, { wrapper: createQueryWrapper() })

    expect(screen.getByTestId('notification-settings')).toBeInTheDocument()
    expect(screen.getByText('Notification Settings')).toBeInTheDocument()
    expect(screen.queryByTestId('notification-settings-content')).not.toBeInTheDocument()
  })

  it('expands when toggle is clicked', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue(mockFetchResponse(mockSettings))
    render(<NotificationSettings />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('notification-settings-toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('notification-settings-content')).toBeInTheDocument()
    })
  })

  it('renders email list from settings', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue(mockFetchResponse(mockSettings))
    render(<NotificationSettings />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('notification-settings-toggle'))

    await waitFor(() => {
      expect(screen.getByText('admin@test.com')).toBeInTheDocument()
    })
  })

  it('adds a valid email address', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue(mockFetchResponse(mockSettings))
    render(<NotificationSettings />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('notification-settings-toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('email-input')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('email-input'), 'new@test.com')
    await user.click(screen.getByTestId('add-email-button'))

    expect(screen.getByText('new@test.com')).toBeInTheDocument()
  })

  it('shows error for invalid email', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue(mockFetchResponse(mockSettings))
    render(<NotificationSettings />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('notification-settings-toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('email-input')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('email-input'), 'not-an-email')
    await user.click(screen.getByTestId('add-email-button'))

    expect(screen.getByTestId('email-error')).toHaveTextContent('Please enter a valid email address')
  })

  it('shows error for duplicate email', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue(mockFetchResponse(mockSettings))
    render(<NotificationSettings />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('notification-settings-toggle'))

    await waitFor(() => {
      expect(screen.getByText('admin@test.com')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('email-input'), 'admin@test.com')
    await user.click(screen.getByTestId('add-email-button'))

    expect(screen.getByTestId('email-error')).toHaveTextContent('Email already added')
  })

  it('removes an email address', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue(mockFetchResponse(mockSettings))
    render(<NotificationSettings />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('notification-settings-toggle'))

    await waitFor(() => {
      expect(screen.getByText('admin@test.com')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('remove-email-admin@test.com'))

    expect(screen.queryByText('admin@test.com')).not.toBeInTheDocument()
    expect(screen.getByText(/No recipients configured/)).toBeInTheDocument()
  })

  it('renders toggle switches', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue(mockFetchResponse(mockSettings))
    render(<NotificationSettings />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('notification-settings-toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('notify-failure-switch')).toBeInTheDocument()
    })

    expect(screen.getByTestId('notify-recovery-switch')).toBeInTheDocument()
  })

  it('save button is disabled when no changes', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue(mockFetchResponse(mockSettings))
    render(<NotificationSettings />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('notification-settings-toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('save-notification-settings')).toBeInTheDocument()
    })

    expect(screen.getByTestId('save-notification-settings')).toBeDisabled()
  })

  it('save button is enabled after making changes', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue(mockFetchResponse(mockSettings))
    render(<NotificationSettings />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('notification-settings-toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('email-input')).toBeInTheDocument()
    })

    await user.type(screen.getByTestId('email-input'), 'extra@test.com')
    await user.click(screen.getByTestId('add-email-button'))

    expect(screen.getByTestId('save-notification-settings')).toBeEnabled()
  })

  it('calls PATCH API when save is clicked', async () => {
    const user = userEvent.setup()
    // First call: GET settings query
    mockFetch.mockResolvedValueOnce(mockFetchResponse(mockSettings))
    render(<NotificationSettings />, { wrapper: createQueryWrapper() })

    await user.click(screen.getByTestId('notification-settings-toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('email-input')).toBeInTheDocument()
    })

    // Make a change
    await user.type(screen.getByTestId('email-input'), 'extra@test.com')
    await user.click(screen.getByTestId('add-email-button'))

    // Mock the PATCH response
    mockFetch.mockResolvedValueOnce(mockFetchResponse({
      ...mockSettings,
      notificationEmails: ['admin@test.com', 'extra@test.com'],
    }))
    // Mock the refetch after invalidation
    mockFetch.mockResolvedValueOnce(mockFetchResponse({
      ...mockSettings,
      notificationEmails: ['admin@test.com', 'extra@test.com'],
    }))

    await user.click(screen.getByTestId('save-notification-settings'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/notifications/settings',
        expect.objectContaining({ method: 'PATCH' }),
      )
    })
  })
})
