/**
 * D3: Shared mock factories for test data.
 *
 * Single source of truth for mock objects. When a schema changes
 * (new column, renamed field), update ONLY here instead of 10+ test files.
 */

import type { System } from '@/lib/validations/system'
import type { User } from '@supabase/supabase-js'
import type { AuthResult } from '@/lib/auth/guard'

// ── System ──────────────────────────────────────────────────────────

const SYSTEM_DEFAULTS: System = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  name: 'Test System',
  url: 'https://example.com',
  logoUrl: null,
  description: null,
  status: null,
  responseTime: null,
  displayOrder: 0,
  enabled: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  deletedAt: null,
  lastCheckedAt: null,
}

export function createMockSystem(overrides?: Partial<System>): System {
  return { ...SYSTEM_DEFAULTS, ...overrides }
}

export function createMockSystemList(count: number, overrides?: Partial<System>): System[] {
  return Array.from({ length: count }, (_, i) =>
    createMockSystem({
      id: `system-${i + 1}`,
      name: `System ${i + 1}`,
      url: `https://system-${i + 1}.example.com`,
      displayOrder: i,
      ...overrides,
    }),
  )
}

// ── Auth ────────────────────────────────────────────────────────────

export function createMockAuth(overrides?: Partial<AuthResult>): AuthResult {
  return {
    user: { id: 'user-123', email: 'admin@example.com' } as User,
    role: 'admin',
    ...overrides,
  }
}
