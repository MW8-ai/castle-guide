import { describe, it, expect, beforeEach } from 'vitest';
import { CastleStorage } from '../src/storage/CastleStorage';
import { deleteDatabase } from '../src/storage/db';
import {
  buildHouseViewModel,
  computeSerenity,
  healthFromTasks,
  listRenderers,
  getRenderer,
} from '../src/houseview';
import { createEmptyProperty, createItem } from '../src/storage/factories';
import type { Task } from '../src/storage/types';

const DB = 'castle-test-house';

describe('Phase 4 house view + serenity', () => {
  beforeEach(async () => {
    await deleteDatabase(DB);
  });

  it('builds model with placement and health from overdue tasks', () => {
    const property = createEmptyProperty('The Serenity');
    property.rooms.push({
      id: 'r1',
      name: 'Kitchen',
      type: 'kitchen',
      dims: { L: 12, W: 10, H: 9 },
      paintCards: [],
      photos: [],
      placements: [],
      noteIds: [],
    });
    const fridge = createItem({
      category: 'refrigerator',
      brand: 'Samsung',
      model: 'RF28',
    });
    property.items.push(fridge);
    property.tasks.push({
      id: 't1',
      itemId: fridge.id,
      title: 'Clean coils',
      cadence: 'yearly',
      nextDue: '2020-01-01',
      difficulty: 1,
      tools: [],
      warnings: [],
      whenNotToDiy: false,
      videoLinks: [],
      status: 'pending',
      history: [],
      createdAt: '',
      updatedAt: '',
    } as Task);

    const { model, placementsChanged } = buildHouseViewModel(property, {
      ensurePlacements: true,
    });
    expect(placementsChanged).toBe(true);
    expect(model.houseName).toBe('The Serenity');
    expect(model.placements.length).toBe(1);
    expect(model.placements[0].itemId).toBe(fridge.id);
    expect(model.healthByItemId[fridge.id]).toBe('overdue');
    expect(healthFromTasks(fridge.id, property.tasks, '2026-07-01')).toBe(
      'overdue'
    );
  });

  it('serenity drops when tasks are overdue', () => {
    const property = createEmptyProperty('S');
    property.items.push(
      createItem({ category: 'furnace', brand: 'X', active: true })
    );
    property.tasks.push({
      id: 't1',
      itemId: property.items[0].id,
      title: 'Filter',
      cadence: '90d',
      nextDue: '2020-01-01',
      difficulty: 1,
      tools: [],
      warnings: [],
      whenNotToDiy: false,
      videoLinks: [],
      status: 'pending',
      history: [],
      createdAt: '',
      updatedAt: '',
    } as Task);
    const low = computeSerenity(property, '2026-07-01');
    const clean = createEmptyProperty('C');
    clean.items.push(createItem({ category: 'furnace', brand: 'Y' }));
    clean.shutoffs.push({
      id: 's1',
      type: 'water',
      locationNote: 'basement',
    });
    const high = computeSerenity(clean, '2026-07-01');
    expect(low).toBeLessThan(high);
  });

  it('defaults to walk-iso house', () => {
    const ids = listRenderers().map((r) => r.id);
    expect(ids).toContain('walk-iso');
    expect(getRenderer().id).toBe('walk-iso');
    expect(getRenderer('default').id).toBe('walk-iso');
  });

  it('movePlacement persists coordinates via storage', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('Move House');
    await storage.addRoom(property.id, {
      name: 'Utility',
      dims: { L: 10, W: 10, H: 8 },
    });
    const item = await storage.addItem(property.id, {
      category: 'water-heater',
      brand: 'Rheem',
    });
    const p = await storage.getProperty(property.id);
    const { model, placementsChanged } = buildHouseViewModel(p!, {
      ensurePlacements: true,
    });
    expect(placementsChanged).toBe(true);
    await storage.saveProperty(p!);
    const placementId = model.placements[0].id;
    await storage.movePlacement(property.id, placementId, {
      x: 4.5,
      y: 2,
      rotation: 0,
    });
    const after = await storage.getProperty(property.id);
    const placed = after!.rooms.flatMap((r) => r.placements);
    expect(placed[0].x).toBe(4.5);
    expect(placed[0].itemId).toBe(item.id);
  });

  it('updateRoom patches pos/dims/floor and persists them', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('Update Room House');
    const room = await storage.addRoom(property.id, {
      name: 'Den',
      dims: { L: 10, W: 10, H: 8 },
    });

    await storage.updateRoom(property.id, room.id, {
      pos: { x: 4, y: 2 },
      dims: { L: 12, W: 11, H: 9 },
      floor: 'upper',
    });

    const after = await storage.getProperty(property.id);
    const updated = after!.rooms.find((r) => r.id === room.id);
    expect(updated?.pos).toEqual({ x: 4, y: 2 });
    expect(updated?.dims).toEqual({ L: 12, W: 11, H: 9 });
    expect(updated?.floor).toBe('upper');
  });

  it('updateRoom throws for an unknown room id', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('No Such Room House');
    await expect(
      storage.updateRoom(property.id, 'nonexistent', { pos: { x: 0, y: 0 } })
    ).rejects.toThrow('Room not found');
  });
});
