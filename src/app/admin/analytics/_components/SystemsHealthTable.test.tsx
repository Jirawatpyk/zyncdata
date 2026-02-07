import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SystemsHealthTable from './SystemsHealthTable'
import { createMockSystemHealth, createMockSystemHealthList } from '@/lib/test-utils/mock-factories'

describe('SystemsHealthTable', () => {
  it('renders systems with name, status badge, response time, and last checked', () => {
    const systems = [
      createMockSystemHealth({ id: '1', name: 'Alpha', status: 'online', responseTime: 120, lastCheckedAt: '2026-01-01T00:00:00Z' }),
      createMockSystemHealth({ id: '2', name: 'Beta', status: 'offline', responseTime: null, lastCheckedAt: '2026-01-01T00:00:00Z' }),
    ]

    render(<SystemsHealthTable systems={systems} />)

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('120 ms')).toBeInTheDocument()
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('renders status badges for each system', () => {
    const systems = [
      createMockSystemHealth({ id: '1', name: 'Online Sys', status: 'online' }),
      createMockSystemHealth({ id: '2', name: 'Offline Sys', status: 'offline' }),
    ]

    render(<SystemsHealthTable systems={systems} />)

    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('highlights offline rows with red background', () => {
    const systems = [
      createMockSystemHealth({ id: '1', name: 'Down', status: 'offline' }),
    ]

    render(<SystemsHealthTable systems={systems} />)

    const row = screen.getByTestId('health-row-1')
    expect(row.className).toContain('bg-red-50')
  })

  it('shows empty state when no systems', () => {
    render(<SystemsHealthTable systems={[]} />)

    expect(screen.getByTestId('health-table-empty')).toBeInTheDocument()
    expect(screen.getByText('No systems found.')).toBeInTheDocument()
  })

  it('shows "Never" when lastCheckedAt is null', () => {
    const systems = [
      createMockSystemHealth({ id: '1', name: 'Unchecked', lastCheckedAt: null }),
    ]

    render(<SystemsHealthTable systems={systems} />)

    expect(screen.getByText('Never')).toBeInTheDocument()
  })

  it('renders table with correct structure', () => {
    const systems = createMockSystemHealthList(3)

    render(<SystemsHealthTable systems={systems} />)

    expect(screen.getByTestId('health-table')).toBeInTheDocument()
    // Header columns
    expect(screen.getByText('System')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Response Time')).toBeInTheDocument()
    expect(screen.getByText('Last Checked')).toBeInTheDocument()
  })
})
