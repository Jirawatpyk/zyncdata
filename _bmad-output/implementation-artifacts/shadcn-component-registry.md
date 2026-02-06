# shadcn Component Registry & Post-Install Checklist

**Created:** 2026-02-06 (Epic 3 Retro Action Item P1 + DOC1)
**Purpose:** Prevent regressions when installing or updating shadcn/ui components.

---

## Problem

`npx shadcn@latest add <component>` overwrites existing files, removing project customizations:
- **Epic 3 Story 3.4:** `button.tsx` overwritten — lost `min-h-11` touch targets, gained 7 `dark:` classes
- **Epic 3 Story 3.8:** `badge.tsx` installed with 3 `dark:` classes
- **Epic 3 Story 3.2:** Needed `ResizeObserver` polyfill for new Radix UI components

---

## Post-Install Checklist

Run after **every** `npx shadcn@latest add <component>`:

### Automated (required)
```bash
npm run shadcn:verify    # Check dark: classes + customization integrity
npm run lint             # ESLint catches dark: via local/no-dark-classes rule
npm run type-check       # Catch TS breakage
npm run test:run         # Full test suite
```

### Manual review
- [ ] Check git diff for modified files — any unexpected overwrites?
- [ ] If Button or Input was modified, verify `min-h-11` is present
- [ ] If any file has `dark:` classes, remove them (theme uses CSS variables)
- [ ] Check for new dependencies that might affect bundle size

---

## Customized Components Registry

Components with project-specific modifications. If shadcn overwrites these, customizations must be re-applied.

| Component | File | Customizations | Since |
|-----------|------|---------------|-------|
| **Button** | `src/components/ui/button.tsx` | `min-h-11` (44px WCAG touch target) | Epic 2 P2 |
| **Input** | `src/components/ui/input.tsx` | `min-h-11` (44px WCAG touch target) | Epic 2 P2 |
| **Select** | `src/components/ui/select.tsx` | `dark:` removed, `w-full`, `min-h-11`, removed `data-[size]` variants | Epic 4 L3 |

### How to add entries

When customizing a shadcn component:
1. Add it to this table with the modification and the reason
2. Add the file + required classes to `CUSTOMIZED_COMPONENTS` in `scripts/verify-shadcn-install.ts`
3. The automated script will then catch any overwrites

---

## Project Conventions for UI Components

All shadcn components in `src/components/ui/` must follow:

1. **No `dark:` classes** — project uses CSS variables for theming, enforced by ESLint rule `local/no-dark-classes`
2. **44px minimum touch targets** — Button and Input use `min-h-11`
3. **No barrel exports** — import directly from component file
4. **`cn()` for conditional classes** — never string concatenation

---

## Related Tooling

| Tool | Command | What it does |
|------|---------|-------------|
| Verify script | `npm run shadcn:verify` | Checks dark: classes + customizations |
| ESLint rule | `local/no-dark-classes` | Blocks dark: in all source files |
| Gen-types guard | `npm run db:types` | Safe wrapper for `supabase gen types` |
| Bundle budget | `npm run size` | Per-route First Load JS check |
| Story metrics | `npm run story-metrics` | File list + test count for stories |
