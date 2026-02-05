/**
 * Story Metrics Script
 *
 * Generates accurate File List and test counts for story documentation.
 * Eliminates manual counting errors flagged in Epic 2 retro (Stories 2.3, 2.5).
 *
 * Usage:
 *   npx tsx scripts/story-metrics.ts                    # Compare HEAD vs main
 *   npx tsx scripts/story-metrics.ts --base=HEAD~3      # Compare HEAD vs 3 commits ago
 *   npx tsx scripts/story-metrics.ts --base=abc1234     # Compare HEAD vs specific commit
 *
 * @see Epic 2 Retrospective Action Item P3
 */

import { execSync } from 'node:child_process'

interface TestResult {
  numTotalTests: number
  numPassedTests: number
  numFailedTests: number
  numTotalTestSuites: number
  numPassedTestSuites: number
  numFailedTestSuites: number
}

function run(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8' }).trim()
}

function getBaseRef(): string {
  const args = process.argv.slice(2)
  const baseArg = args.find((a) => a.startsWith('--base='))
  if (baseArg) return baseArg.split('=')[1]

  // Default: compare against main branch
  return 'main'
}

function getChangedFiles(base: string): string[] {
  try {
    const output = run(`git diff --name-only ${base}...HEAD`)
    return output
      .split('\n')
      .filter((f) => f.length > 0)
      .sort()
  } catch {
    // If base doesn't exist (e.g., no main branch), show all tracked files
    console.warn(`Warning: Could not diff against "${base}". Showing staged + unstaged changes.`)
    const staged = run('git diff --name-only --cached')
    const unstaged = run('git diff --name-only')
    return [...new Set([...staged.split('\n'), ...unstaged.split('\n')])]
      .filter((f) => f.length > 0)
      .sort()
  }
}

function categorizeFiles(files: string[]): {
  src: string[]
  tests: string[]
  config: string[]
  other: string[]
} {
  const src: string[] = []
  const tests: string[] = []
  const config: string[] = []
  const other: string[] = []

  for (const file of files) {
    if (file.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) {
      tests.push(file)
    } else if (file.startsWith('src/')) {
      src.push(file)
    } else if (
      file.match(
        /^(package\.json|tsconfig|next\.config|vitest\.config|playwright\.config|eslint|\.env|tailwind)/
      )
    ) {
      config.push(file)
    } else {
      other.push(file)
    }
  }

  return { src, tests, config, other }
}

function getTestCounts(): TestResult | null {
  try {
    const output = run('npx vitest run --reporter=json 2>nul')
    // Extract JSON from output (vitest may print other text before/after)
    const jsonMatch = output.match(/\{[\s\S]*"numTotalTests"[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as TestResult
    }
    return null
  } catch (e) {
    // vitest run --reporter=json outputs JSON to stdout even on failure
    const error = e as { stdout?: string }
    if (error.stdout) {
      try {
        const jsonMatch = error.stdout.match(/\{[\s\S]*"numTotalTests"[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as TestResult
        }
      } catch {
        // ignore parse error
      }
    }
    return null
  }
}

function countTestFiles(): number {
  try {
    const output = run(
      'git ls-files "src/**/*.test.ts" "src/**/*.test.tsx" "src/**/*.spec.ts" "src/**/*.spec.tsx"'
    )
    return output.split('\n').filter((f) => f.length > 0).length
  } catch {
    return 0
  }
}

// --- Main ---

const base = getBaseRef()

console.log('# Story Metrics Report')
console.log(`# Generated: ${new Date().toISOString().split('T')[0]}`)
console.log(`# Base: ${base}`)
console.log('')

// 1. File List
const files = getChangedFiles(base)
const { src, tests, config, other } = categorizeFiles(files)

console.log('## File List')
console.log('')

if (src.length > 0) {
  console.log(`### Source Files (${src.length})`)
  for (const f of src) console.log(`- ${f}`)
  console.log('')
}

if (tests.length > 0) {
  console.log(`### Test Files (${tests.length})`)
  for (const f of tests) console.log(`- ${f}`)
  console.log('')
}

if (config.length > 0) {
  console.log(`### Config Files (${config.length})`)
  for (const f of config) console.log(`- ${f}`)
  console.log('')
}

if (other.length > 0) {
  console.log(`### Other Files (${other.length})`)
  for (const f of other) console.log(`- ${f}`)
  console.log('')
}

console.log(`**Total changed files: ${files.length}**`)
console.log('')

// 2. Test Counts
console.log('## Test Counts')
console.log('')

const testFileCount = countTestFiles()
console.log(`- **Test files:** ${testFileCount}`)

console.log('- Running vitest for accurate counts...')
const testResult = getTestCounts()

if (testResult) {
  console.log(`- **Test suites:** ${testResult.numPassedTestSuites}/${testResult.numTotalTestSuites} passed`)
  console.log(`- **Tests:** ${testResult.numPassedTests}/${testResult.numTotalTests} passed`)
  if (testResult.numFailedTests > 0) {
    console.log(`- **FAILED:** ${testResult.numFailedTests} tests`)
  }
} else {
  console.log('- ⚠ Could not parse vitest JSON output. Run `npm run test:run` manually.')
}

console.log('')
console.log('---')
console.log('Copy the sections above into your story documentation.')
