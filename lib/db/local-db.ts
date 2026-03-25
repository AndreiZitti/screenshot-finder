import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Discovery } from '@/types/discovery';
import type { Note } from '@/types/note';
import type { Link } from '@/types/link';

export interface SyncFields {
  _dirty: boolean;
  _synced_at: string | null;
}

export type LocalDiscovery = Discovery & SyncFields;
export type LocalNote = Note & SyncFields;
export type LocalLink = Link & SyncFields;

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
    value: LocalNote;
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

export function getDB(): Promise<IDBPDatabase<ZStashDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ZStashDB>('z-stash-db', 1, {
      upgrade(db) {
        const discoveriesStore = db.createObjectStore('discoveries', { keyPath: 'id' });
        discoveriesStore.createIndex('created_at', 'created_at');
        discoveriesStore.createIndex('archived_at', 'archived_at');

        const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
        notesStore.createIndex('created_at', 'created_at');
        notesStore.createIndex('archived_at', 'archived_at');

        const linksStore = db.createObjectStore('links', { keyPath: 'id' });
        linksStore.createIndex('created_at', 'created_at');
        linksStore.createIndex('archived_at', 'archived_at');

        db.createObjectStore('settings', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}
