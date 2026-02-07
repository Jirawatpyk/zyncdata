# React Query Setup Patterns — Admin Routes

**Scope:** `/admin/` routes only. React Query is NOT used in public or auth routes.
**Version:** @tanstack/react-query v5.x
**Origin:** Epic 2 Retrospective Action Item DOC1

---

## Provider Setup

QueryProvider is mounted in `src/app/admin/layout.tsx` — NOT in root layout.

**Provider:** `src/components/providers/query-provider.tsx`

Uses the TanStack v5 recommended `isServer` singleton pattern:
- **Server:** Always creates a new QueryClient (prevents cross-request data leakage)
- **Browser:** Reuses module-level singleton (prevents state loss during React Suspense)

Do NOT use `useState(() => new QueryClient())` — this is the older pattern that breaks with Suspense.

### Default Configuration

| Option | Value | Rationale |
|---|---|---|
| `staleTime` | 60s | Prevents immediate refetch after SSR hydration |
| `gcTime` | 5 min | Standard garbage collection for admin CMS data |
| `retry` (queries) | 1 | Single retry for transient errors |
| `retry` (mutations) | 0 | Never auto-retry mutations (prevents duplicates) |
| `refetchOnWindowFocus` | false | CMS editing context — don't disrupt user work |

---

## Query Key Conventions

All admin query keys start with `'admin'` prefix:

```
['admin', 'systems']                    — all systems list
['admin', 'systems', systemId]          — single system
['admin', 'systems', { visible: true }] — filtered systems
['admin', 'content']                    — all content sections
['admin', 'content', contentId]         — single content item
```

Bulk invalidation: `queryClient.invalidateQueries({ queryKey: ['admin'] })` clears everything.

### queryOptions() Factory Pattern

Define queries in `src/lib/admin/queries/{domain}.ts`:

```tsx
import { queryOptions } from '@tanstack/react-query'

export function systemsQueryOptions() {
  return queryOptions({
    queryKey: ['admin', 'systems'] as const,
    queryFn: () => queryFetch<System[]>('/api/admin/systems'),
  })
}

export function systemQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['admin', 'systems', id] as const,
    queryFn: () => queryFetch<System>(`/api/admin/systems/${id}`),
  })
}
```

Benefits: type-safe keys, single source of truth for key + fetch + config.

---

## ApiResponse Integration

The project uses `{ data, error }` (ApiResponse<T>) — React Query expects throws on error. Bridge with an adapter:

**File:** `src/lib/admin/queries/api-adapter.ts`

```tsx
import type { ApiResponse } from '@/lib/api/types'

export class ApiError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (response.error) {
    throw new ApiError(response.error.message, response.error.code)
  }
  return response.data as T
}
```

---

## Mutation Patterns — Optimistic Updates

### Structure

```
onMutate  → cancel queries → snapshot → optimistic update → return context
onSuccess → replace optimistic data with server response
onError   → rollback to snapshot
onSettled → invalidate queries (always refetch for consistency)
```

### Add (Optimistic Insert)

```tsx
onMutate: async (newItem) => {
  await queryClient.cancelQueries({ queryKey: ['admin', 'systems'] })
  const previous = queryClient.getQueryData<System[]>(['admin', 'systems'])
  const optimistic = { ...newItem, id: `temp-${Date.now()}` }
  queryClient.setQueryData<System[]>(['admin', 'systems'],
    (old) => [...(old ?? []), optimistic as System])
  return { previous, optimistic }
}
```

### Edit (Optimistic Update)

```tsx
onMutate: async (updates) => {
  await queryClient.cancelQueries({ queryKey: ['admin', 'systems', id] })
  const previous = queryClient.getQueryData<System>(systemQueryOptions(id).queryKey)
  if (previous) {
    queryClient.setQueryData<System>(systemQueryOptions(id).queryKey,
      { ...previous, ...updates })
  }
  return { previous }
}
```

### Delete (Optimistic Remove)

```tsx
onMutate: async (id) => {
  await queryClient.cancelQueries({ queryKey: ['admin', 'systems'] })
  const previous = queryClient.getQueryData<System[]>(['admin', 'systems'])
  queryClient.setQueryData<System[]>(['admin', 'systems'],
    (old) => old?.filter((s) => s.id !== id) ?? [])
  return { previous }
}
```

---

## Hydration (Optional)

For admin pages that benefit from server-side prefetching:

```tsx
// Server Component (page.tsx)
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

export default async function AdminSystemsPage() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['admin', 'systems'],
    queryFn: () => queryFetch<System[]>('/api/admin/systems'),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SystemsList />
    </HydrationBoundary>
  )
}
```

**When to use:** Only when instant content display on initial navigation matters. For most admin CMS pages, client-side `useQuery` with loading skeletons is simpler and sufficient.

---

## File Structure for Epic 3

```
src/
├── components/providers/
│   └── query-provider.tsx          ← Updated (isServer singleton)
├── lib/admin/queries/
│   ├── api-adapter.ts              ← ApiError + unwrapResponse
│   ├── systems.ts                  ← queryOptions for systems
│   └── content.ts                  ← queryOptions for content
├── lib/admin/mutations/
│   ├── systems.ts                  ← useCreateSystem, useUpdateSystem, useDeleteSystem
│   └── content.ts                  ← useCreateContent, useUpdateContent, useDeleteContent
└── app/admin/
    └── layout.tsx                  ← QueryProvider wrapper (scoped)
```

---

## Mutation Invocation — `mutateAsync` + try/catch (MANDATORY)

**Origin:** Epic 4 Retrospective Action Item P2 — Story 4-2 found 4 components calling `mutateAsync` without try/catch, causing unhandled promise rejections with no user feedback.

### Rule: Always wrap `mutateAsync` in try/catch

`mutateAsync` returns a promise that **rejects on error**. Unlike `mutate` (fire-and-forget with `onError` callback), `mutateAsync` requires explicit error handling at the call site.

### Correct Pattern

```tsx
async function handleSave() {
  try {
    await updateMutation.mutateAsync(formData)
    toast.success('Saved successfully')
    onClose()
  } catch {
    // onError callback in mutation definition handles rollback + toast
    // try/catch prevents unhandled promise rejection
    // Add call-site-specific recovery here if needed (e.g., keep dialog open)
  }
}
```

### Anti-Pattern (NEVER do this)

```tsx
// BAD: unhandled promise rejection if mutation fails
async function handleSave() {
  await updateMutation.mutateAsync(formData) // 💥 rejects with no catch
  toast.success('Saved successfully')
  onClose()
}
```

### When to use `mutateAsync` vs `mutate`

| Use case | Method | Why |
|---|---|---|
| Need to await completion (sequential logic, close dialog after success) | `mutateAsync` + try/catch | Must handle rejection |
| Fire-and-forget (button click, toggle) | `mutate` | `onError` callback handles errors |
| Need return value from mutation | `mutateAsync` + try/catch | Only `mutateAsync` returns data |

### Toast on Validation Failure

When mutation `onError` shows a generic toast, the call-site catch block can add specific recovery:

```tsx
catch {
  // Mutation onError already shows toast — no duplicate needed
  // But keep dialog open so user can fix and retry:
  setIsSubmitting(false)
}
```

---

## Rules

1. **NEVER import React Query outside `/admin/` routes** — project-context.md rule
2. **All query keys start with `'admin'`** — enables bulk invalidation
3. **Use `queryOptions()` factories** — not raw query key arrays
4. **Mutations always use optimistic update pattern** — cancel → snapshot → update → rollback on error
5. **Bridge ApiResponse with `unwrapResponse()`** — React Query needs throws for error handling
6. **No `useState` for QueryClient** — use `isServer` singleton pattern
7. **`mutateAsync` MUST be wrapped in try/catch** — prevents unhandled promise rejections (Epic 4 P2)
