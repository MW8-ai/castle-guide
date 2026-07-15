import type {
  AppSettings,
  Item,
  ItemSnapshot,
  Note,
  Profile,
  Property,
  Room,
} from './types';
import { newId, nowIso } from './ids';

export function defaultSettings(): AppSettings {
  return {
    theme: 'system',
    activeRendererId: 'iso',
    characterNameOverrides: {},
    currency: 'USD',
    lengthUnit: 'ft',
  };
}

export function createProfile(displayName = 'Homeowner'): Profile {
  return {
    id: newId(),
    displayName,
    createdAt: nowIso(),
    propertyIds: [],
    activePropertyId: null,
    settings: defaultSettings(),
  };
}

export function createEmptyProperty(name: string, zip?: string | null): Property {
  const ts = nowIso();
  return {
    id: newId(),
    name,
    address: null,
    zip: zip ?? null,
    climateZone: null,
    yearBuilt: null,
    style: null,
    hoa: null,
    rooms: [],
    items: [],
    tasks: [],
    opsEvents: [],
    docs: [],
    improvements: [],
    quotes: [],
    notes: [],
    areaLinks: [],
    shutoffs: [],
    consumables: [],
    createdAt: ts,
    updatedAt: ts,
  };
}

export function createRoom(
  partial: Partial<Room> & { name: string; type?: string }
): Room {
  return {
    id: partial.id ?? newId(),
    name: partial.name,
    type: partial.type ?? 'other',
    floor: partial.floor,
    pos: partial.pos,
    dims: partial.dims ?? { L: 10, W: 10, H: 8 },
    materials: partial.materials,
    paintCards: partial.paintCards ?? [],
    photos: partial.photos ?? [],
    placements: partial.placements ?? [],
    noteIds: partial.noteIds ?? [],
  };
}

export function createItem(
  partial: Partial<Item> & { category: string }
): Item {
  return {
    id: partial.id ?? newId(),
    category: partial.category,
    roomId: partial.roomId ?? null,
    brand: partial.brand ?? null,
    model: partial.model ?? null,
    serial: partial.serial ?? null,
    purchaseDate: partial.purchaseDate ?? null,
    price: partial.price ?? null,
    cameWithHouse: partial.cameWithHouse ?? null,
    lifespanYrs: partial.lifespanYrs ?? null,
    warrantyEnd: partial.warrantyEnd ?? null,
    dims: partial.dims ?? null,
    filterSpecs: partial.filterSpecs ?? [],
    manualDocIds: partial.manualDocIds ?? [],
    photos: partial.photos ?? [],
    serviceLog: partial.serviceLog ?? [],
    poolRoomWorthy: partial.poolRoomWorthy ?? false,
    notes: partial.notes ?? null,
    active: partial.active ?? true,
    softDeleted: partial.softDeleted ?? false,
    lineage: partial.lineage ?? [],
  };
}

export function snapshotItem(item: Item): ItemSnapshot {
  return {
    id: item.id,
    category: item.category,
    roomId: item.roomId,
    brand: item.brand,
    model: item.model,
    serial: item.serial,
    purchaseDate: item.purchaseDate,
    price: item.price,
    cameWithHouse: item.cameWithHouse,
    lifespanYrs: item.lifespanYrs,
    warrantyEnd: item.warrantyEnd,
    dims: item.dims,
    filterSpecs: structuredClone(item.filterSpecs),
    manualDocIds: [...item.manualDocIds],
    photos: structuredClone(item.photos),
    serviceLog: structuredClone(item.serviceLog),
    poolRoomWorthy: item.poolRoomWorthy,
    notes: item.notes,
  };
}

export function deepFreezeLineageEntry<T extends object>(obj: T): Readonly<T> {
  const clone = structuredClone(obj);
  return freezeDeep(clone);
}

function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const v of Object.values(value as object)) {
      freezeDeep(v);
    }
  }
  return value;
}

export function createNote(
  body: string,
  opts?: Partial<Note>
): Note {
  const ts = nowIso();
  return {
    id: opts?.id ?? newId(),
    body,
    someday: opts?.someday ?? false,
    roomId: opts?.roomId ?? null,
    itemId: opts?.itemId ?? null,
    createdAt: opts?.createdAt ?? ts,
    updatedAt: opts?.updatedAt ?? ts,
    title: opts?.title,
    links: opts?.links ?? [],
    roughBudget: opts?.roughBudget ?? null,
  };
}
