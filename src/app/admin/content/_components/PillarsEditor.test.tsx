import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PillarsEditor from './PillarsEditor'
import { createQueryWrapper } from '@/lib/test-utils'
import { createMockPillarsContent } from '@/lib/test-utils/mock-factories'

vi.mock('@/lib/admin/mutations/content', () => ({
  useUpdateSection: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
}))

const Wrapper = createQueryWrapper()

function renderEditor(overrides?: Partial<Parameters<typeof PillarsEditor>[0]>) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    content: createMockPillarsContent(),
  }
  return render(<PillarsEditor {...defaultProps} {...overrides} />, { wrapper: Wrapper })
}

describe('PillarsEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders pillar items list', () => {
    const content = createMockPillarsContent({
      items: [
        { title: 'P1', description: 'D1', url: null },
        { title: 'P2', description: 'D2', url: null },
      ],
    })
    renderEditor({ content })

    expect(screen.getByTestId('pillar-item-0')).toBeInTheDocument()
    expect(screen.getByTestId('pillar-item-1')).toBeInTheDocument()
  })

  it('renders heading input with pre-populated data', () => {
    const content = createMockPillarsContent({ heading: 'Custom Heading' })
    renderEditor({ content })

    expect(screen.getByTestId('pillars-heading-input')).toHaveValue('Custom Heading')
  })

  it('adds a new pillar when Add Pillar is clicked', async () => {
    const user = userEvent.setup()
    renderEditor()

    // Initially 1 pillar (from mock factory)
    expect(screen.getByTestId('pillar-item-0')).toBeInTheDocument()

    await user.click(screen.getByTestId('add-pillar-button'))

    await waitFor(() => {
      expect(screen.getByTestId('pillar-item-1')).toBeInTheDocument()
    })
  })

  it('removes a pillar when remove is clicked (if more than 1)', async () => {
    const user = userEvent.setup()
    const content = createMockPillarsContent({
      items: [
        { title: 'P1', description: 'D1', url: null },
        { title: 'P2', description: 'D2', url: null },
      ],
    })
    renderEditor({ content })

    expect(screen.getByTestId('pillar-item-1')).toBeInTheDocument()

    await user.click(screen.getByTestId('remove-pillar-1'))

    await waitFor(() => {
      expect(screen.queryByTestId('pillar-item-1')).not.toBeInTheDocument()
    })
  })

  it('does not show remove button when only 1 pillar exists', () => {
    renderEditor()

    expect(screen.queryByTestId('remove-pillar-0')).not.toBeInTheDocument()
  })

  it('calls onOpenChange(false) when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderEditor({ onOpenChange })

    await user.click(screen.getByTestId('pillars-cancel-button'))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
