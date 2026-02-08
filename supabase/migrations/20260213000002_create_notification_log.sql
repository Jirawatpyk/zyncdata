-- Create notification_log table for Story 5-6
-- Tracks all notification attempts (sent/failed) for auditing

CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('failure', 'recovery')),
  recipient_emails TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying logs by system and time
CREATE INDEX idx_notification_log_system_id ON notification_log (system_id, sent_at DESC);

-- RLS: Only authenticated admins can SELECT
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notification logs"
  ON notification_log
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

-- Service role can INSERT (used by notification service in cron context)
CREATE POLICY "Service role can insert notification logs"
  ON notification_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);
