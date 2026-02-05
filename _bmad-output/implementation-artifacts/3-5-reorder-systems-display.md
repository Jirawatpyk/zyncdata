# Story 3.5: Reorder Systems Display

Status: done

## Story

As an Admin,
I want to reorder systems to change how they appear on the landing page,
so that the most important systems are displayed first.

## Acceptance Criteria (AC)

1. **Given** I am on the Systems management page with multiple systems, **When** I click the up/down arrow buttons on a system row, **Then** the system swaps position with its neighbor and the `display_order` values are updated in the database for all affected systems.
2. **Given** I have reordered the systems, **When** a visitor loads the landing page, **Then** the system cards appear in the new `display_order` order.
3. **Given** I reorder systems, **When** the save operation completes, **Then** I see a success toast confirmation and the list reflects the new order immediately (optimistic update).
4. **Given** I am reordering systems, **When** the first system has no "move up" button and the last system has no "move down" button, **Then** the buttons are disabled at list boundaries.
5. **Given** a reorder fails (network error), **When** the API returns an error, **Then** the list rolls back to its previous order and an error toast is shown.

## Tasks / Subtasks

- [x] Task 1: Add reorder validation schema (AC: #1)
  - [x] 1.1 Add `reorderSystemsSchema` to `src/lib/validations/system.ts`
  - [x] 1.2 Add unit tests for the new schema in `system.test.ts`
- [x] Task 2: Add server mutation `reorderSystems()` (AC: #1, #2)
  - [x] 2.1 Add `reorderSystems()` to `src/lib/systems/mutations.ts`
  - [x] 2.2 Add unit tests in `mutations.test.ts`
- [x] Task 3: Add API route `PATCH /api/systems/reorder` (AC: #1, #5)
  - [x] 3.1 Create `src/app/api/systems/reorder/route.ts`
  - [x] 3.2 Add route tests in `src/app/api/systems/reorder/route.test.ts`
- [x] Task 4: Add React Query mutation hook (AC: #3, #5)
  - [x] 4.1 Add `useReorderSystems()` to `src/lib/admin/mutations/systems.ts`
  - [x] 4.2 Add hook tests in `systems.test.tsx`
- [x] Task 5: Update SystemsList with reorder UI (AC: #1, #3, #4)
  - [x] 5.1 Add move up/down buttons to each system row in `SystemsList.tsx`
  - [x] 5.2 Add unit tests in `SystemsList.test.tsx`
- [x] Task 6: E2E tests (AC: #1-#5)
  - [x] 6.1 Create `tests/e2e/admin-reorder-system.spec.ts`
- [x] Task 7: Guardrail tests (AC: #1)
  - [x] 7.1 Add reorder guardrail tests in `src/app/api/systems/reorder/route.guardrails.test.ts`

## Dev Notes

### UX Approach: Move Up/Down Buttons (NOT Drag-and-Drop)

**Decision:** Use simple ChevronUp/ChevronDown icon buttons instead of a drag-and-drop library.

**Rationale:**
- **Bundle size:** 0 KB added vs ~25-30 KB for @dnd-kit — bundle is ALREADY at 397.81 KB gzip (47.81 KB over 350 KB limit), absolutely cannot add any library
- **Accessibility:** Native `<button>` elements are keyboard-navigable by default (Tab, Enter, Space) — meets WCAG 2.1 AA + 2.5.7 (dragging movements alternative) automatically
- **React 19:** @dnd-kit has open compatibility issues with React 19 (GitHub issue #1654)
- **Touch targets:** Buttons use existing `min-h-11` (44px) standard
- **Simplicity:** ~50 lines of code vs ~150+ for DnD setup

**Future consideration:** If drag-and-drop is desired later (post-Epic 3), evaluate `formkit/drag-and-drop` (~8 KB) or `pragmatic-drag-and-drop` when bundle budget allows. Keyboard alternative (these buttons) would still be required per WCAG 2.5.7.

### API Design: Bulk Reorder Endpoint

Use a dedicated `PATCH /api/systems/reorder` endpoint (NOT individual PATCH per system) to:
- Avoid race conditions with multiple concurrent updates
- Send all affected `display_order` changes in one request
- Reduce network round-trips (swap = 2 systems updated atomically)

**Request body:**
```json
{
  "systems": [
    { "id": "uuid-1", "displayOrder": 0 },
    { "id": "uuid-2", "displayOrder": 1 }
  ]
}
```

**Response:** `{ data: System[], error: null }` — returns full updated system list.

### Swap Logic (Not Full Reorder)

Each button click swaps exactly 2 adjacent systems. The mutation sends only the 2 affected systems with swapped `displayOrder` values. This is simpler and safer than renumbering the entire list.

### Soft-Deleted Systems in Reorder

`getSystems()` returns ALL systems (including deleted). Soft-deleted systems should still be visible in the admin list but:
- Their reorder buttons should be **disabled** (no point reordering a deleted system)
- They should NOT affect the landing page order (already filtered by `getEnabledSystems()`)

### Optimistic Update Pattern

Follow the exact same pattern as `useUpdateSystem()` and `useDeleteSystem()`:
1. `onMutate`: Cancel queries → snapshot → optimistic swap in cache
2. `onSuccess`: Replace with server response
3. `onError`: Rollback to snapshot
4. `onSettled`: Invalidate queries

### ISR Cache Invalidation

Call `revalidatePath('/')` in `reorderSystems()` mutation to bust the landing page ISR cache, same as all other system mutations.

### Project Structure Notes

All new files follow established patterns from Stories 3.2-3.4:

```
src/
├── app/api/systems/
│   └── reorder/
│       ├── route.ts                    # NEW — PATCH handler
│       └── route.test.ts              # NEW — route tests
│       └── route.guardrails.test.ts   # NEW — auth/validation guardrails
├── lib/
│   ├── validations/system.ts          # MODIFY — add reorderSystemsSchema
│   ├── systems/mutations.ts           # MODIFY — add reorderSystems()
│   └── admin/mutations/systems.ts     # MODIFY — add useReorderSystems()
├── app/admin/systems/_components/
│   └── SystemsList.tsx                # MODIFY — add move buttons
tests/
└── e2e/
    └── admin-reorder-system.spec.ts   # NEW — E2E tests
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-3, Story 3.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#API-Patterns]
- [Source: _bmad-output/project-context.md#API-Response-Type]
- [Source: _bmad-output/implementation-artifacts/3-4-delete-system-with-soft-delete.md#Dev-Notes]

---

## Technical Implementation Details

### 1. Validation Schema

**File:** `src/lib/validations/system.ts`

```typescript
// Add to existing file:
export const reorderSystemsSchema = z.object({
  systems: z
    .array(
      z.object({
        id: z.string().uuid('Invalid system ID'),
        displayOrder: z.number().int().min(0, 'Display order must be non-negative'),
      }),
    )
    .min(2, 'At least 2 systems required for reorder')
    .max(100, 'Too many systems in single reorder'),
})

export type ReorderSystemsInput = z.infer<typeof reorderSystemsSchema>
```

### 2. Server Mutation

**File:** `src/lib/systems/mutations.ts`

```typescript
// Add to existing file:
import { getSystems } from '@/lib/systems/queries'

export async function reorderSystems(
  systems: Array<{ id: string; displayOrder: number }>,
): Promise<System[]> {
  const supabase = await createClient()

  // Update each system's display_order
  // Note: These are individual updates, not a DB transaction.
  // For a 2-item swap the inconsistency risk is minimal.
  // If this grows to bulk reorder, consider a Supabase RPC function for atomicity.
  for (const { id, displayOrder } of systems) {
    const { error } = await supabase
      .from('systems')
      .update({ display_order: displayOrder })
      .eq('id', id)

    if (error) throw error
  }

  // Bust ISR cache for landing page
  revalidatePath('/')

  // Return fresh sorted list
  return getSystems()
}
```

**New import:** `getSystems` from `@/lib/systems/queries` — this is a new cross-module dependency within the same domain. No circular dependency (queries does NOT import from mutations).

### 3. API Route

**File:** `src/app/api/systems/reorder/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { reorderSystems } from '@/lib/systems/mutations'
import { reorderSystemsSchema } from '@/lib/validations/system'

export async function PATCH(request: Request) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid JSON body', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    const validated = reorderSystemsSchema.parse(body)
    const systems = await reorderSystems(validated.systems)
    return NextResponse.json({ data: systems, error: null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message ?? 'Validation failed'
      return NextResponse.json(
        { data: null, error: { message, code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { data: null, error: { message: 'Failed to reorder systems', code: 'UPDATE_ERROR' } },
      { status: 500 },
    )
  }
}
```

### 4. React Query Hook

**File:** `src/lib/admin/mutations/systems.ts`

```typescript
// Add to existing file:
interface ReorderMutationContext {
  previous: System[] | undefined
}

export function useReorderSystems() {
  const queryClient = useQueryClient()

  return useMutation<System[], Error, Array<{ id: string; displayOrder: number }>, ReorderMutationContext>({
    mutationFn: async (systems) => {
      const res = await fetch('/api/systems/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systems }),
      })
      return unwrapResponse<System[]>(res)
    },

    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'systems'] })
      const previous = queryClient.getQueryData<System[]>(['admin', 'systems'])

      // Optimistic swap
      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) => {
        if (!old) return []
        const next = [...old]
        for (const u of updates) {
          const idx = next.findIndex((s) => s.id === u.id)
          if (idx !== -1) next[idx] = { ...next[idx], displayOrder: u.displayOrder }
        }
        return next.sort((a, b) => a.displayOrder - b.displayOrder)
      })

      return { previous }
    },

    onSuccess: (serverData) => {
      // Replace optimistic data with real server response
      queryClient.setQueryData<System[]>(['admin', 'systems'], serverData)
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'systems'], context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'systems'] })
    },
  })
}
```

### 5. SystemsList UI Changes

**File:** `src/app/admin/systems/_components/SystemsList.tsx`

Add move up/down buttons to each system row. Pattern:

```tsx
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useReorderSystems } from '@/lib/admin/mutations/systems'
import { toast } from 'sonner'

// Inside SystemsList component:
const reorder = useReorderSystems()

const handleMove = (index: number, direction: 'up' | 'down') => {
  if (!systems) return
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  const current = systems[index]
  const target = systems[targetIndex]

  reorder.mutate(
    [
      { id: current.id, displayOrder: target.displayOrder },
      { id: target.id, displayOrder: current.displayOrder },
    ],
    {
      onSuccess: () => toast.success('Order updated'),
      onError: () => toast.error('Failed to reorder systems'),
    },
  )
}

// In JSX per system row, before Edit/Delete buttons:
<div className="flex items-center gap-1">
  <Button
    variant="ghost"
    size="icon"
    disabled={index === 0 || system.deletedAt != null || reorder.isPending}
    onClick={() => handleMove(index, 'up')}
    aria-label={`Move ${system.name} up`}
    data-testid={`move-up-${system.id}`}
  >
    <ChevronUp className="h-4 w-4" />
  </Button>
  <Button
    variant="ghost"
    size="icon"
    disabled={index === systems.length - 1 || system.deletedAt != null || reorder.isPending}
    onClick={() => handleMove(index, 'down')}
    aria-label={`Move ${system.name} down`}
    data-testid={`move-down-${system.id}`}
  >
    <ChevronDown className="h-4 w-4" />
  </Button>
</div>
```

### 6. Testing Requirements

**Unit tests (Vitest):**
- `system.test.ts`: Validate `reorderSystemsSchema` — valid input, empty array, single item (should fail min 2), invalid UUIDs, negative displayOrder
- `mutations.test.ts`: `reorderSystems()` — happy path (2 systems swapped), Supabase error handling, `revalidatePath('/')` called
- `route.test.ts`: PATCH handler — auth check, validation error, success response, server error
- `systems.test.tsx`: `useReorderSystems()` — optimistic swap, rollback on error, cache invalidation
- `SystemsList.test.tsx`: Move buttons render, disabled at boundaries, disabled for deleted systems, click triggers mutation

**E2E tests (Playwright):**
- Move system down — verify order changes and persists on reload
- Move system up — verify order changes
- First system has disabled "up" button
- Last system has disabled "down" button
- Success toast appears after reorder
- Landing page reflects new order

**Guardrail tests:**
- Unauthenticated request returns 401
- Non-admin role returns 403
- Invalid body returns 400

### 7. Established Patterns to Follow

| Pattern | Reference File | What to Copy |
|---------|---------------|--------------|
| API route structure | `src/app/api/systems/[id]/route.ts` | Auth check → parse → validate → mutate → respond |
| Server mutation | `src/lib/systems/mutations.ts` → `deleteSystem()` | Supabase update → error handling → revalidatePath → return parsed |
| React Query hook | `src/lib/admin/mutations/systems.ts` → `useDeleteSystem()` | Generic types, onMutate/onSuccess/onError/onSettled pattern |
| Component buttons | `SystemsList.tsx` → DeleteSystemDialog trigger | Button placement in row, data-testid pattern |
| Validation schema | `src/lib/validations/system.ts` → `deleteSystemSchema` | Zod object with `.uuid()` validation |
| Route tests | `src/app/api/systems/[id]/route.test.ts` | Mock structure, auth/validation/error test cases |
| Hook tests | `src/lib/admin/mutations/systems.test.tsx` | QueryClient setup, spy patterns, optimistic/rollback tests |
| E2E tests | `tests/e2e/admin-delete-system.spec.ts` | Login flow, page navigation, action, assertion |

### 8. Previous Story Intelligence (from Story 3.4)

**Critical lessons to apply:**
- `vi.useFakeTimers()` in `beforeEach` can cause timeout issues — use `vi.useRealTimers()` at start of data-fetching tests
- Verify rollback via `setQueryDataSpy` (not final cache state) — `onSettled` invalidation clears cache after `onError`
- `e.preventDefault()` is NOT needed here (no AlertDialogAction) — regular Button clicks are fine
- `database.ts` may have corruption from `supabase gen types` — check line 1 after regeneration
- shadcn component installs may overwrite customized files — do NOT install new shadcn components for this story (not needed)
- Test mock objects must include `deletedAt` field (added in Story 3.4)

### 9. Anti-Pattern Prevention

- **DO NOT** install @dnd-kit or any drag-and-drop library — bundle budget is too tight
- **DO NOT** create a separate dialog/modal for reorder — inline buttons are sufficient
- **DO NOT** renumber all display_order values on every swap — only update the 2 affected systems
- **DO NOT** filter out soft-deleted systems from reorder list — they stay visible in admin, just disable their buttons
- **DO NOT** use `dark:` Tailwind classes — ESLint rule `local/no-dark-classes` will block
- **DO NOT** use `getSession()` for auth — use `requireApiAuth('admin')` which calls `getUser()`
- **DO NOT** add `display_order` to `updateSystemSchema` — reorder has its own dedicated schema and endpoint
- **DO NOT** create barrel files — import directly from source

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No debug issues encountered. All tests passed on first implementation.

### Completion Notes List

- **Task 1:** Added `reorderSystemsSchema` with array min(2)/max(100), UUID validation, non-negative int displayOrder. 15 new tests (56 total in system.test.ts).
- **Task 2:** Added `reorderSystems()` mutation — iterates over systems array, updates `display_order` per system via Supabase, calls `revalidatePath('/')`, returns `getSystems()` for fresh list. 5 new tests (18 total in mutations.test.ts).
- **Task 3:** Created `PATCH /api/systems/reorder` route — auth guard → JSON parse → Zod validation → mutation → response. 11 tests in route.test.ts.
- **Task 4:** Added `useReorderSystems()` hook with optimistic swap (sorts by displayOrder), rollback on error, cache invalidation on settled. Follows exact same pattern as useDeleteSystem. 7 new tests (34 total in systems.test.tsx).
- **Task 5:** Added ChevronUp/ChevronDown buttons per system row. Disabled at boundaries (first/last), disabled for soft-deleted systems, disabled during pending mutation. Toast on success/error. 7 new tests (24 total in SystemsList.test.tsx).
- **Task 6:** E2E tests cover: API auth protection, move down flow, boundary button disabled states, success toast, persist on reload, landing page order reflection.
- **Task 7:** 7 guardrail tests cover P0 (auth before mutation, 401/403 enforcement) and P1 (response format invariants).

### Change Log

- 2026-02-05: Story 3.5 implemented — reorder systems with move up/down buttons, optimistic updates, rollback on error. 793 tests pass across 76 files. Zero regressions.
- 2026-02-05: Code review fixes — added duplicate ID validation (.refine()), atomicity warning comment, extracted shared SYSTEM_SELECT_COLUMNS, strengthened E2E order assertions.

### Code Review Notes

- **Unrelated git change:** `src/app/auth/mfa-enroll/_components/MfaEnrollForm.tsx` has an unrelated "Sign out" link addition in the working tree. This is NOT part of story 3.5 and should be committed separately or under its own story.

### File List

**New files:**
- `src/app/api/systems/reorder/route.ts`
- `src/app/api/systems/reorder/route.test.ts`
- `src/app/api/systems/reorder/route.guardrails.test.ts`
- `tests/e2e/admin-reorder-system.spec.ts`

**Modified files:**
- `src/lib/validations/system.ts` — added reorderSystemsSchema + ReorderSystemsInput type + duplicate ID .refine()
- `src/lib/validations/system.test.ts` — added 17 reorder schema tests (incl. duplicate ID)
- `src/lib/systems/queries.ts` — exported SYSTEM_SELECT_COLUMNS (was private)
- `src/lib/systems/mutations.ts` — added reorderSystems() + imported shared SYSTEM_SELECT_COLUMNS from queries
- `src/lib/systems/mutations.test.ts` — added 5 reorderSystems tests + getSystems mock
- `src/lib/admin/mutations/systems.ts` — added useReorderSystems() hook
- `src/lib/admin/mutations/systems.test.tsx` — added 7 useReorderSystems tests
- `src/app/admin/systems/_components/SystemsList.tsx` — added move up/down buttons, reorder hook, toast
- `src/app/admin/systems/_components/SystemsList.test.tsx` — added 7 reorder UI tests
