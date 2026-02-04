import { createClient } from '@supabase/supabase-js'

async function seedAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD

  if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword) {
    console.error(
      'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD',
    )
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Idempotent: try to create, handle duplicate gracefully
  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    app_metadata: { role: 'super_admin' },
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log(`Super Admin already exists: ${adminEmail} — skipping`)
      process.exit(0)
    }
    console.error('Failed to create Super Admin:', error.message)
    process.exit(1)
  }

  console.log(`Super Admin created: ${data.user.email} (${data.user.id})`)
  console.log('Role: super_admin (stored in app_metadata)')
  console.log('IMPORTANT: Change the password after first login!')
  process.exit(0)
}

seedAdmin()
