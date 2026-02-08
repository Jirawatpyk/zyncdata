-- Add per-system health check configuration columns
-- NULL values mean "use global default"

ALTER TABLE systems
  ADD COLUMN check_interval INTEGER NULL,
  ADD COLUMN timeout_threshold INTEGER NULL,
  ADD COLUMN failure_threshold INTEGER NULL;

-- CHECK constraints: enforce valid ranges
ALTER TABLE systems
  ADD CONSTRAINT systems_check_interval_range
    CHECK (check_interval >= 30 AND check_interval <= 86400),
  ADD CONSTRAINT systems_timeout_threshold_range
    CHECK (timeout_threshold >= 1000 AND timeout_threshold <= 60000),
  ADD CONSTRAINT systems_failure_threshold_range
    CHECK (failure_threshold >= 1 AND failure_threshold <= 10);

-- Document units and defaults
COMMENT ON COLUMN systems.check_interval IS 'Health check interval in seconds (30-86400). NULL = use global default (60s).';
COMMENT ON COLUMN systems.timeout_threshold IS 'Health check timeout in milliseconds (1000-60000). NULL = use global default (10000ms).';
COMMENT ON COLUMN systems.failure_threshold IS 'Consecutive failures before marking offline (1-10). NULL = use global default (3).';
