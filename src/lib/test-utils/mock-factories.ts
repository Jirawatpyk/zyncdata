/**
 * D3: Shared mock factories for test data.
 *
 * Single source of truth for mock objects. When a schema changes
 * (new column, renamed field), update ONLY here instead of 10+ test files.
 */

import type { System } from '@/lib/validations/system'
import type { User } from '@supabase/supabase-js'
import type { AuthResult } from '@/lib/auth/guard'
import type { HeroContent, PillarsContent, FooterContent } from '@/lib/validations/content'
import type { LandingPageContent } from '@/lib/content/queries'

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
  category: null,
}

export function createMockSystem(overrides?: Partial<System>): System {
  return { ...SYSTEM_DEFAULTS, ...overrides }
}

export function createMockSystemList(count: number, overrides?: Partial<System>): System[] {
  return Array.from({ length: count }, (_, i) =>
    createMockSystem({
      id: `00000000-0000-4000-a000-${String(i + 1).padStart(12, '0')}`,
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

// ── Content ────────────────────────────────────────────────────────

const HERO_DEFAULTS: HeroContent = {
  title: 'Test Title',
  subtitle: 'Test Subtitle',
  description: '<p>Test description</p>',
}

export function createMockHeroContent(overrides?: Partial<HeroContent>): HeroContent {
  return { ...HERO_DEFAULTS, ...overrides }
}

const PILLARS_DEFAULTS: PillarsContent = {
  heading: 'Our Pillars',
  items: [
    {
      title: 'Test Pillar',
      description: 'Test pillar description',
      url: 'https://example.com',
      icon: 'Shield',
    },
  ],
}

export function createMockPillarsContent(overrides?: Partial<PillarsContent>): PillarsContent {
  return { ...PILLARS_DEFAULTS, ...overrides }
}

const FOOTER_DEFAULTS: FooterContent = {
  copyright: '2026 zyncdata. All rights reserved.',
  contactEmail: 'contact@example.com',
  links: [{ label: 'Privacy', url: '/privacy' }],
}

export function createMockFooterContent(overrides?: Partial<FooterContent>): FooterContent {
  return { ...FOOTER_DEFAULTS, ...overrides }
}

export function createMockLandingPageContent(overrides?: Partial<LandingPageContent>): LandingPageContent {
  return {
    hero: createMockHeroContent(),
    pillars: createMockPillarsContent(),
    systems: { heading: 'Our Systems', subtitle: 'Monitoring & management' },
    footer: createMockFooterContent(),
    ...overrides,
  }
}
