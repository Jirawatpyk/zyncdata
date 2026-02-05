import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  // Get admin user
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.log('List users error:', listError)
    return
  }

  const adminUser = users?.users?.find(u => u.email === 'admin@dxt-ai.com')

  if (!adminUser) {
    console.log('Admin user not found')
    return
  }

  console.log('Admin user ID:', adminUser.id)
  console.log('Factors:', JSON.stringify(adminUser.factors, null, 2))

  // Delete any existing factors
  if (adminUser.factors && adminUser.factors.length > 0) {
    for (const factor of adminUser.factors) {
      console.log('Deleting factor:', factor.id)
      const { error } = await supabase.auth.admin.mfa.deleteFactor({
        userId: adminUser.id,
        id: factor.id,
      })
      if (error) console.log('Delete error:', error)
      else console.log('Factor deleted')
    }
  } else {
    console.log('No factors to delete')
  }
}

main().catch(console.error)
