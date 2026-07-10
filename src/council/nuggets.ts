import gus from '../../data/knowledge/gus-ceiling-fan.json';
import wanda from '../../data/knowledge/wanda-flapper-valve.json';
import councilData from '../../data/characters/council.json';
import { currentSeason } from '../maintain/seasonal';
import type { Property } from '../storage/types';

export interface Nugget {
  id: string;
  character: string;
  category: string;
  title: string;
  body: string;
  sources: { url: string; date: string; label?: string }[];
  asOfDate: string;
  confidence: string;
  seasonTags?: string[];
  estSavings?: number;
}

const NUGGETS: Nugget[] = [gus as Nugget, wanda as Nugget];

// Inline seasonal / category extras (still schema-shaped; not hardcoding costs)
const EXTRA: Nugget[] = [
  {
    id: 'nugget-gus-spring-perimeter',
    character: 'grandpa-gus',
    category: 'seasonal',
    title: 'Spring perimeter walk',
    body: 'Walk the north side of the house every spring — mildew and splash-back like the shade. Check downspouts while you are at it.',
    sources: [
      {
        url: 'https://www.epa.gov/mold',
        date: '2024-01-01',
        label: 'EPA mold basics (general)',
      },
    ],
    asOfDate: '2024-01-01',
    confidence: 'typical',
    seasonTags: ['spring'],
  },
  {
    id: 'nugget-frank-load-bearing',
    character: 'frank-foreman',
    category: 'structural',
    title: 'Load-bearing? Put the saw down',
    body: 'Notching a joist or removing a wall without knowing if it is load-bearing is how castles become rubble. Call a pro when structure is involved.',
    sources: [
      {
        url: 'https://www.cpsc.gov',
        date: '2023-01-01',
        label: 'General safety authority reference',
      },
    ],
    asOfDate: '2023-01-01',
    confidence: 'typical',
  },
];

export function getAllNuggets(): Nugget[] {
  return [...NUGGETS, ...EXTRA];
}

export function getCouncil() {
  return councilData.characters;
}

export function characterName(
  id: string,
  overrides?: Record<string, string>
): string {
  if (overrides?.[id]) return overrides[id];
  const c = getCouncil().find((x) => x.id === id);
  return c?.defaultName ?? id;
}

/** Contextual nuggets: season + open categories from property items. */
export function surfaceNuggets(
  property?: Property | null,
  overrides?: Record<string, string>
): { nugget: Nugget; characterDisplay: string; reason: string }[] {
  const season = currentSeason();
  const out: { nugget: Nugget; characterDisplay: string; reason: string }[] = [];

  for (const n of getAllNuggets()) {
    let reason = 'library';
    if (n.seasonTags?.includes(season)) {
      reason = `seasonal (${season})`;
      out.push({
        nugget: n,
        characterDisplay: characterName(n.character, overrides),
        reason,
      });
      continue;
    }
    if (
      property &&
      n.character === 'wrench-wanda' &&
      property.items.some((i) => /water-heater|toilet|hvac|furnace/i.test(i.category))
    ) {
      reason = 'matches your catalog';
      out.push({
        nugget: n,
        characterDisplay: characterName(n.character, overrides),
        reason,
      });
      continue;
    }
    if (n.character === 'grandpa-gus' && n.seasonTags?.length) {
      // already handled
    } else if (!n.seasonTags?.length) {
      out.push({
        nugget: n,
        characterDisplay: characterName(n.character, overrides),
        reason: 'council library',
      });
    }
  }

  // Prefer seasonal Gus first
  return out.sort((a, b) => {
    if (a.reason.startsWith('seasonal') && !b.reason.startsWith('seasonal'))
      return -1;
    return 0;
  });
}

export function seasonalGusNugget(): Nugget | undefined {
  const season = currentSeason();
  return getAllNuggets().find(
    (n) =>
      n.character === 'grandpa-gus' &&
      (n.seasonTags?.includes(season) || n.id.includes('ceiling-fan'))
  );
}
