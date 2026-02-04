# Story 1.1: Project Initialization & CI/CD Foundation

Status: ready-for-dev

## Story

As a developer,
I want the Next.js project initialized with all core dependencies, folder structure, and CI/CD pipeline,
so that the development environment is ready for feature implementation.

## Acceptance Criteria

1. **Given** no project exists **When** the initialization commands are executed **Then** a Next.js app is created with TypeScript, Tailwind CSS v4, ESLint, App Router, src directory, and `@/*` import alias

2. **Given** the project is initialized **When** I check installed dependencies **Then** @supabase/supabase-js, @supabase/ssr, shadcn/ui (New York style), Zod, React Hook Form, @vercel/analytics, and Sentry are installed **And** dev dependencies include Vitest, Playwright, Husky, Prettier, and size-limit

3. **Given** the project folder structure **When** I inspect the src directory **Then** it follows the architecture specification: app/, components/ui/, components/patterns/, components/layouts/, lib/, types/, and middleware.ts

4. **Given** DxT design tokens are configured **When** I inspect the CSS `@theme` block in globals.css **Then** brand colors (#41B9D5, #5371FF, #6CE6E9), Nunito font family, and responsive breakpoints are defined

5. **Given** the project is pushed to GitHub **When** a pull request is created **Then** GitHub Actions runs lint, type-check, test, and build checks

6. **Given** the project is connected to Vercel **When** code is pushed to main **Then** auto-deployment to production occurs and preview deployments are created per PR

7. **Given** pre-commit hooks are configured **When** a developer attempts to commit **Then** Husky runs type-check and lint before allowing the commit

## Tasks / Subtasks

**CRITICAL: Execute tasks in this order. Tasks have dependencies noted below.**

- [ ] Task 1: Initialize Next.js Project (AC: #1)
  - [ ] 1.1: Navigate to the PARENT directory of the intended project location
  - [ ] 1.2: Run `npx create-next-app@latest zyncdata` with interactive prompts selecting: TypeScript, ESLint, Tailwind CSS, src directory, App Router, `@/*` import alias
  - [ ] 1.3: **IMPORTANT:** If the `zyncdata/` directory already exists with planning artifacts (like `_bmad-output/`), either: (a) run from a clean location and copy artifacts in after, OR (b) use `npx create-next-app@latest .` from inside the existing directory to scaffold into it. Do NOT create a nested `zyncdata/zyncdata/` structure.
  - [ ] 1.4: Verify project builds and runs with `npm run dev`
  - [ ] 1.5: Initialize git repository and create initial commit

- [ ] Task 2: Install Production Dependencies (AC: #2) — depends on Task 1
  - [ ] 2.1: Install Supabase packages: `npm install @supabase/supabase-js @supabase/ssr`
  - [ ] 2.2: Install UI/form packages: `npm install zod react-hook-form @hookform/resolvers`
  - [ ] 2.3: Install state management: `npm install @tanstack/react-query`
  - [ ] 2.4: Install rate limiting: `npm install @upstash/redis @upstash/ratelimit`
  - [ ] 2.5: Install monitoring: `npm install @vercel/analytics`
  - [ ] 2.6: Install utilities: `npm install date-fns`

- [ ] Task 3: Install Dev Dependencies (AC: #2) — depends on Task 1
  - [ ] 3.1: Install testing: `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @axe-core/playwright`
  - [ ] 3.2: Install E2E: `npm install -D @playwright/test` then `npx playwright install`
  - [ ] 3.3: Install code quality: `npm install -D prettier eslint-config-prettier`
  - [ ] 3.4: Install git hooks: `npm install -D husky`
  - [ ] 3.5: Install bundle analysis: `npm install -D size-limit @size-limit/preset-app`

- [ ] Task 4: Initialize shadcn/ui (AC: #2) — depends on Task 1, run BEFORE Task 7
  - [ ] 4.1: Run `npx shadcn@latest init` with: New York style, Neutral base color, CSS variables enabled, lucide icon library, RSC: Yes
  - [ ] 4.2: Verify `components.json` is correctly configured with aliases matching project structure
  - [ ] 4.3: **NOTE:** shadcn/ui init will modify `globals.css` and may create/modify tailwind config. Do Task 7 (design tokens) AFTER this step to avoid being overwritten.

- [ ] Task 5: Initialize Supabase CLI (AC: #1) — depends on Task 1
  - [ ] 5.1: Run `npx supabase init` to create `supabase/` directory
  - [ ] 5.2: Verify `supabase/migrations/` directory exists

- [ ] Task 6: Initialize Sentry (AC: #2) — depends on Task 1
  - [ ] 6.1: **Option A (Sentry account exists):** Run `npx @sentry/wizard@latest -i nextjs` — this is interactive and will ask for: Sentry org, project name, and auth token. Follow the prompts. It auto-generates config files and wraps `next.config.ts`.
  - [ ] 6.2: **Option B (No Sentry account yet):** Install manually with `npm install @sentry/nextjs`, then create placeholder config files (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) with DSN from env var. Wrap `next.config.ts` with `withSentryConfig()` manually. The wizard can be run later when the Sentry project is created.
  - [ ] 6.3: Verify these files exist after setup: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
  - [ ] 6.4: Verify `next.config.ts` is wrapped with Sentry instrumentation
  - [ ] 6.5: Add `NEXT_PUBLIC_SENTRY_DSN` to `.env.local.example` (created in Task 12)

- [ ] Task 7: Configure DxT Design Tokens (AC: #4) — depends on Task 4 (shadcn/ui init)
  - [ ] 7.1: Add DxT brand colors to `@theme` block in `src/app/globals.css` (see Tailwind v4 config below)
  - [ ] 7.2: Configure Nunito font family via `next/font/google` in `src/app/layout.tsx`
  - [ ] 7.3: Add Nunito font variable `--font-nunito` to `@theme` block
  - [ ] 7.4: Verify DxT CSS custom properties integrate with shadcn/ui theme variables
  - [ ] 7.5: Responsive breakpoints are Tailwind v4 defaults (640/768/1024/1280/1536px) — no custom config needed

- [ ] Task 8: Create Project Folder Structure (AC: #3) — depends on Task 4
  - [ ] 8.1: Create route group directories: `src/app/(auth)/`, `src/app/dashboard/`, `src/app/admin/_components/`, `src/app/api/`
  - [ ] 8.2: Create component directories: `src/components/patterns/`, `src/components/layouts/`, `src/components/providers/` (ui/ created by shadcn)
  - [ ] 8.3: Create lib domain directories: `src/lib/api/`, `src/lib/auth/`, `src/lib/health/`, `src/lib/content/`
  - [ ] 8.4: Create lib infrastructure directories: `src/lib/supabase/`, `src/lib/validations/`, `src/lib/utils/`, `src/lib/hooks/`, `src/lib/websocket/`, `src/lib/errors/`, `src/lib/ratelimit/`
  - [ ] 8.5: Create `src/types/database.ts` placeholder (empty export)
  - [ ] 8.6: Create `tests/e2e/` directory
  - [ ] 8.7: Add `.gitkeep` files to empty directories to preserve structure in git

- [ ] Task 9: Configure Supabase Client Utilities — depends on Task 8
  - [ ] 9.1: Create `src/lib/supabase/server.ts` with createClient() for Server Components (see code below)
  - [ ] 9.2: Create `src/lib/supabase/client.ts` with createClient() for Browser Components (see code below)

- [ ] Task 10: Create Middleware Placeholder — depends on Task 8
  - [ ] 10.1: Create `src/middleware.ts` with matcher config and placeholder for auth (see code below)

- [ ] Task 11: Configure Security Headers in next.config.ts — depends on Task 6
  - [ ] 11.1: Add security headers configuration to `next.config.ts`: CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy
  - [ ] 11.2: Ensure Sentry wrapping is preserved when modifying next.config.ts

- [ ] Task 12: Configure Environment & Tooling (AC: #1, #2)
  - [ ] 12.1: Create `.env.local.example` with ALL environment variables documented (see env vars section below)
  - [ ] 12.2: Add these entries to `.gitignore` (beyond Next.js defaults):
    ```
    # Environment
    .env.local
    .env*.local

    # Testing
    coverage/
    playwright-report/
    test-results/

    # Supabase
    .supabase/

    # Sentry
    .sentryclirc
    ```
  - [ ] 12.3: Configure Prettier: `.prettierrc` with `{ "semi": true, "singleQuote": true, "tabWidth": 2, "trailingComma": "es5" }`
  - [ ] 12.4: Update ESLint config to extend `eslint-config-prettier` (prevents ESLint/Prettier conflicts)

- [ ] Task 13: Configure Package.json Scripts — depends on Tasks 1-6
  - [ ] 13.1: Verify/add ALL required scripts to `package.json`:
    ```json
    {
      "dev": "next dev --turbopack",
      "build": "next build",
      "start": "next start",
      "lint": "next lint",
      "type-check": "tsc --noEmit",
      "test": "vitest",
      "test:run": "vitest run",
      "test:e2e": "playwright test",
      "test:coverage": "vitest run --coverage",
      "format": "prettier --write .",
      "format:check": "prettier --check .",
      "size": "size-limit"
    }
    ```
  - [ ] 13.2: **CRITICAL:** `type-check` script does NOT exist by default — must be added manually. CI and Husky depend on it.

- [ ] Task 14: Configure Testing Infrastructure (AC: #2) — depends on Task 13
  - [ ] 14.1: Create `vitest.config.ts` (see Vitest config code below in Dev Notes)
  - [ ] 14.2: Create `src/test-setup.ts` with `import '@testing-library/jest-dom'`
  - [ ] 14.3: Create `playwright.config.ts` with base URL `http://localhost:3000` and webServer config
  - [ ] 14.4: Add `size-limit` configuration to `package.json` (JS < 150KB, CSS < 50KB gzipped)
  - [ ] **SCOPE NOTE:** Story 1.1 creates MINIMAL configs so test scripts don't crash. Story 1.4 adds full coverage thresholds (80%), accessibility testing (jest-axe), test utilities, and established test patterns.

- [ ] Task 15: Configure TanStack Query Provider — depends on Task 2
  - [ ] 15.1: Create `src/components/providers/query-provider.tsx` with QueryClientProvider
  - [ ] 15.2: Wrap root layout children with the provider (client component boundary)
  - [ ] 15.3: **NOTE:** This is a client component — use `'use client'` directive

- [ ] Task 16: Configure CI/CD - GitHub Actions (AC: #5) — depends on Task 13
  - [ ] 16.1: Create `.github/workflows/ci.yml` (see CI workflow below)
  - [ ] 16.2: Configure workflow triggers for pull_request and push to main

- [ ] Task 17: Configure Husky Pre-commit Hooks (AC: #7) — depends on Task 13
  - [ ] 17.1: Run `npx husky init`
  - [ ] 17.2: Create pre-commit hook: `npm run type-check && npm run lint`
  - [ ] 17.3: Verify hooks execute on commit attempt

- [ ] Task 18: Verify Build & Final Checks (AC: #6)
  - [ ] 18.1: Run `npm run build` — must succeed with zero errors
  - [ ] 18.2: Run `npm run type-check` — must pass
  - [ ] 18.3: Run `npm run lint` — must pass
  - [ ] 18.4: Verify Vercel deployment readiness (project builds successfully)

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from day one — no exceptions:**

1. **Naming Conventions:**
   - Database: `snake_case` (tables, columns, indexes, functions)
   - TypeScript: `camelCase` (variables, functions), `PascalCase` (components, types, interfaces)
   - Constants: `UPPER_SNAKE_CASE`
   - API endpoints: kebab-case, plural nouns (`/api/health-checks`)
   - Custom hooks: `use` prefix (`useHealthMonitor`)

2. **Data Transformation Boundary:**
   - Supabase returns `snake_case` — TypeScript uses `camelCase`
   - Transform at boundary (implemented in Story 1.4 as `toCamelCase`/`toSnakeCase`)

3. **API Response Format:**
   - ALL API routes return: `{ data: T | null, error: Error | null }`

4. **Import Alias:**
   - Use `@/*` for all imports from `src/`
   - Example: `import { Button } from '@/components/ui/button'`

### Technology Versions (Latest as of 2026-02-04)

| Technology | Version | Notes |
|---|---|---|
| Next.js | 16.x (v16.1.5) | Turbopack default, App Router |
| Tailwind CSS | **v4** | CSS-based config via `@theme` — NO `tailwind.config.ts` |
| TypeScript | 5.x | Bundled with create-next-app |
| React | 19.x | Bundled with Next.js 16 |
| shadcn/ui | Latest | `npx shadcn@latest init`, New York style |
| Supabase JS | Latest | Uses `PUBLISHABLE_KEY` (not `ANON_KEY`) |
| @supabase/ssr | Latest | Server + browser client patterns |
| Zod | ^3.x | Validation |
| React Hook Form | ^7.x | Forms |
| TanStack Query | ^5.x | CMS admin state |

### Tailwind CSS v4 Configuration (CRITICAL — NOT v3)

**Next.js 16 uses Tailwind v4. Configuration is CSS-based, NOT JavaScript-based.**

There is NO `tailwind.config.ts` file. All customization goes in `src/app/globals.css`:

```css
@import "tailwindcss";

/* DxT Design Tokens */
@theme {
  /* Brand Colors */
  --color-dxt-primary: #41B9D5;
  --color-dxt-secondary: #5371FF;
  --color-dxt-accent: #6CE6E9;
  --color-dxt-dark: #545454;
  --color-dxt-light: #FFFFFF;

  /* Font Family */
  --font-nunito: 'Nunito', sans-serif;
}

/* shadcn/ui CSS variables will also be here (added by shadcn init) */
```

**Usage in components:**
- `bg-dxt-primary` / `text-dxt-secondary` / `border-dxt-accent`
- `font-nunito`

**DO NOT create a `tailwind.config.ts` file — Tailwind v4 does not use it.**

### Supabase Environment Variable Change

```
IMPORTANT: Supabase renamed ANON_KEY → PUBLISHABLE_KEY

- Use: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (NOT ANON_KEY)
- The architecture doc references ANON_KEY — this is outdated
- Server-side: SUPABASE_SERVICE_ROLE_KEY (unchanged)
```

### Supabase SSR Client Patterns

**Server Component client — `src/lib/supabase/server.ts`:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored in Server Components
          }
        },
      },
    }
  )
}
```

**Browser client — `src/lib/supabase/client.ts`:**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

### Middleware Placeholder

**`src/middleware.ts`:**
```typescript
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // TODO: Story 2.6 will add auth + RBAC enforcement
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Security Headers — `next.config.ts`

Add security headers to `next.config.ts` (preserve Sentry wrapping):

```typescript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // CSP: Permissive for now (unsafe-eval/unsafe-inline needed for Next.js dev)
  // SECURITY ROADMAP: Tighten in Story 2.6 (Route Protection & RBAC)
  // - Remove unsafe-eval (use nonce-based approach)
  // - Remove unsafe-inline for scripts
  // - Add specific domain allowlists for Supabase, Sentry, Vercel
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;",
  },
]

// Add to next.config.ts headers() function
async headers() {
  return [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
  ]
}
```

### TanStack Query Provider

**`src/components/providers/query-provider.tsx`:**
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### Vitest Configuration

**`vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**`src/test-setup.ts`:**
```typescript
import '@testing-library/jest-dom'
```

**NOTE:** Also install `@vitejs/plugin-react` as dev dependency: `npm install -D @vitejs/plugin-react`

### Complete Root Layout — `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import { QueryProvider } from '@/components/providers/query-provider'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  title: 'zyncdata',
  description: 'DxT AI Enterprise Access Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-nunito antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
```

### GitHub Actions CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:run
      - run: npm run build
      - run: npm run size
```

### Husky Pre-commit Hook

```bash
#!/usr/bin/env sh
# .husky/pre-commit
npm run type-check && npm run lint
```

### Environment Variables

```bash
# .env.local.example

# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Upstash Redis - Rate Limiting (REQUIRED for auth endpoints)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxx...

# Sentry - Error Tracking (REQUIRED for production)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Vercel Analytics (auto-configured on Vercel, no env var needed)
```

### Performance Budgets (Enforce from Day 1)

**size-limit in `package.json`:**
```json
"size-limit": [
  { "path": ".next/static/**/*.js", "limit": "150 KB", "gzip": true },
  { "path": ".next/static/**/*.css", "limit": "50 KB", "gzip": true }
]
```

**Core Web Vitals targets:** LCP < 2.5s, FID < 100ms, CLS < 0.1

### Project Structure

```
zyncdata/
├── .github/workflows/ci.yml
├── .husky/pre-commit
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/                # Auth route group
│   │   ├── dashboard/             # Health monitoring
│   │   ├── admin/_components/     # CMS admin panel
│   │   ├── api/                   # API routes
│   │   ├── layout.tsx             # Root layout (Nunito font, QueryProvider)
│   │   ├── page.tsx               # Landing page (public)
│   │   └── globals.css            # Tailwind v4 @theme + DxT tokens
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives
│   │   ├── patterns/              # Composed (StatusBadge, LoadingSpinner)
│   │   ├── layouts/               # Header, Footer, Navigation
│   │   └── providers/             # QueryProvider
│   ├── lib/
│   │   ├── api/                   # API client
│   │   ├── auth/                  # Auth domain
│   │   ├── health/                # Health monitoring
│   │   ├── content/               # CMS domain
│   │   ├── supabase/              # server.ts + client.ts
│   │   ├── validations/           # Zod schemas
│   │   ├── utils/                 # Utilities
│   │   ├── hooks/                 # Custom hooks
│   │   ├── websocket/             # WebSocket
│   │   ├── errors/                # Error codes
│   │   └── ratelimit/             # Rate limiting
│   ├── types/database.ts          # Supabase types (placeholder)
│   └── middleware.ts              # Route protection (placeholder)
├── supabase/migrations/
├── tests/e2e/
├── sentry.client.config.ts        # Auto-generated by Sentry wizard
├── sentry.server.config.ts        # Auto-generated by Sentry wizard
├── sentry.edge.config.ts          # Auto-generated by Sentry wizard
├── .env.local.example
├── .prettierrc
├── components.json                # shadcn/ui config
├── next.config.ts                 # Sentry-wrapped + security headers
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### What This Story Does NOT Include

- No database migrations or seed data (Story 1.2)
- No actual page implementations beyond minimal placeholders (Story 1.3)
- No error boundaries, API client, shared utilities, or WebSocket event types (Story 1.4)
- No actual authentication logic (Epic 2)
- No content or system management (Epics 3-4)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Technology Stack]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#CI/CD Pipeline]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Performance Budgets]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Handoff]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation]
- [Source: Tailwind CSS v4 Docs - @theme Directive]
- [Source: Next.js v16.1.5 Docs - Installation]
- [Source: shadcn/ui Docs - CLI Init]
- [Source: Supabase Docs - Next.js SSR Client Setup]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log
- 2026-02-04: Story created by SM agent with full context analysis
- 2026-02-04: Quality review R1 applied — 5 critical fixes, 4 enhancements, 2 optimizations
- 2026-02-04: Quality review R2 applied — 3 critical fixes, 3 enhancements, 1 optimization

### File List
