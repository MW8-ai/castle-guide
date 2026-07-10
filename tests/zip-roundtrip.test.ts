import { describe, it, expect, beforeEach } from 'vitest';
import JSZip from 'jszip';
import { CastleStorage } from '../src/storage/CastleStorage';
import { sha256Blob } from '../src/storage/hash';
import { SCHEMA_VERSION, EXPORT_FORMAT } from '../src/storage/types';
import { deleteDatabase } from '../src/storage/db';
import { nowIso } from '../src/storage/ids';

const DB = 'castle-test-zip';

async function freshStorage() {
  await deleteDatabase(DB);
  const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
  await storage.init();
  return storage;
}

describe('ZIP export/import round-trip (IDB blob fallback)', () => {
  beforeEach(async () => {
    await deleteDatabase(DB);
  });

  it('round-trips property with items, photos, PDF, lineage, notes — deep equal + blob hashes', async () => {
    const storage = await freshStorage();
    const property = await storage.createProperty('The Serenity', '46240');

    const photoBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
    const pdfBytes = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 9, 8, 7,
    ]);
    const photoBlob = new Blob([photoBytes], { type: 'image/png' });
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

    const { blobId: photoId, sha256: photoHash } = await storage.putBlob(
      photoBlob,
      'image/png'
    );
    const { blobId: pdfId, sha256: pdfHash } = await storage.putBlob(
      pdfBlob,
      'application/pdf'
    );

    expect(photoHash).toBe(await sha256Blob(photoBlob));
    expect(pdfHash).toBe(await sha256Blob(pdfBlob));

    const room = await storage.addRoom(property.id, {
      name: 'Utility',
      type: 'utility',
      dims: { L: 8, W: 6, H: 8 },
    });

    const item = await storage.addItem(property.id, {
      category: 'water-heater',
      brand: 'Rheem',
      model: 'XE50T10H45U0',
      serial: 'SN-TEST-001',
      purchaseDate: '2019-05-01',
      roomId: room.id,
      photos: [
        {
          blobId: photoId,
          kind: 'photo',
          caption: 'label',
          createdAt: nowIso(),
        },
      ],
    });

    await storage.attachDoc(property.id, {
      type: 'manual',
      blobId: pdfId,
      itemId: item.id,
      title: 'Rheem manual',
      tags: ['manual'],
      date: '2019-05-01',
    });

    await storage.addNote(property.id, 'Check anode rod next spring', {
      itemId: item.id,
      title: 'Maintenance thought',
    });

    const { next } = await storage.replaceItem(property.id, item.id, {
      brand: 'A.O. Smith',
      model: 'FPTU-50',
      serial: 'SN-NEW-002',
      purchaseDate: '2024-06-15',
      category: 'water-heater',
      roomId: room.id,
    });

    await storage.setPoolRoomWorthy(property.id, next.id, true);

    const before = await storage.getProperty(property.id);
    expect(before).not.toBeNull();
    const zip = await storage.exportZip(property.id);

    await storage.wipeAll();
    expect(await storage.listProperties()).toHaveLength(0);

    const result = await storage.importZip(zip);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const after = await storage.getProperty(result.propertyId);
    expect(after).not.toBeNull();
    if (!after) return;

    // Structural deep compare (dates on updatedAt may match from export)
    expect(after.name).toBe(before!.name);
    expect(after.zip).toBe(before!.zip);
    expect(after.rooms.map((r) => r.name)).toEqual(
      before!.rooms.map((r) => r.name)
    );
    expect(after.items).toHaveLength(before!.items.length);
    expect(after.notes.map((n) => n.body)).toEqual(
      before!.notes.map((n) => n.body)
    );
    expect(after.docs).toHaveLength(before!.docs.length);

    // Lineage order preserved on the active replacement item
    const active = after.items.find((i) => i.active)!;
    const beforeActive = before!.items.find((i) => i.active)!;
    expect(active.lineage.length).toBe(beforeActive.lineage.length);
    expect(active.lineage[0].snapshot.brand).toBe('Rheem');
    expect(active.lineage[0].snapshot.serial).toBe('SN-TEST-001');
    expect(active.poolRoomWorthy).toBe(true);

    // Soft-deleted prior item still present
    const archived = after.items.find((i) => i.softDeleted);
    expect(archived).toBeTruthy();
    expect(archived!.brand).toBe('Rheem');

    // Blob content hashes
    const roundPhoto = await storage.getBlob(photoId);
    const roundPdf = await storage.getBlob(pdfId);
    expect(roundPhoto).not.toBeNull();
    expect(roundPdf).not.toBeNull();
    expect(await sha256Blob(roundPhoto!)).toBe(photoHash);
    expect(await sha256Blob(roundPdf!)).toBe(pdfHash);

    // Full JSON deep-equal of catalog (stable fields)
    expect(normalizeProperty(after)).toEqual(normalizeProperty(before!));
  });

  it('refuses future schemaVersion without writing anything', async () => {
    const storage = await freshStorage();
    const property = await storage.createProperty('Keep Me');
    await storage.addItem(property.id, {
      category: 'appliance',
      brand: 'Stay',
    });

    const zip = await storage.exportZip(property.id);
    const jszip = await JSZip.loadAsync(zip);
    const manifest = JSON.parse(
      await jszip.file('manifest.json')!.async('string')
    ) as Record<string, unknown>;
    manifest.schemaVersion = SCHEMA_VERSION + 99;
    jszip.file('manifest.json', JSON.stringify(manifest));
    const futureZip = await jszip.generateAsync({ type: 'blob' });

    const beforeCount = (await storage.listProperties()).length;
    const result = await storage.importZip(futureZip);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(' ')).toMatch(/schemaVersion/i);
    expect(result.errors.join(' ')).toMatch(/nothing/i);
    expect(await storage.listProperties()).toHaveLength(beforeCount);
    const still = await storage.getProperty(property.id);
    expect(still?.items[0]?.brand).toBe('Stay');
  });

  it('refuses tampered/incomplete ZIP and imports nothing', async () => {
    const storage = await freshStorage();
    await storage.createProperty('Original');
    const beforeIds = (await storage.listProperties()).map((p) => p.id);

    // Missing media referenced by property
    const broken = new JSZip();
    broken.file(
      'manifest.json',
      JSON.stringify({
        format: EXPORT_FORMAT,
        schemaVersion: SCHEMA_VERSION,
        appVersion: '0.2.0',
        exportedAt: nowIso(),
        propertyIds: ['ghost-prop'],
      })
    );
    broken.file(
      'properties/ghost-prop/property.json',
      JSON.stringify({
        id: 'ghost-prop',
        name: 'Ghost',
        rooms: [],
        items: [
          {
            id: 'i1',
            category: 'x',
            brand: 'Y',
            active: true,
            softDeleted: false,
            lineage: [],
            filterSpecs: [],
            manualDocIds: [],
            photos: [
              {
                blobId: 'missing-blob',
                kind: 'photo',
                createdAt: nowIso(),
              },
            ],
            serviceLog: [],
            poolRoomWorthy: false,
          },
        ],
        tasks: [],
        opsEvents: [],
        docs: [],
        improvements: [],
        quotes: [],
        notes: [],
        areaLinks: [],
        shutoffs: [],
        consumables: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      })
    );
    // deliberately no media/missing-blob
    const badZip = await broken.generateAsync({ type: 'blob' });

    const result = await storage.importZip(badZip);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => /missing media/i.test(e))).toBe(true);
    expect(result.errors.some((e) => /nothing was written/i.test(e))).toBe(
      true
    );
    expect(await storage.getProperty('ghost-prop')).toBeNull();
    expect((await storage.listProperties()).map((p) => p.id)).toEqual(
      beforeIds
    );
  });

  it('refuses ZIP missing manifest', async () => {
    const storage = await freshStorage();
    const zip = new JSZip();
    zip.file('README.txt', 'nope');
    const result = await storage.importZip(
      await zip.generateAsync({ type: 'blob' })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/manifest/i);
    }
  });
});

function normalizeProperty(p: ReturnType<typeof Object>) {
  const prop = p as {
    id: string;
    name: string;
    zip?: string | null;
    rooms: unknown[];
    items: unknown[];
    notes: unknown[];
    docs: unknown[];
    shutoffs: unknown[];
    consumables: unknown[];
  };
  return {
    id: prop.id,
    name: prop.name,
    zip: prop.zip,
    rooms: prop.rooms,
    items: prop.items,
    notes: prop.notes,
    docs: prop.docs,
    shutoffs: prop.shutoffs,
    consumables: prop.consumables,
  };
}
