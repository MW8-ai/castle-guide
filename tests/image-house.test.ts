import { describe, it, expect } from 'vitest';
import {
  SAMPLE_HOME_HOTSPOTS,
  matchItemToHotspot,
} from '../src/houseview/imageMap/hotspots';
import { createItem } from '../src/storage/factories';

describe('illustrated house hotspots', () => {
  it('has pins for core appliances', () => {
    const cats = SAMPLE_HOME_HOTSPOTS.map((h) => h.category);
    expect(cats).toContain('refrigerator');
    expect(cats).toContain('water-heater');
    expect(cats).toContain('furnace');
  });

  it('matches LG fridge by category and brand hint', () => {
    const items = [
      createItem({
        category: 'refrigerator',
        brand: 'LG',
        model: 'LRFCS2503S',
      }),
      createItem({ category: 'range', brand: 'GE', model: 'X' }),
    ];
    const hs = SAMPLE_HOME_HOTSPOTS.find((h) => h.id === 'hs-fridge')!;
    const hit = matchItemToHotspot(items, hs);
    expect(hit?.brand).toBe('LG');
  });
});
