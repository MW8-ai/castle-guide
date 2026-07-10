import furnaceFilter from '../../data/costs/furnace-filter.json';
import anode from '../../data/costs/water-heater-anode-rod.json';
import roof from '../../data/costs/roof-asphalt-replace.json';
import hvac from '../../data/costs/hvac-ac-service.json';
import waterHeater from '../../data/costs/water-heater-replace.json';

export interface CostEntry {
  id: string;
  job: string;
  diyRange: { min: number; max: number };
  proRange: { min: number; max: number };
  currency: string;
  source: string;
  sourceUrl?: string;
  asOfDate: string;
  regionNote: string;
  confidence: 'verified' | 'typical' | 'regional';
}

const ENTRIES: CostEntry[] = [
  furnaceFilter as CostEntry,
  anode as CostEntry,
  roof as CostEntry,
  hvac as CostEntry,
  waterHeater as CostEntry,
];

export function getCostLibrary(): CostEntry[] {
  return ENTRIES.slice().sort((a, b) => a.job.localeCompare(b.job));
}

export function getCostById(id: string): CostEntry | undefined {
  return ENTRIES.find((e) => e.id === id);
}

/** Loose job string → best matching cost entry for Dale. */
export function matchCostEntry(job: string): CostEntry | undefined {
  const j = job.toLowerCase();
  const scored = ENTRIES.map((e) => {
    const words = e.job.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const hits = words.filter((w) => j.includes(w)).length;
    return { e, hits };
  }).sort((a, b) => b.hits - a.hits);
  return scored[0] && scored[0].hits > 0 ? scored[0].e : undefined;
}

export function assertCostDated(entry: CostEntry): void {
  if (!entry.asOfDate) {
    throw new Error(`Cost entry ${entry.id} missing asOfDate`);
  }
  if (!entry.confidence) {
    throw new Error(`Cost entry ${entry.id} missing confidence`);
  }
}
