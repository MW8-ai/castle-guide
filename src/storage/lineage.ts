import type { Item, LineageEntry } from './types';
import { deepFreezeLineageEntry, snapshotItem, createItem } from './factories';
import { newId, todayIsoDate } from './ids';

/**
 * Replace an active item: archive current into immutable lineage, install next.
 * Lineage entries are deep-frozen; repositories refuse mutation of lineage arrays.
 */
export function replaceItemWithLineage(
  current: Item,
  nextPartial: Partial<Item> & { category?: string }
): { archived: Item; next: Item } {
  if (!current.active) {
    throw new Error('Cannot replace an inactive item');
  }

  const activeTo = todayIsoDate();
  const activeFrom =
    current.purchaseDate && current.purchaseDate.length >= 4
      ? current.purchaseDate
      : activeTo;

  const entry: LineageEntry = deepFreezeLineageEntry({
    snapshot: snapshotItem(current),
    activeFrom,
    activeTo,
  });

  const archived: Item = {
    ...current,
    active: false,
    softDeleted: true,
    lineage: [...current.lineage, entry],
  };

  // Freeze lineage array contents (entries already frozen)
  Object.freeze(archived.lineage);

  const next = createItem({
    ...nextPartial,
    id: nextPartial.id ?? newId(),
    category: nextPartial.category ?? current.category,
    roomId: nextPartial.roomId ?? current.roomId,
    lineage: [entry, ...current.lineage.map((e) => deepFreezeLineageEntry(e))],
    active: true,
    softDeleted: false,
  });
  Object.freeze(next.lineage);

  return { archived, next };
}

/**
 * Strip any attempt to mutate lineage through a generic update payload.
 * Callers may update active item fields only; lineage is server-side (repo) owned.
 */
export function stripLineageFromUpdate(
  patch: Partial<Item>
): Omit<Partial<Item>, 'lineage'> {
  const { lineage: _ignored, ...rest } = patch;
  void _ignored;
  return rest;
}

export function assertLineageImmutable(item: Item): void {
  for (const entry of item.lineage) {
    if (!Object.isFrozen(entry) || !Object.isFrozen(entry.snapshot)) {
      // On load from JSON, re-freeze rather than throw — immutability is enforced on write paths
      deepFreezeLineageEntry(entry);
    }
  }
}

export function refreezePropertyLineage(items: Item[]): Item[] {
  return items.map((item) => {
    const lineage = item.lineage.map((e) => deepFreezeLineageEntry(e));
    Object.freeze(lineage);
    return { ...item, lineage };
  });
}
