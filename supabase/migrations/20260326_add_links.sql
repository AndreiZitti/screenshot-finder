-- Create links table for saving and organizing links
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT,
  platform TEXT,
  thumbnail TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Create index for faster lookups
CREATE INDEX idx_links_user_id ON links(user_id);

-- Enable RLS
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Users can only access their own links
CREATE POLICY "Users can view own links" ON links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own links" ON links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links" ON links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links" ON links
  FOR DELETE USING (auth.uid() = user_id);
