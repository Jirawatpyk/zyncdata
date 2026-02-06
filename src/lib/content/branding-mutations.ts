import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isSupabaseStorageUrl } from '@/lib/systems/mutations'

/** Extract storage path from a Supabase Storage public URL for the branding bucket */
export function extractBrandingStoragePath(url: string): string | null {
  const match = url.match(/\/object\/public\/branding\/(.+)$/)
  return match?.[1] ?? null
}

/**
 * Upload a branding asset (logo or favicon) to the branding storage bucket.
 * Deletes old file if it exists in Supabase Storage.
 * Returns the new public URL.
 */
export async function uploadBrandingAsset(
  folder: 'logo' | 'favicon',
  file: Buffer | Uint8Array,
  fileName: string,
  contentType: string,
  currentUrl: string | null,
): Promise<string> {
  const supabase = await createClient()

  // Delete old file from storage if it's a Supabase URL
  if (currentUrl && isSupabaseStorageUrl(currentUrl)) {
    const oldPath = extractBrandingStoragePath(currentUrl)
    if (oldPath) {
      await supabase.storage.from('branding').remove([oldPath])
    }
  }

  // Upload new file
  const ext = fileName.split('.').pop() ?? 'png'
  const storagePath = `${folder}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('branding')
    .upload(storagePath, file, {
      contentType,
      upsert: false,
    })

  if (uploadError) throw new Error(`Failed to upload ${folder}: ${uploadError.message}`)

  // Get public URL
  const { data: urlData } = supabase.storage.from('branding').getPublicUrl(storagePath)

  revalidatePath('/')

  return urlData.publicUrl
}

/**
 * Delete a branding asset from the branding storage bucket.
 */
export async function deleteBrandingAsset(
  currentUrl: string | null,
): Promise<void> {
  if (!currentUrl) return

  const supabase = await createClient()

  if (isSupabaseStorageUrl(currentUrl)) {
    const path = extractBrandingStoragePath(currentUrl)
    if (path) {
      await supabase.storage.from('branding').remove([path])
    }
  }

  revalidatePath('/')
}
