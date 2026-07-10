/**
 * Hotspot layout for assets/house/sample-home.png (angled cutaway art).
 * Coordinates are % of image width/height (0–100), tuned to the sample art.
 */
export interface ArtHotspot {
  id: string;
  /** Match inventory by category (and optional brand fragment) */
  category: string;
  brandHint?: string;
  label: string;
  x: number;
  y: number;
  room: string;
}

/** Pins for Sample Home art — angled isometric scene, not bird’s-eye. */
export const SAMPLE_HOME_HOTSPOTS: ArtHotspot[] = [
  {
    id: 'hs-fridge',
    category: 'refrigerator',
    brandHint: 'lg',
    label: 'Fridge',
    x: 58,
    y: 36,
    room: 'Kitchen',
  },
  {
    id: 'hs-range',
    category: 'range',
    label: 'Range',
    x: 52,
    y: 40,
    room: 'Kitchen',
  },
  {
    id: 'hs-dishwasher',
    category: 'dishwasher',
    label: 'Dishwasher',
    x: 48,
    y: 42,
    room: 'Kitchen',
  },
  {
    id: 'hs-sofa',
    category: 'furniture',
    brandHint: 'article',
    label: 'Sofa',
    x: 32,
    y: 58,
    room: 'Living Room',
  },
  {
    id: 'hs-tv',
    category: 'tv',
    label: 'TV',
    x: 38,
    y: 52,
    room: 'Living Room',
  },
  {
    id: 'hs-bed',
    category: 'furniture',
    brandHint: 'ikea',
    label: 'Bed',
    x: 28,
    y: 28,
    room: 'Bedroom',
  },
  {
    id: 'hs-toilet',
    category: 'plumbing',
    label: 'Bath',
    x: 48,
    y: 22,
    room: 'Bathroom',
  },
  {
    id: 'hs-washer',
    category: 'washer',
    label: 'Washer',
    x: 62,
    y: 55,
    room: 'Laundry',
  },
  {
    id: 'hs-dryer',
    category: 'dryer',
    label: 'Dryer',
    x: 66,
    y: 55,
    room: 'Laundry',
  },
  {
    id: 'hs-furnace',
    category: 'furnace',
    label: 'Furnace',
    x: 72,
    y: 62,
    room: 'Utility',
  },
  {
    id: 'hs-wh',
    category: 'water-heater',
    label: 'Water heater',
    x: 76,
    y: 58,
    room: 'Utility',
  },
  {
    id: 'hs-ac',
    category: 'air-conditioner',
    label: 'A/C',
    x: 78,
    y: 48,
    room: 'Garage',
  },
];

import type { Item } from '../../storage/types';

export function matchItemToHotspot(
  items: Item[],
  hs: ArtHotspot
): Item | undefined {
  const active = items.filter((i) => i.active && !i.softDeleted);
  const cat = hs.category.toLowerCase();
  let pool = active.filter((i) => {
    const c = i.category.toLowerCase().replace(/[\s_]+/g, '-');
    return c === cat || c.includes(cat) || cat.includes(c);
  });
  if (hs.brandHint) {
    const b = hs.brandHint.toLowerCase();
    const branded = pool.filter((i) => (i.brand ?? '').toLowerCase().includes(b));
    if (branded.length) pool = branded;
  }
  return pool[0];
}
