-- Fix: storage RLS policies incorrectly used user_metadata instead of app_metadata.
-- The application stores roles in app_metadata (consistent with systems table RLS).

-- Drop incorrect policies
DROP POLICY IF EXISTS "Admin upload system logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin update system logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete system logos" ON storage.objects;

-- Re-create with correct app_metadata path
CREATE POLICY "Admin upload system logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'system-logos'
  AND (select (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('admin', 'super_admin')
);

CREATE POLICY "Admin update system logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'system-logos'
  AND (select (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('admin', 'super_admin')
);

CREATE POLICY "Admin delete system logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'system-logos'
  AND (select (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('admin', 'super_admin')
);
