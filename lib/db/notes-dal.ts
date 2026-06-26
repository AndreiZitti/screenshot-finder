import { getDB, type LocalNote } from './local-db';
import type { Note } from '@/types/note';

export async function getAllNotes(archived?: boolean): Promise<LocalNote[]> {
  const db = await getDB();
  const all = await db.getAll('notes');

  if (archived === undefined) return all;

  return all.filter((n) =>
    archived ? n.archived_at !== null : n.archived_at === null
  );
}

export async function getNoteById(id: string): Promise<LocalNote | undefined> {
  const db = await getDB();
  return db.get('notes', id);
}

export async function createNote(
  note: Omit<Note, 'id' | 'created_at' | 'archived_at'>
): Promise<LocalNote> {
  const db = await getDB();
  const record: LocalNote = {
    ...note,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    archived_at: null,
    _dirty: true,
    _synced_at: null,
  };
  await db.put('notes', record);
  return record;
}

export async function updateNote(
  id: string,
  updates: Partial<Note>
): Promise<LocalNote | undefined> {
  const db = await getDB();
  const existing = await db.get('notes', id);
  if (!existing) return undefined;

  const updated: LocalNote = {
    ...existing,
    ...updates,
    id,
    _dirty: true,
  };
  await db.put('notes', updated);
  return updated;
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('notes', id);
}


export async function getDirtyNotes(): Promise<LocalNote[]> {
  const db = await getDB();
  const all = await db.getAll('notes');
  return all.filter((n) => n._dirty);
}

export async function markClean(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('notes', id);
  if (!existing) return;

  await db.put('notes', {
    ...existing,
    _dirty: false,
    _synced_at: new Date().toISOString(),
  });
}

export async function upsertFromRemote(note: Note): Promise<void> {
  const db = await getDB();
  const existing = await db.get('notes', note.id);

  const record: LocalNote = {
    ...note,
    _dirty: existing?._dirty ?? false,
    _synced_at: new Date().toISOString(),
  };

  if (!existing || !existing._dirty) {
    await db.put('notes', record);
  }
}
