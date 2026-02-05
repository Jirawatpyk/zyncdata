# CMS Testing Patterns — Epic 3

**Scope:** Testing patterns for optimistic UI, file upload, and drag-and-drop reorder in `/admin/` CMS routes.
**Origin:** Epic 2 Retrospective Action Item DOC2
**Authors:** Murat (TEA), Amelia (Dev)

---

## Shared Test Utilities

Create in Story 3.1 as CMS testing infrastructure:

```
src/tests/utils/
├── query-wrapper.tsx    ← createQueryWrapper()
├── file-helpers.ts      ← createMockFile()
└── msw-handlers.ts      ← default admin API handlers for MSW
```

### QueryClient Wrapper

```tsx
// src/tests/utils/query-wrapper.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function createQueryWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}
```

### Mock File Helper

```tsx
// src/tests/utils/file-helpers.ts
interface MockFileOptions {
  name: string
  size: number
  type: string
}

export function createMockFile({ name, size, type }: MockFileOptions): File {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], name, { type })
}
```

### Test QueryClient Convention

Always disable retry in tests to make failures deterministic:

```tsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})
```

---

## Pattern 1: Optimistic UI Testing

**Risk:** HIGH — Optimistic mutations with rollback are the most complex testing surface in CMS.

### What to Test

| Test Case | Priority |
|---|---|
| Optimistic state appears immediately (temp ID in cache) | P0 |
| Success replaces optimistic data with server response (real ID) | P0 |
| Error triggers rollback to previous snapshot | P0 |
| Cache invalidation fires on `onSettled` | P1 |
| Concurrent rapid mutations don't corrupt cache | P1 |
| Loading/pending state during mutation | P2 |

### Test Structure

```
src/lib/admin/mutations/__tests__/systems.test.ts
```

### Example: Create (Optimistic Insert)

```tsx
describe('useCreateSystem', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.setQueryData(['admin', 'systems'], [
      { id: '1', name: 'System A', displayOrder: 0 },
    ])
  })

  it('should optimistically add system to cache', async () => {
    server.use(
      http.post('/api/admin/systems', async () => {
        await delay(100)
        return HttpResponse.json({
          data: { id: '2', name: 'System B', displayOrder: 1 },
          error: null,
        })
      }),
    )

    const { result } = renderHook(() => useCreateSystem(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ name: 'System B' })

    // Verify optimistic state (before server responds)
    await waitFor(() => {
      const cached = queryClient.getQueryData<System[]>(['admin', 'systems'])
      expect(cached).toHaveLength(2)
      expect(cached![1].name).toBe('System B')
      expect(cached![1].id).toMatch(/^temp-/)
    })

    // Verify final state (after server responds)
    await waitFor(() => {
      const cached = queryClient.getQueryData<System[]>(['admin', 'systems'])
      expect(cached![1].id).toBe('2')
    })
  })

  it('should rollback on error', async () => {
    server.use(
      http.post('/api/admin/systems', () =>
        HttpResponse.json(
          { data: null, error: { message: 'Conflict', code: 'CONFLICT' } },
          { status: 409 },
        ),
      ),
    )

    const { result } = renderHook(() => useCreateSystem(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ name: 'Duplicate' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    const cached = queryClient.getQueryData<System[]>(['admin', 'systems'])
    expect(cached).toHaveLength(1)
    expect(cached![0].name).toBe('System A')
  })
})
```

### Example: Update (Optimistic Edit)

```tsx
it('should optimistically update system name', async () => {
  server.use(
    http.patch('/api/admin/systems/1', async () => {
      await delay(100)
      return HttpResponse.json({
        data: { id: '1', name: 'Updated A', displayOrder: 0 },
        error: null,
      })
    }),
  )

  const { result } = renderHook(() => useUpdateSystem('1'), {
    wrapper: createQueryWrapper(queryClient),
  })

  result.current.mutate({ name: 'Updated A' })

  // Optimistic: cache updated immediately
  await waitFor(() => {
    const cached = queryClient.getQueryData<System>(
      systemQueryOptions('1').queryKey,
    )
    expect(cached!.name).toBe('Updated A')
  })
})
```

### Example: Delete (Optimistic Remove)

```tsx
it('should optimistically remove system from list', async () => {
  queryClient.setQueryData(['admin', 'systems'], [
    { id: '1', name: 'System A', displayOrder: 0 },
    { id: '2', name: 'System B', displayOrder: 1 },
  ])

  server.use(
    http.delete('/api/admin/systems/2', () =>
      HttpResponse.json({ data: { success: true }, error: null }),
    ),
  )

  const { result } = renderHook(() => useDeleteSystem(), {
    wrapper: createQueryWrapper(queryClient),
  })

  result.current.mutate('2')

  await waitFor(() => {
    const cached = queryClient.getQueryData<System[]>(['admin', 'systems'])
    expect(cached).toHaveLength(1)
    expect(cached![0].id).toBe('1')
  })
})
```

---

## Pattern 2: File Upload Testing

**Risk:** MEDIUM — Story 3.7 (Logo Management). Client validation + Supabase Storage mocking.

### What to Test

| Test Case | Priority |
|---|---|
| Reject files over size limit (10KB for logos) | P0 |
| Reject non-image file types | P0 |
| Successful upload updates entity with new URL | P0 |
| Upload failure shows error, entity unchanged | P1 |
| File replacement (delete old + upload new) | P1 |
| Loading/progress state during upload | P2 |

### Test Structure

```
src/app/admin/systems/__tests__/logo-upload.test.tsx
```

### Example: Client-Side Validation

```tsx
describe('LogoUpload', () => {
  it('should reject files over 10KB', async () => {
    const user = userEvent.setup()
    render(<LogoUpload systemId="1" />, { wrapper: createQueryWrapper() })

    const largeFile = createMockFile({
      name: 'huge-logo.png',
      size: 15_000,
      type: 'image/png',
    })

    const input = screen.getByLabelText(/upload logo/i)
    await user.upload(input, largeFile)

    expect(screen.getByText(/file too large/i)).toBeInTheDocument()
  })

  it('should reject non-image files', async () => {
    const user = userEvent.setup()
    render(<LogoUpload systemId="1" />, { wrapper: createQueryWrapper() })

    const pdfFile = createMockFile({
      name: 'document.pdf',
      size: 5000,
      type: 'application/pdf',
    })

    const input = screen.getByLabelText(/upload logo/i)
    await user.upload(input, pdfFile)

    expect(screen.getByText(/must be an image/i)).toBeInTheDocument()
  })
})
```

### Example: Successful Upload

```tsx
it('should upload valid file and update system logo', async () => {
  server.use(
    http.post('/api/admin/systems/1/logo', () =>
      HttpResponse.json({
        data: { logoUrl: 'https://storage.example.com/logos/1.png' },
        error: null,
      }),
    ),
  )

  const user = userEvent.setup()
  render(<LogoUpload systemId="1" />, { wrapper: createQueryWrapper() })

  const validFile = createMockFile({
    name: 'logo.png',
    size: 5000,
    type: 'image/png',
  })

  const input = screen.getByLabelText(/upload logo/i)
  await user.upload(input, validFile)

  await waitFor(() => {
    expect(screen.getByAltText(/system logo/i)).toHaveAttribute(
      'src',
      expect.stringContaining('logos/1.png'),
    )
  })
})
```

### Supabase Storage Mocking

For unit tests, mock the storage client at module level:

```tsx
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'logos/1.png' }, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/logos/1.png' },
        }),
      }),
    },
  }),
}))
```

---

## Pattern 3: Drag-and-Drop / Reorder Testing

**Risk:** MEDIUM — Story 3.5 (Reorder Systems). Data integrity testing is critical; UI DnD testing is secondary.

### What to Test

| Test Case | Priority |
|---|---|
| Reorder updates `displayOrder` for affected items | P0 |
| Optimistic reorder in cache (instant feedback) | P0 |
| Rollback on server failure | P0 |
| Move to first position | P1 |
| Move to last position | P1 |
| No-op: drop in same position | P2 |

### Test Structure

```
src/lib/admin/mutations/__tests__/reorder-systems.test.ts   ← mutation hook
tests/e2e/admin/reorder-systems.spec.ts                     ← Playwright E2E
```

### Example: Mutation Hook Tests

```tsx
describe('useReorderSystems', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    queryClient.setQueryData(['admin', 'systems'], [
      { id: '1', name: 'Alpha', displayOrder: 0 },
      { id: '2', name: 'Beta', displayOrder: 1 },
      { id: '3', name: 'Gamma', displayOrder: 2 },
    ])
  })

  it('should optimistically reorder items', async () => {
    server.use(
      http.patch('/api/admin/systems/reorder', async () => {
        await delay(100)
        return HttpResponse.json({ data: { success: true }, error: null })
      }),
    )

    const { result } = renderHook(() => useReorderSystems(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ systemId: '3', fromIndex: 2, toIndex: 0 })

    await waitFor(() => {
      const cached = queryClient.getQueryData<System[]>(['admin', 'systems'])
      expect(cached!.map((s) => s.name)).toEqual(['Gamma', 'Alpha', 'Beta'])
    })
  })

  it('should rollback on reorder failure', async () => {
    server.use(
      http.patch('/api/admin/systems/reorder', () =>
        HttpResponse.json(
          { data: null, error: { message: 'Conflict', code: 'CONFLICT' } },
          { status: 409 },
        ),
      ),
    )

    const { result } = renderHook(() => useReorderSystems(), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate({ systemId: '3', fromIndex: 2, toIndex: 0 })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    const cached = queryClient.getQueryData<System[]>(['admin', 'systems'])
    expect(cached!.map((s) => s.name)).toEqual(['Alpha', 'Beta', 'Gamma'])
  })
})
```

### Example: Playwright E2E

```tsx
// tests/e2e/admin/reorder-systems.spec.ts
test('should reorder systems via drag and drop', async ({ page }) => {
  await page.goto('/admin/systems')

  const source = page.getByTestId('system-row-3')
  const target = page.getByTestId('system-row-1')

  await source.dragTo(target)

  const rows = page.getByTestId(/^system-row-/)
  await expect(rows.nth(0)).toContainText('Gamma')
  await expect(rows.nth(1)).toContainText('Alpha')
  await expect(rows.nth(2)).toContainText('Beta')
})
```

### Testing Strategy for DnD

Test the **mutation hook** for data correctness (unit level). Test the **drag interaction** only in E2E (Playwright). Do NOT couple unit tests to DnD library internals — test the outcome (order changed), not the mechanism (drag events fired).

---

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Testing optimistic state too early (before `onMutate` runs) | Use `waitFor` to observe cache change |
| Not seeding QueryClient cache before mutation tests | Always `setQueryData` in `beforeEach` |
| Testing File objects in jsdom (no real File API) | Use `createMockFile` helper with `ArrayBuffer` |
| Drag-and-drop tests flaky in CI | Test mutation hook directly; E2E only for critical reorder path |
| Not disabling retry in test QueryClient | Always `retry: false` in test config |
| Forgetting to clean up MSW handler overrides | Use `afterEach(() => server.resetHandlers())` |
| Testing Supabase through React components | Mock mutation hook in component tests, mock Supabase in hook tests |
| Asserting on exact cache timing | Always use `waitFor`, never synchronous assertions on async state |

---

## Test Level Guidance

| Layer | Test Tool | What to Assert |
|---|---|---|
| Mutation hooks (`useCreateSystem`, etc.) | Vitest + `renderHook` | Cache state, rollback, API calls |
| Query hooks (`useQuery` with `queryOptions`) | Vitest + `renderHook` | Data fetching, error states, loading |
| Components (forms, lists, dialogs) | Vitest + Testing Library | Rendering, user interaction, a11y |
| File upload validation | Vitest + Testing Library | Client-side validation, mock upload |
| Drag-and-drop interaction | Playwright E2E | Visual order, persistence |
| Full CRUD flow | Playwright E2E | End-to-end admin operations |

---

## Rules

1. **Seed QueryClient cache in `beforeEach`** — every optimistic mutation test needs a known starting state
2. **Always `retry: false`** — deterministic test failures, no flaky retries
3. **Test mutation hooks separately from components** — hooks test data, components test UI
4. **Use MSW for API mocking** — consistent, realistic request/response simulation
5. **E2E for DnD only** — drag-and-drop unit tests are fragile; keep them in Playwright
6. **`createMockFile` for all file tests** — jsdom has no real File API
7. **`waitFor` for all async assertions** — never assert synchronously on React Query state
