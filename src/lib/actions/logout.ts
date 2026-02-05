'use server'

import 'server-only'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function logoutAction(): Promise<never> {
  const supabase = await createClient()

  // signOut() with default scope='global' revokes ALL sessions across devices
  // @supabase/ssr automatically clears session cookies via setAll() callback
  try {
    await supabase.auth.signOut()
  } catch {
    // Even if Supabase API fails (network error, downtime), still proceed
    // with redirect — user should NEVER be stuck on a protected page.
    // @supabase/ssr cookie clearing via setAll() happens regardless.
  }

  // Bust Next.js full-route cache so stale authenticated pages are not served
  revalidatePath('/', 'layout')

  redirect('/auth/login')
}
