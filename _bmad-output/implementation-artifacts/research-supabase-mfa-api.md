# Research: Supabase Auth MFA API Verification

**Date:** 2026-02-04
**Owner:** Amelia (Dev Agent)
**Status:** Complete
**Epic 2 Prep Task:** Critical

---

## Executive Summary

Supabase MFA TOTP API is stable and free on all projects. **Important correction:** Story references to `enrollMFA()`, `challengeMFA()`, `verifyMFA()` are incorrect. Correct namespace is `supabase.auth.mfa.*`. Backup codes are NOT built-in — Story 2.3 requires full custom implementation.

---

## 1. Correct API Methods

| Method | Signature | Purpose |
|--------|-----------|---------|
| `mfa.enroll()` | `supabase.auth.mfa.enroll({ factorType, friendlyName?, issuer? })` | Start enrollment, returns QR code + secret |
| `mfa.challenge()` | `supabase.auth.mfa.challenge({ factorId })` | Create challenge, returns challengeId |
| `mfa.verify()` | `supabase.auth.mfa.verify({ factorId, challengeId, code })` | Verify TOTP code |
| `mfa.challengeAndVerify()` | `supabase.auth.mfa.challengeAndVerify({ factorId, code })` | Shortcut: challenge + verify (TOTP only) |
| `mfa.listFactors()` | `supabase.auth.mfa.listFactors()` | List all enrolled factors |
| `mfa.unenroll()` | `supabase.auth.mfa.unenroll({ factorId })` | Remove factor (requires aal2) |
| `mfa.getAuthenticatorAssuranceLevel()` | `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` | Returns `{ currentLevel, nextLevel }` |

**There are NO methods named `enrollMFA`, `challengeMFA`, or `verifyMFA`.** Stories must reference correct namespace.

---

## 2. TOTP Enrollment Flow (Story 2.2)

```typescript
// Step 1: Enroll
const { data: enrollData, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'My Authenticator App',
  issuer: 'ZyncData',
})

// enrollData.totp.qr_code  — SVG data URL (render directly as <img src>)
// enrollData.totp.secret   — manual entry fallback
// enrollData.totp.uri      — otpauth:// URI
// enrollData.id            — factorId (store this)

// Step 2: User scans QR and enters code

// Step 3: Activate factor
const { data, error } = await supabase.auth.mfa.challengeAndVerify({
  factorId: enrollData.id,
  code: userEnteredCode,  // 6-digit TOTP
})
// Factor now active. Session promoted to aal2.
// All other sessions logged out.
```

**Key:** `qr_code` is an SVG data URL — no third-party QR library needed.

---

## 3. MFA Login Verification Flow (Story 2.4)

```typescript
// After signInWithPassword (aal1 achieved):

// Step 1: Check if MFA required
const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

if (aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
  // Show MFA verification screen
}

// Step 2: Get TOTP factor
const { data: factors } = await supabase.auth.mfa.listFactors()
const totpFactor = factors.totp[0]

// Step 3: Verify
const { data, error } = await supabase.auth.mfa.challengeAndVerify({
  factorId: totpFactor.id,
  code: userEnteredCode,
})
// Session now aal2
```

---

## 4. Backup Codes (Story 2.3) — CUSTOM IMPLEMENTATION REQUIRED

Supabase official docs:
> "Recovery codes are not supported but users can enroll multiple factors, with an upper limit of 10."

### Required Custom Implementation

```sql
-- Database table
CREATE TABLE backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

```typescript
// Server Action: Generate 8 codes
'use server'
import { randomBytes, createHash } from 'crypto'

export async function generateBackupCodes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const codes: string[] = []
  const hashedCodes: { user_id: string; code_hash: string }[] = []

  for (let i = 0; i < 8; i++) {
    const code = randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
    const hash = createHash('sha256').update(code).digest('hex')
    hashedCodes.push({ user_id: user.id, code_hash: hash })
  }

  await supabase.from('backup_codes').delete().eq('user_id', user.id)
  await supabase.from('backup_codes').insert(hashedCodes)

  return { data: codes, error: null } // Return plain-text ONCE
}
```

**Security note:** Backup code verification does NOT promote session to `aal2` via Supabase Auth. Need custom mechanism (e.g., `backup_code_verified_at` flag + RLS check).

---

## 5. AAL (Authenticator Assurance Level)

| Level | Meaning |
|-------|---------|
| `aal1` | Verified via email/password, magic link, social, OTP |
| `aal2` | Verified via login + at least one MFA factor |

### RLS Enforcement

```sql
-- Require MFA for sensitive operations
CREATE POLICY "Require MFA for admin ops"
  ON sensitive_table AS RESTRICTIVE
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt()->>'aal') = 'aal2');
```

---

## 6. Server Action Pattern for Next.js 16

```typescript
// src/lib/actions/mfa.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function verifyMfaAction(formData: FormData) {
  const code = formData.get('code') as string
  const supabase = await createClient()

  const { data: factors } = await supabase.auth.mfa.listFactors()
  if (!factors?.totp[0]) return { error: 'No TOTP factor found' }

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factors.totp[0].id,
    code,
  })

  if (error) return { error: error.message }
  redirect('/dashboard')
}
```

---

## 7. Known Issues & Gotchas

1. **`getAuthenticatorAssuranceLevel()` uses `getSession()` internally** — may trigger console warnings. Use `getUser()` alongside for security-critical checks.
2. **AAL stuck at aal1 bug** — [GitHub #11383](https://github.com/orgs/supabase/discussions/11383): after sign-out/sign-in, AAL may report `nextLevel: 'aal1'` incorrectly. Must test.
3. **Factor verification logs out other sessions** — UX consideration.
4. **Unenroll requires aal2** — user must be MFA-verified to remove factors.
5. **Maximum 10 factors** per user.
6. **`challengeAndVerify()` is TOTP-only** — fine for our use case.
7. **`cookies()` is async in Next.js 16** — always `await cookies()`.
8. **Rate limiting is custom** — Supabase has platform-level limits, but MFA brute-force protection (3 attempts/5 min) needs Upstash Redis.
9. **MFA is free** — enabled on all projects by default, no dashboard config needed.

---

## 8. Story Impact Matrix

| Story | Supabase Support | Custom Work |
|-------|-----------------|-------------|
| 2.2: TOTP MFA Setup | Full (`mfa.enroll` + `mfa.challengeAndVerify`) | UI components, `mfa_enabled` flag |
| 2.3: Backup Codes | **NOT supported** | Full: `backup_codes` table, generation, verification, rate limiting |
| 2.4: MFA Login Verification | Full (`mfa.getAuthenticatorAssuranceLevel` + `mfa.challengeAndVerify`) | Proxy integration, redirect logic, rate limiting |

---

## Sources

- [Supabase MFA TOTP Guide](https://supabase.com/docs/guides/auth/auth-mfa/totp)
- [MFA Overview](https://supabase.com/docs/guides/auth/auth-mfa)
- [JS API: mfa.enroll](https://supabase.com/docs/reference/javascript/auth-mfa-enroll)
- [JS API: mfa.challengeAndVerify](https://supabase.com/docs/reference/javascript/auth-mfa-challengeandverify)
- [JS API: getAuthenticatorAssuranceLevel](https://supabase.com/docs/reference/javascript/auth-mfa-getauthenticatorassurancelevel)
- [MFA RLS Enforcement Blog](https://supabase.com/blog/mfa-auth-via-rls)
- [Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [GitHub Issue #910 — getSession warnings](https://github.com/supabase/auth-js/issues/910)
- [GitHub Discussion #11383 — AAL bug](https://github.com/orgs/supabase/discussions/11383)
