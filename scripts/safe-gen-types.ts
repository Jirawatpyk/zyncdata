/**
 * P3: Safe wrapper for `supabase gen types typescript --local`.
 *
 * Prevents database.ts corruption by:
 *   1. Backing up current file before generation
 *   2. Running gen types
 *   3. Validating output (line 1 must be valid TS, not console garbage)
 *   4. Auto-restoring backup if corruption detected
 *
 * Usage: npm run db:types  (replaces raw supabase command)
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'

const TARGET = path.resolve('src/types/database.ts')
const BACKUP = TARGET + '.bak'

// Known corruption patterns from Epic 3 code reviews:
// - "Connecting to db 5432" console output leaked into file
// - Empty file (0 bytes)
// - HTML error page
const CORRUPTION_PATTERNS = [
  /^Connecting/i,
  /^<!DOCTYPE/i,
  /^<html/i,
  /^Error/i,
  /^\s*$/,
]

// Valid first-line patterns for Supabase generated types
const VALID_FIRST_LINE = /^(export\s|\/\*|\/\/|import\s|declare\s)/

function main() {
  // 1. Backup current file
  if (fs.existsSync(TARGET)) {
    fs.copyFileSync(TARGET, BACKUP)
    console.log(`Backed up: ${path.basename(TARGET)} → ${path.basename(BACKUP)}`)
  }

  // 2. Run gen types
  console.log('Running: supabase gen types typescript --local ...')
  try {
    const output = execSync('supabase gen types typescript --local', {
      encoding: 'utf8',
      timeout: 30_000,
      // Capture stderr separately to prevent console leaks into stdout
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    // Write output to file
    fs.writeFileSync(TARGET, output, 'utf8')
  } catch (err) {
    console.error('supabase gen types failed:', (err as Error).message)
    restore('Command failed')
    return
  }

  // 3. Validate output
  const content = fs.readFileSync(TARGET, 'utf8')

  // Check: file not empty
  if (content.trim().length === 0) {
    restore('Generated file is empty')
    return
  }

  // Check: first line is valid TypeScript
  const firstLine = content.split('\n')[0].trim()

  for (const pattern of CORRUPTION_PATTERNS) {
    if (pattern.test(firstLine)) {
      restore(`Corruption detected on line 1: "${firstLine.substring(0, 60)}"`)
      return
    }
  }

  if (!VALID_FIRST_LINE.test(firstLine)) {
    restore(`Unexpected first line: "${firstLine.substring(0, 60)}"`)
    return
  }

  // Check: file has reasonable size (> 1 KB for a real schema)
  if (content.length < 1024) {
    restore(`Suspiciously small output (${content.length} bytes)`)
    return
  }

  // 4. Cleanup backup on success
  if (fs.existsSync(BACKUP)) {
    fs.unlinkSync(BACKUP)
  }

  console.log(`Generated: ${path.basename(TARGET)} (${(content.length / 1024).toFixed(1)} KB)`)
  console.log('Validation passed.')
}

function restore(reason: string) {
  console.error(`CORRUPTION: ${reason}`)

  if (fs.existsSync(BACKUP)) {
    fs.copyFileSync(BACKUP, TARGET)
    fs.unlinkSync(BACKUP)
    console.error(`RESTORED from backup. database.ts is unchanged.`)
  } else {
    console.error(`No backup available. Check database.ts manually.`)
  }

  process.exit(1)
}

main()
