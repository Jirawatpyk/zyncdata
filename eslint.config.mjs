import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'
import noDarkClasses from './eslint-rules/no-dark-classes.mjs'

const localPlugin = {
  rules: {
    'no-dark-classes': noDarkClasses,
  },
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    plugins: { local: localPlugin },
    rules: {
      'local/no-dark-classes': 'error',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    // ESLint rule tests intentionally contain invalid patterns
    'eslint-rules/__tests__/**',
  ]),
])

export default eslintConfig
