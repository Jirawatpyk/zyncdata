import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import { config as loadEnv } from 'dotenv'

// Load environment variables from .env.local
loadEnv({ path: path.join(__dirname, '../../../.env.local') })

/**
 * Known E2E test system name prefixes.
 * Each E2E spec creates systems with these prefixes + Date.now() suffix.
 */
const TEST_NAME_PREFIXES = [
  'E2E Test',
  'Edit Test',
  'Delete Test',
  'Validation Test',
  'No Changes Test',
  'Enable Button Test',
  'Reset Test',
  'Dup Edit Test',
  'Duplicate Test',
  'Loading Test',
  'Toast Test',
  'Toast Update',
  'Reorder Test',
  'Toggle Test',
  'Updated ',
  'Test System',
]

/**
 * Global teardown for Playwright E2E tests.
 *
 * Hard-deletes all systems created during E2E test runs.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS.
 */
export default async function globalTeardown(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('⚠️ Skipping test data cleanup — SUPABASE_SERVICE_ROLE_KEY not set')
    return
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('🧹 Cleaning up E2E test data...')

  // Build OR filter: name.like.E2E Test%,name.like.Edit Test%,...
  const orFilter = TEST_NAME_PREFIXES.map((prefix) => `name.like.${prefix}%`).join(',')

  const { data, error } = await supabase.from('systems').delete().or(orFilter).select('name')

  if (error) {
    console.error('❌ Test data cleanup failed:', error.message)
    return
  }

  if (data && data.length > 0) {
    console.log(`✓ Cleaned up ${data.length} test system(s):`)
    data.forEach((s: { name: string }) => console.log(`  - ${s.name}`))
  } else {
    console.log('✓ No test systems to clean up')
  }
}
