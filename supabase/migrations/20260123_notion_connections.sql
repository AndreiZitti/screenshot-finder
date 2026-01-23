-- Create notion_connections table for multiple Notion pages per user
CREATE TABLE IF NOT EXISTS notion_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,  -- User-friendly name like "Work Notes" or "Personal"
  api_key TEXT NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT,  -- Cached page name from Notion API
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_notion_connections_user_id ON notion_connections(user_id);

-- Enable RLS
ALTER TABLE notion_connections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own connections
CREATE POLICY "Users can view own connections" ON notion_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections" ON notion_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON notion_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections" ON notion_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Migrate existing data from user_settings to notion_connections
INSERT INTO notion_connections (user_id, name, api_key, page_id, is_default)
SELECT 
  user_id,
  'My Notion Page' as name,
  notion_api_key as api_key,
  notion_page_id as page_id,
  true as is_default
FROM user_settings
WHERE notion_api_key IS NOT NULL AND notion_page_id IS NOT NULL;

-- Remove Notion columns from user_settings (keep table for future settings)
ALTER TABLE user_settings DROP COLUMN IF EXISTS notion_api_key;
ALTER TABLE user_settings DROP COLUMN IF EXISTS notion_page_id;
