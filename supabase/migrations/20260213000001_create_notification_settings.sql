-- Create notification_settings table for Story 5-6
-- Stores admin email addresses and notification preferences

CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_emails TEXT[] NOT NULL DEFAULT '{}',
  notify_on_failure BOOLEAN NOT NULL DEFAULT true,
  notify_on_recovery BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at (shared function from Story 1-2)
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: Only authenticated admins can SELECT/UPDATE
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notification settings"
  ON notification_settings
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can update notification settings"
  ON notification_settings
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- Service role can INSERT (used by seed/setup)
CREATE POLICY "Service role can insert notification settings"
  ON notification_settings
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Seed with initial row (empty email array)
INSERT INTO notification_settings (notification_emails) VALUES ('{}');
