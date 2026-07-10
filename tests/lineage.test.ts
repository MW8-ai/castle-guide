import { describe, it, expect, beforeEach } from 'vitest';
import { CastleStorage } from '../src/storage/CastleStorage';
import { deleteDatabase } from '../src/storage/db';
import { replaceItemWithLineage } from '../src/storage/lineage';
import { createItem } from '../src/storage/factories';

const DB = 'castle-test-lineage';

describe('lineage immutability', () => {
  beforeEach(async () => {
    await deleteDatabase(DB);
  });

  it('replace snapshots old item with activeFrom/activeTo', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('Lineage House');
    const item = await storage.addItem(property.id, {
      category: 'refrigerator',
      brand: 'OldBrand',
      model: 'X1',
      serial: 'OLD-1',
      purchaseDate: '2010-01-15',
    });

    const { archived, next } = await storage.replaceItem(property.id, item.id, {
      brand: 'NewBrand',
      model: 'Y2',
      serial: 'NEW-1',
      purchaseDate: '2024-03-01',
    });

    expect(archived.active).toBe(false);
    expect(archived.softDeleted).toBe(true);
    expect(archived.lineage).toHaveLength(1);
    expect(archived.lineage[0].snapshot.brand).toBe('OldBrand');
    expect(archived.lineage[0].snapshot.serial).toBe('OLD-1');
    expect(archived.lineage[0].activeFrom).toBe('2010-01-15');
    expect(archived.lineage[0].activeTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    expect(next.active).toBe(true);
    expect(next.brand).toBe('NewBrand');
    expect(next.lineage[0].snapshot.brand).toBe('OldBrand');

    const loaded = await storage.getProperty(property.id);
    expect(loaded!.items.filter((i) => i.softDeleted)).toHaveLength(1);
    expect(loaded!.items.filter((i) => i.active)).toHaveLength(1);
  });

  it('snapshots cannot be edited through updateItem (lineage stripped)', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('Immutable');
    const item = await storage.addItem(property.id, {
      category: 'hvac',
      brand: 'Carrier',
      purchaseDate: '2015-06-01',
    });
    const { next } = await storage.replaceItem(property.id, item.id, {
      brand: 'Trane',
      category: 'hvac',
    });

    const tamperedLineage = [
      {
        snapshot: {
          ...next.lineage[0].snapshot,
          brand: 'HACKED',
        },
        activeFrom: '1900-01-01',
        activeTo: '1900-01-02',
      },
    ];

    await storage.updateItem(property.id, next.id, {
      notes: 'legit field update',
      lineage: tamperedLineage as unknown as typeof next.lineage,
    });

    const after = await storage.getProperty(property.id);
    const updated = after!.items.find((i) => i.id === next.id)!;
    expect(updated.notes).toBe('legit field update');
    expect(updated.lineage[0].snapshot.brand).toBe('Carrier');
    expect(updated.lineage[0].snapshot.brand).not.toBe('HACKED');
  });

  it('frozen lineage entries throw on direct mutation in memory', () => {
    const item = createItem({
      category: 'fridge',
      brand: 'A',
      purchaseDate: '2012-01-01',
    });
    const { next } = replaceItemWithLineage(item, { brand: 'B' });
    expect(Object.isFrozen(next.lineage[0])).toBe(true);
    expect(Object.isFrozen(next.lineage[0].snapshot)).toBe(true);
    expect(() => {
      // @ts-expect-error mutation test
      next.lineage[0].snapshot.brand = 'MUTATED';
    }).toThrow();
  });

  it('soft-deleted items appear in export payload', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('Export Soft');
    const item = await storage.addItem(property.id, {
      category: 'range',
      brand: 'OldRange',
      purchaseDate: '2008-01-01',
    });
    await storage.replaceItem(property.id, item.id, {
      brand: 'NewRange',
      category: 'range',
    });

    const zip = await storage.exportZip(property.id);
    const JSZip = (await import('jszip')).default;
    const z = await JSZip.loadAsync(zip);
    const propJson = JSON.parse(
      await z
        .file(`properties/${property.id}/property.json`)!
        .async('string')
    ) as { items: { softDeleted: boolean; brand: string | null }[] };

    expect(propJson.items.some((i) => i.softDeleted && i.brand === 'OldRange')).toBe(
      true
    );
    expect(propJson.items.some((i) => !i.softDeleted && i.brand === 'NewRange')).toBe(
      true
    );
  });
});
