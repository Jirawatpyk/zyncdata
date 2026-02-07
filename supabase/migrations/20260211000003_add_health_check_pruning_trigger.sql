-- Migration: Add health check pruning trigger and performance indexes (Story 5.3)
-- Automatic data retention: keeps newest 1000 records per system.
-- Additional indexes for scaled query patterns.

-- Task 1: Pruning function (AC #1)
-- Fires AFTER INSERT on health_checks.
-- Deletes oldest rows exceeding 1000 per system using OFFSET (avoids COUNT(*) scan).
CREATE OR REPLACE FUNCTION prune_old_health_checks()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM health_checks
  WHERE id IN (
    SELECT id FROM health_checks
    WHERE system_id = NEW.system_id
    ORDER BY checked_at DESC
    OFFSET 1000
  );

  RETURN NULL; -- AFTER trigger, return value is ignored
END;
$$ LANGUAGE plpgsql;

-- Task 1: Pruning trigger (AC #1)
CREATE TRIGGER trigger_prune_health_checks
  AFTER INSERT ON health_checks
  FOR EACH ROW
  EXECUTE FUNCTION prune_old_health_checks();

-- Task 3: Composite index for filtered queries (AC #3)
-- Supports: "show all failures for system X" (Story 5.8 dashboard)
CREATE INDEX idx_health_checks_system_status
  ON health_checks(system_id, status, checked_at DESC);

-- Task 3: Partial index for failure-only lookups (AC #3)
-- Optimizes alerting queries (Story 5.6) — much smaller than full index
CREATE INDEX idx_health_checks_failures
  ON health_checks(system_id, checked_at DESC)
  WHERE status = 'failure';
