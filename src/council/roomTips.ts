/** Lightweight council tips by room type — look/feel of REF-3, no XP. */

export interface RoomTip {
  advisor: string;
  portrait: string;
  tip: string;
}

const BY_TYPE: Record<string, RoomTip[]> = {
  kitchen: [
    {
      advisor: 'Wrench Wanda',
      portrait: '🔧',
      tip: 'Under-sink shutoff and dishwasher filter are the two things people forget until they flood.',
    },
    {
      advisor: 'Deco Dee',
      portrait: '🎨',
      tip: 'Paint + good lighting is the highest ROI refresh in this room if resale is on your mind.',
    },
  ],
  living: [
    {
      advisor: 'Grandpa Gus',
      portrait: '👴',
      tip: 'Ceiling fan: counterclockwise in summer. And keep vents clear of furniture.',
    },
  ],
  bedroom: [
    {
      advisor: 'Adjuster Ada',
      portrait: '📋',
      tip: 'Photograph high-value furniture while it’s clean — claims go smoother with receipts + photos.',
    },
  ],
  bath: [
    {
      advisor: 'Wrench Wanda',
      portrait: '🔧',
      tip: 'A running toilet is often a $15 flapper. Watch the bowl before you call a plumber.',
    },
  ],
  utility: [
    {
      advisor: 'Frank the Foreman',
      portrait: '👷',
      tip: 'Label the breaker that kills the furnace and water heater. 2 a.m. you will thank yourself.',
    },
    {
      advisor: 'Wrench Wanda',
      portrait: '🔧',
      tip: 'Filter size on the furnace is gold — write it on the door with a paint pen.',
    },
  ],
  garage: [
    {
      advisor: 'Adjuster Ada',
      portrait: '📋',
      tip: 'Garage freezers and tools vanish in claims without serials. Snap labels once.',
    },
  ],
  office: [
    {
      advisor: 'Banks McCoin',
      portrait: '💼',
      tip: 'Home-office gear can matter at tax time — keep purchase dates with the rest of the house record.',
    },
  ],
  dining: [
    {
      advisor: 'Deco Dee',
      portrait: '🎨',
      tip: 'Flow: dining should feel connected to kitchen traffic — don’t block the path with a too-big table.',
    },
  ],
};

const FALLBACK: RoomTip = {
  advisor: 'Grandpa Gus',
  portrait: '👴',
  tip: 'Walk the house once a season. Your eyes catch what apps miss.',
};

export function tipsForRoomType(type: string): RoomTip[] {
  const key = type.toLowerCase();
  return BY_TYPE[key] ?? [FALLBACK];
}
