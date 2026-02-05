# Story 3.6: Toggle System Visibility

Status: done

## Story

As an Admin,
I want to enable or disable system visibility on the landing page,
so that I can control which systems are publicly visible without deleting them.

## Acceptance Criteria (AC)

1. **Given** I am on the Systems management page, **When** I toggle the "Enabled" switch on a system, **Then** the system's `enabled` status is updated in the database **And** I see a success toast confirmation.
2. **Given** a system is disabled (`enabled: false`), **When** a visitor loads the landing page, **Then** the disabled system does not appear in the card grid.
3. **Given** a system is re-enabled (`enabled: true`), **When** a visitor loads the landing page, **Then** the system reappears in its correct `display_order` position.
4. **Given** a system is soft-deleted (`deletedAt != null`), **When** I view the Systems management page, **Then** the toggle switch is disabled and cannot be used (must use Edit form to recover instead).
5. **Given** I toggle a system off, **When** the toggle API fails (network error), **Then** the toggle reverts to its previous state and an error toast is shown.

## Tasks / Subtasks

- [x] Task 1: Add `toggleSystemSchema` validation (AC: #1)
  - [x] 1.1 Add `toggleSystemSchema` to `src/lib/validations/system.ts`
  - [x] 1.2 Add unit tests in `system.test.ts`
- [x] Task 2: Add server mutation `toggleSystem()` (AC: #1, #2, #3)
  - [x] 2.1 Add `toggleSystem()` to `src/lib/systems/mutations.ts`
  - [x] 2.2 Add unit tests in `mutations.test.ts`
- [x] Task 3: Add API route `PATCH /api/systems/[id]/toggle` (AC: #1, #5)
  - [x] 3.1 Create `src/app/api/systems/[id]/toggle/route.ts`
  - [x] 3.2 Add route tests in `src/app/api/systems/[id]/toggle/route.test.ts`
- [x] Task 4: Add React Query mutation hook `useToggleSystem()` (AC: #1, #5)
  - [x] 4.1 Add `useToggleSystem()` to `src/lib/admin/mutations/systems.ts`
  - [x] 4.2 Add hook tests in `systems.test.tsx`
- [x] Task 5: Add toggle Switch UI to SystemsList (AC: #1, #4)
  - [x] 5.1 Replace static Enabled/Disabled badge with interactive Switch in `SystemsList.tsx`
  - [x] 5.2 Update 3 existing tests in `SystemsList.test.tsx` that assert "Enabled"/"Disabled" text (now "Visible"/"Hidden")
  - [x] 5.3 Add new toggle-specific unit tests in `SystemsList.test.tsx`
- [x] Task 6: E2E tests (AC: #1-#5)
  - [x] 6.1 Create `tests/e2e/admin-toggle-system.spec.ts`
- [x] Task 7: Guardrail tests (AC: #1)
  - [x] 7.1 Create `src/app/api/systems/[id]/toggle/route.guardrails.test.ts`

## Dev Notes

### Toggle vs Soft Delete — IMPORTANT DISTINCTION

Story 3.4 (Delete) sets BOTH `enabled: false` AND `deleted_at`. Story 3.6 (Toggle) sets ONLY `enabled` — it must **never** touch `deleted_at`.

| Action | `enabled` | `deleted_at` | Recovery |
|--------|-----------|-------------|----------|
| Toggle off | `false` | unchanged (stays `null`) | Toggle back on |
| Toggle on | `true` | unchanged (stays `null`) | N/A |
| Soft delete (3.4) | `false` | timestamp set | Edit form → enable → auto-clears `deleted_at` |

The existing `updateSystem()` mutation has a recovery path: when `enabled === true`, it auto-clears `deleted_at: null`. **Do NOT use `updateSystem()` for toggle** — create a dedicated `toggleSystem()` mutation that only updates `enabled` and never touches `deleted_at`.

### Why a Dedicated Toggle Endpoint (Not Reusing PATCH /api/systems/[id])

The existing PATCH endpoint uses `updateSystemSchema` which requires `name`, `url`, `description`, and `enabled` — all mandatory fields. A toggle only changes `enabled`. Creating a dedicated `PATCH /api/systems/[id]/toggle` endpoint with a minimal schema (`{ enabled: boolean }`) avoids:
- Sending unnecessary data over the network
- Requiring the client to know all current field values just to flip a boolean
- Accidentally overwriting fields with stale data

### No Confirmation Dialog Needed

Toggle is non-destructive — systems can be toggled back immediately. No AlertDialog/confirmation needed (unlike delete). Use a simple shadcn `Switch` component.

### Two Toggle Paths — Inline Switch vs Edit Form

After this story, there are TWO ways to change `enabled`:
1. **Inline Switch** (this story) — uses `useToggleSystem()` → `PATCH /api/systems/[id]/toggle` → `toggleSystem()`. Only changes `enabled`. Fast, one-click.
2. **Edit form Switch** (Story 3.3) — uses `useUpdateSystem()` → `PATCH /api/systems/[id]` → `updateSystem()`. Changes `enabled` AND auto-clears `deleted_at` when `enabled: true` (recovery path).

The Edit form's enabled Switch should remain unchanged. It serves a different purpose: full system editing with soft-delete recovery. The inline Switch is for quick visibility toggling only.

### Soft-Deleted Systems — Toggle Disabled

When `system.deletedAt != null`, the Switch must be disabled. A deleted system is already `enabled: false`, and re-enabling requires going through the Edit form (which has the recovery path that auto-clears `deleted_at`). Toggling a deleted system back to `enabled: true` without clearing `deleted_at` would create an inconsistent state.

### Optimistic Update Pattern

Follow the exact same pattern as `useDeleteSystem()` and `useReorderSystems()`:
1. `onMutate`: Cancel queries → snapshot → optimistic toggle in cache
2. `onSuccess`: Replace with server response
3. `onError`: Rollback to snapshot
4. `onSettled`: Invalidate queries

### ISR Cache Invalidation

Call `revalidatePath('/')` in `toggleSystem()` to bust the landing page ISR cache, same as all other system mutations.

### Switch Component — Touch Target Warning

shadcn `Switch` is already installed at `src/components/ui/switch.tsx` (used in EditSystemDialog). No new component installation needed.

**Touch target issue:** The default Switch is only `h-[1.15rem]` (~18px tall) — well below the 44px minimum. The Switch itself doesn't need to be 44px, but the **clickable row area** around it must meet the target. Wrap the Switch + label in a container with sufficient padding (e.g., `py-2` for 16px vertical padding on a ~18px element = ~50px total touch height), or ensure the system row's `py-3` padding already covers it. Do NOT resize the Switch primitive itself — that would break its visual design.

### Project Structure Notes

All new files follow established patterns from Stories 3.2-3.5:

```
src/
├── app/api/systems/[id]/
│   └── toggle/
│       ├── route.ts                    # NEW — PATCH handler
│       ├── route.test.ts              # NEW — route tests
│       └── route.guardrails.test.ts   # NEW — auth/validation guardrails
├── lib/
│   ├── validations/system.ts          # MODIFY — add toggleSystemSchema
│   ├── systems/mutations.ts           # MODIFY — add toggleSystem()
│   └── admin/mutations/systems.ts     # MODIFY — add useToggleSystem()
├── app/admin/systems/_components/
│   └── SystemsList.tsx                # MODIFY — add Switch toggle
tests/
└── e2e/
    └── admin-toggle-system.spec.ts    # NEW — E2E tests
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-3, Story 3.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#Systems-Table-Schema]
- [Source: _bmad-output/project-context.md#API-Response-Type]
- [Source: _bmad-output/implementation-artifacts/3-4-delete-system-with-soft-delete.md#Dev-Notes]
- [Source: _bmad-output/implementation-artifacts/3-5-reorder-systems-display.md#Dev-Notes]

---

## Technical Implementation Details

### 1. Validation Schema

**File:** `src/lib/validations/system.ts`

```typescript
// Add to existing file:
export const toggleSystemSchema = z.object({
  id: z.string().uuid('Invalid system ID'),
  enabled: z.boolean(),
})

export type ToggleSystemInput = z.infer<typeof toggleSystemSchema>
```

### 2. Server Mutation

**File:** `src/lib/systems/mutations.ts`

```typescript
// Add to existing file:

/**
 * Toggle system visibility (enabled/disabled).
 * ONLY updates `enabled` — does NOT touch `deleted_at`.
 * Use this for simple visibility toggle, NOT for soft-delete recovery.
 * Revalidates ISR cache for landing page.
 */
export async function toggleSystem(id: string, enabled: boolean): Promise<System> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('systems')
    .update({ enabled })
    .eq('id', id)
    .select(SYSTEM_SELECT_COLUMNS)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('System not found')
    }
    throw error
  }

  // Bust ISR cache for landing page
  revalidatePath('/')

  return systemSchema.parse(toCamelCase<System>(data))
}
```

**Key difference from `updateSystem()`:** No `deleted_at` logic. No `toSnakeCase()` needed since we're passing a simple `{ enabled }` object directly.

### 3. API Route

**File:** `src/app/api/systems/[id]/toggle/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { toggleSystem } from '@/lib/systems/mutations'
import { toggleSystemSchema } from '@/lib/validations/system'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const { id } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid JSON body', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    const validated = toggleSystemSchema.parse({ id, ...(body as Record<string, unknown>) })
    const system = await toggleSystem(validated.id, validated.enabled)

    return NextResponse.json({ data: system, error: null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message ?? 'Validation failed'
      return NextResponse.json(
        { data: null, error: { message, code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { data: null, error: { message: 'System not found', code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { data: null, error: { message: 'Failed to toggle system visibility', code: 'UPDATE_ERROR' } },
      { status: 500 },
    )
  }
}
```

### 4. React Query Hook

**File:** `src/lib/admin/mutations/systems.ts`

```typescript
// Add to existing file:
interface ToggleMutationContext {
  previous: System[] | undefined
}

export function useToggleSystem() {
  const queryClient = useQueryClient()

  return useMutation<System, Error, { id: string; enabled: boolean }, ToggleMutationContext>({
    mutationFn: async ({ id, enabled }) => {
      const res = await fetch(`/api/systems/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      return unwrapResponse<System>(res)
    },

    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'systems'] })
      const previous = queryClient.getQueryData<System[]>(['admin', 'systems'])

      // Optimistic toggle
      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) =>
        old?.map((s) => (s.id === id ? { ...s, enabled } : s)) ?? [],
      )

      return { previous }
    },

    onSuccess: (serverData) => {
      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) =>
        old?.map((s) => (s.id === serverData.id ? serverData : s)) ?? [],
      )
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

Add Switch import and toggle hook. Replace the static Enabled/Disabled badge with an interactive Switch.

```tsx
// Add imports:
import { Switch } from '@/components/ui/switch'
import { useToggleSystem } from '@/lib/admin/mutations/systems'

// Inside SystemsList component:
const toggle = useToggleSystem()

const handleToggle = (systemId: string, enabled: boolean) => {
  toggle.mutate(
    { id: systemId, enabled },
    {
      onSuccess: () => toast.success(enabled ? 'System enabled' : 'System disabled'),
      onError: () => toast.error('Failed to toggle system visibility'),
    },
  )
}
```

**Replace** the Enabled/Disabled badge `<span>` (lines 135-144 in current SystemsList.tsx) with:

```tsx
<div className="flex items-center gap-2">
  <Switch
    checked={system.enabled}
    onCheckedChange={(checked) => handleToggle(system.id, checked)}
    disabled={system.deletedAt != null || toggle.isPending}
    aria-label={`Toggle ${system.name} visibility`}
    data-testid={`toggle-system-${system.id}`}
  />
  <span className="text-xs text-muted-foreground">
    {system.enabled ? 'Visible' : 'Hidden'}
  </span>
</div>
```

**Important:** Keep the "Deleted" badge as-is — it shows when `deletedAt != null` and is separate from the toggle.

### 6. Testing Requirements

**BREAKING TEST CHANGES — Must update 3 existing tests in `SystemsList.test.tsx`:**

The static "Enabled"/"Disabled" badge is being replaced with a Switch + "Visible"/"Hidden" label. These existing tests will FAIL and must be updated:

| Test (line) | Current assertion | New assertion |
|-------------|------------------|---------------|
| `should display enabled badge when enabled` (L127) | `getByText('Enabled')` | `getByText('Visible')` + verify Switch is checked |
| `should display disabled badge when disabled` (L142) | `getByText('Disabled')` | `getByText('Hidden')` + verify Switch is unchecked |
| `should have Edit button positioned before status badges` (L283) | `getByText('Enabled')` | `getByText('Visible')` |

**New unit tests (Vitest):**
- `system.test.ts`: Validate `toggleSystemSchema` — valid input (true/false), invalid UUID, missing `enabled`, non-boolean `enabled`
- `mutations.test.ts`: `toggleSystem()` — happy path (enable), happy path (disable), system not found, Supabase error, `revalidatePath('/')` called, verify `deleted_at` is NOT in the update payload
- `route.test.ts`: PATCH handler — auth check, JSON parse error, validation error (missing enabled), success response, not-found error, server error
- `systems.test.tsx`: `useToggleSystem()` — optimistic toggle, rollback on error, server data replacement, cache invalidation
- `SystemsList.test.tsx`: Switch renders with correct checked state, Switch disabled for deleted systems, Switch triggers toggle mutation, success/error toast, label shows "Visible"/"Hidden"

**E2E tests (Playwright):**
- Toggle system off — verify landing page no longer shows it
- Toggle system on — verify landing page shows it in correct order
- Switch is disabled for soft-deleted systems
- Success toast appears after toggle
- Error rollback (optional — hard to simulate in E2E)

**Guardrail tests:**
- Unauthenticated request returns 401
- Non-admin role returns 403
- Invalid body returns 400
- Missing `enabled` field returns 400

### 7. Established Patterns to Follow

| Pattern | Reference File | What to Copy |
|---------|---------------|--------------|
| API route structure | `src/app/api/systems/[id]/route.ts` | Auth check → parse body → validate → mutate → respond |
| Server mutation | `src/lib/systems/mutations.ts` → `deleteSystem()` | Supabase update → error handling → revalidatePath → return parsed |
| React Query hook | `src/lib/admin/mutations/systems.ts` → `useDeleteSystem()` | Generic types, onMutate/onSuccess/onError/onSettled pattern |
| Optimistic update | `useDeleteSystem()` `onMutate` | Snapshot → optimistic state change → rollback context |
| Validation schema | `src/lib/validations/system.ts` → `deleteSystemSchema` | Simple Zod object with `.uuid()` validation |
| Route tests | `src/app/api/systems/[id]/route.test.ts` | Mock structure, auth/validation/error test cases |
| Hook tests | `src/lib/admin/mutations/systems.test.tsx` | QueryClient setup, spy patterns, optimistic/rollback tests |
| E2E tests | `tests/e2e/admin-reorder-system.spec.ts` | Login flow, page navigation, action, assertion |
| Component tests | `src/app/admin/systems/_components/SystemsList.test.tsx` | Mock hooks, render, assert buttons/state |

### 8. Previous Story Intelligence (from Stories 3.4 & 3.5)

**Critical lessons to apply:**
- `vi.useFakeTimers()` in `beforeEach` can cause timeout issues — use `vi.useRealTimers()` at start of data-fetching tests
- Verify rollback via `setQueryDataSpy` (not final cache state) — `onSettled` invalidation clears cache after `onError`
- `database.ts` may have corruption from `supabase gen types` — check line 1 after regeneration
- shadcn component installs may overwrite customized files — do NOT install new shadcn components (Switch should already exist)
- Test mock objects must include `deletedAt` field (added in Story 3.4)
- `AlertDialogAction` pattern is NOT needed here — this is a simple Switch, no dialog
- `e.preventDefault()` is NOT needed here — Switch `onCheckedChange` is a simple callback
- `unwrapResponse<T>(res)` from `@/lib/admin/queries/api-adapter` is the standard fetch response unwrapper

### 9. Anti-Pattern Prevention

- **DO NOT** reuse the PATCH `/api/systems/[id]` endpoint — it requires all fields via `updateSystemSchema`; create a dedicated toggle endpoint
- **DO NOT** touch `deleted_at` in the toggle mutation — toggle only changes `enabled`
- **DO NOT** use `updateSystem()` server mutation for toggle — it has `deleted_at` recovery logic that would clear soft-delete state incorrectly
- **DO NOT** add a confirmation dialog — toggle is non-destructive and instantly reversible
- **DO NOT** use `dark:` Tailwind classes — ESLint rule `local/no-dark-classes` will block
- **DO NOT** use `getSession()` for auth — use `requireApiAuth('admin')` which calls `getUser()`
- **DO NOT** create barrel files — import directly from source
- **DO NOT** install any new shadcn components — Switch should already exist from Story 3.2
- **DO NOT** filter soft-deleted systems from the toggle list — they stay visible in admin, just disable their Switch
- **DO NOT** set `updated_at` manually — database trigger `update_systems_updated_at` handles it

### 10. Critical Implementation Rules

1. **Next.js 16 async params:** `const { id } = await params` in route handlers
2. **Validate before mutation:** Parse with Zod schema, never trust raw input
3. **Snapshot before optimistic update:** Save previous cache state for rollback
4. **Call `revalidatePath('/')`** in every server mutation that changes data
5. **Convert snake_case ↔ camelCase** only in data access layer (`src/lib/systems/`)
6. **No `dark:` Tailwind classes** — ESLint rule enforces
7. **Min 44px touch targets** — Switch is only ~18px tall; the surrounding row padding (`py-3`) provides the 44px touch area. Do NOT resize the Switch primitive
8. **`sr-only` text** via `aria-label` on Switch for accessibility
9. **Test with `vi.mock()` / `vi.fn()` / `vi.spyOn()`** — never Jest syntax
10. **`import { toast } from 'sonner'`** — not from shadcn/ui
11. **`unwrapResponse<T>(res)`** from `@/lib/admin/queries/api-adapter`
12. **API response format:** Always `{ data: T | null, error: { message, code } | null }`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

No issues encountered. All tasks completed in a single session without HALTs.

### Completion Notes List

- Task 1: Added `toggleSystemSchema` (Zod: `{ id: uuid, enabled: boolean }`) and `ToggleSystemInput` type. 7 unit tests pass.
- Task 2: Added `toggleSystem(id, enabled)` mutation — only updates `enabled`, never touches `deleted_at`. Calls `revalidatePath('/')`. 7 unit tests pass.
- Task 3: Created `PATCH /api/systems/[id]/toggle/route.ts` with auth guard, JSON parse, Zod validation, error handling. 11 unit tests pass.
- Task 4: Added `useToggleSystem()` hook with optimistic toggle, rollback on error, server data replacement, cache invalidation. 8 unit tests pass (including optimistic/rollback guardrails).
- Task 5: Replaced static `Enabled/Disabled` badge with interactive `Switch` component + `Visible/Hidden` label. Switch disabled for soft-deleted systems. Updated 3 existing tests, added 4 new tests. 28 total component tests pass.
- Task 6: Created E2E test file with 5 test cases covering toggle on/off, landing page visibility, success toast, and soft-deleted Switch disabled.
- Task 7: Created guardrail tests (8 tests) covering auth order enforcement, 401/403, validation 400, response format, and 500 error.

### Change Log

- 2026-02-06: Story 3.6 implemented — Toggle System Visibility (all 7 tasks complete, 841 tests pass across 78 files)
- 2026-02-06: Code review fixes — M1: scoped toggle.isPending to only disable the active switch (not all switches); M4: updated File List with sprint-status.yaml

### File List

**New files:**
- `src/app/api/systems/[id]/toggle/route.ts` — PATCH handler for toggle endpoint
- `src/app/api/systems/[id]/toggle/route.test.ts` — 11 route unit tests
- `src/app/api/systems/[id]/toggle/route.guardrails.test.ts` — 8 guardrail tests
- `tests/e2e/admin-toggle-system.spec.ts` — 5 E2E test cases

**Modified files:**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — updated story 3.6 status
- `src/lib/validations/system.ts` — added `toggleSystemSchema`, `ToggleSystemInput`
- `src/lib/validations/system.test.ts` — added 7 tests for `toggleSystemSchema`
- `src/lib/systems/mutations.ts` — added `toggleSystem()` function
- `src/lib/systems/mutations.test.ts` — added 7 tests for `toggleSystem()`
- `src/lib/admin/mutations/systems.ts` — added `useToggleSystem()` hook, `ToggleMutationContext`
- `src/lib/admin/mutations/systems.test.tsx` — added 8 tests for `useToggleSystem()`
- `src/app/admin/systems/_components/SystemsList.tsx` — replaced Enabled/Disabled badge with Switch + Visible/Hidden
- `src/app/admin/systems/_components/SystemsList.test.tsx` — updated 3 tests, added 4 new toggle tests
