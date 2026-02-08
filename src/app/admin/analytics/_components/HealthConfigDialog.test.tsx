import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/lib/admin/queries/health', () => ({
  systemHealthConfigQueryOptions: vi.fn((systemId: string) => ({
    queryKey: ['admin', 'health', 'config', systemId],
    queryFn: vi.fn(),
    enabled: true,
  })),
}))

vi.mock('@/lib/admin/mutations/health', () => ({
  useUpdateHealthConfig: vi.fn(),
}))

import { useUpdateHealthConfig } from '@/lib/admin/mutations/health'
import HealthConfigDialog from './HealthConfigDialog'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('HealthConfigDialog', () => {
  const mockMutateAsync = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockMutateAsync.mockResolvedValue({
      checkInterval: null,
      timeoutThreshold: null,
      failureThreshold: null,
    })

    vi.mocked(useUpdateHealthConfig).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateHealthConfig>)
  })

  it('should render gear icon trigger button', () => {
    render(
      <HealthConfigDialog systemId="sys-1" systemName="Test System" />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByTestId('health-config-trigger-sys-1')).toBeInTheDocument()
    expect(screen.getByText('Health check settings for Test System')).toBeInTheDocument()
  })

  it('should open dialog on trigger click', async () => {
    const user = userEvent.setup()
    render(
      <HealthConfigDialog systemId="sys-1" systemName="Test System" />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('health-config-trigger-sys-1'))

    expect(screen.getByTestId('health-config-dialog')).toBeInTheDocument()
    expect(screen.getByText('Health Check Settings')).toBeInTheDocument()
  })

  it('should render 3 form fields when dialog is open', async () => {
    const user = userEvent.setup()
    render(
      <HealthConfigDialog systemId="sys-1" systemName="Test System" />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('health-config-trigger-sys-1'))

    expect(screen.getByTestId('input-check-interval')).toBeInTheDocument()
    expect(screen.getByTestId('input-timeout-threshold')).toBeInTheDocument()
    expect(screen.getByTestId('input-failure-threshold')).toBeInTheDocument()
  })

  it('should show validation error for check interval below minimum', async () => {
    const user = userEvent.setup()
    render(
      <HealthConfigDialog systemId="sys-1" systemName="Test System" />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('health-config-trigger-sys-1'))

    const intervalInput = screen.getByTestId('input-check-interval')
    await user.type(intervalInput, '10')
    await user.click(screen.getByTestId('save-health-config'))

    await waitFor(() => {
      expect(screen.getByTestId('error-check-interval')).toBeInTheDocument()
    })
  })

  it('should show validation error for timeout threshold below minimum', async () => {
    const user = userEvent.setup()
    render(
      <HealthConfigDialog systemId="sys-1" systemName="Test System" />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('health-config-trigger-sys-1'))

    const timeoutInput = screen.getByTestId('input-timeout-threshold')
    await user.type(timeoutInput, '500')
    await user.click(screen.getByTestId('save-health-config'))

    await waitFor(() => {
      expect(screen.getByTestId('error-timeout-threshold')).toBeInTheDocument()
    })
  })

  it('should show validation error for failure threshold above maximum', async () => {
    const user = userEvent.setup()
    render(
      <HealthConfigDialog systemId="sys-1" systemName="Test System" />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('health-config-trigger-sys-1'))

    const failureInput = screen.getByTestId('input-failure-threshold')
    await user.type(failureInput, '20')
    await user.click(screen.getByTestId('save-health-config'))

    await waitFor(() => {
      expect(screen.getByTestId('error-failure-threshold')).toBeInTheDocument()
    })
  })

  it('should call mutateAsync with form data on valid submit', async () => {
    const user = userEvent.setup()
    render(
      <HealthConfigDialog systemId="sys-1" systemName="Test System" />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('health-config-trigger-sys-1'))

    const intervalInput = screen.getByTestId('input-check-interval')
    await user.type(intervalInput, '120')

    const timeoutInput = screen.getByTestId('input-timeout-threshold')
    await user.type(timeoutInput, '5000')

    const failureInput = screen.getByTestId('input-failure-threshold')
    await user.type(failureInput, '5')

    await user.click(screen.getByTestId('save-health-config'))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        checkInterval: 120,
        timeoutThreshold: 5000,
        failureThreshold: 5,
      })
    })
  })

  it('should set all values to null on "Reset to defaults" click', async () => {
    const user = userEvent.setup()
    render(
      <HealthConfigDialog systemId="sys-1" systemName="Test System" />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('health-config-trigger-sys-1'))

    // Type a value first to make form dirty
    const intervalInput = screen.getByTestId('input-check-interval')
    await user.type(intervalInput, '120')

    // Click reset
    await user.click(screen.getByTestId('reset-to-defaults'))

    // All fields should be empty (null values render as '' via ?? '')
    // Number inputs with empty value display as toHaveValue(null) or toHaveDisplayValue('')
    expect(screen.getByTestId('input-check-interval')).toHaveDisplayValue('')
    expect(screen.getByTestId('input-timeout-threshold')).toHaveDisplayValue('')
    expect(screen.getByTestId('input-failure-threshold')).toHaveDisplayValue('')
  })

  it('should have save button disabled when form is not dirty', async () => {
    const user = userEvent.setup()
    render(
      <HealthConfigDialog systemId="sys-1" systemName="Test System" />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('health-config-trigger-sys-1'))

    expect(screen.getByTestId('save-health-config')).toBeDisabled()
  })

  it('should have save button enabled after typing a value', async () => {
    const user = userEvent.setup()
    render(
      <HealthConfigDialog systemId="sys-1" systemName="Test System" />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('health-config-trigger-sys-1'))

    const intervalInput = screen.getByTestId('input-check-interval')
    await user.type(intervalInput, '120')

    expect(screen.getByTestId('save-health-config')).not.toBeDisabled()
  })

  it('should render helper text with range guidance', async () => {
    const user = userEvent.setup()
    render(
      <HealthConfigDialog systemId="sys-1" systemName="Test System" />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('health-config-trigger-sys-1'))

    expect(screen.getByText(/30s - 24h/)).toBeInTheDocument()
    expect(screen.getByText(/1,000ms - 60,000ms/)).toBeInTheDocument()
    expect(screen.getByText(/1 - 10 consecutive failures/)).toBeInTheDocument()
  })

  it('should render description mentioning system name', async () => {
    const user = userEvent.setup()
    render(
      <HealthConfigDialog systemId="sys-1" systemName="Test System" />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('health-config-trigger-sys-1'))

    expect(screen.getByText(/Configure health check parameters for Test System/)).toBeInTheDocument()
  })
})
