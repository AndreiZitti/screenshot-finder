-- Baseline table required by the later archive and schema migrations.
CREATE TABLE IF NOT EXISTS public.discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  link TEXT,
  metadata JSONB,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discoveries_created_at
  ON public.discoveries(created_at DESC);
