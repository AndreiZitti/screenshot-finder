export interface Note {
  id: string;
  user_id?: string;
  transcription: string;
  notes: string | null;
  created_at: string;
  archived_at: string | null;
}
