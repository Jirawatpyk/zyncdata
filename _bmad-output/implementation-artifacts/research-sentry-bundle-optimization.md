# Research: Sentry SDK Bundle Size Optimization

**Date:** 2026-02-04
**Owner:** Amelia (Dev Agent)
**Status:** Complete
**Epic 1 Tech Debt:** D2 (MEDIUM)

---

## Executive Summary

Current bundle budget: 200KB (increased from 150KB). **Root cause:** Session Replay (`replayIntegration`) adds ~50KB gzipped and is loaded eagerly. With tree-shaking flags + lazy-loading Replay, we can get back to ~140-150KB initial bundle. No need to switch SDKs.

---

## 1. Current State

**`package.json`:** `@sentry/nextjs: ^10.38.0`, size-limit: `200 KB`

**`next.config.ts`:** `withSentryConfig` with NO tree-shaking options configured.

**`sentry.client.config.ts`:** Eagerly imports `replayIntegration` (~50KB gzipped).

---

## 2. Available Tree-Shaking Options

| Option | What It Removes | Savings (gzipped) |
|--------|----------------|-------------------|
| `removeDebugLogging: true` | SDK debug console logs | ~2-3 KB |
| `removeTracing: true` | All tracing/performance code | ~5-8 KB |
| `excludeReplayIframe: true` | Iframe recording from Replay | ~2-3 KB |
| `excludeReplayShadowDOM: true` | Shadow DOM recording from Replay | ~2-3 KB |
| `excludeReplayCompressionWorker: true` | Compression web worker | ~10 KB |

**Note:** `removeTracing` must NOT be used if `tracesSampleRate` is configured (we use it). Turbopack (dev only) doesn't support these flags — production builds use webpack, so it works where it matters.

---

## 3. Recommended Strategies

### Strategy A: Tree-Shaking Flags (Low Risk) — ~7-9 KB savings

```typescript
// next.config.ts
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
      excludeReplayIframe: true,
      excludeReplayShadowDOM: true,
    },
  },
})
```

### Strategy B: Lazy-Load Session Replay (High Impact) — ~50 KB off initial bundle

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  integrations: [], // Don't load replay eagerly
})

// Lazy-load after initial page load
if (typeof window !== 'undefined') {
  import('@sentry/nextjs').then((lazyLoadedSentry) => {
    Sentry.addIntegration(
      lazyLoadedSentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      })
    )
  })
}
```

### Strategy C: Remove Replay Entirely — ~50 KB total savings

If Session Replay is not needed for MVP, remove `replayIntegration` completely.

---

## 4. Expected Results

| Scenario | Estimated Budget |
|----------|-----------------|
| Current (no optimization) | ~200 KB |
| Strategy A only | ~191-193 KB |
| **Strategy A + B (recommended)** | **~140-150 KB initial** |
| Strategy A + C (remove replay) | ~141-143 KB |

**Can we get back to 150KB? Yes.** Strategy A + B gets us there while keeping all functionality.

---

## 5. NOT Recommended

- **`@micro-sentry/browser`** (~2.27KB) — loses all Next.js-specific integration
- **`@sentry/browser` directly** — loses server-side error capture, route instrumentation, source maps

---

## 6. Action Plan

1. **Phase 1 (Immediate):** Apply tree-shaking flags to `next.config.ts`
2. **Phase 2 (Next Sprint):** Lazy-load Session Replay
3. **Phase 3 (Validate):** Run `npm run build && npm run size`, update size-limit back to 150KB if target met
4. **Phase 4 (Product Decision):** Evaluate if Replay is needed for MVP

---

## Sources

- [Sentry Next.js Tree Shaking](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/tree-shaking/)
- [Sentry Build Options](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/build/)
- [Bundle Size Developer Docs](https://develop.sentry.dev/sdk/platform-specifics/javascript-sdks/bundle-size/)
- [JS SDK 29% Reduction Blog](https://blog.sentry.io/javascript-sdk-package-reduced/)
- [Replay SDK 35% Reduction Blog](https://blog.sentry.io/sentry-bundle-size-how-we-reduced-replay-sdk-by-35/)
- [GitHub Issue #7680 — Bundle Size](https://github.com/getsentry/sentry-javascript/issues/7680)
