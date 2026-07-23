import { describe, it, expect, beforeEach } from 'vitest';
import { CastleStorage } from '../src/storage/CastleStorage';
import { deleteDatabase } from '../src/storage/db';
import {
  ensureDemoCastle,
  resetDemoCastle,
  DEMO_PROPERTY_NAME,
} from '../src/record/demoSeed';
import { buildHouseViewModel, roomFloorOf, FLOORS } from '../src/houseview';

const DB = 'castle-test-demo';

describe('demo starter castle', () => {
  beforeEach(async () => {
    await deleteDatabase(DB);
  });

  it('seeds The Serenity with rooms, items, placements, and tasks', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const p = await ensureDemoCastle(storage);
    expect(p.name).toBe(DEMO_PROPERTY_NAME);
    expect(p.name).not.toMatch(/serenity/i);
    expect(p.rooms.length).toBeGreaterThanOrEqual(12);
    expect(p.items.filter((i) => i.active).length).toBeGreaterThanOrEqual(20);
    expect(p.items.some((i) => /sofa|couch|sven/i.test(`${i.brand} ${i.model}`))).toBe(
      true
    );
    expect(p.items.some((i) => i.category === 'refrigerator')).toBe(true);
    expect(p.items.some((i) => i.category === 'water-heater')).toBe(true);
    expect(p.tasks.some((t) => /filter/i.test(t.title))).toBe(true);
    expect(p.consumables.some((c) => c.sizeOrModel === '16x25x1')).toBe(true);

    const { model } = buildHouseViewModel(p);
    expect(model.placements.length).toBeGreaterThan(0);
    expect(model.rooms.length).toBeGreaterThan(0);
  });

  it('assigns bedrooms and upstairs baths to the upper floor, a yard room to yard, and the rest to ground', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const p = await ensureDemoCastle(storage);

    // Every room has an explicit floor recognized by the FLOORS enum.
    expect(p.rooms.every((r) => FLOORS.includes(roomFloorOf(r)))).toBe(true);

    const byFloor = (floor: (typeof FLOORS)[number]) =>
      p.rooms.filter((r) => roomFloorOf(r) === floor).map((r) => r.name);

    const upper = byFloor('upper');
    expect(upper).toEqual(
      expect.arrayContaining([
        'Primary Bedroom',
        'Bedroom 2',
        'Bedroom 3',
        'Bedroom 4',
        'Bedroom 5',
        'Bath 2',
        'Bath 3',
      ])
    );
    expect(upper).toHaveLength(7);

    const yard = byFloor('yard');
    expect(yard).toEqual(['Backyard']);

    const basement = byFloor('basement');
    expect(basement).toEqual(['Basement']);

    const ground = byFloor('ground');
    expect(ground).toEqual(
      expect.arrayContaining(['Kitchen', 'Living Room', 'Bath 1', 'Utility'])
    );
    expect(ground).not.toEqual(expect.arrayContaining(['Primary Bedroom']));
    expect(ground).not.toEqual(expect.arrayContaining(['Basement']));

    expect(p.rooms).toHaveLength(
      upper.length + yard.length + basement.length + ground.length
    );
  });

  it('is idempotent — second ensure returns same demo', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const a = await ensureDemoCastle(storage);
    const b = await ensureDemoCastle(storage);
    expect(a.id).toBe(b.id);
    const list = await storage.listProperties();
    expect(list.filter((p) => p.name === DEMO_PROPERTY_NAME)).toHaveLength(1);
  });

  it('reset rebuilds demo content', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const a = await ensureDemoCastle(storage);
    await storage.addItem(a.id, { category: 'other', brand: 'Temp' });
    const reset = await resetDemoCastle(storage);
    expect(reset.items.some((i) => i.brand === 'Temp')).toBe(false);
    expect(reset.items.some((i) => i.brand === 'LG')).toBe(true);
  });
});
