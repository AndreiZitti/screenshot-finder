import { getDB, type LocalDiscovery } from './local-db';
import type { Discovery } from '@/types/discovery';

export async function getAllDiscoveries(archived?: boolean): Promise<LocalDiscovery[]> {
  const db = await getDB();
  const all = await db.getAll('discoveries');

  if (archived === undefined) return all;

  return all.filter((d) =>
    archived ? d.archived_at !== null : d.archived_at === null
  );
}

export async function getDiscoveryById(id: string): Promise<LocalDiscovery | undefined> {
  const db = await getDB();
  return db.get('discoveries', id);
}

export async function createDiscovery(
  discovery: Omit<Discovery, 'id' | 'created_at' | 'archived_at'>
): Promise<LocalDiscovery> {
  const db = await getDB();
  const record: LocalDiscovery = {
    ...discovery,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    archived_at: null,
    _dirty: true,
    _synced_at: null,
  };
  await db.put('discoveries', record);
  return record;
}

export async function updateDiscovery(
  id: string,
  updates: Partial<Discovery>
): Promise<LocalDiscovery | undefined> {
  const db = await getDB();
  const existing = await db.get('discoveries', id);
  if (!existing) return undefined;

  const updated: LocalDiscovery = {
    ...existing,
    ...updates,
    id, // prevent id override
    _dirty: true,
  };
  await db.put('discoveries', updated);
  return updated;
}

export async function deleteDiscovery(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('discoveries', id);
}

export async function archiveDiscovery(id: string): Promise<LocalDiscovery | undefined> {
  const db = await getDB();
  const existing = await db.get('discoveries', id);
  if (!existing) return undefined;

  const updated: LocalDiscovery = {
    ...existing,
    archived_at: new Date().toISOString(),
    _dirty: true,
  };
  await db.put('discoveries', updated);
  return updated;
}

export async function unarchiveDiscovery(id: string): Promise<LocalDiscovery | undefined> {
  const db = await getDB();
  const existing = await db.get('discoveries', id);
  if (!existing) return undefined;

  const updated: LocalDiscovery = {
    ...existing,
    archived_at: null,
    _dirty: true,
  };
  await db.put('discoveries', updated);
  return updated;
}

export async function getDirtyDiscoveries(): Promise<LocalDiscovery[]> {
  const db = await getDB();
  const all = await db.getAll('discoveries');
  return all.filter((d) => d._dirty);
}

export async function markClean(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('discoveries', id);
  if (!existing) return;

  await db.put('discoveries', {
    ...existing,
    _dirty: false,
    _synced_at: new Date().toISOString(),
  });
}

export async function upsertFromRemote(discovery: Discovery): Promise<void> {
  const db = await getDB();
  const existing = await db.get('discoveries', discovery.id);

  const record: LocalDiscovery = {
    ...discovery,
    _dirty: existing?._dirty ?? false,
    _synced_at: new Date().toISOString(),
  };

  // Only overwrite if the local copy is not dirty
  if (!existing || !existing._dirty) {
    await db.put('discoveries', record);
  }
}
