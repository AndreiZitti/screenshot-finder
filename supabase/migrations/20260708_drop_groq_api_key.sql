-- Groq transcription support was removed; Gemini now handles transcription.
ALTER TABLE stash.user_settings DROP COLUMN IF EXISTS groq_api_key;
