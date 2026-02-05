---
project_name: 'zyncdata'
user_name: 'Jiraw'
date: '2026-02-04'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 147
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Core
- **Next.js 16.x** (App Router ONLY - no Pages Router patterns)
- **React 19.x** (Server Components, Suspense, Streaming)
- **TypeScript 5.x** (strict mode)
- **Tailwind CSS 3.x** (utility-first, mobile-first, JIT)
- **Supabase** (PostgreSQL + PostgREST + Auth + Realtime)
- **Vercel** (Serverless Functions + Edge CDN)

### Key Dependencies
- `shadcn/ui` (New York style, Radix UI) - install via CLI only (`npx shadcn@latest add <component>`), never manually create files in `src/components/ui/`
- `zod` ^3.x - validation schemas in `src/lib/validations/`
- `react-hook-form` ^7.x + `@hookform/resolvers` - form handling
- `@tanstack/react-query` ^5.x - **CMS admin only** (`/admin/` routes). Do NOT import outside admin.
- `@upstash/redis` + `@upstash/ratelimit` - serverless rate limiting (sliding window)
- `@sentry/nextjs` - error tracking
- `@vercel/analytics` - Core Web Vitals monitoring
- `date-fns` - all date operations (no moment.js, no raw Date manipulation)

### Supabase Clients (3 distinct patterns)
- `createServerClient` - for RSC and Route Handlers (server-side)
- `createBrowserClient` - for Client Components (browser-side)
- `createServerClient` with cookie handling - for `middleware.ts`
- Use `@supabase/ssr` ONLY. Never use deprecated `@supabase/auth-helpers-nextjs`.

### Font Loading
- `next/font/google` for Nunito - subsets: `['latin']`, weights: `['400', '600', '700']` only
- No `<link>` tags, no CDN imports, no additional weights

### Testing
- **Vitest** + `@testing-library/react` - unit/integration (NOT Jest)
- **Playwright** + `@axe-core/playwright` - E2E + accessibility
- `size-limit` - bundle size enforcement
- Unit tests co-located as `*.test.ts` next to source files
- E2E tests in `tests/e2e/`

### Type Management
- `src/types/database.ts` - Supabase generated types ONLY (via `supabase gen types typescript`)
- All other types co-located with Zod schemas in `src/lib/validations/`

### Import Rules
- `@/*` import alias for ALL imports - no relative paths (`../../`)
- `middleware.ts` - single file at `src/` root, not a folder

---

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

#### Server vs Client Components
- Server Components are DEFAULT - no directive needed
- Add `'use client'` only when component needs: hooks, event handlers, browser APIs, or React Query
- NEVER add `'use client'` to pages or layouts unless absolutely required
- Prefer passing server data as props to client components over client-side fetching

#### Server Actions
- Mark with `'use server'` in separate files: `src/lib/actions/*.ts`
- NEVER inline `'use server'` inside a client component file
- Use for form handlers and mutations that run on the server

#### Export Conventions
- Components: `export default function ComponentName()`
- Everything else (utils, hooks, schemas, types, constants): named exports only
- No barrel files (`index.ts` re-exports) - import directly from source

#### Type Safety
- `strict: true` in tsconfig - no `any` types allowed
- Use `import type` for type-only imports
- Zod schemas export inferred types: `export type User = z.infer<typeof userSchema>`
- Database types from `@/types/database.ts` for Supabase client only - use Zod-inferred types in app code
- Use `as const satisfies` for config objects - never bare type assertions (`as`)

#### Data Boundary Transformation
- Database (snake_case) <-> TypeScript (camelCase) - transform in data access layer ONLY
- Transform happens in `src/lib/{domain}/` functions (auth, health, content)
- Components and Route Handlers NEVER see snake_case
- Utilities: `toCamelCase<T>()` / `toSnakeCase()` in `@/lib/utils/transform.ts`
- Property-based tests required (fast-check roundtrip verification), 100% coverage

#### API Response Type
- Standard type: `ApiResponse<T> = { data: T | null; error: { message: string; code: ErrorCode } | null }`
- Lives in `@/lib/api/types.ts` (NOT in `src/types/`)
- Error codes from centralized `@/lib/errors/codes.ts` only - no ad-hoc strings

#### Error Handling
- Data/service functions: THROW errors
- Route Handlers: CATCH and wrap in `ApiResponse<T>`
- Client Components: Error boundaries + toast notifications
- Server Components: `error.tsx` convention per route segment
- Never silently swallow errors

#### Environment Variables
- `NEXT_PUBLIC_*` prefix = exposed to browser (safe for client)
- Everything else = server ONLY - never import in `'use client'` files
- `SUPABASE_SERVICE_ROLE_KEY` is server-only - leaking it is a security breach
- Access via `process.env.VARIABLE_NAME` directly - no wrapper objects

#### Async Patterns
- `async/await` everywhere - no raw `.then()` chains
- Server Components can be `async` directly
- Client-side async: React Query (admin) or `useEffect` + state (dashboard)

#### Testing Syntax
- Vitest: `vi.mock()`, `vi.fn()`, `vi.spyOn()` - NOT Jest equivalents
- Server Components: test as async functions returning JSX (no `render()`)
- Client Components: `@testing-library/react` `render()` as normal
- Test files mirror source: `UserCard.test.tsx`, `transform.test.ts`

---

### Framework-Specific Rules (Next.js 16 + React 19 + Supabase)

#### App Router Conventions
- Route groups with parentheses: `(auth)` for public auth pages - NO sidebar/nav layout
- `dashboard/` - health monitoring with main app layout (sidebar + nav)
- `admin/` - CMS admin with admin-specific layout (admin nav)
- Each group has its OWN `layout.tsx` - no single shared layout wrapping everything
- Loading states: `loading.tsx` per route segment (triggers Suspense)
- Error handling: `error.tsx` per route segment (must be `'use client'`)
- Metadata: `export const metadata` in `page.tsx` or `layout.tsx` (server only)

#### Next.js 16 Breaking Changes (CRITICAL)
- `params` and `searchParams` are `Promise`-based in page components:
  ```typescript
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
  }
  ```
- `cookies()` and `headers()` are async: `const cookieStore = await cookies()`
- Agents trained on Next.js 14 patterns WILL get these wrong - always use async versions

#### Component Architecture
- `src/components/ui/` - shadcn/ui primitives (CLI-installed only)
- `src/components/patterns/` - composed UI (StatusBadge, LoadingSpinner, DataTable)
- `src/components/layouts/` - Header, Footer, Navigation, Sidebar
- `app/*/_components/` - route-specific components (co-located)
- Max 10 components per feature folder - refactor into sub-folders if exceeded

#### Domain Module Organization
- `src/lib/{domain}/queries.ts` - read operations (for RSC data fetching)
- `src/lib/{domain}/mutations.ts` - write operations (for Server Actions)
- Keep reads and writes separate - queries for RSC, mutations for actions

#### React Server Components (RSC) Patterns
- Fetch data directly in RSC with `async` functions - no `useEffect`
- Pass fetched data as props to Client Components
- Use `Suspense` with `fallback` for streaming
- Cache with `unstable_cache` or `revalidate` options
- ISR: `export const revalidate = 60` for semi-static content

#### Cache Invalidation (MANDATORY)
- Every mutation MUST call `revalidatePath()` or `revalidateTag()` explicitly
- Without this, users see stale data after mutations
- No exceptions - every Server Action that modifies data = explicit cache bust

#### State Management Layers
1. **Server State (RSC):** Initial loads, SEO content, system lists
2. **Client State (useState/useReducer):** UI state, modals, WebSocket updates, optimistic UI
3. **React Query (CMS admin only):** Complex mutations, version history, rollback flows
- NO global state library (no Redux, no Zustand)

#### React 19 Form Primitives
- `useFormStatus()` - submit button loading states
- `useActionState()` - form state management with Server Actions
- Use these for simple forms (login, search) - no third-party needed
- React Hook Form + Zod for complex multi-field forms only (CMS editor, system config)

#### Navigation Rules
- `next/link` for ALL internal navigation - no `<a>` tags for internal routes
- `useRouter()` ONLY for programmatic navigation after mutations (e.g., redirect after form submit)
- Never use `window.location` or `router.push()` for simple link navigation

#### Image & Dynamic Loading
- `next/image` mandatory for ALL images - no raw `<img>` tags
- Required props: `width`, `height`, `alt` - `priority` on above-the-fold only
- System logos: `width={40} height={40}`
- Heavy client components (rich text editor, charts): `next/dynamic` with `{ ssr: false }`

#### Real-time Architecture
- WebSocket primary connection for health updates via `@/lib/websocket/`
- Polling fallback at 60-second intervals via Supabase query
- Connection status indicator in UI (connected/reconnecting/disconnected)
- Custom hook: `useHealthMonitor()` in `@/lib/hooks/`
- WebSocket events use `domain:action` format with Zod schema validation

#### Supabase Integration
- RLS (Row Level Security) enforced on ALL tables - no exceptions
- Server client MUST have cookie access or RLS returns empty data (silent failure - #1 debug trap)
- Auth state managed via Supabase Auth listeners in root layout
- Database operations go through domain modules in `src/lib/{domain}/`
- Supabase Realtime subscriptions only in Client Components

#### Middleware (src/middleware.ts)
- Auth check: redirect unauthenticated users from protected routes
- Role check: block non-admin users from `/admin/*` routes
- Rate limiting: Upstash integration for auth endpoints
- Matcher config: exclude static files, `_next`, API health checks

---

### Testing Rules

#### Test Pyramid & Coverage
- 70% Unit, 20% Integration, 10% E2E - 80% total coverage target
- Transform layer (`@/lib/utils/transform.ts`): 100% coverage with property-based tests
- Risk-based testing: calculate impact before writing every test (depth scales with impact)

#### Test Commands
- `npm run test` - Vitest (unit + integration)
- `npm run test:e2e` - Playwright
- `npm run test:coverage` - Vitest with coverage report
- `npm run test:a11y` - Playwright accessibility suite
- `npm run story-metrics` - Generate File List from git diff + test counts for story documentation

#### Test Data Factories
- Location: `tests/factories/` with factory functions per domain
- Example: `buildSystem(overrides?: Partial<System>): System`
- Every test uses factories - no inline object literals with made-up data
- Non-negotiable for test maintainability

#### Unit Tests (Vitest)
- Co-located: `UserCard.test.tsx` next to `UserCard.tsx`
- Test file naming: `*.test.ts` / `*.test.tsx` - no `.spec` files
- Use `vi.mock()`, `vi.fn()`, `vi.spyOn()` - never Jest syntax
- `vi.clearAllMocks()` in `beforeEach` - every test must be independent
- Server Components: test as async functions returning JSX
- Client Components: `@testing-library/react` with `render()`
- Zod schemas: test validation rules and edge cases
- Hooks: use `@testing-library/react` `renderHook()`

#### Mock Boundary Chain
- Components mock domain modules (`@/lib/{domain}/queries`)
- Domain modules mock Supabase client (`@/lib/supabase/server`)
- Route Handlers mock domain modules
- NEVER mock Supabase client internals directly from components

#### Naming Conventions
- `describe`: component/function/route name - `describe('UserCard', ...)`, `describe('GET /api/users', ...)`
- `it` blocks: start with "should" - `it('should return user data when authenticated', ...)`
- No `test.skip` or `it.skip` in committed code - fix or delete

#### Minimum Test Cases Per Component
1. Happy path (data renders correctly)
2. Loading state (spinner/skeleton shows)
3. Error state (error message displays)
- Server Actions: validation rejection + success path minimum

#### Async Testing
- Use `findByText()` / `waitFor()` for async-rendered content
- NEVER use `getByText()` for content that appears after async operations
- Playwright E2E: fresh browser context per test - no shared state

#### Integration Tests (Vitest)
- API routes: assert `{ data, error }` wrapper structure on every response
- Supabase queries: test through domain module functions
- Middleware: test auth redirects and rate limiting
- WebSocket: contract tests with Zod schema validation on send/receive

#### E2E Tests (Playwright)
- Location: `tests/e2e/`
- Critical user journeys: login -> MFA -> dashboard, CMS edit -> publish -> rollback
- Accessibility: `@axe-core/playwright` on login, dashboard, CMS, system management pages
- CI fails PR if accessibility violations found

#### Testing Anti-Patterns
- NO snapshot testing (`toMatchSnapshot()`) - test behavior, not snapshots
- NO visual regression testing yet (Chromatic/Percy is future - don't set up)
- NEVER test implementation details - test behavior and outcomes
- NEVER skip accessibility tests on new pages
- Flaky tests are critical technical debt - fix immediately or delete

---

### Code Quality & Style Rules

#### Naming Conventions Summary
- **Database:** snake_case (tables, columns, indexes, functions) - no exceptions
- **TypeScript:** camelCase (variables, functions), PascalCase (components, types, interfaces)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`, `API_BASE_URL`)
- **Enums:** PascalCase name, UPPER_SNAKE_CASE values
- **Custom Hooks:** camelCase with `use` prefix (`useAuth`, `useWebSocket`)
- **Event Handlers:** camelCase with `handle` prefix (`handleSubmit`, `handleUserUpdate`)
- **API Routes:** plural nouns, kebab-case for multi-word (`/api/health-checks`)
- **Query Params:** camelCase (`?userId=123&includeInactive=true`)

#### File Naming (Source Files)
- Components: PascalCase → `UserCard.tsx`
- Hooks: camelCase matching function → `useAuth.ts`, `useHealthMonitor.ts`
- Utils/helpers: camelCase → `transform.ts`, `formatDate.ts`
- Validation schemas: by domain → `user.ts` in `validations/`
- Constants: camelCase → `errorCodes.ts`, `websocketEvents.ts`
- NO kebab-case for source files - kebab-case is for API route folders only

#### Prettier Config (Enforced)
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```
- `prettier-plugin-tailwindcss` auto-sorts Tailwind classes - mandatory

#### ESLint Rules (Enforced)
- `no-param-reassign` - prevent mutations
- `no-console: 'error'` - zero `console.log` in committed code (use Sentry)
- `@typescript-eslint/no-explicit-any` - no `any` types
- `@typescript-eslint/naming-convention` - enforce naming patterns
- `jsx-a11y/*` - accessibility rules (all enabled)
- `local/no-dark-classes` - flags any `dark:` prefixed Tailwind classes (custom rule in `eslint-rules/no-dark-classes.mjs`)

#### Immutability
- All React state updates: spread/map - never mutate directly
- All function parameters treated as immutable - return new objects, never modify inputs
- `setSystems(prev => prev.map(s => s.id === id ? { ...s, status } : s))` - correct
- `systems[0].status = 'down'` - FORBIDDEN

#### Conditional CSS Classes
- Use `cn()` utility from shadcn/ui (`clsx` + `tailwind-merge`) - MANDATORY
- `<div className={cn('base-class', isActive && 'active-class', className)} />`
- NEVER use string concatenation or template literals for conditional classes

#### File Size Guidelines
- Components: < 150 lines - decompose if exceeded
- Utility files: < 200 lines - split by concern if exceeded
- Not a CI block, but a strong guideline for scanability

#### Code Organization
- Feature folder limit: max 10 components - refactor if exceeded
- Cross-feature imports only via `@/lib/` public APIs
- No direct imports between feature folders
- Max nesting: 3 levels deep

#### Comments & Documentation
- **DO comment:** Complex business logic, workarounds (with issue links), RLS policy intent, performance trade-offs
- **DON'T comment:** Self-explanatory code, type info already in TypeScript, orphan TODOs
- **TODO rule:** Must reference GitHub issue - `// TODO(#123): Handle edge case for...`
- **JSDoc:** Public API functions in `src/lib/` modules with `@param` and `@returns` - not every function
- **No orphan TODOs** - `// TODO: fix later` is dead code

#### Accessibility (WCAG 2.1 AA)
- All interactive elements: keyboard navigable
- All images: meaningful `alt` text
- Color contrast: 4.5:1 (text), 3:1 (UI components)
- Touch targets: minimum 44x44px — enforced via `min-h-11` in Button/Input component defaults
- Reduced motion: respect `prefers-reduced-motion`
- ARIA labels on all icon-only buttons

#### Performance Budgets (Enforced in CI)
- JavaScript bundle: < 350KB (gzipped) — size-limit enforced in CI
- CSS bundle: < 50KB (gzipped)
- LCP: < 2.5s, FID: < 100ms, CLS: < 0.1
- System logos: < 10KB each

#### Pre-commit Hooks (Husky)
- `npm run type-check && npm run lint && npm run test`
- Blocks commit if any check fails
- No `--no-verify` bypass allowed

---

### Development Workflow Rules

#### Git Branch Strategy
- `main` - production branch (auto-deploys to Vercel)
- `feature/*` - feature branches from main
- `fix/*` - bug fix branches from main
- `hotfix/*` - urgent production fixes
- Branch naming: `feature/STORY-ID-short-description` (e.g., `feature/AUTH-001-login-flow`)

#### Commit Message Format
- Conventional Commits: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`
- Scope: feature area (`auth`, `dashboard`, `cms`, `health`, `admin`)
- Examples:
  - `feat(auth): add TOTP MFA verification flow`
  - `fix(dashboard): resolve WebSocket reconnection on tab focus`
  - `test(health): add integration tests for health check API`

#### PR Requirements
- All PRs target `main`
- CI must pass: type-check, lint, test, build, bundle size check, a11y
- Vercel creates preview deployment for every PR
- PR description includes: what changed, why, how to test

#### CI/CD Pipeline (GitHub Actions)
```yaml
on: [pull_request]
steps:
  - npm ci
  - npm run lint
  - npm run type-check
  - npm run test
  - npm run build
  - bundle size check (fail if > 150KB JS / 50KB CSS)
  - accessibility check
```

#### Deployment Flow
1. Developer creates PR from feature branch
2. GitHub Actions runs all checks
3. Vercel creates preview deployment
4. PR review + approval
5. Merge to main → Vercel auto-deploys to production
6. Supabase migrations applied separately (manual or webhook)

#### Database Migration Workflow
- Migrations in `supabase/migrations/`
- Generate: `supabase db diff -f migration_name`
- Apply locally: `supabase db push`
- Regenerate types after migration: `npm run db:types`
- NEVER manually edit `src/types/database.ts` - always regenerate

#### Environment Setup
- Local dev: `npm run dev` (Next.js) + `npm run dev:db` (Supabase local)
- `.env.local` for all environment variables (never commit)
- `.env.example` tracked in git with placeholder values

---

### Critical Don't-Miss Rules

#### Anti-Patterns to Avoid
- NEVER use Pages Router patterns (`getServerSideProps`, `getStaticProps`, `_app.tsx`, `_document.tsx`)
- NEVER use `@supabase/auth-helpers-nextjs` - use `@supabase/ssr` only
- NEVER import React Query outside `/admin/` routes
- NEVER use `moment.js` or raw `new Date()` manipulation - use `date-fns`
- NEVER use Redux, Zustand, Jotai, or any global state library
- NEVER use `<img>` tags - use `next/image`
- NEVER use `<a>` tags for internal navigation - use `next/link`
- NEVER use string concatenation for Tailwind classes - use `cn()`
- NEVER return raw data from API routes - always wrap in `{ data, error }`
- NEVER expose snake_case beyond the data access layer
- NEVER use `dark:` Tailwind classes until dark mode is explicitly implemented
- NEVER use array index as `key` prop - always use entity `id`
- NEVER add `generateStaticParams` to auth-gated routes
- NEVER use `export default function handler(req, res)` - use named exports (`GET`, `POST`)

#### Supabase Client Factories (3 files ONLY)
- `src/lib/supabase/server.ts` - server client (RSC, Route Handlers)
- `src/lib/supabase/client.ts` - browser client (Client Components)
- `src/lib/supabase/middleware.ts` - middleware client
- ALL files import from these 3 - no inline `createClient()` calls anywhere else
- No `import { createBrowserClient } from '@supabase/ssr'` in component files

#### Auth Callback Route (MANDATORY)
- `app/auth/callback/route.ts` must exist - exchanges auth code for session
- Without it, email confirmations and OAuth flows break silently
- User clicks email link, gets redirected, nothing happens - silent failure

#### Environment Variable Validation
- `src/lib/env.ts` validates all required env vars with Zod at build time
- Import `env` object instead of raw `process.env` in application code
- Catches missing env vars at build, not at runtime in production

#### Form Patterns
- Simple Server Action forms: `<form action={serverAction}>`
- Client validation first (Zod + React Hook Form): use `onSubmit` with `handleSubmit`, call Server Action inside
- Don't mix both - validation runs twice or not at all

#### Security Rules
- TOTP MFA is mandatory for ALL users - no "skip MFA" option
- `SUPABASE_SERVICE_ROLE_KEY` is server-only - never in client code
- RLS policies on ALL tables - no public access without RLS
- Rate limiting on ALL auth endpoints (login: 5/15min, MFA: 3/5min)
- CSP headers configured in `next.config.js`
- bcrypt cost factor 12 for password hashing
- HTTPS only - no HTTP fallback
- Input validation with Zod on ALL user inputs (client AND server)

#### Performance Gotchas
- `'use client'` on a layout propagates to ALL children - avoid at all costs
- Importing a large library in a Server Component still adds to initial page load
- `next/dynamic` with `{ ssr: false }` for chart libraries, rich text editors
- Supabase `.select('*')` fetches ALL columns - always specify needed columns
- WebSocket reconnection must have exponential backoff - not fixed interval
- Image `priority` prop only on above-the-fold images - overuse hurts LCP

#### Database Gotchas
- After ANY schema change locally, immediately run `supabase db diff -f descriptive_name`
- Don't batch schema changes across multiple features - one migration per change
- All timestamps are `TIMESTAMPTZ` - store UTC, display local with `date-fns`
- Supabase returns ISO 8601 strings - never parse with raw `new Date()`

#### Edge Cases
- WebSocket disconnection: fall back to polling silently, show status indicator
- Supabase RLS empty result: distinguish between "no data" and "no permission" for debugging
- Concurrent CMS edits: last-write-wins with version conflict detection
- Session expiry during form fill: preserve form state, re-authenticate, then submit
- Rate limit hit: show clear user message with retry-after time
- E2E tests must include API error scenarios for every critical page

---

## Key Project Documents

- **Architecture:** `_bmad-output/planning-artifacts/architecture.md`
- **PRD:** `_bmad-output/planning-artifacts/prd.md`
- **Epics & Stories:** `_bmad-output/planning-artifacts/epics.md`
- **UX Design:** `_bmad-output/planning-artifacts/ux-design/README.md` (index → 5 docs)
- **Sprint Status:** `_bmad-output/implementation-artifacts/sprint-status.yaml`
- **React Query Patterns:** `_bmad-output/implementation-artifacts/react-query-patterns.md`
- **CMS Testing Patterns:** `_bmad-output/implementation-artifacts/cms-testing-patterns.md`
- **Security Checklist:** `_bmad-output/implementation-artifacts/security-pre-review-checklist.md`

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-02-04
