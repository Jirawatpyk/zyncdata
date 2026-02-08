-- Enable Supabase Realtime on systems table
-- Broadcasts INSERT/UPDATE/DELETE events to subscribed channels
-- RLS policies already in place (Epic 3) — only authenticated admins with SELECT receive events
alter publication supabase_realtime add table systems;
