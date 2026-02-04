-- Migration: Create systems table
-- Story: 1.2 - Database Schema & Seed Data
-- AC: #1, #7

-- Shared trigger function for auto-updating updated_at column
-- Used by: systems, landing_page_content (and future tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Systems table
CREATE TABLE systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  status TEXT,
  response_time INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes (AC #7)
CREATE INDEX idx_systems_enabled ON systems(enabled, display_order);
CREATE INDEX idx_systems_display_order ON systems(display_order);

-- Auto-update updated_at trigger
CREATE TRIGGER update_systems_updated_at
  BEFORE UPDATE ON systems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
