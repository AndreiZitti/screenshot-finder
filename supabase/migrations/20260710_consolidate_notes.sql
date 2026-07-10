-- Voice notes now use stash.discoveries with type = 'note'.
-- Preserve existing note UUIDs so external references remain stable.
DO $$
BEGIN
  IF to_regclass('stash.notes') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM stash.notes WHERE user_id IS NULL) THEN
      RAISE EXCEPTION 'Cannot migrate legacy notes without a user_id. Assign an owner before rerunning this migration.';
    END IF;

    INSERT INTO stash.discoveries (
      id,
      user_id,
      type,
      name,
      description,
      link,
      metadata,
      image_url,
      notes,
      created_at,
      archived_at
    )
    SELECT
      id,
      user_id,
      'note',
      CASE
        WHEN length(transcription) > 60 THEN left(transcription, 57) || '...'
        ELSE transcription
      END,
      transcription,
      NULL,
      NULL,
      NULL,
      NULL,
      created_at,
      archived_at
    FROM stash.notes
    ON CONFLICT (id) DO NOTHING;

    DROP TABLE stash.notes;
  END IF;
END $$;
