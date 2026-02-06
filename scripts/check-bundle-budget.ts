/**
 * Per-route bundle budget checker for Next.js (Turbopack).
 *
 * Measures the real First Load JS per route by reading each route's
 * client-reference-manifest to find page-specific chunks, then adding
 * the shared framework chunks that every page loads.
 *
 * Usage: npx tsx scripts/check-bundle-budget.ts
 * CI:    npm run size  (wired in package.json)
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as zlib from 'node:zlib'

// ── Budget configuration ────────────────────────────────────────────
// Per-route-group budgets (gzip KB). Adjust as needed.
const BUDGETS: Record<string, number> = {
  public: 250, // Landing page, login, register, unauthorized
  admin: 350, // Admin panel (Radix UI, React Query, forms, dialogs)
  css: 50, // Global CSS
}

// Route → budget group mapping
const ROUTE_GROUPS: Record<string, string> = {
  '/(public)': 'public',
  '/auth/login': 'public',
  '/auth/register': 'public',
  '/auth/mfa-verify': 'public',
  '/auth/mfa-enroll': 'public',
  '/unauthorized': 'public',
  '/coming-soon': 'public',
  '/dashboard': 'public',
  '/admin': 'admin',
  '/admin/systems': 'admin',
  '/admin/content': 'admin',
  '/admin/analytics': 'admin',
  '/admin/settings': 'admin',
}

// ── Helpers ─────────────────────────────────────────────────────────

const BUILD_DIR = path.resolve('.next')
const CHUNKS_DIR = path.join(BUILD_DIR, 'static', 'chunks')

function gzipSize(filePath: string): number {
  const content = fs.readFileSync(filePath)
  return zlib.gzipSync(content).length
}

function findBootstrapChunks(): string[] {
  // Bootstrap chunks are embedded in every server-rendered HTML page by Next.js
  // (React DOM, framework, runtime). They don't appear in client-reference
  // manifests, so we extract them from a pre-rendered HTML file.
  const appDir = path.join(BUILD_DIR, 'server', 'app')
  const htmlCandidates = ['unauthorized.html', '_not-found.html']

  for (const name of htmlCandidates) {
    const htmlPath = path.join(appDir, name)
    if (!fs.existsSync(htmlPath)) continue

    const html = fs.readFileSync(htmlPath, 'utf8')
    const scriptRefs = html.match(/static\/chunks\/[a-f0-9-]+\.js/g)
    if (!scriptRefs) continue

    const chunkNames = [
      ...new Set(scriptRefs.map((ref) => ref.replace('static/chunks/', ''))),
    ]
    return chunkNames
  }

  return []
}

function findAllManifests(): string[] {
  const results: string[] = []
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item)
      const stat = fs.statSync(full)
      if (stat.isDirectory()) {
        walk(full)
      } else if (item === 'page_client-reference-manifest.js') {
        results.push(full)
      }
    }
  }
  walk(path.join(BUILD_DIR, 'server', 'app'))
  return results
}

function extractChunkNames(manifestPath: string): string[] {
  const content = fs.readFileSync(manifestPath, 'utf8')
  const matches = content.match(/[a-f0-9]{16}\.js/g)
  return matches ? [...new Set(matches)] : []
}

function routeFromManifest(manifestPath: string): string {
  // e.g. .next/server/app/(public)/page_client-reference-manifest.js → /(public)
  const rel = path.relative(
    path.join(BUILD_DIR, 'server', 'app'),
    manifestPath,
  )
  const dir = path.dirname(rel).replace(/\\/g, '/')
  return '/' + dir.replace(/^\//, '')
}

function formatKB(bytes: number): string {
  return (bytes / 1024).toFixed(1)
}

// ── Main ────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(CHUNKS_DIR)) {
    console.error('Build output not found. Run `npm run build` first.')
    process.exit(1)
  }

  // 1. Find bootstrap (framework) chunks from rendered HTML
  const bootstrapChunkNames = findBootstrapChunks()
  let frameworkSize = 0
  for (const name of bootstrapChunkNames) {
    const fp = path.join(CHUNKS_DIR, name)
    if (fs.existsSync(fp)) frameworkSize += gzipSize(fp)
  }

  console.log('Bundle Budget Check (per-route First Load JS, gzip)')
  console.log('════════════════════════════════════════════════════')
  console.log(
    `Framework (shared):  ${formatKB(frameworkSize).padStart(7)} KB  (${bootstrapChunkNames.length} chunks)`,
  )
  console.log('')

  // 2. Measure each route
  const manifests = findAllManifests()
  const results: {
    route: string
    group: string
    pageSize: number
    totalSize: number
    budget: number
    pass: boolean
  }[] = []

  for (const manifestPath of manifests) {
    const route = routeFromManifest(manifestPath)
    const group = ROUTE_GROUPS[route]
    if (!group) continue // skip unmapped routes (API routes, etc.)

    const allChunks = extractChunkNames(manifestPath)
    const pageChunks = allChunks.filter(
      (c) => !bootstrapChunkNames.includes(c),
    )

    let pageSize = 0
    for (const name of pageChunks) {
      const fp = path.join(CHUNKS_DIR, name)
      if (fs.existsSync(fp)) pageSize += gzipSize(fp)
    }

    const totalSize = frameworkSize + pageSize
    const budget = BUDGETS[group] * 1024 // convert KB to bytes
    const pass = totalSize <= budget

    results.push({ route, group, pageSize, totalSize, budget, pass })
  }

  // Sort by group then route
  results.sort((a, b) => a.group.localeCompare(b.group) || a.route.localeCompare(b.route))

  // 3. Print results
  let hasFailure = false

  for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL'
    const icon = r.pass ? ' ' : '>'
    const budgetKB = formatKB(r.budget)
    const totalKB = formatKB(r.totalSize)
    const pageKB = formatKB(r.pageSize)

    console.log(
      `${icon} ${status}  ${r.route.padEnd(22)} ${totalKB.padStart(7)} KB / ${budgetKB} KB  [${r.group}] (page: ${pageKB} KB)`,
    )

    if (!r.pass) hasFailure = true
  }

  // 4. CSS check
  console.log('')
  const cssFiles = fs
    .readdirSync(CHUNKS_DIR)
    .filter((f) => f.endsWith('.css'))
  let cssSize = 0
  for (const f of cssFiles) {
    cssSize += gzipSize(path.join(CHUNKS_DIR, f))
  }
  const cssBudget = BUDGETS.css * 1024
  const cssPass = cssSize <= cssBudget
  const cssIcon = cssPass ? ' ' : '>'
  const cssStatus = cssPass ? 'PASS' : 'FAIL'
  console.log(
    `${cssIcon} ${cssStatus}  ${'CSS (global)'.padEnd(22)} ${formatKB(cssSize).padStart(7)} KB / ${formatKB(cssBudget)} KB`,
  )
  if (!cssPass) hasFailure = true

  // 5. Summary
  console.log('')
  console.log('════════════════════════════════════════════════════')
  console.log(`Budgets:  public ≤ ${BUDGETS.public} KB  |  admin ≤ ${BUDGETS.admin} KB  |  CSS ≤ ${BUDGETS.css} KB`)

  if (hasFailure) {
    console.log('')
    console.log('BUDGET EXCEEDED — see FAIL entries above')
    process.exit(1)
  } else {
    console.log('All routes within budget.')
  }
}

main()
