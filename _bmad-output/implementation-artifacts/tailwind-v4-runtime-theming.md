# Tailwind v4 Runtime Theme Switching — Two-Level CSS Variable Indirection

**Created:** 2026-02-07 (Epic 4, Story 4-2)
**Author:** Elena (Junior Dev), reviewed by Charlie (Senior Dev)

---

## The Problem

Tailwind v4 introduced `@theme inline` which compiles theme tokens to **static CSS values at build time**. This means you cannot change theme colors or fonts at runtime by simply updating a CSS variable — Tailwind has already baked the values into the compiled CSS.

```css
/* This DOES NOT work for runtime switching in Tailwind v4 */
@theme inline {
  --color-primary: #41b9d5; /* Compiled to static value at build time */
}
```

Changing `--color-primary` at runtime via JavaScript or `:root` overrides has **no effect** because Tailwind utilities (`text-primary`, `bg-primary`) reference the compiled static value, not a live CSS variable.

---

## The Solution: Two-Level Indirection

Use two layers of CSS variables:

1. **Level 1 (Runtime):** `:root` custom properties that can be overridden at runtime
2. **Level 2 (Bridge):** `@theme inline` references Level 1 vars via `var()`

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│  Level 1: :root (Runtime-overridable)           │
│  --dxt-primary: #41b9d5                         │
│  --dxt-secondary: #5371ff                       │
│  --dxt-accent: #6ce6e9                          │
│  --font-sans: var(--font-nunito)                │
└──────────────────┬──────────────────────────────┘
                   │ var() reference
┌──────────────────▼──────────────────────────────┐
│  Level 2: @theme inline (Tailwind bridge)       │
│  --color-dxt-primary: var(--dxt-primary)        │
│  --color-dxt-secondary: var(--dxt-secondary)    │
│  --color-dxt-accent: var(--dxt-accent)          │
│  --font-sans: var(--font-nunito)                │
└──────────────────┬──────────────────────────────┘
                   │ Tailwind compiles to utilities
┌──────────────────▼──────────────────────────────┐
│  Tailwind Utilities (auto-generated)            │
│  .text-dxt-primary { color: var(--dxt-primary) }│
│  .bg-dxt-accent { background: var(--dxt-accent)}│
│  .font-sans { font-family: var(--font-sans) }  │
└─────────────────────────────────────────────────┘
```

When Level 1 vars change at runtime, all Tailwind utilities update automatically because they resolve through the `var()` chain.

---

## Implementation (Our Codebase)

### 1. Register Fonts — `src/app/layout.tsx`

All 3 fonts are loaded via `next/font/google` with CSS variable names:

```tsx
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-nunito' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-inter', preload: false })
const openSans = Open_Sans({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-open-sans', preload: false })

// All three variables injected on <html>
<html className={`${nunito.variable} ${inter.variable} ${openSans.variable}`}>
```

Only the default font (`nunito`) uses `preload: true` (implicit). Others set `preload: false` to avoid loading unused fonts.

### 2. Level 1 — Runtime Vars in `:root` — `src/app/globals.css`

```css
:root {
  /* DxT Brand Colors — runtime-overridable */
  --dxt-primary: #41b9d5;
  --dxt-secondary: #5371ff;
  --dxt-accent: #6ce6e9;
  --dxt-dark: #545454;
  --dxt-light: #ffffff;
  /* ... other vars */
}
```

These are the **default values**. They can be overridden by inline `style` attributes at runtime.

### 3. Level 2 — Bridge to Tailwind — `src/app/globals.css`

```css
@theme inline {
  --font-sans: var(--font-nunito);

  /* DxT Brand Colors — references runtime vars */
  --color-dxt-primary: var(--dxt-primary);
  --color-dxt-secondary: var(--dxt-secondary);
  --color-dxt-accent: var(--dxt-accent);
  --color-dxt-dark: var(--dxt-dark);
  --color-dxt-light: var(--dxt-light);
}
```

Tailwind reads `@theme inline` and generates utilities like `text-dxt-primary`, `bg-dxt-accent`, etc. Because they use `var()`, they follow the Level 1 runtime values.

### 4. Runtime Override — `src/app/(public)/layout.tsx`

```tsx
const cssVars = getThemeCssVars(content.theme)    // { '--dxt-primary': '#0077b6', ... }
const fontVar = getThemeFontVar(content.theme)     // 'var(--font-inter)'

<div className="font-sans" style={{ ...cssVars, '--font-sans': fontVar } as React.CSSProperties}>
  {children}
</div>
```

The `style` attribute overrides Level 1 vars on the container `<div>`. All child components using `text-dxt-primary`, `bg-dxt-accent`, `font-sans`, etc. automatically update.

### 5. Theme Provider Functions — `src/lib/content/theme-provider.ts`

```ts
export function getThemeCssVars(theme: ThemeContent): Record<string, string> {
  const palette = COLOR_SCHEME_PALETTES[theme.colorScheme]
  return {
    '--dxt-primary': palette.primary,
    '--dxt-secondary': palette.secondary,
    '--dxt-accent': palette.accent,
  }
}

export function getThemeFontVar(theme: ThemeContent): string {
  return FONT_VAR_MAP[theme.font]  // e.g. 'var(--font-inter)'
}
```

### 6. Color Scheme Palettes — `src/lib/validations/content.ts`

```ts
export const COLOR_SCHEME_PALETTES: Record<ColorScheme, { primary; secondary; accent }> = {
  'dxt-default':      { primary: '#41b9d5', secondary: '#5371ff', accent: '#6ce6e9' },
  'ocean-blue':       { primary: '#0077b6', secondary: '#00b4d8', accent: '#90e0ef' },
  'midnight-purple':  { primary: '#7c3aed', secondary: '#a78bfa', accent: '#c4b5fd' },
}
```

---

## Gotchas

### 1. CSS `var()` in `@keyframes` Does NOT Work

CSS custom properties inside `@keyframes` have **limited browser support**. The `glow-pulse` animation uses hardcoded hex values instead of `var(--dxt-primary)`.

```css
/* This does NOT work reliably across browsers */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px var(--dxt-primary); }  /* BROKEN */
}

/* Use hardcoded values instead */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px #41b9d5; }  /* Works */
}
```

**Status:** Accepted as D2 in Epic 4 retro. Not worth the complexity to fix.

### 2. `@theme inline` vs `@theme`

- `@theme inline` — tokens are emitted inline in the CSS output (required for var() references)
- `@theme` — tokens may be optimized/compiled away

Always use `@theme inline` for runtime-overridable values.

### 3. Font Preloading

Only the default font should have `preload: true`. Other fonts should set `preload: false` to avoid downloading all font files on initial page load. The browser will lazy-load the active font when it encounters the `font-family` declaration.

### 4. Server-Side Rendering

The override happens via `style` attribute on a server component (`PublicLayout`). This means:
- Theme is resolved at request time (or ISR cache time)
- No hydration mismatch — the `style` attribute is rendered on the server
- No client-side JavaScript needed for theme switching on public pages

### 5. Preview (iframe) Context

In iframe-based previews (`srcDoc`), `next/font/google` `@font-face` rules don't propagate. The preview HTML must load Google Fonts via `<link>` tags directly, and CSP `style-src` must include `https://fonts.googleapis.com`.

---

## When to Use This Pattern

Use two-level CSS variable indirection when:
- You need **runtime** theme switching with Tailwind v4
- Theme values come from a database or user configuration
- You want all Tailwind utilities to automatically reflect the active theme

Do NOT use this pattern when:
- Theme values are known at build time (just use `@theme inline` directly)
- You only need light/dark mode (use `@custom-variant dark` instead)

---

## Related Files

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Level 1 (`:root`) + Level 2 (`@theme inline`) |
| `src/app/layout.tsx` | Font registration via `next/font/google` |
| `src/app/(public)/layout.tsx` | Runtime override via `style` attribute |
| `src/lib/content/theme-provider.ts` | `getThemeCssVars()` + `getThemeFontVar()` |
| `src/lib/validations/content.ts` | Color scheme palettes + font maps |
