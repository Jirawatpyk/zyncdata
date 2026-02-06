/**
 * D3: Shared mock factories for test data.
 *
 * Single source of truth for mock objects. When a schema changes
 * (new column, renamed field), update ONLY here instead of 10+ test files.
 */

import type { System } from '@/lib/validations/system'
import type { HealthCheck } from '@/lib/validations/health'
import type { User } from '@supabase/supabase-js'
import type { AuthResult } from '@/lib/auth/guard'
import type { HeroContent, PillarsContent, FooterContent, ThemeContent } from '@/lib/validations/content'
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
  consecutiveFailures: 0,
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

// ── Health Check ───────────────────────────────────────────────────

const HEALTH_CHECK_DEFAULTS: HealthCheck = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  systemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  status: 'success',
  responseTime: 150,
  errorMessage: null,
  checkedAt: '2026-01-01T00:00:00Z',
}

export function createMockHealthCheck(overrides?: Partial<HealthCheck>): HealthCheck {
  return { ...HEALTH_CHECK_DEFAULTS, ...overrides }
}

export function createMockHealthCheckList(count: number, overrides?: Partial<HealthCheck>): HealthCheck[] {
  return Array.from({ length: count }, (_, i) =>
    createMockHealthCheck({
      id: `00000000-0000-4000-b000-${String(i + 1).padStart(12, '0')}`,
      checkedAt: new Date(Date.now() - i * 300_000).toISOString(),
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

// ── Theme ────────────────────────────────────────────────────────

const THEME_DEFAULTS: ThemeContent = {
  colorScheme: 'dxt-default',
  font: 'nunito',
  logoUrl: null,
  faviconUrl: null,
}

export function createMockThemeContent(overrides?: Partial<ThemeContent>): ThemeContent {
  return { ...THEME_DEFAULTS, ...overrides }
}

export function createMockLandingPageContent(overrides?: Partial<LandingPageContent>): LandingPageContent {
  return {
    hero: createMockHeroContent(),
    pillars: createMockPillarsContent(),
    systems: { heading: 'Our Systems', subtitle: 'Monitoring & management' },
    footer: createMockFooterContent(),
    theme: createMockThemeContent(),
    ...overrides,
  }
}
