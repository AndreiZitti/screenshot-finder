-- Add archived_at column to discoveries table
ALTER TABLE discoveries ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Index for filtering archived/active discoveries
CREATE INDEX IF NOT EXISTS idx_discoveries_archived
  ON discoveries(archived_at)
  WHERE archived_at IS NOT NULL;

-- Create notes table for raw voice transcriptions
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transcription TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Indexes for notes table
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_archived
  ON notes(archived_at)
  WHERE archived_at IS NOT NULL;

-- Enable RLS on notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for notes (match existing discoveries pattern)
CREATE POLICY "Users can view their own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);
