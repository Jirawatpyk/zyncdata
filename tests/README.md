# Test Architecture

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Copy env template and fill in test credentials
cp .env.local.example .env.local
```

Required environment variables for E2E tests:

| Variable | Purpose |
|----------|---------|
| `BASE_URL` | App URL (default: `http://localhost:3000`) |
| `TEST_USER_EMAIL` | E2E test user email |
| `TEST_USER_PASSWORD` | E2E test user password |

## Running Tests

```bash
# Unit + Integration (Vitest)
npm run test              # watch mode
npm run test:run          # single run
npm run test:coverage     # with coverage report

# E2E (Playwright)
npm run test:e2e          # headless
npm run test:e2e:ui       # Playwright UI mode (interactive)
npm run test:e2e:headed   # visible browser
npm run test:e2e:debug    # debug mode with inspector

# Accessibility
npm run test:a11y         # axe-core accessibility checks
```

## Architecture Overview

```
tests/
├── e2e/                          # Playwright E2E tests
│   └── example.spec.ts           # Sample test demonstrating patterns
├── factories/                    # Data factories (faker-based)
│   ├── user-factory.ts           # buildUser, buildAdminUser, buildSuperAdmin
│   └── system-factory.ts         # buildSystem, buildDegradedSystem, buildDownSystem
└── support/
    ├── fixtures/
    │   └── merged-fixtures.ts    # mergeTests composition (single test import)
    ├── helpers/
    │   └── auth-helper.ts        # loginAsUser, logout
    └── page-objects/             # Page Object pattern (add as needed)

src/
├── __tests__/                    # Co-located unit tests
│   └── smoke.test.ts
└── test-setup.ts                 # Vitest setup (@testing-library/jest-dom)
```

### Test Pyramid

- **70% Unit** (Vitest) — co-located next to source as `*.test.ts`
- **20% Integration** (Vitest) — API routes, domain modules
- **10% E2E** (Playwright) — critical user journeys
- **Target: 80% total coverage**

### Fixtures (mergeTests pattern)

All E2E tests import from a single merged fixtures file:

```typescript
import { test, expect } from '../support/fixtures/merged-fixtures'

test('example', async ({ authenticatedPage }) => {
  // authenticatedPage is already logged in
})
```

To add new fixtures, extend `merged-fixtures.ts` with `mergeTests`.

### Data Factories

Factories use `@faker-js/faker` for realistic, collision-free test data:

```typescript
import { buildUser } from '../factories/user-factory'
import { buildSystem } from '../factories/system-factory'

const user = buildUser({ role: 'admin' })           // override specific fields
const system = buildSystem({ status: 'degraded' })  // defaults for everything else
```

Rules:
- Every test uses factories — no inline object literals
- Factory prefix: `build` (e.g., `buildUser`, `buildSystem`)
- Pattern: `buildEntity(overrides?: Partial<Entity>): Entity`

## Best Practices

### Selectors

Use `data-testid` attributes for test selectors:

```typescript
await page.getByTestId('login-submit').click()
```

### Test Structure

Follow Given/When/Then format:

```typescript
test('should redirect unauthenticated users', async ({ page }) => {
  // Given: an unauthenticated user
  // When: they navigate to the dashboard
  await page.goto('/dashboard')
  // Then: they are redirected to login
  await expect(page).toHaveURL(/\/login/)
})
```

### Isolation

- Each test gets a fresh browser context
- No shared state between tests
- Clean up test data after each test
- Use factories for unique data (parallel-safe)

### Anti-Patterns

- NO snapshot testing
- NO `test.skip` in committed code
- NO hard-coded waits (`page.waitForTimeout`)
- NO testing implementation details
- NEVER skip accessibility tests on new pages
- Fix flaky tests immediately or delete them

## CI Integration

Playwright runs in CI with:
- **Retries:** 2 (CI only)
- **Workers:** 1 (CI), auto (local)
- **Reporters:** list + JUnit XML + HTML
- **Artifacts:** trace, screenshot, video retained on failure
- **JUnit output:** `test-results/junit.xml`

## Troubleshooting

### Tests fail to start
- Ensure dev server is running or `webServer` config is correct
- Check `BASE_URL` in `.env.local`

### Authentication failures
- Verify `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in `.env.local`
- Ensure test user exists in Supabase

### Flaky tests
- Check for race conditions — use `waitForSelector` or `expect` with auto-retry
- Never use `page.waitForTimeout` — use Playwright's built-in waiting
- Check `test-results/` for traces and screenshots
