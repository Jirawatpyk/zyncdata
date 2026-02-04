# Research: Next.js 16 `proxy.ts` Route Protection Patterns

**Date:** 2026-02-04
**Owner:** Amelia (Dev Agent)
**Status:** Complete
**Epic 2 Prep Task:** Critical

---

## Executive Summary

Next.js 16 renamed `middleware.ts` to `proxy.ts`. Key driver: security vulnerability CVE-2025-29927 allowed attackers to bypass middleware auth via `x-middleware-subrequest` header. The rename also clarifies the file's role as a network proxy, not business logic middleware.

**Critical for zyncdata:** Architecture doc references `middleware.ts` — must migrate to `proxy.ts` with layered defense pattern.

---

## 1. What Changed

| Feature | `middleware.ts` (Next.js 15) | `proxy.ts` (Next.js 16) |
|---------|------------------------------|--------------------------|
| Runtime | Edge Runtime (default) | **Node.js Runtime only** |
| Function name | `middleware()` | `proxy()` |
| Role | Routing + Auth (overused) | **Routing only** (recommended) |
| Auth recommendation | In middleware | **Server Layout Guards** |
| Config flag | `skipMiddlewareUrlNormalize` | `skipProxyUrlNormalize` |
| Status | Deprecated (still works) | Current |

### Migration Codemod

```bash
npx @next/codemod@canary middleware-to-proxy .
```

---

## 2. Recommended Pattern: Layered Defense (Defense-in-Depth)

### Layer 1: `proxy.ts` — Optimistic Check (fast, lightweight)

```typescript
// src/proxy.ts
import { updateSession } from '@/lib/supabase/proxy'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

```typescript
// src/lib/supabase/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Use getUser(), NOT getSession()
  // getUser() validates JWT via Supabase Auth server
  // getSession() reads from cookie — can be spoofed
  const { data: { user } } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    request.nextUrl.pathname !== '/'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // MUST return supabaseResponse — contains updated cookies
  return supabaseResponse
}
```

### Layer 2: Server Layout Guards — Real Auth + RBAC

```typescript
// src/lib/auth/guard.ts
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

type Role = 'super_admin' | 'admin' | 'user'

interface AuthResult {
  user: User
  role: Role
}

export async function requireAuth(minimumRole?: Role): Promise<AuthResult> {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const role = (user.app_metadata?.role as Role) ?? 'user'

  if (minimumRole) {
    const hierarchy: Record<Role, number> = {
      user: 1,
      admin: 2,
      super_admin: 3,
    }
    if (hierarchy[role] < hierarchy[minimumRole]) {
      redirect('/unauthorized')
    }
  }

  return { user, role }
}
```

Usage in layouts:

```typescript
// app/admin/layout.tsx
import { requireAuth } from '@/lib/auth/guard'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAuth('admin')
  return <>{children}</>
}

// app/admin/users/layout.tsx — Super Admin only
export default async function UserManagementLayout({ children }: { children: React.ReactNode }) {
  await requireAuth('super_admin')
  return <>{children}</>
}
```

### Layer 3: Data Access Layer — RLS enforcement

Database-level RLS policies remain the final guard. No changes needed from Epic 1 patterns.

---

## 3. RBAC Route Matrix

| Route | User | Admin | Super Admin |
|-------|------|-------|-------------|
| `/` (public) | Yes | Yes | Yes |
| `/login` | Yes | Yes | Yes |
| `/dashboard` | Yes | Yes | Yes |
| `/admin/*` | No | Yes | Yes |
| `/admin/users/*` | No | No | Yes |
| `/admin/audit/*` | No | No | Yes |

---

## 4. Key Gotchas

1. **`proxy.ts` runs Node.js runtime only** — no Edge Runtime option
2. **Don't put heavy auth logic in proxy.ts** — optimistic checks only, real validation in Server Layout Guards
3. **Always return `supabaseResponse`** from `updateSession` — contains refreshed cookies
4. **Use `getUser()`, never `getSession()`** for auth validation on server
5. **Matcher must be static** — no dynamic values
6. **Single file only** — one `proxy.ts` per project, use imports for modularity
7. **Cookie response sync** — if proxy doesn't return the Supabase response, browser/server cookies go out of sync

---

## 5. What Needs to Change in zyncdata

1. Rename `middleware.ts` → `proxy.ts`, function `middleware()` → `proxy()`
2. Change Supabase client from `createMiddlewareClient` → `createServerClient` from `@supabase/ssr`
3. Change `getSession()` → `getUser()` everywhere on server
4. Move RBAC logic from proxy → Server Layout Guards
5. Create reusable `requireAuth()` in `src/lib/auth/guard.ts`
6. Update `architecture.md` and `project-context.md` references

---

## Sources

- [Next.js 16 Release Blog](https://nextjs.org/blog/next-16)
- [proxy.js API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Getting Started: Proxy](https://nextjs.org/docs/app/getting-started/proxy)
- [Upgrading to Version 16](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Renaming Middleware to Proxy](https://nextjs.org/docs/messages/middleware-to-proxy)
- [Next.js 16 Auth Changes (Auth0)](https://auth0.com/blog/whats-new-nextjs-16/)
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [CVE-2025-29927 Middleware Bypass](https://www.rabinarayanpatra.com/blogs/hello-proxy-ts-nextjs-16)
