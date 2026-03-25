-- Add API key columns to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS groq_api_key TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
