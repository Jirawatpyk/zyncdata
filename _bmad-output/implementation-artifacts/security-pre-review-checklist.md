# Security Pre-Review Checklist

**Purpose:** Catch HIGH severity security issues before code review. Developer must review this checklist before marking a story as ready-for-review.

**Origin:** Epic 2 Retrospective Action Item P4 — 16 HIGH severity issues caught only in code review.

---

## Mandatory Checks

### 1. Input Validation & Injection

- [ ] All user input validated with Zod `.parse()` at data boundaries
- [ ] No raw user input in SQL queries (use parameterized queries / Supabase client)
- [ ] No raw user input in `dangerouslySetInnerHTML` or template strings rendered as HTML
- [ ] Form actions validate FormData with Zod before processing
- [ ] API route handlers validate request body/params with Zod before processing

### 2. Authentication & Authorization

- [ ] Protected routes use `requireAuth()` or `requireApiAuth()` guard
- [ ] RBAC role checks match story requirements (e.g., `'admin'`, `'super_admin'`)
- [ ] MFA AAL2 enforcement present where required (admin operations)
- [ ] No auth bypass paths (all branches of conditional logic check auth)
- [ ] Session tokens not exposed in URLs or client-side logs

### 3. Open Redirects

- [ ] All redirect URLs validated against allowlist or are relative paths only
- [ ] `redirect()` calls use hardcoded paths, not user-supplied values
- [ ] `searchParams.get('redirect')` or similar validated before use
- [ ] No `window.location.href = userInput` patterns

### 4. Error Handling

- [ ] All Supabase mutation operations (`.insert()`, `.update()`, `.delete()`) check `error` return
- [ ] All Supabase query operations check `error` return
- [ ] Error messages don't leak internal details (stack traces, table names, user existence)
- [ ] Failed operations return generic error messages to client
- [ ] `try/catch` blocks don't silently swallow errors

### 5. Race Conditions

- [ ] Enrollment/setup operations check for existing state before creating new
- [ ] Single-use tokens/codes verified and consumed atomically (or with re-check)
- [ ] Concurrent request handling considered for state-changing operations
- [ ] Database operations that must be atomic use transactions or RLS

### 6. Data Exposure

- [ ] API responses don't include fields beyond what the client needs
- [ ] Sensitive data (passwords, tokens, secret keys) never logged
- [ ] Sensitive data never included in error responses
- [ ] RLS policies cover all tables with user data
- [ ] `select()` calls specify explicit columns, not `*` (where security-relevant)

### 7. CSP & Headers

- [ ] New external resources added to CSP `connect-src` (APIs, analytics, etc.)
- [ ] No `eval()` or `new Function()` usage in application code
- [ ] No inline scripts added outside of Next.js built-in mechanisms
- [ ] `frame-ancestors 'none'` not weakened
- [ ] No new `unsafe-*` CSP directives introduced

### 8. Rate Limiting

- [ ] Auth endpoints (login, MFA verify, password reset) have rate limiting
- [ ] Rate limit keys use appropriate identifiers (IP, user ID, email)
- [ ] Rate limit responses don't reveal whether a user/email exists

---

## How to Use

1. Before marking a story `review`, run through each section above
2. Check every box that applies to your changes
3. For boxes that don't apply, add "N/A" with brief reason
4. Include the completed checklist in your story's Dev Notes section
5. If ANY box cannot be checked, fix the code before submitting for review

---

## Reference: Common Patterns from Epic 2

| Vulnerability | Example from Epic 2 | Fix Applied |
|---|---|---|
| Open redirect | `redirect(searchParams.get('next'))` | Validate against allowlist of relative paths |
| Race condition | Concurrent MFA enrollment creates duplicates | Check existing enrollment before creating |
| Missing error check | `.update()` result not checked | Always destructure `{ error }` and handle |
| AAL enforcement gap | API guard didn't verify MFA level | Add `aal2` check in `requireApiAuth()` |
| CSP missing source | Sentry endpoint not in `connect-src` | Add to CSP in `next.config.ts` |
