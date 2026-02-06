-- Seed Data for Story 1.2
-- Idempotent: ON CONFLICT prevents duplicate errors on re-runs

-- =============================================================================
-- Systems (AC #3) — 5 initial systems
-- Status is NULL until health checks are implemented (Epic 5)
-- =============================================================================
INSERT INTO systems (name, url, logo_url, description, status, display_order, enabled) VALUES
  ('TINEDY', 'https://tinedy.zyncdata.app', '/logos/tinedy.svg', 'Intelligent task and calendar management platform for streamlined scheduling', NULL, 1, true),
  ('VOCA', 'https://voca.dxt-ai.com', '/logos/voca.png', 'AI-powered vocabulary learning and language acquisition system', 'coming_soon', 2, true),
  ('ENEOS', 'https://eneos.zyncdata.app', '/logos/eneos.svg', 'Energy monitoring and optimization system for smart resource management', NULL, 3, true),
  ('rws', 'https://rws.dxt-ai.com', '/logos/rws.png', 'Real-time workspace collaboration and project management tool', 'coming_soon', 4, true),
  ('BINANCE', 'https://binance.dxt-ai.com', '/logos/binance.svg', 'Cryptocurrency portfolio tracking and analytics dashboard', 'coming_soon', 5, true)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- Landing Page Content (AC #4) — hero, intro, footer sections
-- =============================================================================
INSERT INTO landing_page_content (section_name, content, metadata) VALUES
  ('hero', '{
    "title": "DxT Smart Platform & Solutions",
    "subtitle": "Enterprise Access Management",
    "description": "One portal to access and monitor all DxT systems. Complete visibility."
  }'::jsonb, '{}'::jsonb),
  ('intro', '{
    "heading": "About DxT AI",
    "body": "DxT AI builds intelligent solutions that streamline operations and enhance productivity. Our platform provides unified access to all systems with real-time health monitoring and comprehensive management tools."
  }'::jsonb, '{}'::jsonb),
  ('systems', '{
    "heading": "Explore",
    "subtitle": "Access all your enterprise AI tools from one place"
  }'::jsonb, '{}'::jsonb),
  ('footer', '{
    "copyright": "2026 DxT Corporation Co., Ltd.",
    "links": []
  }'::jsonb, '{}'::jsonb)
ON CONFLICT (section_name) DO NOTHING;
