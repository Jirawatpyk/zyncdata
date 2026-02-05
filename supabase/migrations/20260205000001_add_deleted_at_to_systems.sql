-- Migration: Add deleted_at column to systems table
-- Story: 3.4 - Delete System with Soft Delete
-- AC: #3 - Soft delete records deletion timestamp for 30-day recovery

ALTER TABLE systems ADD COLUMN deleted_at TIMESTAMPTZ NULL DEFAULT NULL;
