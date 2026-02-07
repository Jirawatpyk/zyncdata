-- Migration: Add draft_content column to landing_page_content
-- Story: 4.4 - Publish Changes
-- Purpose: Separate draft edits from published content (Strategy B)

ALTER TABLE landing_page_content ADD COLUMN draft_content JSONB DEFAULT NULL;
