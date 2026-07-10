import { CastleStorage } from '../storage/CastleStorage';

/** Single app-wide storage instance (browser). Tests construct their own. */
let appStorage: CastleStorage | null = null;

export function getAppStorage(): CastleStorage {
  if (!appStorage) {
    appStorage = new CastleStorage({ blobMode: 'auto' });
  }
  return appStorage;
}

export async function ensureStorageReady(): Promise<CastleStorage> {
  const s = getAppStorage();
  await s.init();
  return s;
}
