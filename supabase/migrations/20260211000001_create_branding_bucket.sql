-- Create the branding storage bucket for platform logo and favicon
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  true,
  524288,  -- 512KB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/x-icon']
);

-- Public read access for branding assets
CREATE POLICY "Public read access for branding assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

-- Admin upload access
CREATE POLICY "Admin upload branding assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'branding'
  AND (auth.jwt() -> 'app_metadata' ->> 'role')::text IN ('admin', 'super_admin')
);

-- Admin update access (replace)
CREATE POLICY "Admin update branding assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'branding'
  AND (auth.jwt() -> 'app_metadata' ->> 'role')::text IN ('admin', 'super_admin')
);

-- Admin delete access
CREATE POLICY "Admin delete branding assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'branding'
  AND (auth.jwt() -> 'app_metadata' ->> 'role')::text IN ('admin', 'super_admin')
);

-- Seed theme defaults
INSERT INTO landing_page_content (section_name, content) VALUES (
  'theme',
  '{"colorScheme": "dxt-default", "font": "nunito", "logoUrl": null, "faviconUrl": null}'::jsonb
);
