import 'server-only'

import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ErrorCode } from '@/lib/errors/codes'
import type { User } from '@supabase/supabase-js'

export type Role = 'super_admin' | 'admin' | 'user'

export interface AuthResult {
  user: User
  role: Role
}

const ROLE_HIERARCHY: Record<Role, number> = {
  user: 1,
  admin: 2,
  super_admin: 3,
}

/**
 * Server-side auth guard for layout components.
 * Validates user authentication and optionally enforces minimum role.
 *
 * @param minimumRole - Minimum role required to access the route
 * @returns AuthResult with user and role
 * @throws Redirects to /auth/login if not authenticated
 * @throws Redirects to /unauthorized if insufficient role
 */
export async function requireAuth(minimumRole?: Role): Promise<AuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Verify MFA is complete (AAL2) — prevents bypassing MFA by navigating directly.
  // TECH DEBT D3: Backup code login remains at aal1 (Supabase limitation).
  // RBAC guard workaround is in place. Revisit if Supabase adds native backup code AAL2 support.
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
    redirect('/auth/mfa-verify')
  }

  const role = (user.app_metadata?.role as Role) ?? 'user'

  if (minimumRole && ROLE_HIERARCHY[role] < ROLE_HIERARCHY[minimumRole]) {
    redirect('/unauthorized')
  }

  return { user, role }
}

/**
 * Check if a role meets the minimum requirement without redirecting.
 * Useful for conditional UI rendering in Server Components.
 */
export function hasMinimumRole(currentRole: Role, minimumRole: Role): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[minimumRole]
}

/**
 * API route auth guard. Returns user/role or error response.
 * Unlike requireAuth(), this does NOT redirect — returns JSON error.
 *
 * @param minimumRole - Minimum role required
 * @returns AuthResult or NextResponse with error
 */
export async function requireApiAuth(
  minimumRole?: Role,
): Promise<AuthResult | NextResponse> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized', code: ErrorCode.UNAUTHORIZED } },
      { status: 401 },
    )
  }

  // Verify MFA is complete (AAL2) — same enforcement as requireAuth()
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
    return NextResponse.json(
      { data: null, error: { message: 'MFA verification required', code: ErrorCode.FORBIDDEN } },
      { status: 403 },
    )
  }

  const role = (user.app_metadata?.role as Role) ?? 'user'

  if (minimumRole && ROLE_HIERARCHY[role] < ROLE_HIERARCHY[minimumRole]) {
    return NextResponse.json(
      { data: null, error: { message: 'Forbidden', code: ErrorCode.FORBIDDEN } },
      { status: 403 },
    )
  }

  return { user, role }
}

/**
 * Type guard to check if requireApiAuth result is an error response.
 */
export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
