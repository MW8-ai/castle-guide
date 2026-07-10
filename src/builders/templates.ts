import mancave from '../../data/builders/mancave-glory.json';
import bunker from '../../data/builders/bunker.json';

export interface BuilderLineItem {
  item: string;
  low: number;
  high: number;
}

export interface BuilderTier {
  name: string;
  lineItems: BuilderLineItem[];
  considerations: string[];
}

export interface BuilderTemplate {
  id: string;
  type: string;
  title: string;
  host: string;
  tiers: BuilderTier[];
  asOfDate: string;
  confidence: string;
  currency: string;
  regionNote: string;
}

const ALL: BuilderTemplate[] = [
  mancave as BuilderTemplate,
  bunker as BuilderTemplate,
];

export function getBuilderTemplates(): BuilderTemplate[] {
  return ALL;
}

export function getBuilder(id: string): BuilderTemplate | undefined {
  return ALL.find((b) => b.id === id);
}

export function tierEstimate(tier: BuilderTier): { low: number; high: number } {
  return tier.lineItems.reduce(
    (acc, li) => ({ low: acc.low + li.low, high: acc.high + li.high }),
    { low: 0, high: 0 }
  );
}
