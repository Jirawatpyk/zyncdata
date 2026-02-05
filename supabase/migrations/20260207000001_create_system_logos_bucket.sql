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
