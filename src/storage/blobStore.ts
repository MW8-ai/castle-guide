import type { CastleDatabase } from './db';
import type { BlobBackend, MediaRecord } from './types';
import { sha256Hex } from './hash';
import { nowIso } from './ids';
import { toArrayBuffer } from './blobUtils';

const OPFS_DIR = 'castle-media';

export interface BlobStore {
  readonly backend: BlobBackend;
  put(id: string, blob: Blob, mimeType?: string): Promise<MediaRecord>;
  get(id: string): Promise<Blob | null>;
  delete(id: string): Promise<void>;
  getMeta(id: string): Promise<MediaRecord | null>;
  listMeta(): Promise<MediaRecord[]>;
}

function supportsOpfs(): boolean {
  try {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.storage?.getDirectory === 'function'
    );
  } catch {
    return false;
  }
}

async function getOpfsDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(OPFS_DIR, { create: true });
}

class OpfsBlobStore implements BlobStore {
  readonly backend: BlobBackend = 'opfs';

  constructor(private db: CastleDatabase) {}

  async put(id: string, blob: Blob, mimeType?: string): Promise<MediaRecord> {
    const mime = mimeType ?? blob.type ?? 'application/octet-stream';
    const bytes = (await toArrayBuffer(blob)).slice(0);
    const dir = await getOpfsDir();
    const handle = await dir.getFileHandle(id, { create: true });
    const writable = await handle.createWritable();
    await writable.write(bytes);
    await writable.close();

    const sha256 = await sha256Hex(bytes);
    const meta: MediaRecord = {
      id,
      mimeType: mime,
      byteLength: bytes.byteLength,
      sha256,
      createdAt: nowIso(),
    };
    await this.db.mediaMeta.put(meta);
    return meta;
  }

  async get(id: string): Promise<Blob | null> {
    try {
      const dir = await getOpfsDir();
      const handle = await dir.getFileHandle(id);
      const file = await handle.getFile();
      const meta = await this.db.mediaMeta.get(id);
      return new Blob([file], {
        type: meta?.mimeType ?? file.type ?? 'application/octet-stream',
      });
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const dir = await getOpfsDir();
      await dir.removeEntry(id);
    } catch {
      /* missing is fine */
    }
    await this.db.mediaMeta.delete(id);
  }

  async getMeta(id: string): Promise<MediaRecord | null> {
    return (await this.db.mediaMeta.get(id)) ?? null;
  }

  async listMeta(): Promise<MediaRecord[]> {
    return this.db.mediaMeta.toArray();
  }
}

class IdbBlobStore implements BlobStore {
  readonly backend: BlobBackend = 'idb';

  constructor(private db: CastleDatabase) {}

  async put(id: string, blob: Blob, mimeType?: string): Promise<MediaRecord> {
    const mime = mimeType ?? blob.type ?? 'application/octet-stream';
    const src = await toArrayBuffer(blob);
    // Detached copy so IDB / JSZip never share a mutable view
    const bytes = src.slice(0);
    const sha256 = await sha256Hex(bytes);
    const meta: MediaRecord = {
      id,
      mimeType: mime,
      byteLength: bytes.byteLength,
      sha256,
      createdAt: nowIso(),
    };
    await this.db.transaction('rw', this.db.mediaMeta, this.db.mediaBlobs, async () => {
      await this.db.mediaBlobs.put({ id, bytes, mimeType: mime });
      await this.db.mediaMeta.put(meta);
    });
    return meta;
  }

  async get(id: string): Promise<Blob | null> {
    const row = await this.db.mediaBlobs.get(id);
    if (!row?.bytes) return null;
    const copy = new Uint8Array(row.bytes.slice(0));
    return new Blob([copy], {
      type: row.mimeType || 'application/octet-stream',
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.transaction('rw', this.db.mediaMeta, this.db.mediaBlobs, async () => {
      await this.db.mediaBlobs.delete(id);
      await this.db.mediaMeta.delete(id);
    });
  }

  async getMeta(id: string): Promise<MediaRecord | null> {
    return (await this.db.mediaMeta.get(id)) ?? null;
  }

  async listMeta(): Promise<MediaRecord[]> {
    return this.db.mediaMeta.toArray();
  }
}

export type BlobStoreMode = 'auto' | 'idb' | 'opfs';

/**
 * Create a blob store. Tests force `idb` so round-trips exercise the fallback path.
 * Production uses OPFS when available, else IDB.
 */
export async function createBlobStore(
  db: CastleDatabase,
  mode: BlobStoreMode = 'auto'
): Promise<BlobStore> {
  if (mode === 'idb') {
    return new IdbBlobStore(db);
  }
  if (mode === 'opfs') {
    if (!supportsOpfs()) {
      throw new Error('OPFS requested but not available');
    }
    return new OpfsBlobStore(db);
  }
  // auto
  if (supportsOpfs()) {
    try {
      // Probe write
      const probe = new OpfsBlobStore(db);
      const testId = '__castle_opfs_probe__';
      await probe.put(testId, new Blob(['ok'], { type: 'text/plain' }));
      await probe.delete(testId);
      return probe;
    } catch {
      return new IdbBlobStore(db);
    }
  }
  return new IdbBlobStore(db);
}
