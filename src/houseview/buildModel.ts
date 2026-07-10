import type { Item, Property, Task } from '../storage/types';
import type { HealthState, HouseViewModel, PlacementView } from './types';
import { todayUtc } from '../maintain/cadence';
import { newId } from '../storage/ids';

export function healthFromTasks(
  itemId: string,
  tasks: Task[],
  asOf = todayUtc()
): HealthState {
  const related = tasks.filter(
    (t) => t.itemId === itemId && t.status === 'pending' && t.nextDue
  );
  if (related.some((t) => t.nextDue! < asOf)) return 'overdue';
  if (related.some((t) => t.nextDue! <= addDays(asOf, 14))) return 'due';
  return 'ok';
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function defaultFootprint(item: Item): { L: number; W: number } {
  if (item.dims?.L && item.dims?.W) {
    return { L: item.dims.L, W: item.dims.W };
  }
  const cat = item.category.toLowerCase();
  if (cat.includes('fridge') || cat.includes('refrigerator'))
    return { L: 3, W: 2.5 };
  if (cat.includes('water-heater') || cat.includes('water heater'))
    return { L: 2, W: 2 };
  if (cat.includes('furnace') || cat.includes('hvac')) return { L: 2.5, W: 2.5 };
  return { L: 2, W: 2 };
}

/**
 * Build a renderer model from property data.
 * Ensures every active item has a placement (auto-layout if missing).
 * Mutates property.rooms placements only when `ensurePlacements` is true (caller saves).
 */
export function buildHouseViewModel(
  property: Property,
  opts?: { ensurePlacements?: boolean }
): { model: HouseViewModel; placementsChanged: boolean } {
  let placementsChanged = false;
  const rooms = property.rooms.length
    ? property.rooms
    : [
        {
          id: 'auto-room',
          name: 'Main',
          type: 'other',
          dims: { L: 16, W: 12, H: 9 },
          paintCards: [],
          photos: [],
          placements: [],
          noteIds: [],
        },
      ];

  // Ensure auto room exists on property if we invented it
  if (!property.rooms.length && opts?.ensurePlacements) {
    property.rooms.push(rooms[0] as (typeof property.rooms)[0]);
    placementsChanged = true;
  }

  const activeItems = property.items.filter((i) => i.active && !i.softDeleted);
  const placedIds = new Set<string>();
  for (const room of rooms) {
    for (const p of room.placements) placedIds.add(p.itemId);
  }

  if (opts?.ensurePlacements) {
    let cursor = 1;
    for (const item of activeItems) {
      if (placedIds.has(item.id)) continue;
      const room = rooms[0];
      const fp = defaultFootprint(item);
      const placement: PlacementView = {
        id: newId(),
        roomId: room.id,
        itemId: item.id,
        label: itemLabel(item),
        x: cursor,
        y: 1,
        rotation: 0,
        footprint: fp,
      };
      room.placements.push({
        id: placement.id,
        itemId: placement.itemId,
        x: placement.x,
        y: placement.y,
        rotation: placement.rotation,
        footprint: placement.footprint,
      });
      placedIds.add(item.id);
      cursor += fp.L + 0.5;
      placementsChanged = true;
    }
  }

  const placements: PlacementView[] = [];
  for (const room of rooms) {
    for (const p of room.placements) {
      const item = property.items.find((i) => i.id === p.itemId);
      if (!item || item.softDeleted) continue;
      placements.push({
        id: p.id,
        roomId: room.id,
        itemId: p.itemId,
        label: itemLabel(item),
        x: p.x,
        y: p.y,
        z: p.z,
        rotation: p.rotation,
        footprint: p.footprint,
      });
    }
  }

  const healthByItemId: Record<string, HealthState> = {};
  for (const item of activeItems) {
    healthByItemId[item.id] = healthFromTasks(item.id, property.tasks);
  }

  return {
    model: {
      houseName: property.name,
      rooms: rooms.map((r) => ({
        id: r.id,
        name: r.name,
        dims: r.dims,
        materials: r.materials,
      })),
      placements,
      healthByItemId,
    },
    placementsChanged,
  };
}

export function itemLabel(item: Item): string {
  const parts = [item.brand, item.model].filter(Boolean);
  return parts.length ? parts.join(' ') : item.category;
}
