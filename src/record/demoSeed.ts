import type { CastleStorage } from '../storage/CastleStorage';
import { newId, nowIso, todayIsoDate } from '../storage/ids';
import type { Property } from '../storage/types';

export const DEMO_FLAG_KEY = 'castle-guide-demo-v1';
export const DEMO_PROPERTY_NAME = 'The Serenity';

/**
 * Full starter castle so first open is playable, not a blank form gauntlet.
 */
export async function ensureDemoCastle(storage: CastleStorage): Promise<Property> {
  const existing = await storage.listProperties();
  const demo = existing.find((p) => p.name === DEMO_PROPERTY_NAME);
  if (demo) {
    await storage.setActiveProperty(demo.id);
    return demo;
  }

  const property = await storage.createProperty(DEMO_PROPERTY_NAME, '46240');
  property.yearBuilt = 1998;
  property.style = 'Ranch';
  property.address = null;

  const kitchenId = newId();
  const livingId = newId();
  const utilityId = newId();
  const garageId = newId();

  const fridgeId = newId();
  const rangeId = newId();
  const whId = newId();
  const furnaceId = newId();
  const washerId = newId();
  const dryerId = newId();

  const ts = nowIso();

  property.rooms = [
    {
      id: kitchenId,
      name: 'Kitchen',
      type: 'kitchen',
      dims: { L: 14, W: 12, H: 9 },
      materials: { floor: 'oak', wall: 'SW 7008' },
      paintCards: [
        {
          id: newId(),
          brand: 'Sherwin-Williams',
          number: 'SW 7008',
          sheen: 'eggshell',
          room: 'Kitchen',
          date: '2022-04-01',
        },
      ],
      photos: [],
      placements: [
        {
          id: newId(),
          itemId: fridgeId,
          x: 1,
          y: 1,
          rotation: 0,
          footprint: { L: 3, W: 2.5 },
        },
        {
          id: newId(),
          itemId: rangeId,
          x: 6,
          y: 1,
          rotation: 0,
          footprint: { L: 2.5, W: 2.5 },
        },
      ],
      noteIds: [],
    },
    {
      id: livingId,
      name: 'Living Room',
      type: 'living',
      dims: { L: 18, W: 14, H: 9 },
      materials: { floor: 'carpet', wall: 'SW 7029' },
      paintCards: [],
      photos: [],
      placements: [],
      noteIds: [],
    },
    {
      id: utilityId,
      name: 'Utility',
      type: 'utility',
      dims: { L: 10, W: 8, H: 8 },
      materials: { floor: 'vinyl' },
      paintCards: [],
      photos: [],
      placements: [
        {
          id: newId(),
          itemId: whId,
          x: 1,
          y: 1,
          rotation: 0,
          footprint: { L: 2, W: 2 },
        },
        {
          id: newId(),
          itemId: furnaceId,
          x: 4.5,
          y: 1,
          rotation: 0,
          footprint: { L: 2.5, W: 2.5 },
        },
        {
          id: newId(),
          itemId: washerId,
          x: 1,
          y: 4.5,
          rotation: 0,
          footprint: { L: 2.2, W: 2.2 },
        },
        {
          id: newId(),
          itemId: dryerId,
          x: 4,
          y: 4.5,
          rotation: 0,
          footprint: { L: 2.2, W: 2.2 },
        },
      ],
      noteIds: [],
    },
    {
      id: garageId,
      name: 'Garage',
      type: 'garage',
      dims: { L: 20, W: 12, H: 9 },
      materials: { floor: 'concrete' },
      paintCards: [],
      photos: [],
      placements: [],
      noteIds: [],
    },
  ];

  // Layout rooms adjacent in world space (kitchen | living ; utility under kitchen)
  // Placements are room-local; buildModel lays rooms in a row — fine for demo.

  property.items = [
    {
      id: fridgeId,
      category: 'refrigerator',
      roomId: kitchenId,
      brand: 'LG',
      model: 'LRFCS2503S',
      serial: 'DEMO-FRIDGE-001',
      purchaseDate: '2021-05-12',
      price: 1899,
      cameWithHouse: false,
      lifespanYrs: 12,
      warrantyEnd: '2026-05-12',
      dims: { L: 3, W: 2.5, H: 6 },
      filterSpecs: [{ name: 'water filter', sizeOrModel: 'LT1000P' }],
      manualDocIds: [],
      photos: [],
      serviceLog: [],
      poolRoomWorthy: false,
      notes: 'Demo appliance — click me in House View.',
      active: true,
      softDeleted: false,
      lineage: [],
    },
    {
      id: rangeId,
      category: 'range',
      roomId: kitchenId,
      brand: 'GE',
      model: 'JGBS66REKSS',
      serial: 'DEMO-RANGE-001',
      purchaseDate: '2019-08-01',
      price: 900,
      cameWithHouse: true,
      lifespanYrs: 15,
      warrantyEnd: null,
      dims: { L: 2.5, W: 2.5, H: 3 },
      filterSpecs: [],
      manualDocIds: [],
      photos: [],
      serviceLog: [],
      poolRoomWorthy: false,
      notes: null,
      active: true,
      softDeleted: false,
      lineage: [],
    },
    {
      id: whId,
      category: 'water-heater',
      roomId: utilityId,
      brand: 'Rheem',
      model: 'XE50T10H45U0',
      serial: 'DEMO-WH-001',
      purchaseDate: '2019-05-01',
      price: 1100,
      cameWithHouse: false,
      lifespanYrs: 12,
      warrantyEnd: '2025-05-01',
      dims: { L: 2, W: 2, H: 5 },
      filterSpecs: [],
      manualDocIds: [],
      photos: [],
      serviceLog: [],
      poolRoomWorthy: false,
      notes: 'Anode rod due ~year 4 from install.',
      active: true,
      softDeleted: false,
      lineage: [],
    },
    {
      id: furnaceId,
      category: 'furnace',
      roomId: utilityId,
      brand: 'Carrier',
      model: '59TP6',
      serial: 'DEMO-FURN-001',
      purchaseDate: '2018-03-15',
      price: 4200,
      cameWithHouse: true,
      lifespanYrs: 18,
      warrantyEnd: null,
      dims: { L: 2.5, W: 2.5, H: 4 },
      filterSpecs: [{ name: 'furnace filter', sizeOrModel: '16x25x1' }],
      manualDocIds: [],
      photos: [],
      serviceLog: [],
      poolRoomWorthy: false,
      notes: null,
      active: true,
      softDeleted: false,
      lineage: [],
    },
    {
      id: washerId,
      category: 'washer',
      roomId: utilityId,
      brand: 'Samsung',
      model: 'WF45',
      serial: null,
      purchaseDate: '2020-06-01',
      price: 800,
      cameWithHouse: false,
      lifespanYrs: 11,
      warrantyEnd: null,
      dims: null,
      filterSpecs: [],
      manualDocIds: [],
      photos: [],
      serviceLog: [],
      poolRoomWorthy: false,
      notes: null,
      active: true,
      softDeleted: false,
      lineage: [],
    },
    {
      id: dryerId,
      category: 'dryer',
      roomId: utilityId,
      brand: 'Samsung',
      model: 'DVE45',
      serial: null,
      purchaseDate: '2020-06-01',
      price: 750,
      cameWithHouse: false,
      lifespanYrs: 12,
      warrantyEnd: null,
      dims: null,
      filterSpecs: [],
      manualDocIds: [],
      photos: [],
      serviceLog: [],
      poolRoomWorthy: true,
      notes: 'Went straight to the pool room (demo trophy).',
      active: true,
      softDeleted: false,
      lineage: [],
    },
  ];

  property.consumables = [
    {
      id: newId(),
      kind: 'furnace filter',
      label: 'Main furnace',
      sizeOrModel: '16x25x1',
      itemId: furnaceId,
      roomId: utilityId,
      notes: 'Never guess in the hardware aisle.',
    },
  ];

  property.shutoffs = [
    {
      id: newId(),
      type: 'water',
      locationNote: 'Front hose-bib wall, red valve (demo)',
      photo: null,
    },
    {
      id: newId(),
      type: 'gas',
      locationNote: 'Utility room, next to furnace (demo)',
      photo: null,
    },
    {
      id: newId(),
      type: 'breaker-panel',
      locationNote: 'Garage wall, labeled panel (demo)',
      photo: null,
    },
  ];

  property.notes = [
    {
      id: newId(),
      title: 'Welcome to The Serenity',
      body: 'This is demo data. Click the house, drag appliances, open Inventory to edit. Reset demo anytime from Home.',
      someday: false,
      roomId: null,
      itemId: null,
      createdAt: ts,
      updatedAt: ts,
      links: [],
      roughBudget: null,
    },
  ];

  property.opsEvents = [
    {
      id: newId(),
      type: 'trash',
      title: 'Trash day',
      schedule: 'weekly:weekday:2',
      source: 'demo',
      remind: true,
      notes: 'Demo — change to your real day',
      createdAt: ts,
    },
  ];

  // Seed a couple maintenance tasks so House health + Maintain aren't empty
  const dueSoon = new Date();
  dueSoon.setUTCDate(dueSoon.getUTCDate() + 12);
  const dueStr = dueSoon.toISOString().slice(0, 10);

  property.tasks = [
    {
      id: newId(),
      templateId: 'tpl-furnace-filter',
      itemId: furnaceId,
      title: 'Replace furnace filter (16x25x1)',
      cadence: 'every 90 days',
      nextDue: dueStr,
      difficulty: 1,
      diyCost: 15,
      proCost: 80,
      tools: [],
      warnings: [],
      whenNotToDiy: false,
      videoLinks: [],
      status: 'pending',
      history: [],
      detail: '16x25x1',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: newId(),
      templateId: 'tpl-water-heater-anode',
      itemId: whId,
      title: 'Inspect water heater anode rod',
      cadence: 'about every 4 years',
      nextDue: '2026-09-01',
      difficulty: 3,
      diyCost: 40,
      proCost: 250,
      tools: ['socket set'],
      warnings: ['If the rod is seized, hire a pro.'],
      whenNotToDiy: false,
      videoLinks: [],
      status: 'pending',
      history: [],
      detail: null,
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  property.updatedAt = ts;
  await storage.saveProperty(property);
  await storage.setActiveProperty(property.id);

  try {
    localStorage.setItem(DEMO_FLAG_KEY, todayIsoDate());
  } catch {
    /* ignore */
  }

  return (await storage.getProperty(property.id))!;
}

export async function resetDemoCastle(storage: CastleStorage): Promise<Property> {
  const all = await storage.listProperties();
  for (const p of all) {
    if (p.name === DEMO_PROPERTY_NAME) {
      await storage.deleteProperty(p.id);
    }
  }
  return ensureDemoCastle(storage);
}
