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
    {
      advisor: 'Banks McCoin',
      portrait: '💼',
      tip: 'Keep the fridge and range receipts — full kitchen packages matter at claim and resale time.',
    },
  ],
  living: [
    {
      advisor: 'Grandpa Gus',
      portrait: '👴',
      tip: 'Ceiling fan: counterclockwise in summer. Keep vents clear of furniture.',
    },
    {
      advisor: 'Adjuster Ada',
      portrait: '📋',
      tip: 'Living-room electronics and rugs need photos in your vault before anything happens.',
    },
  ],
  bedroom: [
    {
      advisor: 'Adjuster Ada',
      portrait: '📋',
      tip: 'Photograph high-value furniture while it’s clean — claims go smoother with receipts + photos.',
    },
    {
      advisor: 'Deco Dee',
      portrait: '🎨',
      tip: 'Note the paint brand and code on the wall — future touch-ups take five minutes instead of a store trip.',
    },
  ],
  bath: [
    {
      advisor: 'Wrench Wanda',
      portrait: '🔧',
      tip: 'A running toilet is often a $15 flapper. Watch the bowl before you call a plumber.',
    },
    {
      advisor: 'Frank the Foreman',
      portrait: '👷',
      tip: 'Caulk and exhaust fans prevent the expensive kind of “mystery mildew.”',
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
    {
      advisor: 'Adjuster Ada',
      portrait: '📋',
      tip: 'Water heater age + serial is the first thing an adjuster asks after a leak.',
    },
  ],
  garage: [
    {
      advisor: 'Adjuster Ada',
      portrait: '📋',
      tip: 'Garage freezers and tools vanish in claims without serials. Snap labels once.',
    },
    {
      advisor: 'The Colonel',
      portrait: '🪖',
      tip: 'CO detector near any attached garage is non-negotiable if you park cars inside.',
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
      tip: 'Dining should feel connected to kitchen traffic — don’t block the path with a too-big table.',
    },
  ],
  family: [
    {
      advisor: 'Grandpa Gus',
      portrait: '👴',
      tip: 'This is the wear room — check floor transitions and outlets every spring.',
    },
  ],
  laundry: [
    {
      advisor: 'Wrench Wanda',
      portrait: '🔧',
      tip: 'Dryer vent cleaning is a fire prevention chore, not optional housekeeping.',
    },
  ],
  hallway: [
    {
      advisor: 'Frank the Foreman',
      portrait: '👷',
      tip: 'Smoke alarms in halls cover more of the house than any single room placement.',
    },
  ],
  exterior: [
    {
      advisor: 'Sod Father',
      portrait: '🌱',
      tip: 'Gutters + grade away from the foundation beat almost any basement “fix.”',
    },
  ],
};

const FALLBACK: RoomTip[] = [
  {
    advisor: 'Grandpa Gus',
    portrait: '👴',
    tip: 'Walk the house once a season. Your eyes catch what apps miss.',
  },
  {
    advisor: 'Wrench Wanda',
    portrait: '🔧',
    tip: 'If something hums, drips, or smells off — log it with a photo before it becomes a project.',
  },
];

export function tipsForRoomType(type: string): RoomTip[] {
  const key = type.toLowerCase();
  // soft match: "primary bedroom" → bedroom, "bath 1" → bath
  for (const k of Object.keys(BY_TYPE)) {
    if (key.includes(k)) return BY_TYPE[k];
  }
  return BY_TYPE[key] ?? FALLBACK;
}

/** Full council strip for the home screen — one tip each from main advisors. */
export function homeCouncilTips(): RoomTip[] {
  return [
    {
      advisor: 'Wrench Wanda',
      portrait: '🔧',
      tip: 'Filters, flappers, and shutoffs — the cheap fixes that stop expensive nights.',
    },
    {
      advisor: 'Adjuster Ada',
      portrait: '📋',
      tip: 'Serials + install dates turn a claim from chaos into a checklist.',
    },
    {
      advisor: 'Banks McCoin',
      portrait: '💼',
      tip: 'Receipts and improvement records are equity you can prove.',
    },
    {
      advisor: 'Frank the Foreman',
      portrait: '👷',
      tip: 'Know your main water and gas shutoffs before you need them.',
    },
    {
      advisor: 'Grandpa Gus',
      portrait: '👴',
      tip: 'A quiet walk through the house beats any dashboard.',
    },
  ];
}
