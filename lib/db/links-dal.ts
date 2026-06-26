import { getDB, type LocalLink } from './local-db';
import type { Link } from '@/types/link';

export async function getAllLinks(archived?: boolean): Promise<LocalLink[]> {
  const db = await getDB();
  const all = await db.getAll('links');

  if (archived === undefined) return all;

  return all.filter((l) =>
    archived ? l.archived_at !== null : l.archived_at === null
  );
}

export async function getLinkById(id: string): Promise<LocalLink | undefined> {
  const db = await getDB();
  return db.get('links', id);
}

export async function createLink(
  link: Omit<Link, 'id' | 'created_at' | 'archived_at'>
): Promise<LocalLink> {
  const db = await getDB();
  const record: LocalLink = {
    ...link,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    archived_at: null,
    _dirty: true,
    _synced_at: null,
  };
  await db.put('links', record);
  return record;
}

export async function updateLink(
  id: string,
  updates: Partial<Link>
): Promise<LocalLink | undefined> {
  const db = await getDB();
  const existing = await db.get('links', id);
  if (!existing) return undefined;

  const updated: LocalLink = {
    ...existing,
    ...updates,
    id,
    _dirty: true,
  };
  await db.put('links', updated);
  return updated;
}

export async function deleteLink(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('links', id);
}


export async function getDirtyLinks(): Promise<LocalLink[]> {
  const db = await getDB();
  const all = await db.getAll('links');
  return all.filter((l) => l._dirty);
}

export async function markClean(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('links', id);
  if (!existing) return;

  await db.put('links', {
    ...existing,
    _dirty: false,
    _synced_at: new Date().toISOString(),
  });
}

export async function upsertFromRemote(link: Link): Promise<void> {
  const db = await getDB();
  const existing = await db.get('links', link.id);

  const record: LocalLink = {
    ...link,
    _dirty: existing?._dirty ?? false,
    _synced_at: new Date().toISOString(),
  };

  if (!existing || !existing._dirty) {
    await db.put('links', record);
  }
}
