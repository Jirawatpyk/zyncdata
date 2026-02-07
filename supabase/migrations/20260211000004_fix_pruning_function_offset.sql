-- Fix: Optimize pruning function to use OFFSET instead of COUNT(*) (code review fix)
-- OFFSET approach: if ≤1000 rows, returns 0 rows = no-op. No COUNT scan needed.
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
