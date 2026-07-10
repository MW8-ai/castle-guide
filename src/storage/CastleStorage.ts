import { getDb, deleteDatabase, type CastleDatabase } from './db';
import {
  createBlobStore,
  type BlobStore,
  type BlobStoreMode,
} from './blobStore';
import type {
  Consumable,
  DocMeta,
  Item,
  Note,
  Profile,
  Property,
  Room,
  Shutoff,
} from './types';
import {
  createEmptyProperty,
  createItem,
  createNote,
  createProfile,
  createRoom,
} from './factories';
import {
  replaceItemWithLineage,
  refreezePropertyLineage,
  stripLineageFromUpdate,
} from './lineage';
import { newId, nowIso } from './ids';
import {
  exportPropertyZip,
  importPropertyZip,
  type ImportResult,
} from './exportImport';

export interface CastleStorageOptions {
  dbName?: string;
  /** Force IDB blob path (required for reliable CI round-trip tests). */
  blobMode?: BlobStoreMode;
}

/**
 * Sole persistence façade. UI and domain modules use this — never Dexie/OPFS directly.
 */
export class CastleStorage {
  private db: CastleDatabase;
  private blobs: BlobStore | null = null;
  private blobMode: BlobStoreMode;
  private dbName: string;

  constructor(opts: CastleStorageOptions = {}) {
    this.dbName = opts.dbName ?? 'castle-guide';
    this.db = getDb(opts.dbName);
    this.blobMode = opts.blobMode ?? 'auto';
  }

  async init(): Promise<void> {
    if (!this.blobs) {
      this.blobs = await createBlobStore(this.db, this.blobMode);
    }
  }

  get blobBackend(): string {
    return this.blobs?.backend ?? 'uninitialized';
  }

  private async store(): Promise<BlobStore> {
    await this.init();
    return this.blobs!;
  }

  // ── Profile ──────────────────────────────────────────────

  async getOrCreateProfile(displayName = 'Homeowner'): Promise<Profile> {
    const existing = await this.db.profiles.toCollection().first();
    if (existing) return existing;
    const profile = createProfile(displayName);
    await this.db.profiles.put(profile);
    return profile;
  }

  async getProfile(): Promise<Profile | null> {
    return (await this.db.profiles.toCollection().first()) ?? null;
  }

  async saveProfile(profile: Profile): Promise<void> {
    // Never persist aiKeys from an import path; allow in-session only via updateSettings
    await this.db.profiles.put(profile);
  }

  async setActiveProperty(propertyId: string | null): Promise<Profile> {
    const profile = await this.getOrCreateProfile();
    profile.activePropertyId = propertyId;
    await this.db.profiles.put(profile);
    return profile;
  }

  // ── Properties ───────────────────────────────────────────

  async listProperties(): Promise<Property[]> {
    const rows = await this.db.properties.toArray();
    return rows.map((p) => ({
      ...p,
      items: refreezePropertyLineage(p.items),
    }));
  }

  async getProperty(id: string): Promise<Property | null> {
    const p = await this.db.properties.get(id);
    if (!p) return null;
    return { ...p, items: refreezePropertyLineage(p.items) };
  }

  async createProperty(name: string, zip?: string | null): Promise<Property> {
    const profile = await this.getOrCreateProfile();
    const property = createEmptyProperty(name, zip);
    await this.db.properties.put(property);
    profile.propertyIds = [...profile.propertyIds, property.id];
    profile.activePropertyId = property.id;
    await this.db.profiles.put(profile);
    return property;
  }

  async saveProperty(property: Property): Promise<void> {
    const items = refreezePropertyLineage(property.items);
    const next: Property = {
      ...property,
      items,
      updatedAt: nowIso(),
    };
    await this.db.properties.put(next);
  }

  async deleteProperty(id: string): Promise<void> {
    const property = await this.getProperty(id);
    if (property) {
      const blobIds = collectBlobIds(property);
      const blobs = await this.store();
      for (const bid of blobIds) {
        await blobs.delete(bid);
      }
    }
    await this.db.properties.delete(id);
    const profile = await this.getProfile();
    if (profile) {
      profile.propertyIds = profile.propertyIds.filter((x) => x !== id);
      if (profile.activePropertyId === id) {
        profile.activePropertyId = profile.propertyIds[0] ?? null;
      }
      await this.db.profiles.put(profile);
    }
  }

  // ── Rooms ────────────────────────────────────────────────

  async addRoom(
    propertyId: string,
    partial: Partial<Room> & { name: string }
  ): Promise<Room> {
    const property = await this.requireProperty(propertyId);
    const room = createRoom(partial);
    property.rooms.push(room);
    await this.saveProperty(property);
    return room;
  }

  // ── Items ────────────────────────────────────────────────

  async addItem(
    propertyId: string,
    partial: Partial<Item> & { category: string }
  ): Promise<Item> {
    const property = await this.requireProperty(propertyId);
    const item = createItem(partial);
    property.items.push(item);
    await this.saveProperty(property);
    return item;
  }

  /**
   * Update mutable fields on an active item.
   * Lineage cannot be edited — any lineage in the patch is stripped.
   */
  async updateItem(
    propertyId: string,
    itemId: string,
    patch: Partial<Item>
  ): Promise<Item> {
    const property = await this.requireProperty(propertyId);
    const idx = property.items.findIndex((i) => i.id === itemId);
    if (idx < 0) throw new Error(`Item not found: ${itemId}`);
    const current = property.items[idx];
    const safe = stripLineageFromUpdate(patch);
    // Preserve lineage reference; never replace from patch
    const updated: Item = {
      ...current,
      ...safe,
      id: current.id,
      lineage: current.lineage,
    };
    property.items[idx] = updated;
    await this.saveProperty(property);
    return (await this.getProperty(propertyId))!.items.find((i) => i.id === itemId)!;
  }

  /**
   * Replace appliance: old becomes soft-deleted with lineage snapshot; new is active.
   * Both share history chain for resale storytelling.
   */
  async replaceItem(
    propertyId: string,
    itemId: string,
    nextPartial: Partial<Item> & { category?: string }
  ): Promise<{ archived: Item; next: Item }> {
    const property = await this.requireProperty(propertyId);
    const idx = property.items.findIndex((i) => i.id === itemId);
    if (idx < 0) throw new Error(`Item not found: ${itemId}`);
    const current = property.items[idx];
    const { archived, next } = replaceItemWithLineage(current, nextPartial);
    property.items[idx] = archived;
    property.items.push(next);
    await this.saveProperty(property);
    return { archived, next };
  }

  async setPoolRoomWorthy(
    propertyId: string,
    itemId: string,
    worthy: boolean
  ): Promise<Item> {
    return this.updateItem(propertyId, itemId, { poolRoomWorthy: worthy });
  }

  async listPoolRoom(propertyId: string): Promise<Item[]> {
    const property = await this.requireProperty(propertyId);
    return property.items.filter((i) => i.poolRoomWorthy && !i.softDeleted);
  }

  // ── Docs / blobs ─────────────────────────────────────────

  async putBlob(
    data: Blob,
    mimeType?: string,
    id?: string
  ): Promise<{ blobId: string; sha256: string }> {
    const blobs = await this.store();
    const blobId = id ?? newId();
    const meta = await blobs.put(blobId, data, mimeType);
    return { blobId, sha256: meta.sha256 };
  }

  async getBlob(blobId: string): Promise<Blob | null> {
    const blobs = await this.store();
    return blobs.get(blobId);
  }

  async attachDoc(
    propertyId: string,
    doc: Omit<DocMeta, 'id'> & { id?: string }
  ): Promise<DocMeta> {
    const property = await this.requireProperty(propertyId);
    const meta: DocMeta = {
      id: doc.id ?? newId(),
      type: doc.type,
      blobId: doc.blobId,
      date: doc.date ?? null,
      tags: doc.tags ?? [],
      itemId: doc.itemId ?? null,
      title: doc.title,
    };
    property.docs.push(meta);
    if (meta.itemId) {
      const item = property.items.find((i) => i.id === meta.itemId);
      if (item && meta.type === 'manual' && !item.manualDocIds.includes(meta.id)) {
        item.manualDocIds.push(meta.id);
      }
    }
    await this.saveProperty(property);
    return meta;
  }

  // ── Notes / shutoffs / consumables ───────────────────────

  async addNote(propertyId: string, body: string, opts?: Partial<Note>): Promise<Note> {
    const property = await this.requireProperty(propertyId);
    const note = createNote(body, opts);
    property.notes.push(note);
    await this.saveProperty(property);
    return note;
  }

  async addShutoff(
    propertyId: string,
    shutoff: Omit<Shutoff, 'id'> & { id?: string }
  ): Promise<Shutoff> {
    const property = await this.requireProperty(propertyId);
    const row: Shutoff = {
      id: shutoff.id ?? newId(),
      type: shutoff.type,
      locationNote: shutoff.locationNote,
      photo: shutoff.photo ?? null,
    };
    property.shutoffs.push(row);
    await this.saveProperty(property);
    return row;
  }

  async addConsumable(
    propertyId: string,
    c: Omit<Consumable, 'id'> & { id?: string }
  ): Promise<Consumable> {
    const property = await this.requireProperty(propertyId);
    const row: Consumable = {
      id: c.id ?? newId(),
      kind: c.kind,
      label: c.label,
      sizeOrModel: c.sizeOrModel,
      roomId: c.roomId ?? null,
      itemId: c.itemId ?? null,
      notes: c.notes ?? null,
    };
    property.consumables.push(row);
    await this.saveProperty(property);
    return row;
  }

  // ── Export / import / wipe ───────────────────────────────

  async exportZip(propertyId: string): Promise<Blob> {
    const property = await this.requireProperty(propertyId);
    const profile = await this.getOrCreateProfile();
    const blobs = await this.store();
    return exportPropertyZip({ property, profile, blobs });
  }

  async importZip(zipBlob: Blob): Promise<ImportResult> {
    const blobs = await this.store();
    return importPropertyZip({
      zipBlob,
      db: this.db,
      blobs,
      getProfile: () => this.getOrCreateProfile(),
      saveProfile: (p) => this.saveProfile(p),
    });
  }

  async wipeAll(): Promise<void> {
    await deleteDatabase(this.dbName);
    this.db = getDb(this.dbName);
    this.blobs = null;
    await this.init();
  }

  private async requireProperty(id: string): Promise<Property> {
    const p = await this.getProperty(id);
    if (!p) throw new Error(`Property not found: ${id}`);
    return p;
  }
}

function collectBlobIds(property: Property): string[] {
  const ids = new Set<string>();
  for (const d of property.docs) ids.add(d.blobId);
  for (const item of property.items) {
    for (const ph of item.photos) ids.add(ph.blobId);
  }
  for (const room of property.rooms) {
    for (const ph of room.photos) ids.add(ph.blobId);
  }
  for (const s of property.shutoffs) {
    if (s.photo) ids.add(s.photo.blobId);
  }
  return [...ids];
}
