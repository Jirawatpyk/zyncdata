-- Migration: Create RLS policies for systems and landing_page_content
-- Story: 1.2 - Database Schema & Seed Data
-- AC: #5, #6

-- =============================================================================
-- Systems table RLS policies
-- =============================================================================

-- Public: read enabled systems only (AC #5)
CREATE POLICY "Public can view enabled systems"
ON systems
FOR SELECT
TO anon, authenticated
USING (enabled = true);

-- Admin: full CRUD access
CREATE POLICY "Admins can manage systems"
ON systems
FOR ALL
TO authenticated
USING (
  (select (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('admin', 'super_admin')
)
WITH CHECK (
  (select (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('admin', 'super_admin')
);

-- =============================================================================
-- Landing page content table RLS policies
-- =============================================================================

-- Public: read all published content
CREATE POLICY "Public can view landing page content"
ON landing_page_content
FOR SELECT
TO anon, authenticated
USING (true);

-- Admin: full CRUD access
CREATE POLICY "Admins can manage landing page content"
ON landing_page_content
FOR ALL
TO authenticated
USING (
  (select (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('admin', 'super_admin')
)
WITH CHECK (
  (select (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('admin', 'super_admin')
);
