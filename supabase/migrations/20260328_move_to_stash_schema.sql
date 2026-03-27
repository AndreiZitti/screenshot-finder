-- =============================================================
-- Migration: Move all tables from public to stash schema
-- Also fixes: discoveries missing user_id column + RLS
-- =============================================================

-- 1. Create stash schema and grant permissions to Supabase roles
CREATE SCHEMA IF NOT EXISTS stash;
GRANT USAGE ON SCHEMA stash TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA stash TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA stash GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- 2. Fix discoveries table BEFORE moving (add missing columns)
ALTER TABLE public.discoveries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.discoveries ADD COLUMN IF NOT EXISTS notes TEXT;

-- Backfill existing rows with owner's user_id
UPDATE public.discoveries SET user_id = '135ff12e-4387-421e-b7b5-901993e25eb7' WHERE user_id IS NULL;

-- Now enforce NOT NULL
ALTER TABLE public.discoveries ALTER COLUMN user_id SET NOT NULL;

-- Add index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_discoveries_user_id ON public.discoveries(user_id);

-- 3. Move all tables to stash schema
ALTER TABLE public.discoveries SET SCHEMA stash;
ALTER TABLE public.notes SET SCHEMA stash;
ALTER TABLE public.links SET SCHEMA stash;
ALTER TABLE public.user_settings SET SCHEMA stash;
ALTER TABLE public.notion_connections SET SCHEMA stash;

-- 4. Enable RLS on discoveries (was missing!)
ALTER TABLE stash.discoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own discoveries" ON stash.discoveries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discoveries" ON stash.discoveries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discoveries" ON stash.discoveries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own discoveries" ON stash.discoveries
  FOR DELETE USING (auth.uid() = user_id);
