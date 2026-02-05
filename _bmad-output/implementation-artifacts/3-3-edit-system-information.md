# Story 3.3: Edit System Information

Status: done

## Story

As an Admin,
I want to edit existing system information (name, URL, description, enabled status),
So that I can keep portfolio data accurate and up-to-date.

## Scope

**IN SCOPE:**
- Edit name, URL, description, enabled toggle
- Pre-populate form with current system data
- Validation (required fields, URL format)
- Optimistic updates with rollback
- Toast notifications (success/error)

**OUT OF SCOPE (deferred to other stories):**
- Logo upload/change → Story 3.7
- Display order change → Story 3.5
- System deletion → Story 3.4

## Acceptance Criteria

1. **Given** I am on the Systems management page **When** I click "Edit" on a system **Then** the edit form opens pre-populated with the system's current data

2. **Given** I modify system fields **When** I save the changes **Then** the system record is updated in the database **And** I see a success confirmation message **And** the CMS save operation completes within 1 second (NFR-P3)

3. **Given** I clear a required field (name or URL) **When** I attempt to save **Then** I see validation errors and the form is not submitted

4. **Given** the system was updated **When** a visitor loads the landing page **Then** the updated information is reflected on the system card

5. **Given** I open the edit dialog but make no changes **When** I view the Save button **Then** the button is disabled (no unnecessary API calls)

## Tasks / Subtasks

- [x] Task 1: Create update validation schema (AC: #3)
  - [x] 1.1 Add `updateSystemSchema` to `src/lib/validations/system.ts` — input validation with required `id`
  - [x] 1.2 Add `UpdateSystemInput` type export (z.infer)
  - [x] 1.3 Add unit tests for schema validation

- [x] Task 2: Create system update mutation hook with optimistic updates (AC: #2)
  - [x] 2.1 Add `useUpdateSystem()` hook to `src/lib/admin/mutations/systems.ts`
  - [x] 2.2 Implement optimistic update pattern: snapshot → update → rollback on error
  - [x] 2.3 Add unit tests for mutation hook

- [x] Task 3: Create API PATCH endpoint (AC: #2, #4)
  - [x] 3.1 Create `src/app/api/systems/[id]/route.ts` with PATCH handler
  - [x] 3.2 Implement `updateSystem()` function in `src/lib/systems/mutations.ts` (server-side)
  - [x] 3.3 Return updated system with all fields
  - [x] 3.4 Call `revalidatePath('/')` to bust ISR cache for landing page
  - [x] 3.5 Add unit tests for API route (success, validation error, not found, auth error)

- [x] Task 4: Create EditSystemDialog component (AC: #1, #2, #3, #5)
  - [x] 4.1 Create `src/app/admin/systems/_components/EditSystemDialog.tsx` — `'use client'`
  - [x] 4.2 Follow AddSystemDialog pattern with modifications (see Dev Notes)
  - [x] 4.3 Pre-populate form with current system data via `defaultValues`
  - [x] 4.4 Disable "Save Changes" button when `!form.formState.isDirty`
  - [x] 4.5 Reset form to original values on dialog close
  - [x] 4.6 Add comprehensive unit tests including "no changes" scenario

- [x] Task 5: Integrate Edit button into SystemsList (AC: #1)
  - [x] 5.1 Add EditSystemDialog to each system row in `SystemsList.tsx`
  - [x] 5.2 Place Edit button before status badges in the row actions area
  - [x] 5.3 Update tests for integration

- [x] Task 6: Write E2E test for edit system flow (AC: #2, #4, #5)
  - [x] 6.1 Create `tests/e2e/admin-edit-system.spec.ts`
  - [x] 6.2 Test: open dialog, modify fields, submit, verify list updates
  - [x] 6.3 Test: validation errors display correctly
  - [x] 6.4 Test: save button disabled when no changes made

## Dev Notes

### Key Differences from AddSystemDialog

EditSystemDialog follows the same pattern as AddSystemDialog with these modifications:

| Aspect | AddSystemDialog | EditSystemDialog |
|--------|-----------------|------------------|
| Props | `trigger?, onSuccess?` | `system: System, trigger?, onSuccess?` |
| defaultValues | Empty strings | Pre-populated from `system` prop |
| Form reset | Reset to empty on close | Reset to `system` values on close |
| Submit button | Always enabled | Disabled when `!isDirty` |
| Mutation | `useCreateSystem()` | `useUpdateSystem()` |
| API method | POST `/api/systems` | PATCH `/api/systems/[id]` |
| Button text | "Add System" | "Save Changes" |

### Database Trigger — DO NOT manually set `updated_at`

The `systems` table has a trigger `update_systems_updated_at` that **automatically updates** `updated_at` on any UPDATE:

```sql
CREATE TRIGGER update_systems_updated_at
  BEFORE UPDATE ON systems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**IMPORTANT:** Do NOT include `updated_at` in the update payload. The database handles it.

### Existing Infrastructure (EXTEND, don't recreate)

| File | Action |
|------|--------|
| `src/lib/validations/system.ts` | **Add** `updateSystemSchema`, `UpdateSystemInput` |
| `src/lib/systems/mutations.ts` | **Add** `updateSystem()` function |
| `src/lib/admin/mutations/systems.ts` | **Add** `useUpdateSystem()` hook |
| `src/app/api/systems/[id]/route.ts` | **Create** new file with PATCH handler |
| `src/app/admin/systems/_components/SystemsList.tsx` | **Modify** — add EditSystemDialog |

### Validation Schema

```typescript
// src/lib/validations/system.ts — ADD

export const updateSystemSchema = z.object({
  id: z.string().uuid('Invalid system ID'),
  name: z.string().min(1, 'Name required').max(100, 'Name must be 100 characters or less'),
  url: z.string().url('Valid URL required'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  enabled: z.boolean(),
})

export type UpdateSystemInput = z.infer<typeof updateSystemSchema>
```

### API Route — PATCH `/api/systems/[id]`

```typescript
// src/app/api/systems/[id]/route.ts — NEW FILE

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { updateSystem } from '@/lib/systems/mutations'
import { updateSystemSchema } from '@/lib/validations/system'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const { id } = await params
    const body = await request.json()

    // Body should contain: { name, url, description, enabled }
    // ID comes from URL params, NOT body
    const validated = updateSystemSchema.parse({ id, ...body })
    const system = await updateSystem(validated)

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

    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { data: null, error: { message: 'A system with this name already exists', code: 'DUPLICATE_NAME' } },
        { status: 409 },
      )
    }

    return NextResponse.json(
      { data: null, error: { message: 'Failed to update system', code: 'UPDATE_ERROR' } },
      { status: 500 },
    )
  }
}
```

### Server-Side Mutation

```typescript
// src/lib/systems/mutations.ts — ADD

/**
 * Update an existing system in the database.
 * Note: updated_at is auto-set by database trigger — do not include in payload.
 */
export async function updateSystem(input: UpdateSystemInput): Promise<System> {
  const supabase = await createClient()
  const { id, ...updateData } = input

  const { data, error } = await supabase
    .from('systems')
    .update(toSnakeCase(updateData as unknown as Record<string, unknown>))
    .eq('id', id)
    .select(SYSTEM_SELECT_COLUMNS)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('System not found')
    }
    throw error
  }

  revalidatePath('/')
  return systemSchema.parse(toCamelCase<System>(data))
}
```

### React Query Mutation Hook

```typescript
// src/lib/admin/mutations/systems.ts — ADD

interface UpdateMutationContext {
  previous: System[] | undefined
}

export function useUpdateSystem() {
  const queryClient = useQueryClient()

  return useMutation<System, Error, UpdateSystemInput, UpdateMutationContext>({
    mutationFn: async (input) => {
      const { id, ...body } = input
      const res = await fetch(`/api/systems/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), // Body does NOT include id
      })
      return unwrapResponse<System>(res)
    },

    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'systems'] })
      const previous = queryClient.getQueryData<System[]>(['admin', 'systems'])

      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) =>
        old?.map((s) =>
          s.id === updates.id
            ? { ...s, name: updates.name, url: updates.url, description: updates.description ?? null, enabled: updates.enabled }
            : s,
        ) ?? [],
      )

      return { previous }
    },

    onSuccess: (updated) => {
      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) =>
        old?.map((s) => (s.id === updated.id ? updated : s)) ?? [],
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

### EditSystemDialog Component

Create following AddSystemDialog structure with these key differences:

```typescript
// src/app/admin/systems/_components/EditSystemDialog.tsx

interface EditSystemDialogProps {
  system: System           // Required — provides pre-population data
  trigger?: React.ReactNode
  onSuccess?: () => void
}

// Key implementation points:

// 1. Default values from system prop
const form = useForm<FormValues>({
  resolver: zodResolver(updateSystemSchema) as Resolver<FormValues>,
  defaultValues: {
    id: system.id,
    name: system.name,
    url: system.url,
    description: system.description ?? '',
    enabled: system.enabled,
  },
})

// 2. Reset to system values when dialog opens (not empty)
useEffect(() => {
  if (open) {
    form.reset({
      id: system.id,
      name: system.name,
      url: system.url,
      description: system.description ?? '',
      enabled: system.enabled,
    })
  }
}, [open, system, form])

// 3. Disable submit when no changes made
<Button
  type="submit"
  disabled={form.formState.isSubmitting || !form.formState.isDirty}
>
  {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
</Button>

// 4. Default trigger is icon-only button with sr-only text for accessibility
<Button variant="ghost" size="sm" data-testid={`edit-system-${system.id}`}>
  <Pencil className="h-4 w-4" />
  <span className="sr-only">Edit {system.name}</span>
</Button>
```

### SystemsList Integration

Modify the system row to add EditSystemDialog before status badges:

```typescript
// src/app/admin/systems/_components/SystemsList.tsx — MODIFY

import EditSystemDialog from './EditSystemDialog'

// In the systems.map() render, update the row structure:
{systems.map((system) => (
  <div
    key={system.id}
    className="flex items-center justify-between px-4 py-3"
    data-testid={`system-row-${system.id}`}
  >
    {/* Left side: name and URL */}
    <div className="flex flex-col gap-0.5">
      <span className="font-medium text-foreground">{system.name}</span>
      <span className="text-sm text-muted-foreground">{system.url}</span>
    </div>

    {/* Right side: Edit button + status badges */}
    <div className="flex items-center gap-2">
      {/* ADD: Edit button */}
      <EditSystemDialog system={system} />

      {/* EXISTING: Status badges */}
      {system.status && (
        <span className={cn(/* status styling */)}>{system.status}</span>
      )}
      <span className={cn(/* enabled styling */)}>
        {system.enabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  </div>
))}
```

### Test Cases

**Unit Tests (EditSystemDialog.test.tsx):**
1. Renders form pre-populated with system data
2. Shows validation error when name cleared
3. Shows validation error when URL invalid
4. Submit button disabled when no changes made (isDirty = false)
5. Submit button enabled after field modification
6. Calls mutation on valid submit
7. Shows success toast and closes dialog on success
8. Shows error toast and keeps dialog open on failure
9. Resets form to original values on cancel/close

**API Route Tests ([id]/route.test.ts):**
1. Returns 401 for unauthenticated request
2. Returns 403 for non-admin user
3. Returns 400 for validation error (missing name)
4. Returns 404 for non-existent system ID
5. Returns 409 for duplicate name
6. Returns 200 with updated system on success

**E2E Tests (admin-edit-system.spec.ts):**
1. Edit flow: open → modify → save → verify list updates
2. Validation: clear required field → see error
3. No changes: open → don't modify → save button disabled

### Security Considerations

- Auth enforced by `requireApiAuth('admin')` — 401/403 for unauthorized
- RLS policy `systems_admin_all` allows UPDATE for admin/super_admin
- UUID validation on `id` param prevents injection
- Unique constraint on `name` — DB-level duplicate prevention

### Project Structure

```
src/
├── app/
│   ├── api/systems/
│   │   ├── [id]/
│   │   │   ├── route.ts              # NEW
│   │   │   └── route.test.ts         # NEW
│   │   └── route.ts                  # UNCHANGED
│   └── admin/systems/
│       └── _components/
│           ├── EditSystemDialog.tsx      # NEW
│           ├── EditSystemDialog.test.tsx # NEW
│           ├── SystemsList.tsx           # MODIFY
│           └── SystemsList.test.tsx      # MODIFY
├── lib/
│   ├── admin/mutations/
│   │   ├── systems.ts                # MODIFY: add useUpdateSystem
│   │   └── systems.test.tsx          # MODIFY
│   ├── systems/
│   │   ├── mutations.ts              # MODIFY: add updateSystem
│   │   └── mutations.test.ts         # MODIFY
│   └── validations/
│       ├── system.ts                 # MODIFY: add updateSystemSchema
│       └── system.test.ts            # MODIFY
└── tests/e2e/
    └── admin-edit-system.spec.ts     # NEW
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.3]
- [Source: _bmad-output/implementation-artifacts/3-2-add-new-system.md]
- [Source: _bmad-output/implementation-artifacts/react-query-patterns.md]
- [Source: _bmad-output/project-context.md]
- [Source: supabase/migrations/20260204000001_create_systems_table.sql]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- **Task 1:** Added `updateSystemSchema` and `UpdateSystemInput` type to `src/lib/validations/system.ts`. 18 new unit tests for schema validation.
- **Task 2:** Added `useUpdateSystem()` hook with optimistic update pattern (snapshot → optimistic → rollback on error) to `src/lib/admin/mutations/systems.ts`. 10 new unit tests including rollback verification.
- **Task 3:** Created API PATCH endpoint at `src/app/api/systems/[id]/route.ts`. Added `updateSystem()` server mutation with `revalidatePath('/')` for ISR cache busting. 16 unit tests covering auth, validation, not found, duplicate name, and success cases.
- **Task 4:** Created `EditSystemDialog.tsx` following AddSystemDialog pattern with key differences: pre-populated form, submit disabled when `!isDirty`, form resets to original values on close. 18 unit tests including AC coverage.
- **Task 5:** Integrated EditSystemDialog into SystemsList with edit button positioned before status badges. 2 new integration tests.
- **Task 6:** Created comprehensive E2E test file with 12 test cases covering edit flow, validation, disabled save button, and error handling.

### Change Log

- 2026-02-05: Story 3.3 implemented — Edit System Information feature complete
- 2026-02-05: Code review fixes — added JSON parse error handling, updated File List, fixed ESLint warnings

### File List

**New files:**
- `src/app/api/systems/[id]/route.ts`
- `src/app/api/systems/[id]/route.test.ts`
- `src/app/admin/systems/_components/EditSystemDialog.tsx`
- `src/app/admin/systems/_components/EditSystemDialog.test.tsx`
- `tests/e2e/admin-edit-system.spec.ts`
- `tests/support/auth/` — E2E auth state storage directory

**Modified files:**
- `src/lib/validations/system.ts` — added updateSystemSchema, UpdateSystemInput
- `src/lib/validations/system.test.ts` — added 18 tests for updateSystemSchema
- `src/lib/systems/mutations.ts` — added updateSystem() function
- `src/lib/admin/mutations/systems.ts` — added useUpdateSystem() hook
- `src/lib/admin/mutations/systems.test.tsx` — added 10 tests for useUpdateSystem
- `src/app/admin/systems/_components/SystemsList.tsx` — added EditSystemDialog integration
- `src/app/admin/systems/_components/SystemsList.test.tsx` — added 2 integration tests
- `package.json` — dependency updates for E2E fixtures
- `package-lock.json` — lockfile update
- `playwright.config.ts` — auth state storage config
- `tests/e2e/admin-add-system.spec.ts` — refactored to use shared fixtures
- `tests/support/fixtures/merged-fixtures.ts` — added adminPage fixture
- `tests/support/helpers/auth-helper.ts` — E2E auth helpers
- `.gitignore` — added playwright/ directory

