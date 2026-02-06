import {
  COLOR_SCHEME_PALETTES,
  type ThemeContent,
  type FontOption,
} from '@/lib/validations/content'

/**
 * Generate CSS custom property overrides for the selected color scheme.
 * These override the :root runtime vars (--dxt-primary, etc.)
 * which are referenced by @theme inline vars.
 */
export function getThemeCssVars(theme: ThemeContent): Record<string, string> {
  const palette = COLOR_SCHEME_PALETTES[theme.colorScheme]
  return {
    '--dxt-primary': palette.primary,
    '--dxt-secondary': palette.secondary,
    '--dxt-accent': palette.accent,
  }
}

const FONT_VAR_MAP: Record<FontOption, string> = {
  'nunito': 'var(--font-nunito)',
  'inter': 'var(--font-inter)',
  'open-sans': 'var(--font-open-sans)',
}

/**
 * Get the CSS variable reference for the selected font.
 * Used to override --font-sans in the public layout.
 */
export function getThemeFontVar(theme: ThemeContent): string {
  return FONT_VAR_MAP[theme.font]
}
