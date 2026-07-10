import type { CastleStorage } from '../storage/CastleStorage';
import { newId, nowIso, todayIsoDate } from '../storage/ids';
import type { Item, Placement, Property, Room } from '../storage/types';

export const DEMO_FLAG_KEY = 'castle-guide-demo-v2';
/** Neutral demo name — no movie references. */
export const DEMO_PROPERTY_NAME = 'Sample Home';
const LEGACY_DEMO_NAMES = ['The Serenity', 'Sample Home'];

function item(partial: Partial<Item> & { category: string; brand: string }): Item {
  return {
    id: partial.id ?? newId(),
    category: partial.category,
    roomId: partial.roomId ?? null,
    brand: partial.brand,
    model: partial.model ?? null,
    serial: partial.serial ?? null,
    purchaseDate: partial.purchaseDate ?? null,
    price: partial.price ?? null,
    cameWithHouse: partial.cameWithHouse ?? null,
    lifespanYrs: partial.lifespanYrs ?? null,
    warrantyEnd: partial.warrantyEnd ?? null,
    dims: partial.dims ?? null,
    filterSpecs: partial.filterSpecs ?? [],
    manualDocIds: [],
    photos: [],
    serviceLog: [],
    poolRoomWorthy: partial.poolRoomWorthy ?? false,
    notes: partial.notes ?? null,
    active: true,
    softDeleted: false,
    lineage: [],
  };
}

function place(
  itemId: string,
  x: number,
  y: number,
  L = 2,
  W = 2
): Placement {
  return {
    id: newId(),
    itemId,
    x,
    y,
    rotation: 0,
    footprint: { L, W },
  };
}

/**
 * Full starter home so first open feels like a game map full of stuff.
 */
export async function ensureDemoCastle(storage: CastleStorage): Promise<Property> {
  const existing = await storage.listProperties();
  // Prefer current demo name; adopt legacy demo once
  let demo = existing.find((p) => p.name === DEMO_PROPERTY_NAME);
  if (!demo) {
    demo = existing.find((p) => LEGACY_DEMO_NAMES.includes(p.name));
    if (demo && demo.name !== DEMO_PROPERTY_NAME) {
      demo.name = DEMO_PROPERTY_NAME;
      await storage.saveProperty(demo);
    }
  }
  if (demo && demo.items.length >= 8) {
    await storage.setActiveProperty(demo.id);
    return demo;
  }
  // Replace thin/legacy demo
  if (demo) {
    await storage.deleteProperty(demo.id);
  }

  const property = await storage.createProperty(DEMO_PROPERTY_NAME, '43017');
  property.yearBuilt = 2008;
  property.style = 'Two-story';
  property.address = null;

  const kitchen = newId();
  const living = newId();
  const bath = newId();
  const bedroom = newId();
  const utility = newId();
  const garage = newId();

  const ids = {
    fridge: newId(),
    range: newId(),
    dishwasher: newId(),
    microwave: newId(),
    wh: newId(),
    furnace: newId(),
    ac: newId(),
    washer: newId(),
    dryer: newId(),
    tv: newId(),
    sofa: newId(),
    bed: newId(),
    toilet: newId(),
    waterSoftener: newId(),
  };

  const rooms: Room[] = [
    {
      id: kitchen,
      name: 'Kitchen',
      type: 'kitchen',
      dims: { L: 16, W: 12, H: 9 },
      materials: { floor: 'oak', wall: 'Warm White' },
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
        place(ids.fridge, 1, 1, 3, 2.5),
        place(ids.range, 6, 1, 2.5, 2.5),
        place(ids.dishwasher, 10, 1, 2, 2),
        place(ids.microwave, 13, 1, 2, 1.5),
      ],
      noteIds: [],
    },
    {
      id: living,
      name: 'Living Room',
      type: 'living',
      dims: { L: 18, W: 14, H: 9 },
      materials: { floor: 'hardwood', wall: 'Agreeable Gray' },
      paintCards: [],
      photos: [],
      placements: [
        place(ids.sofa, 2, 3, 7, 3),
        place(ids.tv, 12, 2, 4, 1.5),
      ],
      noteIds: [],
    },
    {
      id: bath,
      name: 'Bathroom',
      type: 'bath',
      dims: { L: 9, W: 8, H: 8 },
      materials: { floor: 'tile' },
      paintCards: [],
      photos: [],
      placements: [place(ids.toilet, 1.5, 2, 2, 2.5)],
      noteIds: [],
    },
    {
      id: bedroom,
      name: 'Bedroom',
      type: 'bedroom',
      dims: { L: 14, W: 12, H: 9 },
      materials: { floor: 'carpet' },
      paintCards: [],
      photos: [],
      placements: [place(ids.bed, 3, 3, 6, 7)],
      noteIds: [],
    },
    {
      id: utility,
      name: 'Utility',
      type: 'utility',
      dims: { L: 12, W: 10, H: 8 },
      materials: { floor: 'vinyl' },
      paintCards: [],
      photos: [],
      placements: [
        place(ids.wh, 1, 1, 2.2, 2.2),
        place(ids.furnace, 5, 1, 2.5, 2.5),
        place(ids.washer, 1, 5, 2.2, 2.2),
        place(ids.dryer, 4.5, 5, 2.2, 2.2),
        place(ids.waterSoftener, 8, 1, 2, 2),
      ],
      noteIds: [],
    },
    {
      id: garage,
      name: 'Garage',
      type: 'garage',
      dims: { L: 20, W: 12, H: 9 },
      materials: { floor: 'concrete' },
      paintCards: [],
      photos: [],
      placements: [place(ids.ac, 16, 2, 3, 3)],
      noteIds: [],
    },
  ];

  property.rooms = rooms;
  property.items = [
    item({
      id: ids.fridge,
      category: 'refrigerator',
      roomId: kitchen,
      brand: 'LG',
      model: 'LRFCS2503S',
      serial: 'LG-DEMO-FRIDGE',
      purchaseDate: '2021-05-12',
      price: 1899,
      warrantyEnd: '2026-05-12',
      filterSpecs: [{ name: 'water filter', sizeOrModel: 'LT1000P' }],
      notes: 'Walk up and click me in the house.',
    }),
    item({
      id: ids.range,
      category: 'range',
      roomId: kitchen,
      brand: 'GE',
      model: 'JGBS66',
      serial: 'GE-RANGE-01',
      purchaseDate: '2019-08-01',
      price: 900,
      cameWithHouse: true,
    }),
    item({
      id: ids.dishwasher,
      category: 'dishwasher',
      roomId: kitchen,
      brand: 'Bosch',
      model: 'SHPM65Z',
      purchaseDate: '2020-11-01',
      price: 950,
      warrantyEnd: '2025-11-01',
    }),
    item({
      id: ids.microwave,
      category: 'microwave',
      roomId: kitchen,
      brand: 'Panasonic',
      model: 'NN-SN966S',
      purchaseDate: '2021-01-15',
      price: 220,
    }),
    item({
      id: ids.wh,
      category: 'water-heater',
      roomId: utility,
      brand: 'Rheem',
      model: 'XE50T10H45U0',
      serial: 'RH-WH-50',
      purchaseDate: '2019-05-01',
      price: 1100,
      notes: '50 gallon tank · anode check on the to-do list',
    }),
    item({
      id: ids.furnace,
      category: 'furnace',
      roomId: utility,
      brand: 'Carrier',
      model: '59TP6',
      serial: 'CA-FURN-18',
      purchaseDate: '2018-03-15',
      price: 4200,
      filterSpecs: [{ name: 'furnace filter', sizeOrModel: '16x25x1' }],
      cameWithHouse: true,
    }),
    item({
      id: ids.ac,
      category: 'air-conditioner',
      roomId: garage,
      brand: 'Carrier',
      model: '24ACC6',
      purchaseDate: '2018-03-15',
      price: 3800,
      cameWithHouse: true,
    }),
    item({
      id: ids.washer,
      category: 'washer',
      roomId: utility,
      brand: 'Samsung',
      model: 'WF45',
      purchaseDate: '2020-06-01',
      price: 800,
    }),
    item({
      id: ids.dryer,
      category: 'dryer',
      roomId: utility,
      brand: 'Samsung',
      model: 'DVE45',
      purchaseDate: '2020-06-01',
      price: 750,
      notes: 'Clean the vent once a year',
    }),
    item({
      id: ids.tv,
      category: 'tv',
      roomId: living,
      brand: 'Sony',
      model: 'XR-65A80J',
      purchaseDate: '2022-12-01',
      price: 1600,
    }),
    item({
      id: ids.sofa,
      category: 'furniture',
      roomId: living,
      brand: 'Article',
      model: 'Sven',
      purchaseDate: '2021-09-01',
      price: 1400,
    }),
    item({
      id: ids.bed,
      category: 'furniture',
      roomId: bedroom,
      brand: 'IKEA',
      model: 'MALM',
      purchaseDate: '2019-01-01',
      price: 400,
      cameWithHouse: false,
    }),
    item({
      id: ids.toilet,
      category: 'plumbing',
      roomId: bath,
      brand: 'Toto',
      model: 'Drake',
      purchaseDate: '2017-06-01',
      price: 350,
      cameWithHouse: true,
    }),
    item({
      id: ids.waterSoftener,
      category: 'water-softener',
      roomId: utility,
      brand: 'Culligan',
      model: 'HE 1.5',
      purchaseDate: '2020-04-01',
      price: 1800,
    }),
  ];

  property.consumables = [
    {
      id: newId(),
      kind: 'furnace filter',
      label: 'Main furnace',
      sizeOrModel: '16x25x1',
      itemId: ids.furnace,
      roomId: utility,
      notes: 'Buy this size — not whatever looks close',
    },
    {
      id: newId(),
      kind: 'fridge filter',
      label: 'Kitchen fridge',
      sizeOrModel: 'LT1000P',
      itemId: ids.fridge,
      roomId: kitchen,
      notes: null,
    },
    {
      id: newId(),
      kind: 'light bulb',
      label: 'Kitchen pendants',
      sizeOrModel: 'BR30 LED 2700K',
      roomId: kitchen,
      notes: null,
    },
  ];

  property.shutoffs = [
    {
      id: newId(),
      type: 'water',
      locationNote: 'Front wall by hose bib — red valve',
      photo: null,
    },
    {
      id: newId(),
      type: 'gas',
      locationNote: 'Utility room next to furnace',
      photo: null,
    },
    {
      id: newId(),
      type: 'breaker-panel',
      locationNote: 'Garage wall, labeled main panel',
      photo: null,
    },
  ];

  const ts = nowIso();
  property.notes = [
    {
      id: newId(),
      title: 'Welcome',
      body: 'This is sample data so you can walk the house immediately. Edit or delete anything — or start a blank home from the home screen.',
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
      title: 'Trash pickup',
      schedule: 'weekly:weekday:2',
      source: 'demo',
      remind: true,
      notes: 'Change to your real pickup day',
      createdAt: ts,
    },
    {
      id: newId(),
      type: 'recycling',
      title: 'Recycling pickup',
      schedule: 'weekly:weekday:2',
      source: 'demo',
      remind: true,
      notes: null,
      createdAt: ts,
    },
  ];

  const due = new Date();
  due.setUTCDate(due.getUTCDate() + 12);
  const dueStr = due.toISOString().slice(0, 10);

  property.tasks = [
    {
      id: newId(),
      templateId: 'tpl-furnace-filter',
      itemId: ids.furnace,
      title: 'Change furnace filter (16x25x1)',
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
      templateId: 'tpl-dryer-vent',
      itemId: ids.dryer,
      title: 'Clean dryer vent',
      cadence: 'annually',
      nextDue: '2026-10-01',
      difficulty: 2,
      diyCost: 20,
      proCost: 150,
      tools: ['vent brush'],
      warnings: [],
      whenNotToDiy: false,
      videoLinks: [],
      status: 'pending',
      history: [],
      detail: null,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: newId(),
      templateId: 'tpl-water-heater-anode',
      itemId: ids.wh,
      title: 'Check water heater anode rod',
      cadence: 'about every 4 years',
      nextDue: '2026-09-01',
      difficulty: 3,
      diyCost: 40,
      proCost: 250,
      tools: ['socket set'],
      warnings: ['If stuck, call a pro.'],
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
    if (LEGACY_DEMO_NAMES.includes(p.name) || p.name === DEMO_PROPERTY_NAME) {
      await storage.deleteProperty(p.id);
    }
  }
  return ensureDemoCastle(storage);
}
