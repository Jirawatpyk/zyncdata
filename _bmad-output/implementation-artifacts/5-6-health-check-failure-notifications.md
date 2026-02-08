# Story 5.6: Health Check Failure Notifications

Status: done

## Story

As an Admin,
I want to be notified when health checks fail and systems go offline,
so that I can respond to outages promptly.

## Acceptance Criteria

1. **Given** a system's status changes to "offline" (failure threshold reached), **When** the status change is detected, **Then** an email notification is sent to designated admin email addresses within 1 minute (NFR-R6, NFR-R8).
2. **Given** a notification is sent, **When** I check the notification content, **Then** it includes: system name, time of failure, last successful check, and error details.
3. **Given** a previously offline system recovers, **When** the status changes back to "online", **Then** a recovery notification is sent to admins.
4. **Given** notifications are configured, **When** I view the notification settings, **Then** I can see which email addresses receive alerts.

## Tasks / Subtasks

<!-- P1 (Epic 4 Retro): SPLITTING THRESHOLD — If this story has 12+ tasks OR touches 4+ architectural layers (e.g., migration + API + UI + tests), it MUST be split into smaller stories before dev begins. Stories exceeding this threshold produce exponentially more defects (ref: Story 4-2 had 16 tasks → 20 issues, 5 HIGH). -->

<!-- THRESHOLD CHECK: 10 tasks, 3 layers (migration + service + integration) — WITHIN threshold -->

- [x] Task 1: Install Resend & create notification service (AC: #1, #2)
  - [x] 1.1 Install `resend` package: `npm install resend`
  - [x] 1.2 Add `RESEND_API_KEY` to `.env.local.example`
  - [x] 1.3 Create `src/lib/health/notifications.ts` with `sendFailureNotification()` and `sendRecoveryNotification()`
  - [x] 1.4 Create Zod schemas for notification payloads in `src/lib/validations/health.ts`
- [x] Task 2: Create notification_settings migration (AC: #4)
  - [x] 2.1 Create migration `supabase/migrations/20260213000001_create_notification_settings.sql`
  - [x] 2.2 Table: `notification_settings` (id UUID PK, notification_emails TEXT[] NOT NULL, notify_on_failure BOOLEAN DEFAULT true, notify_on_recovery BOOLEAN DEFAULT true, created_at, updated_at)
  - [x] 2.3 Add `updated_at` auto-trigger
  - [x] 2.4 RLS: Only authenticated admins can SELECT/UPDATE; service role for INSERT
  - [x] 2.5 Seed with initial row containing empty array `'{}'` for notification_emails
- [x] Task 3: Create notification_log table migration (AC: #1, #2)
  - [x] 3.1 Create migration `supabase/migrations/20260213000002_create_notification_log.sql`
  - [x] 3.2 Table: `notification_log` with all required columns and constraints
  - [x] 3.3 Index: `idx_notification_log_system_id(system_id, sent_at DESC)`
  - [x] 3.4 RLS: Only authenticated admins can SELECT; only service role can INSERT
- [x] Task 4: Regenerate database types (AC: all)
  - [x] 4.1 Manually added `notification_settings` and `notification_log` types to `src/types/database.ts` (Supabase CLI not available locally)
- [x] Task 5: Integrate notifications into health check flow (AC: #1, #3)
  - [x] 5.1 `sendFailureNotification()` called when `failureCount >= threshold AND system.status !== 'offline'` (first-time transition only)
  - [x] 5.2 `sendRecoveryNotification()` called when `system.status === 'offline' AND checkResult.status === 'success'`
  - [x] 5.3 Both wrapped in try/catch — non-blocking, errors logged
- [x] Task 6: Create notification settings query + API route (AC: #4)
  - [x] 6.1 Created `src/lib/health/notification-queries.ts` with `getNotificationSettings()` and `updateNotificationSettings()` (separate file to keep server-client queries distinct from service-client)
  - [x] 6.2 Create API route `src/app/api/admin/notifications/settings/route.ts` (GET + PATCH)
  - [x] 6.3 Validate PATCH body with Zod `updateNotificationSettingsSchema`
- [x] Task 7: Create notification settings UI (AC: #4)
  - [x] 7.1 Create `src/app/admin/analytics/_components/NotificationSettings.tsx` — collapsible panel with email list + toggle switches
  - [x] 7.2 Create React Query mutation hook in `src/lib/admin/mutations/notifications.ts`
  - [x] 7.3 Create React Query query options in `src/lib/admin/queries/notifications.ts`
  - [x] 7.4 Add NotificationSettings to HealthDashboard page (collapsible section at bottom)
- [x] Task 8: Write unit tests (AC: all)
  - [x] 8.1 Test `src/lib/health/notifications.ts` — 11 tests: failure email, recovery email, error handling, no-config-skip, multi-recipient, graceful Resend errors
  - [x] 8.2 Test notification integration in `mutations.ts` — 5 new tests: `sendFailureNotification` on threshold + first transition only, recovery notification, non-blocking
  - [x] 8.3 Test notification settings API route — 8 tests: GET returns config, PATCH validates + updates, 400 on invalid, 500 on error
  - [x] 8.4 Test NotificationSettings component — 11 tests: renders emails, add/remove, toggle switches, save, validation
- [x] Task 9: Write integration + contract tests (AC: all)
  - [x] 9.1 Contract test: Resend mock verifies email payload structure (from, to[], subject, html) — in `notifications.test.ts`
  - [x] 9.2 Integration test: health check failure flow triggers notification — in `mutations.test.ts`
  - [x] 9.3 Integration test: recovery flow triggers recovery notification — in `mutations.test.ts`
- [x] Task 10: Verify all tests pass + bundle budget (AC: all)
  - [x] 10.1 `npm run test` — 1426 tests pass (127 files), +35 from 1391 baseline, zero regressions
  - [x] 10.2 `npm run type-check` — zero errors
  - [x] 10.3 `npm run lint` — zero warnings
  - [x] 10.4 `npm run size` — `/admin/analytics` 206.3 KB / 350 KB budget ✓

<!-- P3 (Epic 4 Retro): INTEGRATION CONTRACT VERIFICATION — This story spans migration files + application validation (notification_settings schema + Zod types + API route validation). Add explicit verification:
- [x] Verify integration contracts: notification_emails TEXT[] → string[], notify_on_failure BOOLEAN → boolean, notification_type TEXT ('failure'|'recovery') → NotificationType, snake_case→camelCase in notification-queries.ts via toCamelCase()
-->

## Dev Notes

### Architecture & Integration Points

**Notification Trigger Location — `src/lib/health/mutations.ts:runAllHealthChecks()`:**
The existing `runAllHealthChecks()` already has the exact transition detection points needed:
- **Line ~190-195:** Recovery path — `if (system.status === 'offline')` after successful check = send recovery notification
- **Line ~200-206:** Failure path — `if (failureCount >= DEFAULT_FAILURE_THRESHOLD)` AND `if (system.status !== 'offline')` = send failure notification (first transition only, not repeat)

Notifications MUST be non-blocking. Wrap all notification calls in try/catch and `console.error` on failure. The health check must never fail because of email delivery issues.

**Email Provider: Resend**
- Install: `npm install resend`
- Free tier: 100 emails/day (sufficient for MVP)
- API pattern: `const resend = new Resend(process.env.RESEND_API_KEY)`
- Send: `const { data, error } = await resend.emails.send({ from, to, subject, html })`
- Error types: `validation_error`, `missing_required_field`, `application_error`
- `to` accepts `string | string[]` — use array for multi-recipient
- No retry needed in our code — Resend SDK handles transient retries internally
- **Graceful skip:** If `RESEND_API_KEY` is not set (local dev), skip email sending with `console.info('[notifications] RESEND_API_KEY not configured, skipping email')` — never crash

**From Address:** Use `notifications@zyncdata.app` or `noreply@zyncdata.app`. Must be a verified domain in Resend dashboard. For development, use Resend's test address `onboarding@resend.dev`.

**Environment Variable:**
```
RESEND_API_KEY=re_xxxxx  # Server-only, never expose to client
```

### Critical Constraints

1. **Service client only** — use `createServiceClient()` from `@/lib/supabase/service` for DB operations in notifications (runs in cron context, no user session)
2. **`server-only`** — `notifications.ts` must import `'server-only'` (runs exclusively on server in cron)
3. **No `console.log`** — use `console.info` for success, `console.error` for failures (Rule 331)
4. **`ApiResponse<T>` wrapper** — all API routes must return `{ data, error }` format (Rule 459)
5. **snake_case → camelCase** — transform in `queries.ts` only, not in `notifications.ts` (service layer works with DB types directly)
6. **Static imports in tests** — NEVER use `await import()` in test cases (D1 lesson: causes 5s+ timeout)
7. **`mutateAsync` + try/catch** — all React Query mutations must use `mutateAsync` wrapped in try/catch (Rule P2)
8. **`cn()` for Tailwind** — never string concatenation
9. **`min-h-11`** — all interactive elements (buttons, inputs) must be 44px min
10. **No `dark:` classes** — ESLint rule `local/no-dark-classes` enforces

### Email Templates

**Failure notification:**
```
Subject: [ALERT] System Offline: {systemName}

Body HTML:
- System: {systemName}
- URL: {systemUrl}
- Status: OFFLINE
- Failure Time: {failureTime}
- Last Successful Check: {lastSuccessfulCheck}  ← query from health_checks table (see below)
- Error: {errorMessage}
- Consecutive Failures: {failureCount}
- Dashboard: {dashboardUrl}
```

**Querying last successful check (AC #2):**
`sendFailureNotification()` must query the last successful health check for context:
```typescript
const { data: lastSuccess } = await supabase
  .from('health_checks')
  .select('checked_at')
  .eq('system_id', systemId)
  .eq('status', 'success')
  .order('checked_at', { ascending: false })
  .limit(1)
  .maybeSingle()
```
Pass `lastSuccess?.checked_at ?? 'Never'` into the email template.

**Recovery notification:**
```
Subject: [RESOLVED] System Online: {systemName}

Body HTML:
- System: {systemName}
- URL: {systemUrl}
- Status: ONLINE (Recovered)
- Recovery Time: {recoveryTime}
- Response Time: {responseTime}ms
- Dashboard: {dashboardUrl}
```

### Notification Settings UI

Place in the Health Dashboard page (`/admin/analytics`) as a collapsible section or settings icon that opens a sheet/dialog. Keep it minimal:
- Email list: text inputs to add/remove email addresses (validate with Zod email schema)
- Toggle: "Notify on failure" (default: true)
- Toggle: "Notify on recovery" (default: true)
- Save button with toast feedback

Use React Query mutation pattern from `react-query-patterns.md`:
```typescript
async function handleSave() {
  try {
    await updateMutation.mutateAsync(formData)
    toast.success('Notification settings saved')
  } catch {
    // onError callback handles toast.error
  }
}
```

### Project Structure Notes

**New files to create:**
```
src/lib/health/notifications.ts           # Email sending service
src/lib/health/notifications.test.ts      # Unit tests
src/lib/admin/mutations/notifications.ts  # React Query mutation
src/lib/admin/queries/notifications.ts    # React Query query options
src/app/api/admin/notifications/settings/route.ts  # Settings API
src/app/admin/analytics/_components/NotificationSettings.tsx       # Settings UI
src/app/admin/analytics/_components/NotificationSettings.test.tsx  # UI tests
supabase/migrations/{timestamp}_create_notification_settings.sql
supabase/migrations/{timestamp}_create_notification_log.sql
```

**Files to modify:**
```
src/lib/health/mutations.ts              # Add notification calls in runAllHealthChecks
src/lib/health/mutations.test.ts         # Add notification integration tests
src/lib/validations/health.ts            # Add notification schemas
src/app/admin/analytics/_components/HealthDashboard.tsx  # Add NotificationSettings section
package.json                              # resend dependency
.env.local / .env.example                # RESEND_API_KEY
```

**DO NOT modify (read-only reference):**
```
src/lib/supabase/service.ts              # Service client factory
src/lib/hooks/useHealthMonitor.ts        # Realtime hook (no changes needed)
src/app/api/cron/health-check/route.ts   # Cron route calls runAllHealthChecks (no changes needed)
```

### Existing Patterns to Follow

**Toast pattern** (from `src/lib/admin/mutations/publish.ts`):
```typescript
onSuccess: () => { toast.success('...') }
onError: () => { toast.error('...') }
```

**Query key pattern:** `['admin', 'notifications', 'settings']`

**Query options pattern** (from `src/lib/admin/queries/health.ts`):
```typescript
export function notificationSettingsQueryOptions() {
  return queryOptions({
    queryKey: ['admin', 'notifications', 'settings'],
    queryFn: async () => {
      const response = await apiGet<NotificationSettings>('/api/admin/notifications/settings')
      return unwrapResponse(response)
    },
    staleTime: 5 * 60 * 1000,  // 5 min (settings rarely change)
  })
}
```

**Supabase service client pattern** (from `src/lib/health/mutations.ts`):
```typescript
const supabase = client ?? createServiceClient()
const { data, error } = await supabase.from('notification_settings').select('*').single()
if (error) throw error
```

**Migration naming:** `{YYYYMMDD}{6-digit-sequence}_description.sql` — e.g. `20260213000001_create_notification_settings.sql`

### Testing Strategy

**Mock Resend** (vi.mock at top-level, static import):
```typescript
import { vi } from 'vitest'

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'test-email-id' }, error: null }),
    },
  })),
}))
```

**Mock boundary chain:**
- Component tests mock `@/lib/admin/queries/notifications` and `@/lib/admin/mutations/notifications`
- API route tests mock `@/lib/health/queries`
- Notification service tests mock `resend` and `@/lib/supabase/service`
- Mutation tests mock `@/lib/health/notifications`

**Key test scenarios:**
1. Failure notification sent only on FIRST offline transition (not on repeated failures)
2. Recovery notification sent only when transitioning FROM offline TO online
3. No notification sent when `notification_emails` is empty array
4. No notification sent when `notify_on_failure`/`notify_on_recovery` is false
5. Notification failure does NOT block health check completion
6. Email payload contains all required fields (system name, time, error, etc.)
7. Notification log record created for both success and failure

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-5-Story-5.6] — AC, user story, technical requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#Section-5] — Code structure, notification architecture
- [Source: _bmad-output/project-context.md#Rules-101-111] — Error handling, API patterns
- [Source: _bmad-output/project-context.md#Rules-200-205] — Realtime architecture
- [Source: _bmad-output/project-context.md#Rule-459] — ApiResponse wrapper mandate
- [Source: _bmad-output/implementation-artifacts/react-query-patterns.md#Rule-7] — mutateAsync + try/catch
- [Source: _bmad-output/implementation-artifacts/5-5-real-time-dashboard-updates.md] — Previous story patterns, Realtime hook, ConnectionStatus
- [Source: NFR-R6] — Notification within 1 minute
- [Source: NFR-R8] — Email delivery to designated admin addresses

### Previous Story Intelligence (5-5)

**Key learnings from Story 5-5:**
- Supabase Realtime already enabled on `systems` table — notifications can leverage same channel for UI alerts
- `useHealthMonitor()` hook already tracks connection state — no changes needed
- Dashboard uses React Query with `staleTime: 30s`, `refetchInterval: 60s` — notification settings can use longer staleTime (5 min)
- ConnectionStatus component already handles 3 states — no changes needed
- Test baseline: 1391 tests across 124 files
- Bundle budget: 206.3 KB / 350 KB for `/admin/analytics` — ~144 KB headroom for notification UI

**Code review fixes from 5-5 to maintain:**
- 30s reconnect timeout on CHANNEL_ERROR (M3 fix)
- Contract test uses `toHaveBeenCalledTimes(1)` not `toHaveBeenCalled()` (M4 fix)
- No redundant `as const` on inner object values (L2 fix)

## Scope Additions

<!-- P4 (Epic 3 Retro): Document unplanned changes in real-time as they happen -->

| Change | Reason | Impact |
|--------|--------|--------|
| (none) | — | — |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Resend mock needed `class MockResend` (not `vi.fn().mockImplementation`) — constructors require class syntax in Vitest
- Supabase CLI not available locally — manually added notification_settings + notification_log types to database.ts

### Completion Notes List

- Installed `resend` package for email delivery (free tier: 100 emails/day)
- Created `notifications.ts` service with failure + recovery email sending, graceful skip when `RESEND_API_KEY` not configured
- Created 2 migrations: `notification_settings` (singleton config) and `notification_log` (audit trail)
- Integrated notification triggers into `runAllHealthChecks()` at exact transition points (first offline + recovery only)
- All notifications non-blocking via try/catch — health check flow never fails due to email issues
- Created API route with Zod validation (GET + PATCH) behind admin auth guard
- Built collapsible NotificationSettings UI panel in Health Dashboard with email management + toggle switches
- Created React Query hooks following existing patterns (mutateAsync + try/catch, invalidation, toast)
- 35 new tests: 11 (notifications service) + 5 (mutation integration) + 8 (API route) + 11 (UI component)
- All 1426 tests pass (127 files), zero regressions, zero type errors, zero lint warnings
- Bundle: `/admin/analytics` 206.3 KB / 350 KB — no change from baseline
- Security checklist: all applicable checks pass, no new external client-side resources

### File List

**New files:**
- `src/lib/health/notifications.ts` — Email notification service (failure + recovery)
- `src/lib/health/notifications.test.ts` — 11 unit tests for notification service
- `src/lib/health/notification-queries.ts` — Server-side queries for notification settings
- `src/lib/admin/queries/notifications.ts` — React Query options for notification settings
- `src/lib/admin/mutations/notifications.ts` — React Query mutation hook for updating settings
- `src/app/api/admin/notifications/settings/route.ts` — API route (GET + PATCH)
- `src/app/api/admin/notifications/settings/route.test.ts` — 8 API route tests
- `src/app/admin/analytics/_components/NotificationSettings.tsx` — Settings UI component
- `src/app/admin/analytics/_components/NotificationSettings.test.tsx` — 11 component tests
- `supabase/migrations/20260213000001_create_notification_settings.sql` — notification_settings table
- `supabase/migrations/20260213000002_create_notification_log.sql` — notification_log table

**Modified files:**
- `src/lib/health/mutations.ts` — Added notification import + calls in recovery/failure paths + select `name`
- `src/lib/health/mutations.test.ts` — Added notification mock + 5 notification integration tests + updated mock data with `name`
- `src/lib/validations/health.ts` — Added notification Zod schemas + types
- `src/types/database.ts` — Added notification_settings + notification_log table types
- `src/app/admin/analytics/_components/HealthDashboard.tsx` — Added NotificationSettings import + render
- `.env.local.example` — Added RESEND_API_KEY
- `package.json` — Added resend dependency
- `package-lock.json` — Lock file updated

<!-- P2 (Epic 3 Retro): Verify File List matches all new/modified/deleted files. Post-commit: run `npm run story-metrics` to cross-check. -->

## Senior Developer Review (AI)

**Reviewer:** Amelia (Dev Agent) — 2026-02-08
**Outcome:** Approved with fixes applied

### Review Summary

| Category | Found | Fixed | Accepted |
|----------|-------|-------|----------|
| HIGH | 1 | 1 | 0 |
| MEDIUM | 5 | 5 | 0 |
| LOW | 4 | 2 | 2 |
| **Total** | **10** | **8** | **2** |

### Issues Fixed

- **H1** `NotificationSettings.tsx` — Remove-email button below 44px min touch target → changed to `min-h-11 min-w-11`
- **M1** `notifications.ts` — XSS in email HTML templates → added `escapeHtml()` utility for all interpolated values
- **M2** `notifications.ts` — `DASHBOARD_URL` checked wrong env var + relative URL fallback useless in email → fixed to check `NEXT_PUBLIC_SITE_URL`, always absolute URL
- **M3** `NotificationSettings.tsx` — Anti-pattern `initialized` flag never resyncs → replaced with render-time `prevSettings` comparison (React-recommended pattern)
- **M4** `notifications.test.ts` — Contract test for `from` field claimed but not asserted → added `from` assertions to both failure + recovery tests
- **M5** `notifications.test.ts` — `logNotification()` completely untested → added `mockLogInsert` + assertions verifying audit log insert
- **L1** `notifications.test.ts` — Missing `afterEach` import → added to vitest import
- **L4** — Empty recipients + enabled notifications → accepted (functionally handled by skip logic)

### Issues Accepted (no change)

- **L2** Code duplication in failure/recovery functions — accepted as readable, self-contained; refactoring adds complexity without functional benefit
- **L3** Singleton `notification_settings` not enforced at DB level — accepted; INSERT policy restricts to `service_role`, adding migration is scope creep

### Verification

- `npm run test` — 1426 tests pass (127 files), zero regressions
- `npm run type-check` — zero errors
- `npm run lint` — zero warnings
