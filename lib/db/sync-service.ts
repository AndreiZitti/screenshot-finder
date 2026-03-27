import { createClient } from '@/lib/supabase/client';
import {
  getAllDiscoveries,
  getDirtyDiscoveries,
  deleteDiscovery,
  markClean as markDiscoveryClean,
  upsertFromRemote as upsertDiscoveryFromRemote,
} from './discoveries-dal';
import {
  getAllNotes,
  getDirtyNotes,
  deleteNote,
  markClean as markNoteClean,
  upsertFromRemote as upsertNoteFromRemote,
} from './notes-dal';
import {
  getAllLinks,
  getDirtyLinks,
  deleteLink,
  markClean as markLinkClean,
  upsertFromRemote as upsertLinkFromRemote,
} from './links-dal';
import type { Discovery } from '@/types/discovery';
import type { Note } from '@/types/note';
import type { Link } from '@/types/link';

/**
 * Strip sync-only fields before sending to Supabase.
 */
function stripSyncFields<T extends { _dirty: boolean; _synced_at: string | null }>(
  record: T
): Omit<T, '_dirty' | '_synced_at'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _dirty, _synced_at, ...rest } = record;
  return rest as Omit<T, '_dirty' | '_synced_at'>;
}

/**
 * Push all dirty local records to Supabase.
 */
export async function pushToSupabase(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // Can't push without authentication

  // Push dirty discoveries
  const dirtyDiscoveries = await getDirtyDiscoveries();
  for (const discovery of dirtyDiscoveries) {
    const clean = { ...stripSyncFields(discovery), user_id: user.id };
    const { error } = await supabase
      .from('discoveries')
      .upsert(clean, { onConflict: 'id' });
    if (!error) {
      await markDiscoveryClean(discovery.id);
    } else {
      console.error('[sync] Failed to push discovery', discovery.id, error.message);
    }
  }

  // Push dirty notes
  const dirtyNotes = await getDirtyNotes();
  for (const note of dirtyNotes) {
    const clean = { ...stripSyncFields(note), user_id: user.id };
    const { error } = await supabase
      .from('notes')
      .upsert(clean, { onConflict: 'id' });
    if (!error) {
      await markNoteClean(note.id);
    } else {
      console.error('[sync] Failed to push note', note.id, error.message);
    }
  }

  // Push dirty links
  const dirtyLinks = await getDirtyLinks();
  for (const link of dirtyLinks) {
    const clean = { ...stripSyncFields(link), user_id: user.id };
    const { error } = await supabase
      .from('links')
      .upsert(clean, { onConflict: 'id' });
    if (!error) {
      await markLinkClean(link.id);
    } else {
      console.error('[sync] Failed to push link', link.id, error.message);
    }
  }
}

/**
 * Pull all records from Supabase into the local DB.
 */
export async function pullFromSupabase(): Promise<void> {
  const supabase = createClient();

  // Pull discoveries
  const { data: discoveries, error: dErr } = await supabase
    .from('discoveries')
    .select('*');
  if (dErr) {
    console.error('[sync] Failed to pull discoveries', dErr.message);
  } else if (discoveries) {
    for (const d of discoveries as Discovery[]) {
      await upsertDiscoveryFromRemote(d);
    }
    // Remove local records deleted server-side (keep dirty/unsynced ones)
    const remoteDiscoveryIds = new Set((discoveries as Discovery[]).map(d => d.id));
    for (const local of await getAllDiscoveries()) {
      if (!remoteDiscoveryIds.has(local.id) && !local._dirty) {
        await deleteDiscovery(local.id);
      }
    }
  }

  // Pull notes
  const { data: notes, error: nErr } = await supabase
    .from('notes')
    .select('*');
  if (nErr) {
    console.error('[sync] Failed to pull notes', nErr.message);
  } else if (notes) {
    for (const n of notes as Note[]) {
      await upsertNoteFromRemote(n);
    }
    const remoteNoteIds = new Set((notes as Note[]).map(n => n.id));
    for (const local of await getAllNotes()) {
      if (!remoteNoteIds.has(local.id) && !local._dirty) {
        await deleteNote(local.id);
      }
    }
  }

  // Pull links
  const { data: links, error: lErr } = await supabase
    .from('links')
    .select('*');
  if (lErr) {
    console.error('[sync] Failed to pull links', lErr.message);
  } else if (links) {
    for (const l of links as Link[]) {
      await upsertLinkFromRemote(l);
    }
    const remoteLinkIds = new Set((links as Link[]).map(l => l.id));
    for (const local of await getAllLinks()) {
      if (!remoteLinkIds.has(local.id) && !local._dirty) {
        await deleteLink(local.id);
      }
    }
  }
}

/**
 * Full sync: push local changes first (to avoid overwriting), then pull remote.
 */
export async function fullSync(): Promise<void> {
  await pushToSupabase();
  await pullFromSupabase();
}

/**
 * Auto-sync: check authentication and run fullSync if the user is logged in.
 * Designed to be called on login and network reconnect.
 * Gracefully handles cases where Supabase is not available (guest mode).
 */
export async function autoSync(): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Not authenticated — skip sync (guest mode)
      return;
    }

    await fullSync();
  } catch (err) {
    // Supabase client may not be available or network may be down
    console.error('[sync] autoSync failed', err);
  }
}
