-- Story 4-B: Add category column to systems table
-- Categories: dxt_smart_platform, dxt_solutions, dxt_game (NULL = uncategorized)

ALTER TABLE systems ADD COLUMN category TEXT NULL;

COMMENT ON COLUMN systems.category IS 'Business unit: dxt_smart_platform, dxt_solutions, dxt_game';
