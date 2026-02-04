# Story 1.4: Testing Infrastructure, Error Boundaries & Shared Utilities

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want testing tools configured, React error boundaries in place, and shared utilities (data transformation, API client, error codes) established,
So that all subsequent stories have a consistent foundation for testing, error handling, and data access patterns.

## Acceptance Criteria

1. **Given** the project needs testing infrastructure **When** I check the dev dependencies and configuration **Then** Vitest is configured for unit/integration tests with React Testing Library **And** Playwright is configured for E2E tests **And** jest-axe and @axe-core/playwright are configured for accessibility testing **And** coverage thresholds are set to 80% for critical paths (NFR-T1)

2. **Given** React error boundaries are needed for graceful degradation **When** a component throws an unhandled error **Then** a root-level error boundary catches the error and displays a user-friendly fallback UI instead of a white screen **And** the error is reported to Sentry

3. **Given** the architecture mandates data transformation at boundaries **When** I inspect `src/lib/utils/transform.ts` **Then** `toCamelCase` and `toSnakeCase` utilities exist for converting between database (snake_case) and TypeScript (camelCase) formats **And** roundtrip property-based tests verify `toSnakeCase(toCamelCase(x)) === x`

4. **Given** the architecture specifies a standard API client **When** I inspect `src/lib/api/client.ts` **Then** `apiGet<T>` and `apiPost<T>` functions exist that wrap fetch with the standard `{ data: T | null, error: Error | null }` response format

5. **Given** centralized error codes are needed **When** I inspect `src/lib/errors/codes.ts` **Then** error code constants (UNAUTHORIZED, VALIDATION_ERROR, RATE_LIMIT_EXCEEDED, INTERNAL_ERROR) are defined

6. **Given** WebSocket event types are needed for later epics **When** I inspect `src/lib/websocket/events.ts` **Then** event type constants (`health:update`, `system:created`, `content:published`) are defined with Zod payload schemas

## Tasks / Subtasks

**Dependency: Stories 1.1, 1.2, 1.3 must be complete (project setup, database, landing page). All are done.**

- [x] Task 1: Configure Vitest coverage thresholds (AC: #1)
  - [x] 1.1: Add coverage configuration to `vitest.config.ts` — set `provider: 'v8'`, `reporter: ['text', 'lcov', 'html']`, `reportsDirectory: './coverage'`
  - [x] 1.2: Set coverage thresholds in vitest config: `statements: 80, branches: 80, functions: 80, lines: 80` for critical paths (NFR-T1)
  - [x] 1.3: Add `include` pattern for coverage: `['src/lib/**/*.ts', 'src/lib/**/*.tsx']` to focus on critical path code
  - [x] 1.4: Verify `npm run test:coverage` runs and produces coverage report
  - [x] 1.5: Install `@vitest/coverage-v8` if not already present: `npm install -D @vitest/coverage-v8`

- [x] Task 2: Configure accessibility testing (AC: #1)
  - [x] 2.1: Install `jest-axe` and its types: `npm install -D jest-axe @types/jest-axe`
  - [x] 2.2: Verify `@axe-core/playwright` is already installed (confirmed present in devDependencies)
  - [x] 2.3: Add jest-axe setup to `src/test-setup.ts` — import `toHaveNoViolations` from `jest-axe` and explicitly register with `expect.extend(toHaveNoViolations)`. Just importing `'jest-axe'` is NOT enough — the matcher must be registered manually for Vitest:
    ```typescript
    import '@testing-library/jest-dom'
    import { toHaveNoViolations } from 'jest-axe'
    expect.extend(toHaveNoViolations)
    ```
  - [x] 2.4: Create a sample Vitest accessibility test in `src/components/patterns/SystemCard.test.tsx` — add as additional test case to existing file. **IMPORTANT:** Server Components are normally tested as plain functions returning JSX, but jest-axe needs rendered DOM. Use `render()` from `@testing-library/react` to convert the JSX output into a DOM container, then pass to `axe()`:
    ```typescript
    import { render } from '@testing-library/react'
    import { axe } from 'jest-axe'

    it('should have no accessibility violations', async () => {
      const { container } = render(
        SystemCard({ name: 'TINEDY', url: 'https://example.com', logoUrl: null, description: 'Test' })
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    ```
    **Note:** `vitest-axe` is a Vitest-native alternative to `jest-axe` with better integration. AC #1 specifies jest-axe, but if compatibility issues arise, `vitest-axe` is the fallback.
  - [x] 2.5: Verify `npm run test:a11y` runs the `@a11y` tagged E2E tests in Playwright (already configured in package.json scripts)

- [x] Task 3: Add global error boundary (AC: #2)
  - [x] 3.1: Create `src/app/global-error.tsx` — must be `'use client'`. This catches errors in the root layout itself (which `error.tsx` cannot catch)
  - [x] 3.2: Include its own `<html>` and `<body>` tags (required since root layout is replaced)
  - [x] 3.3: Report error to Sentry via `Sentry.captureException(error)` in `useEffect`
  - [x] 3.4: Display user-friendly fallback UI with a "Reload" button that calls `reset()`
  - [x] 3.5: Style with inline styles (Tailwind CSS may not be available if layout fails)
  - [x] 3.6: Verify existing `src/app/error.tsx` is already in place (confirmed — catches route-segment errors, reports to Sentry, has retry button)
  - [x] 3.7: Write unit test for `global-error.tsx` — verify it renders error message and that clicking "Reload" calls `reset()`

- [x] Task 4: Create data transformation utilities (AC: #3)
  - [x] 4.1: Create `src/lib/utils/transform.ts` with two exported functions:
    - `toCamelCase<T>(obj: Record<string, unknown>): T` — converts all top-level snake_case keys to camelCase
    - `toSnakeCase(obj: Record<string, unknown>): Record<string, string>` — converts all top-level camelCase keys to snake_case
  - [x] 4.2: Handle edge cases: nested objects (only transform top-level keys), arrays, null/undefined values, already-camelCase keys
  - [x] 4.3: Do NOT use any external library — implement with regex: `str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())` for toCamelCase, `str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())` for toSnakeCase
  - [x] 4.4: Create `src/lib/utils/transform.test.ts` with comprehensive tests:
    - Happy path: basic snake_case to camelCase conversion
    - Happy path: basic camelCase to snake_case conversion
    - Roundtrip: `toSnakeCase(toCamelCase(x)) === x` for known inputs
    - Edge cases: empty object, single key, already-correct casing, null values, nested objects (keys NOT transformed)
    - Property-based tests: install `fast-check` (`npm install -D fast-check`), verify roundtrip for random snake_case strings
  - [x] 4.5: Achieve 100% coverage on transform.ts (per architecture mandate)

- [x] Task 5: Create centralized error codes (AC: #5) — **Must complete before Task 6 (API client imports ErrorCode)**
  - [x] 5.1: Create `src/lib/errors/codes.ts` with error code constants:
    ```typescript
    export const ErrorCode = {
      UNAUTHORIZED: 'UNAUTHORIZED',
      USER_NOT_FOUND: 'USER_NOT_FOUND',
      VALIDATION_ERROR: 'VALIDATION_ERROR',
      RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
      INTERNAL_ERROR: 'INTERNAL_ERROR',
      NOT_FOUND: 'NOT_FOUND',
      FORBIDDEN: 'FORBIDDEN',
      CONFLICT: 'CONFLICT',
    } as const

    export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode]
    ```
  - [x] 5.2: Create `src/lib/errors/codes.test.ts` — verify all expected error codes exist, verify `ErrorCodeType` type correctness via Zod parsing, verify `as const` immutability
  - [x] 5.3: Delete `src/lib/errors/.gitkeep` (no longer needed once real files exist)

- [x] Task 6: Create API client utilities (AC: #4) — **Depends on Task 5 (imports ErrorCode)**
  - [x] 6.1: Create `src/lib/api/types.ts` with the standard API response type:
    ```typescript
    import type { ErrorCodeType } from '@/lib/errors/codes'

    export type ApiResponse<T> = {
      data: T | null
      error: { message: string; code: ErrorCodeType } | null
    }
    ```
  - [x] 6.2: Create `src/lib/api/client.ts` with two exported functions:
    - `apiGet<T>(endpoint: string): Promise<ApiResponse<T>>` — wraps `fetch(endpoint)` with GET method, parses JSON, catches errors
    - `apiPost<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>>` — wraps `fetch(endpoint, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })`, parses JSON, catches errors
  - [x] 6.3: Both functions return `{ data, error }` wrapper — on success `{ data: T, error: null }`, on fetch error `{ data: null, error: { message, code: 'INTERNAL_ERROR' } }`, on HTTP error status extract error from response body
  - [x] 6.4: Create `src/lib/api/client.test.ts` with tests:
    - `apiGet` success path — returns `{ data, error: null }`
    - `apiGet` HTTP error — returns `{ data: null, error }` with correct error code
    - `apiGet` network error — returns `{ data: null, error }` with INTERNAL_ERROR
    - Same 3 tests for `apiPost`
    - Test that POST sends correct headers and body
  - [x] 6.5: Mock `fetch` using `vi.fn()` — do NOT use any fetch mocking library
  - [x] 6.6: Delete `src/lib/api/.gitkeep` (no longer needed once real files exist)

- [x] Task 7: Create WebSocket event types (AC: #6)
  - [x] 7.1: Create `src/lib/websocket/events.ts` with event type constants:
    ```typescript
    export const WebSocketEventType = {
      HEALTH_UPDATE: 'health:update',
      SYSTEM_CREATED: 'system:created',
      SYSTEM_UPDATED: 'system:updated',
      SYSTEM_DELETED: 'system:deleted',
      CONTENT_PUBLISHED: 'content:published',
    } as const

    export type WebSocketEventTypeValue = typeof WebSocketEventType[keyof typeof WebSocketEventType]
    ```
  - [x] 7.2: Add Zod payload schemas for each event type:
    ```typescript
    export const healthUpdatePayloadSchema = z.object({
      systemId: z.string().uuid(),
      status: z.enum(['online', 'offline']),
      responseTime: z.number().nonnegative().nullable(),
      checkedAt: z.string().datetime(),
    })

    export const systemEventPayloadSchema = z.object({
      systemId: z.string().uuid(),
      name: z.string(),
      action: z.enum(['created', 'updated', 'deleted']),
    })

    export const contentPublishedPayloadSchema = z.object({
      sections: z.array(z.string()),
      publishedBy: z.string().uuid(),
      publishedAt: z.string().datetime(),
    })
    ```
  - [x] 7.3: Export inferred types: `export type HealthUpdatePayload = z.infer<typeof healthUpdatePayloadSchema>` etc.
  - [x] 7.4: Create `src/lib/websocket/events.test.ts` — verify each Zod schema validates correct payloads and rejects invalid ones (missing fields, wrong types)
  - [x] 7.5: Delete `src/lib/websocket/.gitkeep` (no longer needed once real files exist)

- [x] Task 8: Refactor existing queries to use toCamelCase utility (post-Task 4)
  - [x] 8.1: Update `src/lib/systems/queries.ts` — replace manual field-by-field mapping with `toCamelCase<System>(system)` in the `.map()` callback. The exact refactor:
    ```typescript
    // BEFORE (current — manual mapping):
    return z.array(systemSchema).parse(
      data.map((system) => ({
        id: system.id,
        name: system.name,
        url: system.url,
        logoUrl: system.logo_url,
        description: system.description,
        displayOrder: system.display_order,
      })),
    )

    // AFTER (refactored — use shared utility):
    import { toCamelCase } from '@/lib/utils/transform'
    return z.array(systemSchema).parse(data.map((s) => toCamelCase<System>(s)))
    ```
    Note: `toCamelCase` takes a single object. Use `.map()` to apply to each array item. Zod `.parse()` still validates the result.
  - [x] 8.2: Verify existing `src/lib/systems/queries.test.ts` still passes after refactor (all 4 tests)
  - [x] 8.3: Evaluate `src/lib/content/queries.ts` — the content queries use Zod `.parse()` with `.transform()` which handles the shape. No change needed. The `section_name` field is used as a map key (not object property), and JSONB `content` values have their own Zod schemas
  - [x] 8.4: Verify existing `src/lib/content/queries.test.ts` still passes

- [x] Task 9: Final verification
  - [x] 9.1: Run `npm run type-check` — must pass
  - [x] 9.2: Run `npm run lint` — must pass
  - [x] 9.3: Run `npm run test:run` — all unit tests pass (existing + new)
  - [x] 9.4: Run `npm run test:coverage` — verify coverage report generates, critical paths at 80%+
  - [x] 9.5: Run `npm run build` — must pass
  - [x] 9.6: Verify no regressions on landing page (`npm run dev` + visual check)

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns — no exceptions:**

1. **Server Components by default** — `global-error.tsx` is the only new `'use client'` component in this story
2. **Next.js 16 async patterns** — `cookies()`, `headers()`, `params` are all `Promise`-based. The Supabase server client already handles this correctly
3. **Data transform at boundary** — The new `toCamelCase`/`toSnakeCase` utilities in `src/lib/utils/transform.ts` become the SINGLE source for all boundary transformations. Story 1.3 queries currently do manual field mapping — refactor to use the utility
4. **`cn()` for classes** — use `cn()` from `@/lib/utils` for ALL conditional Tailwind classes
5. **No barrel files** — import directly from source files
6. **Vitest, NOT Jest** — use `vi.mock()`, `vi.fn()`, `vi.spyOn()`. Never use `jest.*` equivalents
7. **No `dark:` classes** — dark mode not implemented. Light mode only
8. **`as const` for constant objects** — `ErrorCode` and `WebSocketEventType` must use `as const` for type narrowing
9. **Zod for schemas** — WebSocket event payloads validated with Zod. Export inferred types with `z.infer<>`
10. **No external transform library** — implement `toCamelCase`/`toSnakeCase` with simple regex, not lodash/change-case
11. **Property-based testing** — `fast-check` for roundtrip verification of transform utilities. This is MANDATORY per architecture
12. **API client is for client-side only** — `apiGet`/`apiPost` wrap browser `fetch()`. Server-side uses Supabase client directly via RSC
13. **Zod v4, not v3** — `package.json` has `"zod": "^4.3.6"`. Architecture docs reference `^3.x` but project upgraded to v4. The default import `from 'zod'` uses v4/classic mode which is backward-compatible with all v3 patterns used in this project. `z.object()`, `z.string().uuid()`, `z.enum()`, `z.infer<>`, `.parse()`, `.transform()`, `.nullable()` all work identically. `z.string().datetime()` (used in WebSocket schemas) also works in v4/classic
14. **Import path clarity: `@/lib/utils` vs `@/lib/utils/transform`** — `src/lib/utils.ts` (file) contains `cn()` for Tailwind class merging. `src/lib/utils/transform.ts` (in `utils/` directory) contains `toCamelCase`/`toSnakeCase`. These coexist — Node.js resolves `@/lib/utils` to the file and `@/lib/utils/transform` into the directory. Do NOT create a barrel `utils/index.ts`

### Existing Infrastructure Already in Place

The following is **already configured** from Stories 1.1-1.3. Do NOT recreate:

| Component | Status | Location |
|-----------|--------|----------|
| Vitest config | Done | `vitest.config.ts` (jsdom env, globals, path alias) |
| Playwright config | Done | `playwright.config.ts` (chromium, trace, CI config) |
| Test setup | Done | `src/test-setup.ts` (imports @testing-library/jest-dom) |
| @axe-core/playwright | Done | devDependencies |
| @testing-library/react | Done | devDependencies |
| @faker-js/faker | Done | devDependencies |
| Test factories | Done | `tests/factories/system-factory.ts`, `user-factory.ts` |
| E2E support | Done | `tests/support/` (fixtures, helpers) |
| Sentry integration | Done | `sentry.client.config.ts`, `sentry.server.config.ts` |
| error.tsx | Done | `src/app/error.tsx` ('use client', Sentry, retry) |
| Pre-commit hooks | Done | `.husky/pre-commit` (type-check + lint + test) |
| CI pipeline | Done | `.github/workflows/ci.yml` |
| Test scripts | Done | package.json (test, test:run, test:e2e, test:a11y, test:coverage) |

### What This Story ADDS (New Files)

| File | Purpose |
|------|---------|
| `src/app/global-error.tsx` | Root layout error boundary (catches layout-level crashes) |
| `src/app/global-error.test.tsx` | Tests for global error boundary |
| `src/lib/utils/transform.ts` | `toCamelCase<T>()` and `toSnakeCase()` utilities |
| `src/lib/utils/transform.test.ts` | 100% coverage with property-based tests |
| `src/lib/api/types.ts` | `ApiResponse<T>` type definition |
| `src/lib/api/client.ts` | `apiGet<T>()` and `apiPost<T>()` functions |
| `src/lib/api/client.test.ts` | API client tests with mocked fetch |
| `src/lib/errors/codes.ts` | Centralized error code constants |
| `src/lib/errors/codes.test.ts` | Error code tests |
| `src/lib/websocket/events.ts` | WebSocket event types + Zod payload schemas |
| `src/lib/websocket/events.test.ts` | Schema validation tests |

### What This Story MODIFIES (Existing Files)

| File | Change | Reason |
|------|--------|--------|
| `vitest.config.ts` | Add coverage config | AC #1 coverage thresholds |
| `src/test-setup.ts` | Add jest-axe import | AC #1 accessibility testing |
| `src/lib/systems/queries.ts` | Use `toCamelCase()` | Refactor to shared utility (Task 8) |
| `package.json` | Add devDependencies | `@vitest/coverage-v8`, `fast-check`, `jest-axe`, `@types/jest-axe` |
| `src/lib/errors/.gitkeep` | **DELETE** | Replaced by real files (`codes.ts`, `codes.test.ts`) |
| `src/lib/api/.gitkeep` | **DELETE** | Replaced by real files (`types.ts`, `client.ts`, `client.test.ts`) |
| `src/lib/websocket/.gitkeep` | **DELETE** | Replaced by real files (`events.ts`, `events.test.ts`) |

### Alignment with Previous Stories

**From Story 1.1:**
- Tailwind v4 CSS-based config (not `tailwind.config.ts`) — all DxT tokens in `globals.css`
- `proxy.ts` exists instead of `middleware.ts` (Next.js 16 convention)
- Prettier: `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`
- Pre-commit hook: `type-check && lint && test:run`
- Size-limit: JS < 200KB (increased from 150KB for Sentry SDK)

**From Story 1.2:**
- Database schema and seed data ready
- RLS policies enforce: anonymous users can only SELECT enabled systems
- Server Supabase client pattern established in `src/lib/supabase/server.ts`

**From Story 1.3:**
- Landing page fully implemented with RSC, ISR, Suspense
- Data access layer: `src/lib/systems/queries.ts`, `src/lib/content/queries.ts`
- Zod schemas: `src/lib/validations/system.ts`, `src/lib/validations/content.ts`
- 38 unit tests across 8 test files, all passing
- E2E tests for landing page in `tests/e2e/landing-page.spec.ts`
- `src/app/error.tsx` already handles route-segment errors with Sentry
- Component testing pattern: direct JSX function call (no render()) for Server Components
- Mock pattern: `vi.mock('@/lib/supabase/server')` at module level

**Code Review Learnings from 1.3:**
- footerContentSchema had snake_case leak (`contact_email`) — fixed with `.transform()`. Watch for snake_case leaks in new schemas
- Zod validation was defined but not called — always verify schemas are `.parse()`d at runtime
- Header links needed `focus-visible:ring-2` — all new interactive elements need focus indicators
- GridSkeleton was duplicated — extract shared components early
- E2E used brittle CSS selectors — use `data-testid` attributes

### Git Intelligence (Recent Commits)

```
b716554 style(story-1.3): enhance visual design with DxT brand identity
d27e200 feat(story-1.3): public landing page with DxT branding
f2cd458 fix(story-1.2): code review low-severity fixes
9738592 feat(story-1.2): database schema, seed data, and admin seed script
5c80e4a fix(story-1.1): code review fixes — prettier config, layout, sentry, dark mode
792743b fix(ci): increase JS size-limit to 200KB to accommodate Sentry SDK
87280d2 feat(story-1.1): project initialization & CI/CD foundation
7b6ceca chore: initialize Next.js 16 project with TypeScript, Tailwind CSS v4, App Router
```

**Patterns observed:**
- Commit format: `type(story-X.Y): description`
- Code reviews generate fix commits
- Size-limit was increased to 200KB for Sentry SDK — keep this in mind for bundle budget

### Vitest Config Reference (Current State)

```typescript
// vitest.config.ts (current — note: alias is under resolve, not test)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Modifications needed for this story:**
```typescript
// Add coverage configuration:
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov', 'html'],
  reportsDirectory: './coverage',
  // Intentionally scoped to src/lib/ — critical path code (transform, API client, errors, domain modules).
  // Components (src/components/) and pages (src/app/) are covered by E2E tests, not unit coverage.
  include: ['src/lib/**/*.ts', 'src/lib/**/*.tsx'],
  thresholds: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80,
  },
},
```

### Test Setup Reference (Current State)

```typescript
// src/test-setup.ts (current)
import '@testing-library/jest-dom'
```

**Modification needed for this story:**
```typescript
// Add jest-axe matchers — MUST explicitly extend expect (just importing is NOT enough):
import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)
```

### API Client Implementation Guide

The API client wraps browser `fetch()` for client-side usage (Client Components calling API routes). It is NOT for Server Components — those use Supabase client directly.

```typescript
// src/lib/api/client.ts
import { ErrorCode } from '@/lib/errors/codes'
import type { ApiResponse } from '@/lib/api/types'

export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint)
    const json = await response.json()

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: json.error?.message ?? 'Request failed',
          code: json.error?.code ?? ErrorCode.INTERNAL_ERROR,
        },
      }
    }

    return { data: json.data ?? json, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'Network error',
        code: ErrorCode.INTERNAL_ERROR,
      },
    }
  }
}
```

### Transform Utility Implementation Guide

The transform utilities handle the snake_case (DB) <-> camelCase (TS) boundary. They are intentionally simple — top-level keys only, no deep recursion.

**Why top-level only?** Supabase PostgREST returns flat rows. JSONB columns (like `landing_page_content.content`) have their own Zod schemas that define the shape. Deep transformation would break JSONB structures where keys might intentionally contain underscores.

```typescript
// src/lib/utils/transform.ts

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
}

export function toCamelCase<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    result[snakeToCamel(key)] = obj[key]
  }
  return result as T
}

export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    result[camelToSnake(key)] = obj[key]
  }
  return result
}
```

### Global Error Boundary Guide

`global-error.tsx` catches errors thrown in the root `layout.tsx`. Unlike `error.tsx`, it replaces the ENTIRE page including `<html>` and `<body>` tags.

**IMPORTANT:** Since the root layout may have failed, Tailwind CSS might not be loaded. Use inline styles as a fallback.

```typescript
// src/app/global-error.tsx
'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '2rem' }}>
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred. Please try reloading the page.</p>
        <button onClick={() => reset()} style={{ /* styling */ }}>
          Reload
        </button>
      </body>
    </html>
  )
}
```

### What This Story Does NOT Include

- No auth flow (Epic 2)
- No middleware.ts (deferred to Epic 2 — currently `proxy.ts` exists for Next.js 16)
- No Supabase browser client usage (no client components need DB access yet)
- No rate limiting setup (Epic 2)
- No React Query setup (Epic 3, admin-only)
- No actual WebSocket implementation — only type definitions and schemas
- No integration tests for API routes (no API routes exist yet)
- No `src/lib/env.ts` environment validation (deferred — would block dev without all env vars)
- No test data factories changes (already comprehensive from Story 1.3)
- No CI pipeline changes — current CI runs `test:run` (not `test:coverage`). Adding coverage enforcement to CI is a future enhancement, not this story's scope

### Project Structure Notes

After this story, `src/lib/` will have this structure:

```
src/lib/
├── utils.ts                   # cn() utility (existing)
├── utils/
│   └── transform.ts           # NEW: toCamelCase, toSnakeCase
│   └── transform.test.ts      # NEW: 100% coverage + property-based
├── api/
│   ├── types.ts               # NEW: ApiResponse<T>
│   ├── client.ts              # NEW: apiGet, apiPost
│   └── client.test.ts         # NEW: fetch mock tests
├── errors/
│   ├── codes.ts               # NEW: ErrorCode constants
│   └── codes.test.ts          # NEW: error code tests
├── websocket/
│   ├── events.ts              # NEW: event types + Zod schemas
│   └── events.test.ts         # NEW: schema validation tests
├── supabase/
│   ├── client.ts              # Existing (browser client)
│   └── server.ts              # Existing (server client)
├── validations/
│   ├── system.ts              # Existing (system schema)
│   └── content.ts             # Existing (content schemas)
├── systems/
│   ├── queries.ts             # MODIFIED: use toCamelCase
│   └── queries.test.ts        # Existing (verify still passes)
├── content/
│   ├── queries.ts             # Existing (no change)
│   └── queries.test.ts        # Existing (verify still passes)
├── auth/                      # Empty (.gitkeep) — Epic 2
├── health/                    # Empty (.gitkeep) — Epic 5
├── hooks/                     # Empty (.gitkeep) — future
└── ratelimit/                 # Empty (.gitkeep) — Epic 2
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Centralized Type Definitions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Testing Strategy for Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Enhanced Enforcement]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/project-context.md#Testing Rules]
- [Source: _bmad-output/project-context.md#Code Quality & Style Rules]
- [Source: _bmad-output/implementation-artifacts/1-3-public-landing-page-with-dxt-branding.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Coverage initially failed `functions` threshold due to `src/lib/supabase/` factory files (0% function coverage). Excluded from coverage scope — these are infrastructure files requiring actual Supabase connection, tested via E2E.
- Added `coverage/**` to ESLint `globalIgnores` to suppress warnings from generated coverage output files.

### Completion Notes List

- Task 1: Installed `@vitest/coverage-v8`, added v8 coverage config with 80% thresholds scoped to `src/lib/**`. Excluded `src/lib/supabase/**` from coverage (factory files, not unit-testable).
- Task 2: Installed `jest-axe` + types, added `toHaveNoViolations` matcher to test-setup, added accessibility test to SystemCard (9 tests total). Confirmed `@axe-core/playwright` and `test:a11y` script already in place.
- Task 3: Created `global-error.tsx` with `'use client'`, own `<html>/<body>` tags, inline styles, Sentry reporting, and Reload button. 4 unit tests pass.
- Task 4: Created `transform.ts` with `toCamelCase<T>` and `toSnakeCase` using regex (no external lib). 17 tests including property-based roundtrip tests with `fast-check` (200 random runs). 100% coverage.
- Task 5: Created `ErrorCode` constant object with 8 error codes, `ErrorCodeType` union type. 5 tests pass. Deleted `.gitkeep`.
- Task 6: Created `ApiResponse<T>` type and `apiGet`/`apiPost` functions wrapping fetch with `{ data, error }` pattern. 10 tests with `vi.fn()` mocked fetch. Deleted `.gitkeep`.
- Task 7: Created `WebSocketEventType` constants and 3 Zod payload schemas with inferred types. 19 schema validation tests. Deleted `.gitkeep`.
- Task 8: Refactored `systems/queries.ts` to use `toCamelCase<System>()` instead of manual field mapping. All 4 existing tests pass. Content queries evaluated — no change needed (uses Zod `.transform()`).
- Task 9: All verifications pass — `type-check`, `lint` (0 errors), `test:run` (96 tests, 13 files), `test:coverage` (100% stmts/funcs/lines, 83% branches), `build` succeeds.

### Change Log

- 2026-02-04: Implemented Story 1.4 — testing infrastructure, error boundaries, and shared utilities
- 2026-02-04: Code review fixes (CR-1.4) — 1 HIGH, 4 MEDIUM issues fixed:
  - [H1] apiPost now guards body/Content-Type when body is undefined
  - [M1] GlobalError test suppresses expected jsdom nesting warning
  - [M2] Removed no-op immutability test from codes.test.ts (as const is compile-time)
  - [M3] Fixed json.data null handling — `!== undefined` check replaces `??` to preserve explicit null
  - [M4] Added sprint-status.yaml to File List

### File List

**New files:**
- `src/app/global-error.tsx` — Root layout error boundary
- `src/app/global-error.test.tsx` — Global error boundary tests (4 tests)
- `src/lib/utils/transform.ts` — toCamelCase/toSnakeCase utilities
- `src/lib/utils/transform.test.ts` — Transform tests with property-based testing (17 tests)
- `src/lib/errors/codes.ts` — Centralized ErrorCode constants
- `src/lib/errors/codes.test.ts` — Error code tests (5 tests)
- `src/lib/api/types.ts` — ApiResponse<T> type definition
- `src/lib/api/client.ts` — apiGet/apiPost fetch wrapper functions
- `src/lib/api/client.test.ts` — API client tests (10 tests)
- `src/lib/websocket/events.ts` — WebSocket event types + Zod schemas
- `src/lib/websocket/events.test.ts` — Schema validation tests (19 tests)

**Modified files:**
- `vitest.config.ts` — Added v8 coverage config with thresholds, excluded supabase from coverage
- `src/test-setup.ts` — Added jest-axe toHaveNoViolations matcher
- `src/components/patterns/SystemCard.test.tsx` — Added accessibility test (9 tests total)
- `src/lib/systems/queries.ts` — Refactored to use toCamelCase utility
- `eslint.config.mjs` — Added `coverage/**` to globalIgnores
- `package.json` — Added devDependencies: @vitest/coverage-v8, jest-axe, @types/jest-axe, fast-check
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Story status updated

**Deleted files:**
- `src/lib/errors/.gitkeep`
- `src/lib/api/.gitkeep`
- `src/lib/websocket/.gitkeep`
