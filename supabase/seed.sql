-- Seed Data for Story 1.2 + 4-B
-- Idempotent: ON CONFLICT prevents duplicate errors on re-runs

-- =============================================================================
-- Systems (AC #3) — Systems grouped by category (Story 4-B)
-- Status is NULL until health checks are implemented (Epic 5)
-- =============================================================================

-- DxT Smart Platform
INSERT INTO systems (name, url, logo_url, description, status, display_order, enabled, category) VALUES
  ('TINEDY', 'https://tinedy.zyncdata.app', '/logos/tinedy.svg', 'Intelligent task and calendar management platform for streamlined scheduling', NULL, 1, true, 'dxt_smart_platform'),
  ('SLS', 'https://ba-sls.eqho.dev/login', NULL, 'Speech & Language Services for enterprise communication', 'coming_soon', 2, true, 'dxt_smart_platform'),
  ('ELAS', 'https://elas.zyncdata.app', NULL, 'Enterprise Language Assessment System for multilingual evaluation', 'coming_soon', 3, true, 'dxt_smart_platform'),
  ('QERP', 'https://qerp.zyncdata.app', NULL, 'Quality Enterprise Resource Planning for business operations', 'coming_soon', 4, true, 'dxt_smart_platform'),
  ('Project V', 'https://projectv.zyncdata.app', NULL, 'Project Management Platform for team collaboration', 'coming_soon', 5, true, 'dxt_smart_platform')
ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, display_order = EXCLUDED.display_order;

-- DxT Solutions
INSERT INTO systems (name, url, logo_url, description, status, display_order, enabled, category) VALUES
  ('Bangkok Air', 'https://bangkokair.zyncdata.app', NULL, 'Aviation Communication Platform for airline operations', 'coming_soon', 6, true, 'dxt_solutions'),
  ('ENEOS Industrial', 'https://eneos-industrial.zyncdata.app', NULL, 'Industrial Energy Management for manufacturing', 'coming_soon', 7, true, 'dxt_solutions'),
  ('ENEOS', 'https://eneos.zyncdata.app', '/logos/eneos.svg', 'Energy monitoring and optimization system for smart resource management', NULL, 8, true, 'dxt_solutions'),
  ('rws', 'https://rws.dxt-ai.com', '/logos/rws.png', 'Real-time workspace collaboration and project management tool', 'coming_soon', 9, true, 'dxt_solutions'),
  ('BINANCE', 'https://binance.dxt-ai.com', '/logos/binance.svg', 'Cryptocurrency portfolio tracking and analytics dashboard', 'coming_soon', 10, true, 'dxt_solutions'),
  ('VOCA', 'https://voca.dxt-ai.com', '/logos/voca.png', 'AI-powered vocabulary learning and language acquisition system', 'coming_soon', 11, true, 'dxt_solutions'),
  ('eLearning', 'https://elearning.zyncdata.app', NULL, 'Online Education Platform for enterprise training', 'coming_soon', 12, true, 'dxt_solutions')
ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, display_order = EXCLUDED.display_order;

-- DxT Game
INSERT INTO systems (name, url, logo_url, description, status, display_order, enabled, category) VALUES
  ('Hearthstone', 'https://hearthstone.zyncdata.app', NULL, 'Card Game Localization for international markets', 'coming_soon', 13, true, 'dxt_game'),
  ('RIOT', 'https://riot.zyncdata.app', NULL, 'Game Localization Services for competitive gaming', 'coming_soon', 14, true, 'dxt_game'),
  ('SONY', 'https://sony.zyncdata.app', NULL, 'Console Game Localization for PlayStation titles', 'coming_soon', 15, true, 'dxt_game')
ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, display_order = EXCLUDED.display_order;

-- =============================================================================
-- Landing Page Content (AC #4) — hero, pillars, systems, footer sections
-- =============================================================================
INSERT INTO landing_page_content (section_name, content, metadata) VALUES
  ('hero', '{
    "title": "DxT Smart Platform & Solutions",
    "subtitle": "Enterprise Access Management",
    "description": "One portal to access and monitor all DxT systems. Complete visibility."
  }'::jsonb, '{}'::jsonb),
  ('pillars', '{
    "heading": "Our Pillars",
    "items": [
      {
        "title": "DxT Smart Platform",
        "description": "Unified ecosystem connecting CRM, ERP, HR, and AI tools into one enterprise platform.",
        "url": "https://ba-sls.eqho.dev/login",
        "icon": "building"
      },
      {
        "title": "DxT Solutions",
        "description": "AI-powered multilingual platforms and automated workflows that help B2B teams scale with precision.",
        "url": "https://www.dxt-solutions.com/",
        "icon": "lightbulb"
      },
      {
        "title": "DxT AI & Data Management",
        "description": "Tailored data training services and AI model management designed for each business''s unique needs.",
        "url": "https://www.dxt-ai.com/",
        "icon": "brain"
      },
      {
        "title": "DxT Game",
        "description": "End-to-end game localization, cultural adaptation, and scalable services for international markets.",
        "url": null,
        "icon": "gamepad"
      }
    ]
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
