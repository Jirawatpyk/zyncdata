-- Migration: Add last_checked_at column for health check timestamps (Story 3.8)
-- This column will store the timestamp of the most recent health check.
-- Initially NULL for all systems (no health checks until Epic 5).

ALTER TABLE systems ADD COLUMN last_checked_at TIMESTAMPTZ NULL;
