/**
 * P1: shadcn post-install verification script.
 *
 * Run after any `npx shadcn@latest add <component>` to catch regressions:
 *   1. dark: classes (banned by project convention)
 *   2. min-h-11 missing from Button/Input (WCAG 44px touch targets)
 *   3. Unexpected file overwrites (customized components)
 *
 * Usage: npm run shadcn:verify
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

const UI_DIR = path.resolve('src/components/ui')

// Components with known project customizations that must be preserved.
// If shadcn overwrites these, the verification will catch the damage.
const CUSTOMIZED_COMPONENTS: Record<string, string[]> = {
  'button.tsx': ['min-h-11'],
  'input.tsx': ['min-h-11'],
}

// ── Checks ──────────────────────────────────────────────────────────

let failures = 0

function fail(file: string, message: string) {
  console.error(`  FAIL  ${file}: ${message}`)
  failures++
}

function pass(message: string) {
  console.log(`  PASS  ${message}`)
}

// Check 1: No dark: classes in any UI component
function checkNoDarkClasses() {
  console.log('\n[1/3] Checking for banned dark: classes...')

  const files = fs.readdirSync(UI_DIR).filter((f) => f.endsWith('.tsx'))
  let found = 0

  for (const file of files) {
    const content = fs.readFileSync(path.join(UI_DIR, file), 'utf8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      // Match dark: prefix in Tailwind classes (but not in comments/strings about "dark:")
      const matches = lines[i].match(/\bdark:/g)
      if (matches) {
        fail(file, `line ${i + 1}: found ${matches.length} dark: class(es)`)
        found += matches.length
      }
    }
  }

  if (found === 0) {
    pass('No dark: classes found in any UI component')
  } else {
    console.error(
      `\n  Action: Remove all dark: classes. ESLint rule "local/no-dark-classes" should also catch these.`,
    )
  }
}

// Check 2: Customized components retain required classes
function checkCustomizations() {
  console.log('\n[2/3] Checking customized component integrity...')

  for (const [file, requiredClasses] of Object.entries(
    CUSTOMIZED_COMPONENTS,
  )) {
    const filePath = path.join(UI_DIR, file)
    if (!fs.existsSync(filePath)) {
      fail(file, 'file missing — may have been deleted by shadcn install')
      continue
    }

    const content = fs.readFileSync(filePath, 'utf8')
    for (const cls of requiredClasses) {
      if (!content.includes(cls)) {
        fail(file, `missing required class "${cls}" — shadcn may have overwritten customization`)
      } else {
        pass(`${file} has "${cls}"`)
      }
    }
  }
}

// Check 3: List all UI files for manual review awareness
function listComponents() {
  console.log('\n[3/3] UI component inventory...')
  const files = fs.readdirSync(UI_DIR).filter((f) => f.endsWith('.tsx'))
  const customized = Object.keys(CUSTOMIZED_COMPONENTS)

  for (const file of files.sort()) {
    const tag = customized.includes(file) ? ' [CUSTOMIZED]' : ''
    console.log(`  ${file}${tag}`)
  }
  console.log(`  Total: ${files.length} components (${customized.length} customized)`)
}

// ── Main ────────────────────────────────────────────────────────────

function main() {
  console.log('shadcn Post-Install Verification')
  console.log('═════════════════════════════════')

  if (!fs.existsSync(UI_DIR)) {
    console.error(`UI directory not found: ${UI_DIR}`)
    process.exit(1)
  }

  checkNoDarkClasses()
  checkCustomizations()
  listComponents()

  console.log('\n═════════════════════════════════')
  if (failures > 0) {
    console.error(`${failures} failure(s) detected. Fix before committing.`)
    process.exit(1)
  } else {
    console.log('All checks passed.')
  }
}

main()
