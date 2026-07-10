import type { Improvement } from '../storage/types';

/**
 * Capital improvements → running adjusted basis eligible total.
 * Educational explainer numbers only — not tax advice.
 */
export function sumBasisEligible(improvements: Improvement[]): number {
  return improvements
    .filter((i) => i.basisEligible)
    .reduce((s, i) => s + (i.cost || 0), 0);
}

export function sumAllImprovements(improvements: Improvement[]): number {
  return improvements.reduce((s, i) => s + (i.cost || 0), 0);
}

export const BASIS_EXPLAINER = `Capital improvements can increase your cost basis in a home, which may reduce taxable capital gain when you sell. Keep dated receipts. Repairs that merely maintain the property may not qualify. This app tracks your numbers; a tax professional applies the law to your facts.`;
