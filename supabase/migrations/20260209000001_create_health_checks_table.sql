-- Migration: Create health_checks table for health check audit trail (Story 5.1)
-- Stores individual health check results per system.
-- The systems table holds the latest snapshot; health_checks holds the history.

CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure')),
  response_time INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_health_checks_system_id ON health_checks(system_id, checked_at DESC);

-- RLS Policies
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;

-- Public can read health checks for enabled, non-deleted systems
CREATE POLICY "Public can read health checks for enabled systems"
  ON health_checks FOR SELECT TO anon
  USING (system_id IN (
    SELECT id FROM systems WHERE enabled = true AND deleted_at IS NULL
  ));

-- Authenticated admins can read all health checks
CREATE POLICY "Admins can read all health checks"
  ON health_checks FOR SELECT TO authenticated
  USING (true);

-- Service role has full access (bypasses RLS automatically)
