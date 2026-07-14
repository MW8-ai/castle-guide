import type { CastleStorage } from '../storage/CastleStorage';
import { newId, nowIso, todayIsoDate } from '../storage/ids';
import type { Item, Placement, Property, Room } from '../storage/types';

export const DEMO_FLAG_KEY = 'castle-guide-demo-v3';
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

function room(
  id: string,
  name: string,
  type: string,
  L: number,
  W: number,
  placements: Placement[] = [],
  materials?: Room['materials']
): Room {
  return {
    id,
    name,
    type,
    dims: { L, W, H: 9 },
    materials: materials ?? { floor: 'oak' },
    paintCards: [],
    photos: [],
    placements,
    noteIds: [],
  };
}

/**
 * Large filled demo: 2-story style layout, 5 beds, 3 baths, 3 garages,
 * plus living/kitchen/utility and lots of placed items.
 */
export async function ensureDemoCastle(storage: CastleStorage): Promise<Property> {
  const existing = await storage.listProperties();
  let demo = existing.find((p) => p.name === DEMO_PROPERTY_NAME);
  if (!demo) {
    demo = existing.find((p) => LEGACY_DEMO_NAMES.includes(p.name));
    if (demo && demo.name !== DEMO_PROPERTY_NAME) {
      demo.name = DEMO_PROPERTY_NAME;
      await storage.saveProperty(demo);
    }
  }
  // Require big house
  if (demo && demo.rooms.length >= 12 && demo.items.length >= 20) {
    await storage.setActiveProperty(demo.id);
    return demo;
  }
  if (demo) await storage.deleteProperty(demo.id);

  const property = await storage.createProperty(DEMO_PROPERTY_NAME, '43017');
  property.yearBuilt = 2008;
  property.style = 'Two-story · 5 bed / 3 bath / 3-car';
  property.address = '412 Maplewood Dr, Dublin, OH 43017';
  property.mortgage = {
    principal: 285000,
    annualRatePercent: 6.25,
    termMonths: 360,
    startDate: '2019-06-01',
    extraMonthly: 150,
    pmiMonthly: null,
    homeValue: 465000,
  };

  // Room ids
  const kitchen = newId();
  const living = newId();
  const dining = newId();
  const family = newId();
  const bath1 = newId();
  const bath2 = newId();
  const bath3 = newId();
  const bed1 = newId();
  const bed2 = newId();
  const bed3 = newId();
  const bed4 = newId();
  const bed5 = newId();
  const utility = newId();
  const garage1 = newId();
  const garage2 = newId();
  const garage3 = newId();
  const office = newId();

  // Item ids
  const fridge = newId();
  const range = newId();
  const dishwasher = newId();
  const microwave = newId();
  const couch = newId();
  const loveseat = newId();
  const tv = newId();
  const diningTable = newId();
  const bedA = newId();
  const bedB = newId();
  const bedC = newId();
  const bedD = newId();
  const bedE = newId();
  const toilet1 = newId();
  const toilet2 = newId();
  const toilet3 = newId();
  const wh = newId();
  const furnace = newId();
  const ac = newId();
  const washer = newId();
  const dryer = newId();
  const waterSoftener = newId();
  const desk = newId();
  const car1 = newId();
  const car2 = newId();
  const freezer = newId();

  property.rooms = [
    // Main living floor cluster
    room(
      kitchen,
      'Kitchen',
      'kitchen',
      16,
      14,
      [
        place(fridge, 1, 1, 3, 2.5),
        place(range, 6, 1, 2.5, 2.5),
        place(dishwasher, 10, 1, 2, 2),
        place(microwave, 13, 1, 2, 1.5),
      ],
      { floor: 'tile', wall: 'Warm White' }
    ),
    room(
      living,
      'Living Room',
      'living',
      18,
      16,
      [
        place(couch, 2, 4, 8, 3.5),
        place(loveseat, 12, 4, 4, 3),
        place(tv, 8, 1, 5, 1.5),
      ],
      { floor: 'hardwood' }
    ),
    room(
      dining,
      'Dining',
      'dining',
      14,
      12,
      [place(diningTable, 4, 3, 6, 5)],
      { floor: 'hardwood' }
    ),
    room(family, 'Family Room', 'living', 16, 14, [], { floor: 'carpet' }),
    room(bath1, 'Bath 1', 'bath', 9, 8, [place(toilet1, 2, 2, 2, 2.5)], {
      floor: 'tile',
    }),
    room(bath2, 'Bath 2', 'bath', 8, 7, [place(toilet2, 1.5, 2, 2, 2.5)], {
      floor: 'tile',
    }),
    room(bath3, 'Bath 3', 'bath', 10, 9, [place(toilet3, 2, 2, 2, 2.5)], {
      floor: 'tile',
    }),
    room(bed1, 'Primary Bedroom', 'bedroom', 16, 14, [
      place(bedA, 4, 3, 7, 7),
    ]),
    room(bed2, 'Bedroom 2', 'bedroom', 12, 11, [place(bedB, 2, 2, 6, 6)]),
    room(bed3, 'Bedroom 3', 'bedroom', 12, 11, [place(bedC, 2, 2, 6, 6)]),
    room(bed4, 'Bedroom 4', 'bedroom', 11, 10, [place(bedD, 2, 2, 6, 6)]),
    room(bed5, 'Bedroom 5', 'bedroom', 11, 10, [place(bedE, 2, 2, 6, 6)]),
    room(
      utility,
      'Utility',
      'utility',
      12,
      10,
      [
        place(wh, 1, 1, 2.2, 2.2),
        place(furnace, 5, 1, 2.5, 2.5),
        place(washer, 1, 5, 2.2, 2.2),
        place(dryer, 4.5, 5, 2.2, 2.2),
        place(waterSoftener, 8, 1, 2, 2),
      ],
      { floor: 'vinyl' }
    ),
    room(office, 'Office', 'office', 12, 11, [place(desk, 2, 2, 5, 3)]),
    room(
      garage1,
      'Garage 1',
      'garage',
      20,
      12,
      [place(car1, 4, 3, 10, 6), place(ac, 16, 2, 3, 3)],
      { floor: 'concrete' }
    ),
    room(
      garage2,
      'Garage 2',
      'garage',
      20,
      12,
      [place(car2, 4, 3, 10, 6), place(freezer, 16, 2, 3, 3)],
      { floor: 'concrete' }
    ),
    room(garage3, 'Garage 3', 'garage', 18, 12, [], { floor: 'concrete' }),
  ];

  // Fix family room - had bogus placement. Put a second sofa-like item
  const familySofa = newId();
  property.rooms = property.rooms.map((r) => {
    if (r.id !== family) return r;
    return {
      ...r,
      placements: [place(familySofa, 3, 4, 7, 3.5)],
    };
  });

  // Floors: bedrooms + full baths upstairs, everything else on the ground
  // floor, plus a yard room so the outdoor tab has real content.
  const backyard = newId();
  property.rooms.push(
    room(backyard, 'Backyard', 'yard', 24, 18, [], { floor: 'grass' })
  );
  const upperFloorRoomIds = new Set([bed1, bed2, bed3, bed4, bed5, bath2, bath3]);
  property.rooms = property.rooms.map((r) => ({
    ...r,
    floor: r.id === backyard ? 'yard' : upperFloorRoomIds.has(r.id) ? 'upper' : 'ground',
  }));

  property.items = [
    item({
      id: fridge,
      category: 'refrigerator',
      roomId: kitchen,
      brand: 'LG',
      model: 'LRFCS2503S',
      serial: 'LG-FRIDGE-001',
      purchaseDate: '2021-05-12',
      price: 1899,
      warrantyEnd: '2026-05-12',
      filterSpecs: [{ name: 'water filter', sizeOrModel: 'LT1000P' }],
      notes: 'French-door · kitchen',
    }),
    item({
      id: range,
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
      id: dishwasher,
      category: 'dishwasher',
      roomId: kitchen,
      brand: 'Bosch',
      model: 'SHPM65Z',
      purchaseDate: '2020-11-01',
      price: 950,
    }),
    item({
      id: microwave,
      category: 'microwave',
      roomId: kitchen,
      brand: 'Panasonic',
      model: 'NN-SN966S',
      purchaseDate: '2021-01-15',
      price: 220,
    }),
    item({
      id: couch,
      category: 'furniture',
      roomId: living,
      brand: 'Article',
      model: 'Sven Sofa',
      purchaseDate: '2021-09-01',
      price: 1400,
      notes: 'Living room couch',
    }),
    item({
      id: loveseat,
      category: 'furniture',
      roomId: living,
      brand: 'Article',
      model: 'Sven Loveseat',
      purchaseDate: '2021-09-01',
      price: 900,
    }),
    item({
      id: tv,
      category: 'tv',
      roomId: living,
      brand: 'Sony',
      model: 'XR-65A80J',
      purchaseDate: '2022-12-01',
      price: 1600,
    }),
    item({
      id: diningTable,
      category: 'furniture',
      roomId: dining,
      brand: 'West Elm',
      model: 'Industrial Table',
      purchaseDate: '2020-03-01',
      price: 1100,
    }),
    item({
      id: familySofa,
      category: 'furniture',
      roomId: family,
      brand: 'IKEA',
      model: 'KIVIK',
      purchaseDate: '2019-06-01',
      price: 700,
    }),
    item({
      id: bedA,
      category: 'furniture',
      roomId: bed1,
      brand: 'Pottery Barn',
      model: 'Farmhouse King',
      purchaseDate: '2018-01-01',
      price: 2200,
    }),
    item({
      id: bedB,
      category: 'furniture',
      roomId: bed2,
      brand: 'IKEA',
      model: 'MALM Queen',
      purchaseDate: '2019-01-01',
      price: 400,
    }),
    item({
      id: bedC,
      category: 'furniture',
      roomId: bed3,
      brand: 'IKEA',
      model: 'MALM Full',
      purchaseDate: '2019-02-01',
      price: 350,
    }),
    item({
      id: bedD,
      category: 'furniture',
      roomId: bed4,
      brand: 'Wayfair',
      model: 'Twin Platform',
      purchaseDate: '2020-08-01',
      price: 280,
    }),
    item({
      id: bedE,
      category: 'furniture',
      roomId: bed5,
      brand: 'Wayfair',
      model: 'Twin Platform',
      purchaseDate: '2020-08-01',
      price: 280,
    }),
    item({
      id: toilet1,
      category: 'plumbing',
      roomId: bath1,
      brand: 'Toto',
      model: 'Drake',
      purchaseDate: '2017-06-01',
      price: 350,
      cameWithHouse: true,
    }),
    item({
      id: toilet2,
      category: 'plumbing',
      roomId: bath2,
      brand: 'Kohler',
      model: 'Highline',
      purchaseDate: '2017-06-01',
      price: 320,
      cameWithHouse: true,
    }),
    item({
      id: toilet3,
      category: 'plumbing',
      roomId: bath3,
      brand: 'American Standard',
      model: 'Cadet',
      purchaseDate: '2018-01-01',
      price: 280,
      cameWithHouse: true,
    }),
    item({
      id: wh,
      category: 'water-heater',
      roomId: utility,
      brand: 'Rheem',
      model: 'XE50T10H45U0',
      serial: 'RH-WH-50',
      purchaseDate: '2019-05-01',
      price: 1100,
      notes: '50 gallon',
    }),
    item({
      id: furnace,
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
      id: washer,
      category: 'washer',
      roomId: utility,
      brand: 'Samsung',
      model: 'WF45',
      purchaseDate: '2020-06-01',
      price: 800,
    }),
    item({
      id: dryer,
      category: 'dryer',
      roomId: utility,
      brand: 'Samsung',
      model: 'DVE45',
      purchaseDate: '2020-06-01',
      price: 750,
    }),
    item({
      id: waterSoftener,
      category: 'water-softener',
      roomId: utility,
      brand: 'Culligan',
      model: 'HE 1.5',
      purchaseDate: '2020-04-01',
      price: 1800,
    }),
    item({
      id: ac,
      category: 'air-conditioner',
      roomId: garage1,
      brand: 'Carrier',
      model: '24ACC6',
      purchaseDate: '2018-03-15',
      price: 3800,
      cameWithHouse: true,
    }),
    item({
      id: desk,
      category: 'furniture',
      roomId: office,
      brand: 'Fully',
      model: 'Jarvis Desk',
      purchaseDate: '2021-04-01',
      price: 650,
    }),
    item({
      id: car1,
      category: 'vehicle',
      roomId: garage1,
      brand: 'Toyota',
      model: 'RAV4',
      purchaseDate: '2022-01-01',
      price: 32000,
    }),
    item({
      id: car2,
      category: 'vehicle',
      roomId: garage2,
      brand: 'Honda',
      model: 'CR-V',
      purchaseDate: '2019-05-01',
      price: 28000,
    }),
    item({
      id: freezer,
      category: 'freezer',
      roomId: garage2,
      brand: 'GE',
      model: 'Chest Freezer',
      purchaseDate: '2020-11-01',
      price: 450,
    }),
  ];

  // Remove invalid zero-footprint if any
  property.rooms = property.rooms.map((r) => ({
    ...r,
    placements: r.placements.filter((p) => p.footprint.L > 0 && p.footprint.W > 0),
  }));

  property.consumables = [
    {
      id: newId(),
      kind: 'furnace filter',
      label: 'Main furnace',
      sizeOrModel: '16x25x1',
      itemId: furnace,
      roomId: utility,
      notes: null,
    },
    {
      id: newId(),
      kind: 'fridge filter',
      label: 'Kitchen fridge',
      sizeOrModel: 'LT1000P',
      itemId: fridge,
      roomId: kitchen,
      notes: null,
    },
  ];

  property.shutoffs = [
    {
      id: newId(),
      type: 'water',
      locationNote: 'Front wall by hose bib',
      photo: null,
    },
    {
      id: newId(),
      type: 'gas',
      locationNote: 'Utility next to furnace',
      photo: null,
    },
    {
      id: newId(),
      type: 'breaker-panel',
      locationNote: 'Garage 1 wall',
      photo: null,
    },
  ];

  const ts = nowIso();
  property.notes = [
    {
      id: newId(),
      title: 'Kitchen traffic',
      body: 'Keep the path from fridge to sink clear — kids snack station.',
      someday: false,
      roomId: kitchen,
      itemId: null,
      createdAt: ts,
      updatedAt: ts,
      links: [],
      roughBudget: null,
    },
    {
      id: newId(),
      title: 'Utility reminder',
      body: 'Filter size 16x25x1 written on furnace door.',
      someday: false,
      roomId: utility,
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
      notes: null,
      createdAt: ts,
    },
  ];

  const due = new Date();
  due.setUTCDate(due.getUTCDate() + 12);
  property.tasks = [
    {
      id: newId(),
      templateId: 'tpl-furnace-filter',
      itemId: furnace,
      title: 'Change furnace filter (16x25x1)',
      cadence: 'every 90 days',
      nextDue: due.toISOString().slice(0, 10),
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
      itemId: wh,
      title: 'Check water heater anode rod',
      cadence: 'about every 4 years',
      nextDue: '2026-09-01',
      difficulty: 3,
      diyCost: 40,
      proCost: 250,
      tools: [],
      warnings: [],
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
