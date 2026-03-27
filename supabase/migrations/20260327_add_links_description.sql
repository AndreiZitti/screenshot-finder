-- Add description column to links table (was missing from initial migration)
ALTER TABLE links ADD COLUMN IF NOT EXISTS description TEXT;
