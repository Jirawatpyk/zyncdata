'use server'

import 'server-only'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { getCurrentUser } from '@/lib/auth/queries'
import { generateBackupCodes, hashBackupCode } from '@/lib/auth/backup-codes'
import { backupCodeSchema } from '@/lib/validations/auth'
import { getBackupCodeRatelimit } from '@/lib/ratelimit/backup-codes'
import { createClient } from '@/lib/supabase/server'

export type GenerateBackupCodesState = {
  codes: string[] | null
  error: string | null
}

export async function generateBackupCodesAction(): Promise<GenerateBackupCodesState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect('/auth/login')
    }

    const { plainCodes, hashedCodes } = generateBackupCodes()

    const supabase = await createClient()

    // Delete existing backup codes for this user (regeneration)
    const { error: deleteError } = await supabase
      .from('backup_codes')
      .delete()
      .eq('user_id', user.id)
    if (deleteError) {
      return { codes: null, error: 'Failed to generate backup codes. Please try again.' }
    }

    // Insert new hashed codes
    const { error: insertError } = await supabase.from('backup_codes').insert(
      hashedCodes.map((codeHash) => ({
        user_id: user.id,
        code_hash: codeHash,
      })),
    )

    if (insertError) {
      return { codes: null, error: 'Failed to generate backup codes. Please try again.' }
    }

    // Return plain-text codes — this is the ONLY time they are visible
    return { codes: plainCodes, error: null }
  } catch (err) {
    if (isRedirectError(err)) {
      throw err
    }
    return { codes: null, error: 'An unexpected error occurred. Please try again.' }
  }
}

export type VerifyBackupCodeState = {
  error: string | null
  rateLimited: boolean
  success: boolean
  remainingCodes: number | null
}

export async function verifyBackupCodeAction(
  _prevState: VerifyBackupCodeState,
  formData: FormData,
): Promise<VerifyBackupCodeState> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect('/auth/login')
    }

    // Rate limit by user ID
    const { success: rateLimitOk } = await getBackupCodeRatelimit().limit(user.id)
    if (!rateLimitOk) {
      return {
        error: 'Too many attempts. Please try again later.',
        rateLimited: true,
        success: false,
        remainingCodes: null,
      }
    }

    // Validate backup code format
    const raw = { code: formData.get('code') }
    const parsed = backupCodeSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0].message,
        rateLimited: false,
        success: false,
        remainingCodes: null,
      }
    }

    const codeHash = hashBackupCode(parsed.data.code)
    const supabase = await createClient()

    // Find matching unused backup code
    const { data: backupCode, error: selectError } = await supabase
      .from('backup_codes')
      .select('id')
      .eq('user_id', user.id)
      .eq('code_hash', codeHash)
      .is('used_at', null)
      .single()

    if (selectError || !backupCode) {
      return {
        error: 'Invalid or already used backup code',
        rateLimited: false,
        success: false,
        remainingCodes: null,
      }
    }

    // Mark code as used
    const { error: updateError } = await supabase
      .from('backup_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', backupCode.id)
    if (updateError) {
      return {
        error: 'An unexpected error occurred. Please try again.',
        rateLimited: false,
        success: false,
        remainingCodes: null,
      }
    }

    // Count remaining unused codes for user awareness
    const { count } = await supabase
      .from('backup_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('used_at', null)

    return { error: null, rateLimited: false, success: true, remainingCodes: count ?? 0 }
  } catch (err) {
    if (isRedirectError(err)) {
      throw err
    }
    return {
      error: 'An unexpected error occurred. Please try again.',
      rateLimited: false,
      success: false,
      remainingCodes: null,
    }
  }
}
