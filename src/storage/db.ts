import Dexie, { type Table } from 'dexie';
import type { MediaRecord, Profile, Property } from './types';

/**
 * IndexedDB schema via Dexie.
 * Components must NEVER import this module — only repositories via index.ts.
 */
export class CastleDatabase extends Dexie {
  profiles!: Table<Profile, string>;
  properties!: Table<Property, string>;
  mediaMeta!: Table<MediaRecord, string>;
  /** Fallback blob store when OPFS is unavailable (ArrayBuffer for portable binary) */
  mediaBlobs!: Table<{ id: string; bytes: ArrayBuffer; mimeType: string }, string>;
  /** Key-value app meta (e.g. blob backend choice) */
  meta!: Table<{ key: string; value: string }, string>;

  constructor(name = 'castle-guide') {
    super(name);
    this.version(1).stores({
      profiles: 'id',
      properties: 'id, name',
      mediaMeta: 'id',
      mediaBlobs: 'id',
      meta: 'key',
    });
  }
}

let dbInstance: CastleDatabase | null = null;

export function getDb(dbName?: string): CastleDatabase {
  if (dbName) {
    return new CastleDatabase(dbName);
  }
  if (!dbInstance) {
    dbInstance = new CastleDatabase();
  }
  return dbInstance;
}

/** Test helper: reset singleton (does not delete IDB). */
export function resetDbSingleton(): void {
  dbInstance = null;
}

export async function deleteDatabase(name = 'castle-guide'): Promise<void> {
  resetDbSingleton();
  await Dexie.delete(name);
}
