import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Discovery } from '@/types/discovery';
import type { Link } from '@/types/link';

export interface SyncFields {
  _dirty: boolean;
  _synced_at: string | null;
}

export type LocalDiscovery = Discovery & SyncFields;
export type LocalLink = Link & SyncFields;

interface LegacyNote extends SyncFields {
  id: string;
  user_id?: string;
  transcription: string;
  notes?: string | null;
  created_at: string;
  archived_at: string | null;
}

interface ZStashDB extends DBSchema {
  discoveries: {
    key: string;
    value: LocalDiscovery;
    indexes: {
      created_at: string;
      archived_at: string;
    };
  };
  notes: {
    key: string;
    value: LegacyNote;
    indexes: {
      created_at: string;
      archived_at: string;
    };
  };
  links: {
    key: string;
    value: LocalLink;
    indexes: {
      created_at: string;
      archived_at: string;
    };
  };
  settings: {
    key: string;
    value: { key: string; [prop: string]: unknown };
  };
}

let dbPromise: Promise<IDBPDatabase<ZStashDB>> | null = null;

function noteName(transcription: string): string {
  return transcription.length > 60 ? `${transcription.slice(0, 57)}...` : transcription;
}

export function getDB(): Promise<IDBPDatabase<ZStashDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ZStashDB>('z-stash-db', 2, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const discoveriesStore = db.createObjectStore('discoveries', { keyPath: 'id' });
          discoveriesStore.createIndex('created_at', 'created_at');
          discoveriesStore.createIndex('archived_at', 'archived_at');

          const linksStore = db.createObjectStore('links', { keyPath: 'id' });
          linksStore.createIndex('created_at', 'created_at');
          linksStore.createIndex('archived_at', 'archived_at');

          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (oldVersion === 1 && db.objectStoreNames.contains('notes')) {
          const notesStore = transaction.objectStore('notes');
          const discoveriesStore = transaction.objectStore('discoveries');

          void notesStore.getAll().then((notes) => {
            for (const note of notes) {
              void discoveriesStore.put({
                id: note.id,
                user_id: note.user_id,
                type: 'note',
                name: noteName(note.transcription),
                description: note.transcription,
                link: null,
                metadata: null,
                image_url: null,
                notes: note.notes || null,
                created_at: note.created_at,
                archived_at: note.archived_at,
                _dirty: note._dirty,
                _synced_at: note._synced_at,
              });
            }
            db.deleteObjectStore('notes');
          });
        }
      },
    });
  }
  return dbPromise;
}
