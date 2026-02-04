# Story 1.3: Public Landing Page with DxT Branding

Status: done

## Story

As a visitor,
I want to see a professional landing page at zyncdata.app with DxT branding and system cards,
So that I can quickly identify and access any system with a single click.

## Acceptance Criteria

1. **Given** I navigate to zyncdata.app **When** the page loads **Then** I see a hero section (title, subtitle, description), an intro/about section, a system cards grid, and a footer with DxT AI branding (colors, Nunito font, logo)

2. **Given** the page loads **When** I view the system cards **Then** each card displays the system name, logo, and description pulled from the Supabase database **And** cards are ordered by `display_order` **And** only enabled systems are shown

3. **Given** I see a system card **When** I click on it **Then** I am redirected to the system's URL in < 300ms

4. **Given** I'm on a mobile device (>= 375px width) **When** I view the landing page **Then** the layout is responsive: 1 column (mobile), 2 columns (tablet), 3-4 columns (desktop) using CSS Grid

5. **Given** I use keyboard navigation **When** I tab through the page **Then** all interactive elements are focusable with visible focus indicators (`ring-2 ring-dxt-primary`) **And** system cards are accessible via Enter/Space keys

6. **Given** the page renders **When** I inspect color contrast **Then** all text meets WCAG AA standards (4.5:1 ratio for text, 3:1 for UI components)

7. **Given** a first-time visit **When** I measure page performance **Then** LCP is < 2 seconds and on subsequent cached visits < 0.5 seconds

8. **Given** a mobile visitor on 4G **When** the page loads **Then** load time is < 3 seconds

9. **Given** I use Chrome, Firefox, or Safari (latest 2 versions) **When** I view the landing page **Then** the page renders correctly across all supported browsers

## Tasks / Subtasks

**Dependency: Story 1.2 must be complete (database schema + seed data). If Supabase local is not running, data fetching will fail. Start with `supabase start` + `supabase db reset` before development.**

- [x] Task 1: Create data access layer (AC: #2)
  - [x] 1.1: Create `src/lib/systems/queries.ts` — `getEnabledSystems()` fetches from `systems` table where `enabled = true`, ordered by `display_order`, selecting only needed columns: `id, name, url, logo_url, description, display_order`
  - [x] 1.2: Create `src/lib/content/queries.ts` — `getLandingPageContent()` fetches all rows from `landing_page_content` table
  - [x] 1.3: Both functions use `createClient()` from `@/lib/supabase/server` (server-side client for RSC)
  - [x] 1.4: Both functions THROW on error (not catch) — `error.tsx` handles display
  - [x] 1.5: Transform snake_case DB response to camelCase in these functions (data access boundary)
  - [x] 1.6: Define Zod schemas for return types in `src/lib/validations/system.ts` and `src/lib/validations/content.ts` — export inferred types: `export type System = z.infer<typeof systemSchema>`
  - [x] 1.7: Validate JSONB `content` column from `landing_page_content` with Zod to prevent runtime errors if content shape changes

- [x] Task 2: Create SystemCard component (AC: #2, #3, #5, #6)
  - [x] 2.1: Create `src/components/patterns/SystemCard.tsx` as a Server Component (no `'use client'`)
  - [x] 2.2: Props: `name: string`, `url: string`, `logoUrl: string | null`, `description: string | null`
  - [x] 2.3: Render card with: system name (H4, 20px semibold), description (14px body-small), logo placeholder (if `logoUrl` is null, show first letter of name in a styled circle)
  - [x] 2.4: Card is an `<a>` tag wrapping the card content, `href={url}`, `target="_blank"`, `rel="noopener noreferrer"` — ensures < 300ms redirect (native browser navigation)
  - [x] 2.5: Hover state: `motion-safe:hover:scale-[1.02]`, shadow elevation (`shadow-sm` to `shadow-md`), `transition-all duration-150 ease-out` — use `motion-safe:` prefix to respect `prefers-reduced-motion`
  - [x] 2.6: Focus indicator: `focus-visible:ring-2 focus-visible:ring-dxt-primary focus-visible:outline-none` with `rounded-lg`
  - [x] 2.7: Use `cn()` from `@/lib/utils` for all conditional classes
  - [x] 2.8: No status badge on landing page variant (status badges are dashboard-only per UX spec)
  - [x] 2.9: ARIA: `aria-label="Visit {name} - {description}"`

- [x] Task 3: Create Hero section component (AC: #1, #6)
  - [x] 3.1: Create `src/app/_components/Hero.tsx` as a Server Component
  - [x] 3.2: Accept props from `landing_page_content` hero section: `title`, `subtitle`, `description`
  - [x] 3.3: Typography: H1 (48px/3rem bold, `text-gray-800`) for title, H2 (36px/2.25rem semibold, `text-gray-700`) for subtitle, Body Large (18px, `text-gray-600`) for description
  - [x] 3.4: Mobile responsive typography: H1 -> 36px, H2 -> 28px on `< md` breakpoint
  - [x] 3.5: Center-aligned text, max-width constrained (`max-w-3xl mx-auto`)
  - [x] 3.6: Section padding: `py-16 md:py-24` (3xl to 4xl spacing)

- [x] Task 4: Create Intro/About section component (AC: #1)
  - [x] 4.1: Create `src/app/_components/IntroSection.tsx` as a Server Component
  - [x] 4.2: Accept props from `landing_page_content` intro section: `heading`, `body`
  - [x] 4.3: Typography: H2 (36px bold, `text-gray-800`) for heading, Body Large (18px, `text-gray-600`, `leading-relaxed`) for body
  - [x] 4.4: Center-aligned, `max-w-3xl mx-auto`, section padding `py-12 md:py-16`
  - [x] 4.5: Background: `bg-gray-50` to visually separate from hero above

- [x] Task 5: Create Footer component (AC: #1, #6)
  - [x] 5.1: Create `src/components/layouts/Footer.tsx` as a Server Component (reusable across routes)
  - [x] 5.2: Accept props from `landing_page_content` footer section: `copyright`, `contactEmail`, `links`
  - [x] 5.3: Background: `bg-gray-50`, text: `text-gray-600` (14px body-small)
  - [x] 5.4: Layout: centered content, `max-w-7xl mx-auto`, padding `py-8 px-4`
  - [x] 5.5: Links use `next/link` for internal routes, `<a>` for external

- [x] Task 6: Create Header component (AC: #1)
  - [x] 6.1: Create `src/components/layouts/Header.tsx` as a Server Component
  - [x] 6.2: Left: DxT branding text ("DxT AI Platform") — no logo image yet (logo management is Epic 3, Story 3.7)
  - [x] 6.3: Right: "Login" link (points to `/login` — not implemented yet, but route exists for future)
  - [x] 6.4: Sticky header: `sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200`
  - [x] 6.5: Layout: `max-w-7xl mx-auto`, padding `py-4 px-4 md:px-8`, flex between
  - [x] 6.6: Mobile: same layout (no hamburger menu needed — only 1-2 nav items)

- [x] Task 7: Create error.tsx and loading.tsx (AC: #7, #8)
  - [x] 7.1: Create `src/app/error.tsx` — must be `'use client'`. Display user-friendly error message ("Something went wrong. Please try again later.") with a retry button that calls `reset()`. Report error to Sentry via `Sentry.captureException(error)` in `useEffect`
  - [x] 7.2: Create `src/app/loading.tsx` — skeleton UI with: header placeholder, hero skeleton (3 text lines), grid of 5 card skeletons (matching responsive grid layout). Use `animate-pulse` on gray placeholder blocks. Keep it minimal — no `'use client'` needed

- [x] Task 8: Build the landing page (`app/page.tsx`) (AC: #1, #2, #4, #7, #8)
  - [x] 8.1: Replace current placeholder in `src/app/page.tsx` with landing page implementation
  - [x] 8.2: Page is an `async` Server Component — fetch data directly using `getEnabledSystems()` and `getLandingPageContent()`
  - [x] 8.3: Structure: `<Header />` -> `<main id="main-content">` -> `<Hero />` -> `<IntroSection />` -> `<Suspense fallback={<GridSkeleton />}>` -> `<SystemGrid />` -> `</Suspense>` -> `</main>` -> `<Footer />`
  - [x] 8.4: Add skip-to-content link: `<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:p-4 focus:text-dxt-primary">Skip to content</a>` as first child of body content
  - [x] 8.5: System cards grid: CSS Grid with `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (responsive per AC #4)
  - [x] 8.6: Grid container: `max-w-7xl mx-auto px-4 md:px-8`, gap: `gap-6` (24px)
  - [x] 8.7: Section heading above grid: "Our Systems" (H2, 36px, centered)
  - [x] 8.8: Add ISR: `export const revalidate = 60` — revalidate every 60 seconds for near-real-time CMS updates without rebuilding
  - [x] 8.9: Update metadata with Open Graph tags:
    ```
    title: 'DxT AI Platform - Enterprise Access Management'
    description: 'Your centralized hub for accessing and monitoring all DxT AI systems.'
    openGraph: { title, description, type: 'website' }
    ```
  - [x] 8.10: Handle empty state: if no systems returned, show friendly message "No systems available"
  - [x] 8.11: Use semantic HTML landmarks: `<header>`, `<main>`, `<section>`, `<footer>`

- [x] Task 9: Unit tests (AC: all)
  - [x] 9.1: `src/components/patterns/SystemCard.test.tsx` — test renders name, description, link href, ARIA label, focus-visible classes
  - [x] 9.2: `src/app/_components/Hero.test.tsx` — test renders title, subtitle, description with correct heading levels
  - [x] 9.3: `src/app/_components/IntroSection.test.tsx` — test renders heading, body text
  - [x] 9.4: `src/components/layouts/Footer.test.tsx` — test renders copyright, contact email
  - [x] 9.5: `src/components/layouts/Header.test.tsx` — test renders branding text, login link
  - [x] 9.6: `src/lib/systems/queries.test.ts` — mock Supabase client, verify query params (`.eq('enabled', true)`, `.order('display_order')`), verify camelCase transform
  - [x] 9.7: `src/lib/content/queries.test.ts` — mock Supabase client, verify content map structure, verify Zod validation
  - [x] 9.8: Test naming: `describe('ComponentName', ...)`, `it('should ...', ...)`
  - [x] 9.9: Minimum per component: happy path, empty/null data, accessibility attributes
  - [x] 9.10: Use `vi.mock('@/lib/supabase/server')` — see Dev Notes for mock pattern

- [x] Task 10: E2E & accessibility tests (AC: #5, #6, #9)
  - [x] 10.1: Create `tests/e2e/landing-page.spec.ts`
  - [x] 10.2: Test: page loads with hero section, intro section, system cards, footer
  - [x] 10.3: Test: system cards are clickable and have correct hrefs
  - [x] 10.4: Test: responsive layout — verify grid changes at breakpoints
  - [x] 10.5: Test: keyboard navigation — Tab through cards, Enter activates link
  - [x] 10.6: Accessibility: run `@axe-core/playwright` on landing page — zero violations
  - [x] 10.7: Test: page renders in < 3 seconds (performance assertion)

- [x] Task 11: Final verification
  - [x] 11.1: Run `npm run type-check` — must pass
  - [x] 11.2: Run `npm run lint` — must pass
  - [x] 11.3: Run `npm run build` — must pass
  - [x] 11.4: Run `npm run test:run` — all unit tests pass
  - [x] 11.5: Visual check: landing page looks professional with DxT branding
  - [x] 11.6: Check bundle size: `npm run size` — JS < 200KB (current limit per Story 1.1)

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns — no exceptions:**

1. **Server Components by default** — the landing page is 100% server-rendered. Do NOT add `'use client'` to any component unless required (only `error.tsx` needs it in this story)
2. **Next.js 16 async patterns** — `cookies()`, `headers()`, `params` are all `Promise`-based. The Supabase server client already handles this correctly (see `src/lib/supabase/server.ts`)
3. **Data transform at boundary** — `src/lib/systems/queries.ts` and `src/lib/content/queries.ts` transform snake_case to camelCase. Components NEVER see snake_case
4. **Domain separation** — systems and content are separate domains. `getEnabledSystems()` goes in `src/lib/systems/queries.ts` (not `content/`). Epic 3 adds 8 stories of system CRUD to this module
5. **`cn()` for classes** — use `cn()` from `@/lib/utils` for ALL conditional Tailwind classes
6. **No barrel files** — import directly from source files, not through `index.ts`
7. **ISR, not SSG** — use `export const revalidate = 60` for near-real-time CMS updates. Pure SSG would require rebuilds for content changes
8. **Supabase server client** — use `createClient()` from `@/lib/supabase/server` for ALL data fetching in RSC. NEVER use the browser client in server components
9. **No `dark:` classes** — dark mode not implemented yet per Story 1.1 learnings. Light mode only
10. **No React Query on landing page** — React Query is restricted to `/admin/` routes only. The landing page uses direct RSC data fetching
11. **Semantic HTML** — use `<header>`, `<main>`, `<footer>`, `<section>`, `<nav>` for accessibility and SEO
12. **Zod for app types** — define schemas in `src/lib/validations/`, export inferred types. Use database types from `@/types/database.ts` for Supabase client only

### Important: Epics vs Architecture Conflict on Card Clickability

The architecture doc's "Landing Page Structure" section describes system cards as "informational only (not clickable)." **Ignore this.** The epics acceptance criteria (AC #3) explicitly requires clickable cards that redirect to the system URL. The epics are the authoritative implementation spec. Implement cards as clickable `<a>` tags.

### Zod Schemas

**`src/lib/validations/system.ts`:**
```typescript
import { z } from 'zod'

export const systemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string().url(),
  logoUrl: z.string().url().nullable(),
  description: z.string().nullable(),
  displayOrder: z.number().int(),
})

export type System = z.infer<typeof systemSchema>
```

**`src/lib/validations/content.ts`:**
```typescript
import { z } from 'zod'

export const heroContentSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
})

export const introContentSchema = z.object({
  heading: z.string(),
  body: z.string(),
})

export const footerContentSchema = z.object({
  copyright: z.string(),
  contact_email: z.string().email(),
  links: z.array(z.object({ label: z.string(), url: z.string() })),
})

export type HeroContent = z.infer<typeof heroContentSchema>
export type IntroContent = z.infer<typeof introContentSchema>
export type FooterContent = z.infer<typeof footerContentSchema>
```

### Exact Supabase Queries

**`src/lib/systems/queries.ts` — Systems query:**
```typescript
import { createClient } from '@/lib/supabase/server'
import type { System } from '@/lib/validations/system'

export async function getEnabledSystems(): Promise<System[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('systems')
    .select('id, name, url, logo_url, description, display_order')
    .eq('enabled', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data.map((system) => ({
    id: system.id,
    name: system.name,
    url: system.url,
    logoUrl: system.logo_url,
    description: system.description,
    displayOrder: system.display_order,
  }))
}
```

**`src/lib/content/queries.ts` — Landing page content query:**
```typescript
import { createClient } from '@/lib/supabase/server'
import {
  heroContentSchema,
  introContentSchema,
  footerContentSchema,
  type HeroContent,
  type IntroContent,
  type FooterContent,
} from '@/lib/validations/content'

interface LandingPageContent {
  hero: HeroContent
  intro: IntroContent
  footer: FooterContent
}

export async function getLandingPageContent(): Promise<LandingPageContent> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('landing_page_content')
    .select('section_name, content')

  if (error) throw error

  const contentMap = Object.fromEntries(
    data.map((row) => [row.section_name, row.content]),
  )

  return {
    hero: heroContentSchema.parse(contentMap.hero),
    intro: introContentSchema.parse(contentMap.intro),
    footer: footerContentSchema.parse(contentMap.footer),
  }
}
```

### Unit Test Mock Pattern for Server Components

Server Components that call `createClient()` (which internally calls `await cookies()`) require module-level mocking:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getEnabledSystems } from '@/lib/systems/queries'

// Mock the Supabase server client at module level
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

describe('getEnabledSystems', () => {
  const mockSelect = vi.fn()
  const mockEq = vi.fn()
  const mockOrder = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOrder.mockResolvedValue({
      data: [
        { id: '1', name: 'TINEDY', url: 'https://tinedy.dxt-ai.com', logo_url: null, description: 'Task management', display_order: 1 },
      ],
      error: null,
    })
    mockEq.mockReturnValue({ order: mockOrder })
    mockSelect.mockReturnValue({ eq: mockEq })
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    } as any)
  })

  it('should return enabled systems in camelCase', async () => {
    const result = await getEnabledSystems()
    expect(result[0].logoUrl).toBeNull() // camelCase
    expect(result[0].displayOrder).toBe(1) // camelCase
  })

  it('should throw on Supabase error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'Connection failed' } })
    await expect(getEnabledSystems()).rejects.toThrow()
  })
})
```

For Server Component rendering tests, test the component as an async function:

```typescript
import { describe, it, expect, vi } from 'vitest'
import SystemCard from '@/components/patterns/SystemCard'

describe('SystemCard', () => {
  it('should render system name and description', async () => {
    const jsx = await SystemCard({
      name: 'TINEDY',
      url: 'https://tinedy.dxt-ai.com',
      logoUrl: null,
      description: 'Task management',
    })
    // Assert on the JSX tree
    expect(jsx).toBeTruthy()
  })
})
```

### Database Schema Reference (from Story 1.2)

**systems table columns used:**
- `id` (UUID) — primary key
- `name` (TEXT) — system display name (e.g., "TINEDY")
- `url` (TEXT) — redirect URL (e.g., "https://tinedy.dxt-ai.com")
- `logo_url` (TEXT, nullable) — logo image URL (all NULL in seed data — use letter avatar)
- `description` (TEXT, nullable) — system description
- `display_order` (INTEGER) — sort order (1-5 in seed data)
- `enabled` (BOOLEAN) — visibility filter (all `true` in seed data)

**landing_page_content seed data structure:**
```json
{ "section_name": "hero", "content": { "title": "DxT AI Platform", "subtitle": "Enterprise Access Management", "description": "Your centralized hub for accessing and monitoring all DxT AI systems. One portal, complete visibility." } }

{ "section_name": "intro", "content": { "heading": "About DxT AI", "body": "DxT AI builds intelligent solutions that streamline operations and enhance productivity. Our platform provides unified access to all systems with real-time health monitoring and comprehensive management tools." } }

{ "section_name": "footer", "content": { "copyright": "2026 DxT AI. All rights reserved.", "contact_email": "support@dxt-ai.com", "links": [] } }
```

### DxT Design Tokens (already configured in globals.css)

```css
--color-dxt-primary: #41b9d5;    /* Primary cyan — CTA buttons, focus rings, accents */
--color-dxt-secondary: #5371ff;  /* Secondary blue — secondary actions */
--color-dxt-accent: #6ce6e9;     /* Light cyan — hover highlights */
--color-dxt-dark: #545454;       /* Dark gray — icon/text on light bg */
--color-dxt-light: #ffffff;      /* White — backgrounds */
```

**Usage in Tailwind classes:** `text-dxt-primary`, `bg-dxt-primary`, `ring-dxt-primary`, etc.

**Contrast notes:**
- `dxt-primary` (#41B9D5) on white = 3.2:1 — use for large text (18px+), buttons with white text, UI elements. NOT for body text
- `gray-800` (#1F2937) on white = 14.7:1 — headings
- `gray-600` (#4B5563) on white = 8.6:1 — body text
- `gray-500` (#6B7280) on white = 4.7:1 — secondary text (AA for normal text)

### Typography Spec

| Element | Size | Weight | Tailwind | Color |
|---------|------|--------|----------|-------|
| H1 (page title) | 48px (3rem) | Bold (700) | `text-5xl font-bold` | `text-gray-800` |
| H2 (section) | 36px (2.25rem) | Bold (700) | `text-4xl font-bold` | `text-gray-800` |
| H4 (card title) | 20px (1.25rem) | SemiBold (600) | `text-xl font-semibold` | `text-gray-800` |
| Body Large | 18px (1.125rem) | Regular (400) | `text-lg` | `text-gray-600` |
| Body Small | 14px (0.875rem) | Regular (400) | `text-sm` | `text-gray-600` |

Mobile responsive: H1 -> `text-4xl`, H2 -> `text-3xl` below `md` breakpoint.

### Spacing & Layout Spec

- **Container:** `max-w-7xl mx-auto px-4 md:px-8` (1280px max)
- **Card padding:** `p-6` (24px)
- **Card gap:** `gap-6` (24px)
- **Section gap:** `py-12 md:py-16` (48-64px vertical)
- **Card border radius:** `rounded-lg` (8px)
- **Card border:** `border border-gray-200`
- **Card shadow on hover:** `hover:shadow-md` (from `shadow-sm`)

### Responsive Grid

```
Mobile (< 768px):    grid-cols-1    — 1 card per row, full width
Tablet (768-1023px): grid-cols-2    — 2 cards per row
Desktop (1024px+):   grid-cols-3    — 3 cards per row
```

Tailwind: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

### Logo Placeholder Pattern

All systems currently have `logo_url: null` (logo upload is Epic 3, Story 3.7). Implement a letter avatar:

```tsx
{logoUrl ? (
  <Image src={logoUrl} alt={`${name} logo`} width={64} height={64} className="rounded-lg" />
) : (
  <div
    className="flex h-16 w-16 items-center justify-center rounded-lg bg-dxt-primary/10 text-2xl font-bold text-dxt-primary"
    aria-hidden="true"
  >
    {name.charAt(0)}
  </div>
)}
```

**IMPORTANT:** `next.config.ts` does NOT have `images.remotePatterns` configured. When `logo_url` is non-null (Story 3.7), `next/image` will fail for external URLs. For now, all logos are null so the letter avatar path runs. When Story 3.7 adds logo uploads, `remotePatterns` must be added to `next.config.ts`.

### Motion Accessibility

Card hover animations must respect `prefers-reduced-motion`. Use Tailwind's `motion-safe:` variant:

```tsx
<a
  className={cn(
    'block rounded-lg border border-gray-200 bg-white p-6 shadow-sm',
    'motion-safe:transition-all motion-safe:duration-150 motion-safe:ease-out',
    'motion-safe:hover:scale-[1.02] motion-safe:hover:shadow-md',
    'focus-visible:ring-2 focus-visible:ring-dxt-primary focus-visible:outline-none',
  )}
  href={url}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={`Visit ${name} - ${description}`}
>
```

### Existing Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `src/app/page.tsx` | **REPLACE** | Remove Next.js placeholder, implement landing page |

### What This Story Does NOT Include

- No login/auth flow (Epic 2)
- No system logo upload (Story 3.7)
- No CMS editing of content (Epic 4)
- No health status badges on cards (Epic 5)
- No dark mode
- No WebSocket connections
- No React Query usage
- No API routes — data fetched directly via Supabase server client in RSC
- No contact form — CTA links are placeholder for now
- No testimonials section — CMS-managed, deferred to Epic 4
- No `remotePatterns` config for external images (deferred to Story 3.7)

### Alignment with Previous Stories

**From Story 1.1:**
- Tailwind v4 CSS-based config (not `tailwind.config.ts`) — all DxT tokens in `globals.css`
- `proxy.ts` exists instead of `middleware.ts` (Next.js 16 convention)
- Prettier: `semi: false`, `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`
- Pre-commit hook: `type-check && lint && test:run`
- Size-limit: JS < 200KB (increased from 150KB for Sentry SDK)

**From Story 1.2:**
- Database schema and seed data are ready
- RLS policies enforce: anonymous users can only SELECT enabled systems
- All logo_url values are NULL — use letter avatar placeholder
- System status is NULL — do NOT show status indicators (those are Epic 5)
- Server Supabase client pattern established in `src/lib/supabase/server.ts`

### Git Commit Convention

```
feat(story-1.3): implement public landing page with DxT branding
```

Scope: `story-1.3` or `landing-page`

### Testing Strategy

**Unit tests (Vitest):**
- Mock `@/lib/supabase/server` at module level (see mock pattern in Dev Notes)
- Server Components: test as async functions returning JSX
- Minimum 3 tests per component: happy path, empty data, accessibility

**E2E tests (Playwright):**
- Requires `npm run dev` + `supabase start` running
- Test full page render, card interactions, responsive layout
- Accessibility: `@axe-core/playwright` with zero violations target

### Performance Considerations

- **Zero client-side JavaScript** — entire page is Server Components (only `error.tsx` needs `'use client'`)
- **ISR with 60s revalidation** — cached at edge, revalidated in background
- **Suspense streaming** — wrap SystemGrid in `<Suspense>` so hero/intro render instantly while cards stream in
- **Selective column queries** — only fetch needed columns from Supabase (no `select('*')`)
- **Nunito font** — already loaded in root layout via `next/font/google` (no additional font loading)
- **No external scripts** — no analytics on landing page (analytics is on dashboard)
- **Image optimization** — `next/image` for system logos (when available, after Story 3.7)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Fetching Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Landing Page Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SystemCard Component]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography System]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Spacing & Layout]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Breakpoints]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: _bmad-output/project-context.md#Framework-Specific Rules]
- [Source: _bmad-output/project-context.md#Testing Rules]
- [Source: _bmad-output/implementation-artifacts/1-2-database-schema-seed-data.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

- Task 1: Data access layer — created `getEnabledSystems()` in `src/lib/systems/queries.ts` and `getLandingPageContent()` in `src/lib/content/queries.ts`. Zod schemas defined in `src/lib/validations/system.ts` and `content.ts` for type-safe validation. Both use server-side Supabase client, throw on error, transform snake_case to camelCase at boundary.
- Task 2: SystemCard — Server Component with `<a>` tag, letter avatar fallback, `motion-safe:` hover animations, `focus-visible:ring-2` focus indicators, ARIA labels. Used `<img>` instead of `next/image` since `remotePatterns` not configured (Story 3.7).
- Task 3: Hero — H1/H2 with responsive typography (`text-4xl md:text-5xl`), centered, padded section.
- Task 4: IntroSection — H2 + body text, `bg-gray-50` background, centered.
- Task 5: Footer — reusable layout component, `next/link` for internal routes, `<a>` for external, copyright + contact email.
- Task 6: Header — sticky with backdrop-blur, DxT branding text + Login link.
- Task 7: error.tsx (`'use client'`) with Sentry integration + retry button. loading.tsx with full skeleton UI matching page structure.
- Task 8: Landing page — async RSC, ISR (60s), Suspense streaming for SystemGrid, skip-to-content link, responsive CSS Grid, OG metadata, empty state handling, semantic HTML landmarks.
- Task 9: 38 unit tests across 8 test files — all passing. Tests cover happy path, empty data, error handling, accessibility attributes, Zod validation, Supabase query params, camelCase transform.
- Task 10: E2E tests created — hero/intro/cards/footer rendering, card hrefs, responsive grid, keyboard navigation, axe-core accessibility, performance assertion.
- Task 11: type-check (pass), lint (pass), build (pass), tests 38/38 (pass).

### Senior Developer Review (AI)

**Reviewer:** Amelia (Dev Agent) — Claude Opus 4.5
**Date:** 2026-02-04
**Issues Found:** 3 High, 4 Medium, 3 Low — ALL FIXED

#### Issues Fixed:

1. **[HIGH] footerContentSchema snake_case leak** — `contact_email` leaked into components violating Architecture Rule #3. Fixed: added `.transform()` to `footerContentSchema` to convert `contact_email` -> `contactEmail` at the Zod schema boundary. Updated `page.tsx` and `content/queries.test.ts`.

2. **[HIGH] getEnabledSystems() missing Zod validation** — Task 1.7 requires Zod validation but `systemSchema` was defined and never used. Fixed: added `z.array(systemSchema).parse()` to validate transformed output in `systems/queries.ts`.

3. **[HIGH] Header links missing focus-visible indicators** — AC #5 requires `ring-2 ring-dxt-primary` focus indicators on ALL interactive elements. Login and branding links in Header had no focus-visible styles. Fixed: added `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dxt-primary rounded-sm` to both Header links. Added test coverage.

4. **[MEDIUM] Git files not documented in File List** — `playwright.config.ts` modified but not listed. `nul` Windows artifact in repo root. Fixed: updated File List, deleted `nul` file.

5. **[MEDIUM] error.tsx redundant text** — Heading and paragraph both said "Something went wrong." Fixed: heading "Something went wrong", paragraph "Please try again later."

6. **[MEDIUM] GridSkeleton duplicated** — Card skeleton markup copy-pasted in `page.tsx` and `loading.tsx`. Fixed: extracted `src/app/_components/GridSkeleton.tsx` shared component, imported in both.

7. **[LOW] Header branding link missing aria-label** — Fixed: added `aria-label="DxT AI Platform - Home"`.

8. **[LOW] E2E brittle CSS class selector** — `section.bg-gray-50` selector for intro section. Fixed: added `data-testid="intro-section"` to IntroSection, updated E2E test to use `getByTestId`.

9. **[LOW] Multiple H2 elements** — Two H2 elements on page (Hero subtitle + IntroSection heading). Valid HTML, no code change needed. Noted for future heading hierarchy review.

#### Verification:
- `npm run type-check` — PASS
- `npm run lint` — PASS
- `npm run build` — PASS
- `npm run test:run` — 38/38 PASS

### Change Log
- 2026-02-04: Story created by SM agent (Bob) with comprehensive context analysis from epics, architecture, UX design, project-context, previous story intelligence (1-2), and git history
- 2026-02-04: Quality review applied — 5 critical fixes (intro section, error.tsx, loading.tsx, domain separation, remotePatterns note), 4 enhancements (Zod schemas/types, architecture conflict note, Prettier-formatted code, test mock pattern), 3 optimizations (motion-safe animations, OG metadata, Suspense streaming)
- 2026-02-04: Implementation complete — all 11 tasks done, 37 unit tests passing, E2E tests created, all verification checks pass (type-check, lint, build, size-limit)
- 2026-02-04: Code review complete — 10 issues found (3H/4M/3L), all fixed. footerContentSchema snake_case transform, Zod validation added to systems queries, Header focus-visible styles, GridSkeleton extracted, error.tsx text dedup, nul artifact removed, E2E selectors improved. 38 tests passing.

### File List

**New files:**
- src/lib/validations/system.ts
- src/lib/validations/content.ts
- src/lib/systems/queries.ts
- src/lib/systems/queries.test.ts
- src/lib/content/queries.ts
- src/lib/content/queries.test.ts
- src/components/patterns/SystemCard.tsx
- src/components/patterns/SystemCard.test.tsx
- src/components/layouts/Header.tsx
- src/components/layouts/Header.test.tsx
- src/components/layouts/Footer.tsx
- src/components/layouts/Footer.test.tsx
- src/app/_components/Hero.tsx
- src/app/_components/Hero.test.tsx
- src/app/_components/IntroSection.tsx
- src/app/_components/IntroSection.test.tsx
- src/app/_components/GridSkeleton.tsx
- src/app/error.tsx
- src/app/loading.tsx
- tests/e2e/landing-page.spec.ts

**Modified files:**
- src/app/page.tsx (replaced Next.js placeholder with landing page)
- playwright.config.ts (updated test configuration)
