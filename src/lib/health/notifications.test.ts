import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock server-only (must be before any imports that use it)
vi.mock('server-only', () => ({}))

// Mock Resend
const mockSend = vi.fn()
vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = { send: mockSend }
    },
  }
})

// Mock Supabase service client
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockLogInsert = vi.fn()

const mockSupabaseClient = {
  from: mockFrom,
}

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => mockSupabaseClient),
}))

import { sendFailureNotification, sendRecoveryNotification } from './notifications'

function setupNotificationSettingsQuery(settings: {
  notification_emails: string[]
  notify_on_failure: boolean
  notify_on_recovery: boolean
} | null) {
  // notification_settings query
  mockFrom.mockImplementation((table: string) => {
    if (table === 'notification_settings') {
      return {
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: settings, error: null }),
          }),
        }),
      }
    }
    if (table === 'health_checks') {
      return {
        select: mockSelect,
      }
    }
    if (table === 'notification_log') {
      return {
        insert: mockLogInsert,
      }
    }
    return { select: vi.fn(), insert: vi.fn() }
  })

  // health_checks query chain (for last successful check)
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockImplementation(() => ({ eq: mockEq, order: mockOrder }))
  mockOrder.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({
    maybeSingle: vi.fn().mockResolvedValue({ data: { checked_at: '2026-01-01T00:00:00Z' }, error: null }),
  })
}

describe('notifications', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv, RESEND_API_KEY: 're_test_key' }
    mockSend.mockResolvedValue({ data: { id: 'test-email-id' }, error: null })
    mockLogInsert.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('sendFailureNotification', () => {
    const failurePayload = {
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      systemName: 'Test System',
      systemUrl: 'https://example.com',
      errorMessage: 'Connection refused',
      failureCount: 3,
    }

    it('sends failure email to configured recipients', async () => {
      setupNotificationSettingsQuery({
        notification_emails: ['admin@test.com'],
        notify_on_failure: true,
        notify_on_recovery: true,
      })

      await sendFailureNotification(failurePayload, mockSupabaseClient as never)

      expect(mockSend).toHaveBeenCalledTimes(1)
      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.from).toBe('onboarding@resend.dev')
      expect(callArgs.to).toEqual(['admin@test.com'])
      expect(callArgs.subject).toBe('[ALERT] System Offline: Test System')
      expect(callArgs.html).toContain('Test System')
      expect(callArgs.html).toContain('Connection refused')

      // Verify notification audit log
      expect(mockLogInsert).toHaveBeenCalledTimes(1)
      expect(mockLogInsert).toHaveBeenCalledWith(expect.objectContaining({
        system_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        notification_type: 'failure',
        status: 'sent',
      }))
    })

    it('sends to multiple recipients', async () => {
      setupNotificationSettingsQuery({
        notification_emails: ['admin1@test.com', 'admin2@test.com'],
        notify_on_failure: true,
        notify_on_recovery: true,
      })

      await sendFailureNotification(failurePayload, mockSupabaseClient as never)

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend.mock.calls[0][0].to).toEqual(['admin1@test.com', 'admin2@test.com'])
    })

    it('skips when notify_on_failure is false', async () => {
      setupNotificationSettingsQuery({
        notification_emails: ['admin@test.com'],
        notify_on_failure: false,
        notify_on_recovery: true,
      })

      await sendFailureNotification(failurePayload, mockSupabaseClient as never)

      expect(mockSend).not.toHaveBeenCalled()
    })

    it('skips when no recipients configured', async () => {
      setupNotificationSettingsQuery({
        notification_emails: [],
        notify_on_failure: true,
        notify_on_recovery: true,
      })

      await sendFailureNotification(failurePayload, mockSupabaseClient as never)

      expect(mockSend).not.toHaveBeenCalled()
    })

    it('skips when no notification settings exist', async () => {
      setupNotificationSettingsQuery(null)

      await sendFailureNotification(failurePayload, mockSupabaseClient as never)

      expect(mockSend).not.toHaveBeenCalled()
    })

    it('skips when RESEND_API_KEY is not set', async () => {
      delete process.env.RESEND_API_KEY

      await sendFailureNotification(failurePayload, mockSupabaseClient as never)

      expect(mockSend).not.toHaveBeenCalled()
    })

    it('handles Resend API error gracefully', async () => {
      setupNotificationSettingsQuery({
        notification_emails: ['admin@test.com'],
        notify_on_failure: true,
        notify_on_recovery: true,
      })
      mockSend.mockResolvedValue({ data: null, error: { message: 'Rate limited' } })

      // Should not throw
      await expect(sendFailureNotification(failurePayload, mockSupabaseClient as never)).resolves.toBeUndefined()
    })

    it('handles Resend SDK exception gracefully', async () => {
      setupNotificationSettingsQuery({
        notification_emails: ['admin@test.com'],
        notify_on_failure: true,
        notify_on_recovery: true,
      })
      mockSend.mockRejectedValue(new Error('Network error'))

      // Should not throw
      await expect(sendFailureNotification(failurePayload, mockSupabaseClient as never)).resolves.toBeUndefined()
    })
  })

  describe('sendRecoveryNotification', () => {
    const recoveryPayload = {
      systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      systemName: 'Test System',
      systemUrl: 'https://example.com',
      responseTime: 150,
    }

    it('sends recovery email to configured recipients', async () => {
      setupNotificationSettingsQuery({
        notification_emails: ['admin@test.com'],
        notify_on_failure: true,
        notify_on_recovery: true,
      })

      await sendRecoveryNotification(recoveryPayload, mockSupabaseClient as never)

      expect(mockSend).toHaveBeenCalledTimes(1)
      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.from).toBe('onboarding@resend.dev')
      expect(callArgs.to).toEqual(['admin@test.com'])
      expect(callArgs.subject).toBe('[RESOLVED] System Online: Test System')
      expect(callArgs.html).toContain('ONLINE (Recovered)')
      expect(callArgs.html).toContain('150ms')

      // Verify notification audit log
      expect(mockLogInsert).toHaveBeenCalledTimes(1)
      expect(mockLogInsert).toHaveBeenCalledWith(expect.objectContaining({
        system_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        notification_type: 'recovery',
        status: 'sent',
      }))
    })

    it('skips when notify_on_recovery is false', async () => {
      setupNotificationSettingsQuery({
        notification_emails: ['admin@test.com'],
        notify_on_failure: true,
        notify_on_recovery: false,
      })

      await sendRecoveryNotification(recoveryPayload, mockSupabaseClient as never)

      expect(mockSend).not.toHaveBeenCalled()
    })

    it('skips when no recipients configured', async () => {
      setupNotificationSettingsQuery({
        notification_emails: [],
        notify_on_failure: true,
        notify_on_recovery: true,
      })

      await sendRecoveryNotification(recoveryPayload, mockSupabaseClient as never)

      expect(mockSend).not.toHaveBeenCalled()
    })
  })
})
