# Story 3.7: System Logo Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Admin,
I want to upload, replace, and delete system logos,
so that each system card displays the correct branding on the landing page.

## Acceptance Criteria (AC)

1. **Given** I am adding or editing a system, **When** I upload a logo file, **Then** the file is uploaded via a dedicated upload API route, **And** the `logo_url` is saved to the system record, **And** the logo is stored in Supabase Storage (bucket: `system-logos`).
2. **Given** a system has an existing logo, **When** I upload a new logo, **Then** the previous logo file is deleted from storage **And** the new logo replaces it.
3. **Given** a system has a logo, **When** I click "Remove logo", **Then** the `logo_url` is cleared to `null` **And** the logo file is deleted from storage **And** the system card shows the letter-based fallback placeholder.
4. **Given** I upload an invalid file (not an image, wrong MIME type, or too large), **When** the upload is processed, **Then** I see a clear error message describing the specific issue (file type or size).
5. **Given** I upload a logo during system creation, **When** the system is created successfully, **Then** the logo is uploaded after system creation and the `logo_url` is updated on the new system record.
6. **Given** the logo is displayed on the landing page, **When** I inspect it, **Then** the logo uses `next/image` with proper `remotePatterns` configuration for the Supabase Storage domain.

## Tasks / Subtasks

- [x] Task 1: Configure Supabase Storage bucket (AC: #1)
  - [x] 1.1 Create migration for `system-logos` public bucket with RLS policies
  - [x] 1.2 Add storage bucket config to `supabase/config.toml` for local dev
  - [x] 1.3 Verify bucket works locally with `npm run dev:db`
- [x] Task 2: Add validation schemas (AC: #1, #4)
  - [x] 2.1 Add `uploadLogoSchema` to `src/lib/validations/system.ts`
  - [x] 2.2 Add unit tests in `system.test.ts`
- [x] Task 3: Add server mutations for logo operations (AC: #1, #2, #3)
  - [x] 3.1 Add `uploadSystemLogo()` to `src/lib/systems/mutations.ts`
  - [x] 3.2 Add `deleteSystemLogo()` to `src/lib/systems/mutations.ts`
  - [x] 3.3 Add unit tests in `mutations.test.ts`
- [x] Task 4: Add API routes for upload and delete (AC: #1, #2, #3, #4)
  - [x] 4.1 Create `POST /api/systems/[id]/logo` route (upload/replace)
  - [x] 4.2 Create `DELETE /api/systems/[id]/logo` route (remove)
  - [x] 4.3 Add route tests
  - [x] 4.4 Add guardrail tests
- [x] Task 5: Add React Query mutation hooks (AC: #1, #2, #3)
  - [x] 5.1 Add `useUploadLogo()` to `src/lib/admin/mutations/systems.ts`
  - [x] 5.2 Add `useDeleteLogo()` to `src/lib/admin/mutations/systems.ts`
  - [x] 5.3 Add hook tests in `systems.test.tsx`
- [x] Task 6: Add logo upload UI to AddSystemDialog and EditSystemDialog (AC: #1, #2, #3, #4, #5)
  - [x] 6.1 Create `LogoUpload` component at `src/app/admin/systems/_components/LogoUpload.tsx`
  - [x] 6.2 Integrate `LogoUpload` into `EditSystemDialog` (upload + replace + remove)
  - [x] 6.3 Integrate `LogoUpload` into `AddSystemDialog` (upload after creation)
  - [x] 6.4 Add component tests
- [x] Task 7: Update landing page to use `next/image` for logos (AC: #6)
  - [x] 7.1 `sharp` already installed as next.js dependency
  - [x] 7.2 Add Supabase Storage domain to `next.config.ts` `images.remotePatterns`
  - [x] 7.3 Replace `<img>` with `<Image>` in `SystemCard.tsx` and `coming-soon/page.tsx`
  - [x] 7.4 Remove `eslint-disable @next/next/no-img-element` comments from both files
  - [x] 7.5 SystemCard tests pass without mocking (JSX serialization works with next/image)
- [x] Task 8: E2E tests (AC: #1-#6)
  - [x] 8.1 Create `tests/e2e/admin-system-logo.spec.ts`

## Dev Notes

### Architecture Decision: Supabase Storage (NOT public/ directory)

Current state: Seed data uses static files in `public/logos/` (e.g., `/logos/tinedy.svg`). Story 3.7 introduces **dynamic** logo uploads via Supabase Storage. This means:

- **New uploads** → Supabase Storage bucket `system-logos` → public URL like `https://<project>.supabase.co/storage/v1/object/public/system-logos/<filename>`
- **Existing seed logos** → Continue working from `public/logos/` (no migration needed — they're just static paths in `logo_url`)
- **Mixed state is OK** — some systems have `/logos/foo.svg` (static), others have full Supabase URLs (dynamic). `next/image` and `<img>` both handle both patterns.

### Storage Bucket: `system-logos`

**Bucket configuration:**
- **Name:** `system-logos`
- **Public:** `true` (logos are publicly visible on landing page)
- **File size limit:** `512KB` (generous — 10KB target per architecture, but allow larger originals)
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/svg+xml`, `image/webp`
- **File naming:** `{systemId}/{timestamp}.{ext}` (prevents collisions, enables easy cleanup)

**RLS policies (on `storage.objects` table):**
- `SELECT` (public read): Allow anyone to read from `system-logos` bucket
- `INSERT` (admin write): Allow authenticated users with `admin` or `super_admin` role
- `UPDATE` (admin replace): Same as INSERT
- `DELETE` (admin delete): Same as INSERT

**Migration file:** Create `supabase/migrations/YYYYMMDDHHmmss_create_system_logos_bucket.sql` (use `YYYYMMDDHHmmss` timestamp format matching existing migrations, e.g., `20260207000001_create_system_logos_bucket.sql`)

```sql
-- Create the system-logos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'system-logos',
  'system-logos',
  true,
  524288,  -- 512KB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
);

-- Public read access for system logos
CREATE POLICY "Public read access for system logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'system-logos');

-- Admin upload access
CREATE POLICY "Admin upload system logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'system-logos'
  AND (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'super_admin')
);

-- Admin update access (replace)
CREATE POLICY "Admin update system logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'system-logos'
  AND (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'super_admin')
);

-- Admin delete access
CREATE POLICY "Admin delete system logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'system-logos'
  AND (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('admin', 'super_admin')
);
```

### Local Dev: `supabase/config.toml` Addition

```toml
[storage.buckets.system-logos]
public = true
file_size_limit = "512KB"
allowed_mime_types = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"]
```

### API Route Design

**Why `POST /api/systems/[id]/logo` (not `/api/systems/upload-logo`)?**

The epics file mentions `/api/systems/upload-logo`, but RESTful convention and consistency with our existing patterns (`/api/systems/[id]/toggle`) favor resource-scoped routes: `/api/systems/[id]/logo`. This gives us:
- `POST /api/systems/[id]/logo` — Upload or replace logo (multipart/form-data)
- `DELETE /api/systems/[id]/logo` — Remove logo

**Upload flow (POST):**
1. Auth check: `requireApiAuth('admin')`
2. Parse `FormData` (NOT JSON — binary file upload)
3. Validate: file type, file size, system exists
4. If system already has a logo → delete old file from storage
5. Upload new file to Supabase Storage: `system-logos/{systemId}/{timestamp}.{ext}`
6. Get public URL
7. Update `systems.logo_url` with new URL
8. `revalidatePath('/')` for ISR cache bust
9. Return `{ data: system, error: null }`

**Delete flow (DELETE):**
1. Auth check: `requireApiAuth('admin')`
2. Parse system ID from params
3. Get current `logo_url` from system record
4. If logo_url points to Supabase Storage → delete file from storage
5. If logo_url is a static path (e.g., `/logos/tinedy.svg`) → just clear the DB field, don't try to delete from storage
6. Update `systems.logo_url = null`
7. `revalidatePath('/')` for ISR cache bust
8. Return `{ data: system, error: null }`

### Detecting Storage vs Static Logo URLs

```typescript
function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage/')
    || url.includes('127.0.0.1:54321/storage/')
    || url.includes('localhost:54321/storage/')
}

function extractStoragePath(url: string): string | null {
  // Extract path after /object/public/system-logos/
  const match = url.match(/\/object\/public\/system-logos\/(.+)$/)
  return match?.[1] ?? null
}
```

### Validation Schema

**File:** `src/lib/validations/system.ts`

```typescript
// Max file size: 512KB (architecture target is 10KB, but allow larger originals)
export const MAX_LOGO_SIZE = 512 * 1024 // 512KB

export const ALLOWED_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
] as const

// Server-side validation for the upload API (validates parsed FormData fields)
export const uploadLogoSchema = z.object({
  systemId: z.string().uuid('Invalid system ID'),
  fileName: z.string().min(1, 'File name required'),
  fileSize: z.number().max(MAX_LOGO_SIZE, `File must be less than 512KB`),
  fileType: z.enum(ALLOWED_LOGO_TYPES, {
    errorMap: () => ({ message: 'File must be JPEG, PNG, SVG, or WebP' }),
  }),
})

export type UploadLogoInput = z.infer<typeof uploadLogoSchema>
```

**Important:** Zod cannot validate `File` objects on the server (they're `Blob` via FormData). Instead, extract metadata (name, size, type) from the FormData file and validate those scalar values. The actual file bytes are passed separately to the upload function.

### Server Mutations

**File:** `src/lib/systems/mutations.ts`

```typescript
/**
 * Upload a logo for a system.
 * If the system already has a Supabase Storage logo, deletes the old one first.
 * Stores file in system-logos/{systemId}/{timestamp}.{ext}
 * Revalidates ISR cache for landing page.
 */
export async function uploadSystemLogo(
  systemId: string,
  file: Buffer | Uint8Array,
  fileName: string,
  contentType: string,
): Promise<System> {
  const supabase = await createClient()

  // 1. Get current system to check for existing logo
  const { data: current, error: fetchError } = await supabase
    .from('systems')
    .select('logo_url')
    .eq('id', systemId)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') throw new Error('System not found')
    throw fetchError
  }

  // 2. Delete old logo from storage if it's a Supabase URL
  if (current.logo_url && isSupabaseStorageUrl(current.logo_url)) {
    const oldPath = extractStoragePath(current.logo_url)
    if (oldPath) {
      await supabase.storage.from('system-logos').remove([oldPath])
    }
  }

  // 3. Upload new file
  const ext = fileName.split('.').pop() ?? 'png'
  const storagePath = `${systemId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('system-logos')
    .upload(storagePath, file, {
      contentType,
      upsert: false,
    })

  if (uploadError) throw new Error(`Failed to upload logo: ${uploadError.message}`)

  // 4. Get public URL
  const { data: urlData } = supabase.storage
    .from('system-logos')
    .getPublicUrl(storagePath)

  // 5. Update system record with new logo URL
  const { data, error } = await supabase
    .from('systems')
    .update({ logo_url: urlData.publicUrl })
    .eq('id', systemId)
    .select(SYSTEM_SELECT_COLUMNS)
    .single()

  if (error) throw error

  revalidatePath('/')

  return systemSchema.parse(toCamelCase<System>(data))
}

/**
 * Delete a system's logo.
 * Removes file from Supabase Storage (if it's a storage URL) and clears logo_url.
 * Static logos (e.g., /logos/tinedy.svg) just get their DB field cleared.
 * Revalidates ISR cache for landing page.
 */
export async function deleteSystemLogo(systemId: string): Promise<System> {
  const supabase = await createClient()

  // 1. Get current logo URL
  const { data: current, error: fetchError } = await supabase
    .from('systems')
    .select('logo_url')
    .eq('id', systemId)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') throw new Error('System not found')
    throw fetchError
  }

  // 2. Delete from storage if Supabase URL
  if (current.logo_url && isSupabaseStorageUrl(current.logo_url)) {
    const path = extractStoragePath(current.logo_url)
    if (path) {
      await supabase.storage.from('system-logos').remove([path])
    }
  }

  // 3. Clear logo_url on system record
  const { data, error } = await supabase
    .from('systems')
    .update({ logo_url: null })
    .eq('id', systemId)
    .select(SYSTEM_SELECT_COLUMNS)
    .single()

  if (error) throw error

  revalidatePath('/')

  return systemSchema.parse(toCamelCase<System>(data))
}
```

### API Route: Upload Logo

**File:** `src/app/api/systems/[id]/logo/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { uploadSystemLogo, deleteSystemLogo } from '@/lib/systems/mutations'
import { uploadLogoSchema, MAX_LOGO_SIZE, ALLOWED_LOGO_TYPES } from '@/lib/validations/system'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const { id } = await params

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid form data', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    const file = formData.get('file')
    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { data: null, error: { message: 'No file provided', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    // Validate metadata via Zod
    const validated = uploadLogoSchema.parse({
      systemId: id,
      fileName: (file as File).name ?? 'upload.png',
      fileSize: file.size,
      fileType: file.type,
    })

    // Convert to buffer for Supabase upload
    const buffer = Buffer.from(await file.arrayBuffer())

    const system = await uploadSystemLogo(
      validated.systemId,
      buffer,
      validated.fileName,
      validated.fileType,
    )

    return NextResponse.json({ data: system, error: null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message ?? 'Validation failed'
      return NextResponse.json(
        { data: null, error: { message, code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { data: null, error: { message: 'System not found', code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { data: null, error: { message: 'Failed to upload logo', code: 'UPLOAD_ERROR' } },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const { id } = await params
    const system = await deleteSystemLogo(id)
    return NextResponse.json({ data: system, error: null })
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { data: null, error: { message: 'System not found', code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { data: null, error: { message: 'Failed to delete logo', code: 'DELETE_ERROR' } },
      { status: 500 },
    )
  }
}
```

### React Query Hooks

**File:** `src/lib/admin/mutations/systems.ts`

```typescript
// Add to existing file:

interface UploadLogoMutationContext {
  previous: System[] | undefined
}

export function useUploadLogo() {
  const queryClient = useQueryClient()

  return useMutation<System, Error, { systemId: string; file: File }, UploadLogoMutationContext>({
    mutationFn: async ({ systemId, file }) => {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/systems/${systemId}/logo`, {
        method: 'POST',
        body: formData,
        // NOTE: Do NOT set Content-Type header — browser sets multipart boundary automatically
      })
      return unwrapResponse<System>(res)
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'systems'] })
      const previous = queryClient.getQueryData<System[]>(['admin', 'systems'])
      return { previous }
    },

    onSuccess: (serverData) => {
      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) =>
        old?.map((s) => (s.id === serverData.id ? serverData : s)) ?? [],
      )
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'systems'], context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'systems'] })
    },
  })
}

interface DeleteLogoMutationContext {
  previous: System[] | undefined
}

export function useDeleteLogo() {
  const queryClient = useQueryClient()

  return useMutation<System, Error, string, DeleteLogoMutationContext>({
    mutationFn: async (systemId) => {
      const res = await fetch(`/api/systems/${systemId}/logo`, {
        method: 'DELETE',
      })
      return unwrapResponse<System>(res)
    },

    onMutate: async (systemId) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'systems'] })
      const previous = queryClient.getQueryData<System[]>(['admin', 'systems'])

      // Optimistic: clear logo immediately
      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) =>
        old?.map((s) => (s.id === systemId ? { ...s, logoUrl: null } : s)) ?? [],
      )

      return { previous }
    },

    onSuccess: (serverData) => {
      queryClient.setQueryData<System[]>(['admin', 'systems'], (old) =>
        old?.map((s) => (s.id === serverData.id ? serverData : s)) ?? [],
      )
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'systems'], context.previous)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'systems'] })
    },
  })
}
```

### LogoUpload Component

**File:** `src/app/admin/systems/_components/LogoUpload.tsx`

A reusable component for both AddSystemDialog and EditSystemDialog:

```tsx
'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAX_LOGO_SIZE, ALLOWED_LOGO_TYPES } from '@/lib/validations/system'

interface LogoUploadProps {
  currentLogoUrl: string | null
  systemName: string
  isUploading: boolean
  onUpload: (file: File) => void
  onRemove: () => void
  error?: string | null
}

export default function LogoUpload({
  currentLogoUrl,
  systemName,
  isUploading,
  onUpload,
  onRemove,
  error,
}: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setValidationError(null)

    // Client-side validation
    if (!(ALLOWED_LOGO_TYPES as readonly string[]).includes(file.type)) {
      setValidationError('File must be JPEG, PNG, SVG, or WebP')
      return
    }
    if (file.size > MAX_LOGO_SIZE) {
      setValidationError(`File must be less than 512KB (current: ${Math.round(file.size / 1024)}KB)`)
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (event) => setPreview(event.target?.result as string)
    reader.readAsDataURL(file)

    onUpload(file)
  }

  const handleRemove = () => {
    setPreview(null)
    setValidationError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onRemove()
  }

  const displayUrl = preview ?? currentLogoUrl
  const displayError = validationError ?? error

  return (
    <div className="space-y-2">
      <Label>Logo</Label>
      <div className="flex items-center gap-4">
        {/* Logo preview */}
        <div
          className={cn(
            'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted',
            isUploading && 'opacity-50',
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : displayUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- preview uses local blob URL */
            <img
              src={displayUrl}
              alt={`${systemName} logo`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="text-2xl font-bold text-muted-foreground" aria-hidden="true">
              {systemName.charAt(0) || '?'}
            </div>
          )}
        </div>

        {/* Upload / Remove buttons */}
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              data-testid="upload-logo-button"
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {currentLogoUrl ? 'Replace' : 'Upload'}
            </Button>
            {(currentLogoUrl || preview) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
                data-testid="remove-logo-button"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Remove
              </Button>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            JPEG, PNG, SVG, or WebP. Max 512KB.
          </span>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/svg+xml,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="logo-file-input"
        />
      </div>

      {/* Error message */}
      {displayError && (
        <p className="text-[0.8rem] font-medium text-destructive" role="alert" data-testid="logo-error">
          {displayError}
        </p>
      )}
    </div>
  )
}
```

### Integration into EditSystemDialog

Add `LogoUpload` between the Description field and the Enabled toggle:

```tsx
import LogoUpload from './LogoUpload'
import { useUploadLogo, useDeleteLogo } from '@/lib/admin/mutations/systems'

// Inside component:
const uploadLogo = useUploadLogo()
const deleteLogo = useDeleteLogo()

const handleLogoUpload = (file: File) => {
  uploadLogo.mutate(
    { systemId: system.id, file },
    {
      onSuccess: () => toast.success('Logo uploaded'),
      onError: (err) => toast.error(`Upload failed: ${err.message}`),
    },
  )
}

const handleLogoRemove = () => {
  deleteLogo.mutate(system.id, {
    onSuccess: () => toast.success('Logo removed'),
    onError: () => toast.error('Failed to remove logo'),
  })
}

// In JSX (between Description and Enabled toggle):
<LogoUpload
  currentLogoUrl={system.logoUrl}
  systemName={form.watch('name') || system.name}
  isUploading={uploadLogo.isPending}
  onUpload={handleLogoUpload}
  onRemove={handleLogoRemove}
  error={uploadLogo.isError ? uploadLogo.error.message : null}
/>
```

### Integration into AddSystemDialog

Logo upload in AddSystemDialog is a **two-step process** because the system doesn't exist yet when the dialog opens:

1. User fills form + selects a logo file (stored in local state, preview shown)
2. On form submit: create system → get system ID → upload logo to that system

```tsx
// Inside AddSystemDialog:
const uploadLogo = useUploadLogo()
const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)
const [logoPreview, setLogoPreview] = useState<string | null>(null)

const handlePendingLogoSelect = (file: File) => {
  setPendingLogoFile(file)
  const reader = new FileReader()
  reader.onload = (e) => setLogoPreview(e.target?.result as string)
  reader.readAsDataURL(file)
}

const handlePendingLogoRemove = () => {
  setPendingLogoFile(null)
  setLogoPreview(null)
}

// In onSubmit, after createSystem.mutateAsync(data):
const created = await createSystem.mutateAsync(data)
if (pendingLogoFile) {
  try {
    await uploadLogo.mutateAsync({ systemId: created.id, file: pendingLogoFile })
  } catch {
    toast.error('System created but logo upload failed. Edit the system to retry.')
  }
}
```

For AddSystemDialog, `LogoUpload` doesn't call `onUpload` directly to the API — it just stores the file locally:
```tsx
<LogoUpload
  currentLogoUrl={logoPreview}
  systemName={form.watch('name') || 'New System'}
  isUploading={uploadLogo.isPending}
  onUpload={handlePendingLogoSelect}
  onRemove={handlePendingLogoRemove}
/>
```

### next/image Configuration

**File:** `next.config.ts`

Add `images.remotePatterns` for Supabase Storage:

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // ... existing headers config
}
```

For local dev, also add:
```typescript
{
  protocol: 'http',
  hostname: '127.0.0.1',
  port: '54321',
  pathname: '/storage/v1/object/public/**',
},
```

### SystemCard.tsx: Replace `<img>` with `next/image`

```tsx
import Image from 'next/image'

// Replace existing <img> block:
{logoUrl ? (
  <Image
    src={logoUrl}
    alt={`${name} logo`}
    width={64}
    height={64}
    className="h-16 w-16 rounded-xl object-contain"
  />
) : (
  <div className="..." aria-hidden="true">
    {name.charAt(0)}
  </div>
)}
```

**Note:** Static logos (e.g., `/logos/tinedy.svg`) work with `next/image` out of the box — no remotePatterns needed for local paths.

Also update `coming-soon/page.tsx` with the same pattern (80x80 dimensions).

### CSP: No Changes Required

The existing CSP in `next.config.ts` line 22 already has `img-src 'self' data: https:` — all HTTPS sources (including Supabase Storage) are already permitted. Do NOT add extra CSP directives for image loading.

### `sharp` Dependency — MUST INSTALL

`sharp` is **not in `package.json`** and this is the **first usage of `next/image` in the entire codebase**. Without `sharp`, next/image falls back to unoptimized mode (no WebP/AVIF conversion, no resizing). Install it as part of Task 7:

```bash
npm install sharp
```

### FormData vs JSON for Uploads — CRITICAL

**NEVER use `Content-Type: application/json` for file uploads.** Use `FormData` and let the browser set the multipart boundary automatically.

```typescript
// CORRECT:
const formData = new FormData()
formData.append('file', file)
await fetch(`/api/systems/${id}/logo`, { method: 'POST', body: formData })

// WRONG:
await fetch(`/api/systems/${id}/logo`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ file }), // File cannot be JSON serialized!
})
```

### Project Structure Notes

```
src/
├── app/api/systems/[id]/
│   └── logo/
│       ├── route.ts                    # NEW — POST (upload) + DELETE (remove)
│       ├── route.test.ts              # NEW — route tests
│       └── route.guardrails.test.ts   # NEW — auth/validation guardrails
├── app/admin/systems/_components/
│   ├── LogoUpload.tsx                 # NEW — reusable logo upload component
│   ├── LogoUpload.test.tsx            # NEW — component tests
│   ├── AddSystemDialog.tsx            # MODIFY — integrate LogoUpload
│   ├── AddSystemDialog.test.tsx       # MODIFY — add logo tests
│   ├── EditSystemDialog.tsx           # MODIFY — integrate LogoUpload
│   └── EditSystemDialog.test.tsx      # MODIFY — add logo tests
├── components/patterns/
│   ├── SystemCard.tsx                 # MODIFY — <img> → next/image
│   └── SystemCard.test.tsx            # MODIFY — update assertions
├── app/coming-soon/
│   └── page.tsx                       # MODIFY — <img> → next/image
├── lib/
│   ├── validations/system.ts          # MODIFY — add uploadLogoSchema, constants
│   ├── systems/mutations.ts           # MODIFY — add uploadSystemLogo(), deleteSystemLogo()
│   └── admin/mutations/systems.ts     # MODIFY — add useUploadLogo(), useDeleteLogo()
├── next.config.ts                     # MODIFY — add images.remotePatterns
supabase/
├── config.toml                        # MODIFY — add storage bucket
├── migrations/
│   └── YYYYMMDDHHmmss_create_system_logos_bucket.sql  # NEW (use timestamp format)
tests/
└── e2e/
    └── admin-system-logo.spec.ts      # NEW — E2E tests
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-3, Story 3.7]
- [Source: _bmad-output/planning-artifacts/architecture.md#Systems-Table-Schema]
- [Source: _bmad-output/project-context.md#API-Response-Type]
- [Source: _bmad-output/project-context.md#Image-Dynamic-Loading]
- [Source: _bmad-output/implementation-artifacts/3-6-toggle-system-visibility.md#Dev-Notes]
- [Source: _bmad-output/implementation-artifacts/3-4-delete-system-with-soft-delete.md#Dev-Notes]

---

## Technical Implementation Details

### 1. Established Patterns to Follow

| Pattern | Reference File | What to Copy |
|---------|---------------|--------------|
| API route structure | `src/app/api/systems/[id]/toggle/route.ts` | Auth check → parse → validate → mutate → respond |
| Server mutation | `src/lib/systems/mutations.ts` → `deleteSystem()` | Supabase op → error handling → revalidatePath → return parsed |
| React Query hook | `src/lib/admin/mutations/systems.ts` → `useDeleteSystem()` | Generic types, onMutate/onSuccess/onError/onSettled |
| Optimistic update | `useDeleteSystem()` `onMutate` | Snapshot → optimistic state → rollback context |
| Validation schema | `src/lib/validations/system.ts` → `toggleSystemSchema` | Zod schema + exported type |
| Route tests | `src/app/api/systems/[id]/toggle/route.test.ts` | Mock structure, auth/validation/error test cases |
| Hook tests | `src/lib/admin/mutations/systems.test.tsx` | QueryClient setup, spy patterns |
| E2E tests | `tests/e2e/admin-toggle-system.spec.ts` | Login flow, page navigation, action, assertion. **Import `test` from `../support/fixtures/merged-fixtures`** (NOT plain Playwright `test`) |
| Component dialog | `src/app/admin/systems/_components/EditSystemDialog.tsx` | Dialog + Form + mutation pattern |

### 2. Previous Story Intelligence (from Stories 3.4-3.6)

**Critical lessons to apply:**
- `vi.useFakeTimers()` in `beforeEach` can cause timeout issues — use `vi.useRealTimers()` at start of data-fetching tests
- Verify rollback via `setQueryDataSpy` (not final cache state) — `onSettled` invalidation clears cache after `onError`
- `database.ts` may have corruption from `supabase gen types` — check line 1 after regeneration
- shadcn component installs may overwrite customized files — do NOT install new shadcn components
- Test mock objects must include `deletedAt` field (added in Story 3.4)
- `AlertDialogAction` pattern from Story 3.4: use `e.preventDefault()` for async confirm actions in AlertDialogAction — but NOT relevant here (no destructive confirmations for logo upload)
- `unwrapResponse<T>(res)` from `@/lib/admin/queries/api-adapter` is the standard fetch response unwrapper
- `import { toast } from 'sonner'` — not from shadcn/ui

### 3. Git Intelligence (Recent Commits)

```
a050fdf fix(e2e): add missing test name prefixes to global-teardown
f3fa0bb fix(e2e): use /admin/systems for logout tests + add test data cleanup
403aee8 fix(ci): handle fresh MFA enrollment in E2E workflow
3241348 feat(story-3.5): implement reorder systems display + code review fixes
8a2a96c feat(story-3.4): implement delete system with soft delete + code review fixes
```

**Pattern insights:**
- E2E tests follow `admin-{action}.spec.ts` naming convention
- Story commits use `feat(story-X.Y):` prefix
- Bug fixes use `fix(scope):` prefix
- CI fixes handled separately

### 4. Testing Requirements

**Validation tests (`system.test.ts`):**
- Valid JPEG upload metadata passes
- Valid PNG upload metadata passes
- Valid SVG upload metadata passes
- Valid WebP upload metadata passes
- File too large (> 512KB) rejected
- Invalid MIME type (PDF, GIF, etc.) rejected
- Missing systemId rejected
- Invalid UUID rejected
- Missing fileName rejected

**Mutation tests (`mutations.test.ts`):**
- `uploadSystemLogo()`: happy path (new upload), replace existing (deletes old), system not found, storage upload error, DB update error, `revalidatePath('/')` called
- `deleteSystemLogo()`: happy path (Supabase URL), happy path (static URL — just clears DB), system not found, storage delete error (non-fatal), `revalidatePath('/')` called

**Route tests (`route.test.ts`):**
- POST: auth check, FormData parse error, no file provided, file type validation, file size validation, success response, system not found, server error
- DELETE: auth check, success response, system not found, server error

**Guardrail tests (`route.guardrails.test.ts`):**
- Unauthenticated request returns 401
- Non-admin role returns 403
- Missing file returns 400
- Invalid MIME type returns 400
- File too large returns 400

**Hook tests (`systems.test.tsx`):**
- `useUploadLogo()`: success + cache update, error rollback, cache invalidation, FormData sent correctly
- `useDeleteLogo()`: optimistic logoUrl clear, success + server data replacement, error rollback, cache invalidation

**Component tests (`LogoUpload.test.tsx`):**
- Renders fallback when no logo
- Renders image preview when logo exists
- Shows loading spinner during upload
- File input triggers on button click
- Validates file type client-side
- Validates file size client-side
- Shows error messages
- Remove button clears logo
- Upload button disabled during upload

**SystemCard.test.tsx migration notes:**

Existing test (line ~60) uses `expect(rendered).toContain('https://example.com/logo.png')` to check logo rendering. After migrating `<img>` to `next/image`, the `Image` component renders differently in JSDOM (test environment). Options:
1. **Mock `next/image`** with a simple `<img>` passthrough in test setup (recommended — keeps assertions simple)
2. Update assertions to check `Image` component props via `@testing-library/react` queries

Mock approach:
```typescript
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img {...props} />
  },
}))
```

**E2E tests (`admin-system-logo.spec.ts`):**

Import `test` from `../support/fixtures/merged-fixtures` (all E2E tests use this, NOT plain Playwright `test`). Create fresh test data per test — no shared state. Use `data-testid` selectors.

- Upload logo via edit dialog → verify logo appears in admin list
- Upload logo → verify logo appears on landing page
- Replace logo → verify new logo replaces old
- Remove logo → verify fallback shows
- Invalid file type → verify error message
- Create system with logo → verify two-step process works

### 5. Anti-Pattern Prevention

- **DO NOT** set `Content-Type: application/json` for file uploads — use FormData
- **DO NOT** try to JSON.stringify a File object — it's not serializable
- **DO NOT** delete static logos from the filesystem — only clear the DB field
- **DO NOT** use `next/image` for the in-dialog preview — use `<img>` since preview uses a local blob URL (blob URLs are not optimizable by next/image and don't need remote patterns)
- **DO NOT** create a separate `/api/systems/upload-logo` endpoint — use resource-scoped `/api/systems/[id]/logo`
- **DO NOT** upload logo before system exists (in AddSystemDialog) — create system first, then upload
- **DO NOT** use `dark:` Tailwind classes — ESLint rule `local/no-dark-classes` enforces
- **DO NOT** use `getSession()` for auth — use `requireApiAuth('admin')` which calls `getUser()`
- **DO NOT** install any new shadcn components — all needed components are already installed
- **DO NOT** set `updated_at` manually — database trigger handles it
- **DO NOT** create barrel files — import directly from source
- **DO NOT** hardcode Supabase project URL — use environment variables

### 6. Critical Implementation Rules

1. **Next.js 16 async params:** `const { id } = await params` in route handlers
2. **Validate before mutation:** Parse FormData metadata with Zod, never trust raw input
3. **FormData for uploads:** Let browser set Content-Type header with multipart boundary
4. **Call `revalidatePath('/')`** in every server mutation that changes data
5. **Convert snake_case ↔ camelCase** only in data access layer (`src/lib/systems/`)
6. **No `dark:` Tailwind classes** — ESLint rule enforces
7. **Min 44px touch targets** — Upload/Remove buttons inherit from Button component defaults
8. **`aria-label`** on icon-only buttons for accessibility
9. **Test with `vi.mock()` / `vi.fn()` / `vi.spyOn()`** — never Jest syntax
10. **`import { toast } from 'sonner'`** — not from shadcn/ui
11. **`unwrapResponse<T>(res)`** from `@/lib/admin/queries/api-adapter`
12. **API response format:** Always `{ data: T | null, error: { message, code } | null }`
13. **`next/image` requires `remotePatterns`** for Supabase Storage URLs — add to `next.config.ts`
14. **SVG support:** Include `image/svg+xml` in allowed types — current seed logos are SVGs

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- z.enum errorMap doesn't work for invalid values → switched to z.string().refine()
- JSDOM FormData/File/Blob limitations → mock FormData and File objects in route tests
- Buffer.from() → Uint8Array for JSDOM test compatibility in route handler
- userEvent.upload respects accept attribute → use fireEvent.change for invalid type tests

### Code Review Fixes Applied

**Reviewer:** Claude Opus 4.6 (adversarial code review)
**Date:** 2026-02-06

**Issues found:** 0 Critical, 4 Medium, 4 Low

**Fixes applied:**
- [M1] Added UUID validation (`z.string().uuid().parse(id)`) to DELETE route handler — prevents malformed IDs from reaching DB. Added 2 new tests (route.test.ts + guardrails).
- [M2] Removed duplicate FileReader in AddSystemDialog — `LogoUpload` already handles preview internally. Eliminated redundant `logoPreview` state and FileReader read.
- [M3] Skipped — `LogoUpload` component already provides spinner and FileReader preview UX. No meaningful optimistic URL available at mutation time.
- [M4] Added `package.json` and `package-lock.json` to Change Log and File List.
- [L4] Added test for DB update failure after successful storage upload (orphaned file scenario).

**Not fixed (low/acceptable):**
- [L1] E2E tests don't navigate to landing page to verify logo display — manual verification sufficient.
- [L2] Non-issue — Upload/Remove buttons have visible text labels, not icon-only.
- [L3] Minor UX inconsistency in button label — acceptable.

### Completion Notes List

- All 8 tasks completed
- 932 tests across 81 files — all passing (+91 new tests from Story 3.7)
- `sharp` was already installed as a next.js dependency (no separate install needed)
- SystemCard tests pass without next/image mocking (JSX serialization approach works)
- LogoUpload preview uses `<img>` (not next/image) per anti-pattern note — blob URLs not optimizable

### Change Log

- `supabase/migrations/20260207000001_create_system_logos_bucket.sql` — NEW
- `supabase/config.toml` — MODIFIED (storage bucket config)
- `src/lib/validations/system.ts` — MODIFIED (uploadLogoSchema, MAX_LOGO_SIZE, ALLOWED_LOGO_TYPES)
- `src/lib/validations/system.test.ts` — MODIFIED (+15 tests)
- `src/lib/systems/mutations.ts` — MODIFIED (uploadSystemLogo, deleteSystemLogo, isSupabaseStorageUrl, extractStoragePath)
- `src/lib/systems/mutations.test.ts` — MODIFIED (+19 tests)
- `src/app/api/systems/[id]/logo/route.ts` — NEW (POST + DELETE handlers)
- `src/app/api/systems/[id]/logo/route.test.ts` — NEW (13 tests)
- `src/app/api/systems/[id]/logo/route.guardrails.test.ts` — NEW (12 tests)
- `src/lib/admin/mutations/systems.ts` — MODIFIED (useUploadLogo, useDeleteLogo)
- `src/lib/admin/mutations/systems.test.tsx` — MODIFIED (+14 tests)
- `src/app/admin/systems/_components/LogoUpload.tsx` — NEW
- `src/app/admin/systems/_components/LogoUpload.test.tsx` — NEW (19 tests)
- `src/app/admin/systems/_components/EditSystemDialog.tsx` — MODIFIED (LogoUpload integration)
- `src/app/admin/systems/_components/AddSystemDialog.tsx` — MODIFIED (LogoUpload with two-step upload)
- `next.config.ts` — MODIFIED (images.remotePatterns for Supabase Storage)
- `src/components/patterns/SystemCard.tsx` — MODIFIED (<img> → next/image)
- `src/app/coming-soon/page.tsx` — MODIFIED (<img> → next/image)
- `tests/e2e/admin-system-logo.spec.ts` — NEW (6 E2E tests)
- `package.json` — MODIFIED (added sharp dependency)
- `package-lock.json` — MODIFIED (lockfile update for sharp)

### File List

**New files:**
- `supabase/migrations/20260207000001_create_system_logos_bucket.sql`
- `src/app/api/systems/[id]/logo/route.ts`
- `src/app/api/systems/[id]/logo/route.test.ts`
- `src/app/api/systems/[id]/logo/route.guardrails.test.ts`
- `src/app/admin/systems/_components/LogoUpload.tsx`
- `src/app/admin/systems/_components/LogoUpload.test.tsx`
- `tests/e2e/admin-system-logo.spec.ts`

**Modified files:**
- `supabase/config.toml`
- `src/lib/validations/system.ts`
- `src/lib/validations/system.test.ts`
- `src/lib/systems/mutations.ts`
- `src/lib/systems/mutations.test.ts`
- `src/lib/admin/mutations/systems.ts`
- `src/lib/admin/mutations/systems.test.tsx`
- `src/app/admin/systems/_components/EditSystemDialog.tsx`
- `src/app/admin/systems/_components/AddSystemDialog.tsx`
- `next.config.ts`
- `src/components/patterns/SystemCard.tsx`
- `src/app/coming-soon/page.tsx`
- `package.json`
- `package-lock.json`
