import { RuleTester } from 'eslint'
import noDarkClasses from '../no-dark-classes.mjs'

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

ruleTester.run('no-dark-classes', noDarkClasses, {
  valid: [
    // Normal Tailwind classes — no dark: prefix
    { code: 'const cls = "bg-primary text-white"' },
    { code: 'const cls = `bg-primary text-white`' },
    // CSS variable theming (correct approach)
    { code: 'const cls = "text-foreground bg-background"' },
    // The word "dark" without colon prefix is fine
    { code: 'const theme = "dark"' },
    { code: 'const cls = "dark-mode-toggle"' },
  ],
  invalid: [
    {
      code: 'const cls = "bg-white dark:bg-black"',
      errors: [{ messageId: 'noDarkClass', data: { className: 'dark:bg-black' } }],
    },
    {
      code: 'const cls = `text-red dark:text-blue hover:dark:text-green`',
      errors: [
        { messageId: 'noDarkClass', data: { className: 'dark:text-blue' } },
        { messageId: 'noDarkClass', data: { className: 'dark:text-green' } },
      ],
    },
    {
      code: 'const cls = "dark:hover:bg-accent"',
      errors: [{ messageId: 'noDarkClass', data: { className: 'dark:hover:bg-accent' } }],
    },
  ],
})

// If we reach here, all tests passed
console.log('no-dark-classes: All RuleTester tests passed.')
