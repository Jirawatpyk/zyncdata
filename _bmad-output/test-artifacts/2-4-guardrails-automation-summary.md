# TEA Automate — Story 2.4 MFA Login Verification Guardrails

**Workflow:** TEA `*automate` (after dev-story)
**Story:** 2.4 — MFA Login Verification
**Mode:** BMad-Integrated (story artifact provided)
**Date:** 2026-02-05

---

## Coverage Plan

### Execution Summary

| Metric | Value |
|---|---|
| Total guardrail tests | 14 |
| Unit tests (Vitest) | 11 (2 files) |
| E2E tests (Playwright) | 3 (1 file) |
| Priority P0 | 1 |
| Priority P1 | 6 |
| Priority P2 | 7 |
| New fixtures/helpers | 0 (inline mocks, consistent with existing patterns) |

### Priority Breakdown

**P0 — Critical (1 test)**
- Double-submit prevention via `verifyInProgress` ref guard

**P1 — High (6 tests)**
- `factorId` null safety — submit disabled when `!factorId`
- `factorId` null safety — no "MFA setup incomplete" on normal path
- Error priority — `actionState.error` wins over `clientError`
- Retry with different factor ID — uses new factor after recovery
- Error propagation — `getCurrentUser` throws → error propagates (not swallowed)
- Error propagation — `getMfaStatus` throws → error propagates (not swallowed)

**P2 — Medium (7 tests)**
- Retry recovery — settles to consistent state after error→success
- Retry empty factors — redirects to `/auth/mfa-enroll`
- Client error clearing on new submit
- Auth guard bypass — query params (`?bypass=true`, `?token=fake`, `?authenticated=1`)
- Auth guard bypass — hash fragment (`#admin`)
- Auth guard bypass — rapid sequential navigations

---

## Files Created

| File | Type | Tests | Level |
|---|---|---|---|
| `src/app/auth/mfa-verify/_components/MfaVerifyForm.guardrails.test.tsx` | Unit | 8 | Component |
| `src/app/auth/mfa-verify/page.guardrails.test.tsx` | Unit | 3 | Server Component |
| `tests/e2e/mfa-verify-guardrails.spec.ts` | E2E | 3 | Integration |

---

## Test Level Selection Rationale

- **Component unit tests (8):** MfaVerifyForm edge cases — race conditions, state management, error priority logic. These are implementation-specific behaviors best tested at the component level with mocked dependencies.
- **Server component unit tests (3):** page.tsx auth guard edge cases — exception propagation, undefined field handling. Server component rendering tested with mocked auth queries.
- **E2E tests (3):** Auth guard bypass prevention — verifies the server-side redirect works against various URL manipulation attempts in a real browser context.

---

## Validation Results

- **Vitest:** 356/356 passed (42 files) — zero regressions
- **Playwright (guardrails):** 3/3 passed
- All tests deterministic, no flaky patterns
- No hard waits, no conditional flow, no shared state

---

## Knowledge Fragments Used

- `test-levels-framework` — test level selection
- `test-priorities-matrix` — P0-P3 classification
- `data-factories` — factory patterns (inline mocks used per project convention)
- `test-quality` — Given-When-Then, atomic assertions, deterministic design
- `selective-testing` — targeted guardrail scope
- `overview` (Playwright utils) — E2E patterns

---

## Key Assumptions & Risks

1. **Assumption:** React strict mode double-invocation in tests affects mock call counts. Mitigated by using `mockResolvedValue` (not `callCount`-based `mockImplementation`) for retry tests.
2. **Assumption:** Next.js App Router server components handle POST differently than GET for redirect. POST bypass test replaced with rapid sequential navigation test.
3. **Risk:** Authenticated E2E tests (TOTP input rendering, backup code toggle) deferred until auth test harness is available (Story 2.6+).

---

## Definition of Done

- [x] All acceptance criteria edge cases covered at appropriate test levels
- [x] Priority tags `[P0]`/`[P1]`/`[P2]` on all test names
- [x] Given-When-Then structure with clear comments
- [x] `data-testid` selectors in E2E tests
- [x] No duplicate coverage with existing functional tests
- [x] All tests passing (356 unit + 3 E2E guardrails)
- [x] Zero regressions in existing test suite
- [x] Guardrail naming convention: `*.guardrails.test.ts(x)`

---

## Recommended Next Steps

- `bmad tea *test-review` — quality audit of the full MFA verify test suite
- `bmad tea *trace` — coverage traceability matrix (AC → test mapping)
- Story 2.6+ — add authenticated E2E tests once auth test harness is available
