import type { DaleVerdict, QuoteLineItem } from '../storage/types';
import type { CostEntry } from './costLibrary';
import { matchCostEntry } from './costLibrary';

const VAGUE_PATTERNS =
  /\b(as needed|tbd|misc\.?|miscellaneous|etc\.?|allowance|contingency|lump sum|to be determined|various)\b/i;

export interface DaleReviewInput {
  job: string;
  amount: number;
  lineItems: QuoteLineItem[];
  scopeNotes?: string | null;
  costEntry?: CostEntry | null;
}

export interface DaleReviewResult {
  verdict: DaleVerdict;
  reasons: string[];
  /** Famous when overpriced / vague */
  catchphrase: string | null;
  costEntryId: string | null;
}

/**
 * Dale's Desk — compare quote to cost library + scope quality.
 * Deadpan numbers; flavor only on the verdict line.
 */
export function reviewQuote(input: DaleReviewInput): DaleReviewResult {
  const reasons: string[] = [];
  const entry = input.costEntry ?? matchCostEntry(input.job) ?? null;
  const costEntryId = entry?.id ?? null;

  if (input.amount <= 0) {
    return {
      verdict: 'unknown',
      reasons: ['Quote amount is missing or zero.'],
      catchphrase: null,
      costEntryId,
    };
  }

  let priceScore: 'ok' | 'steep' | 'dreamin' | 'unknown' = 'unknown';
  if (entry) {
    const { min, max } = entry.proRange;
    if (input.amount <= max * 1.1) {
      priceScore = 'ok';
      reasons.push(
        `Amount $${input.amount.toLocaleString()} is within ~10% of typical pro range $${min.toLocaleString()}–$${max.toLocaleString()} (${entry.asOfDate}, ${entry.confidence}).`
      );
    } else if (input.amount <= max * 1.5) {
      priceScore = 'steep';
      reasons.push(
        `Amount $${input.amount.toLocaleString()} is above typical pro max $${max.toLocaleString()} for "${entry.job}" (as of ${entry.asOfDate}). Your market may vary.`
      );
    } else {
      priceScore = 'dreamin';
      reasons.push(
        `Amount $${input.amount.toLocaleString()} is well above typical pro max $${max.toLocaleString()} for "${entry.job}" (as of ${entry.asOfDate}). Get another bid before writing a check.`
      );
    }
  } else {
    reasons.push('No matching cost library entry — price check skipped.');
  }

  const scopeText = [
    input.scopeNotes ?? '',
    ...input.lineItems.map((l) => l.description),
  ].join(' ');

  let vague = false;
  if (input.lineItems.length === 0) {
    vague = true;
    reasons.push('No line items — scope is too vague to defend.');
  } else if (VAGUE_PATTERNS.test(scopeText)) {
    vague = true;
    reasons.push(
      'Scope uses vague language (as needed / misc / allowance / etc.). Ask for quantities and specs.'
    );
  }

  const unpriced = input.lineItems.filter((l) => !l.amount || l.amount <= 0);
  if (unpriced.length > 0) {
    vague = true;
    reasons.push(`${unpriced.length} line item(s) have no amount.`);
  }

  let verdict: DaleVerdict;
  if (priceScore === 'dreamin' || (priceScore === 'steep' && vague)) {
    verdict = 'dreamin';
  } else if (priceScore === 'steep' || vague) {
    verdict = 'steep';
  } else if (priceScore === 'ok' && !vague) {
    verdict = 'fair-dinkum';
  } else {
    verdict = 'unknown';
  }

  const catchphrase =
    verdict === 'dreamin'
      ? "Tell him he's dreamin'."
      : verdict === 'fair-dinkum'
        ? 'Fair dinkum.'
        : null;

  return { verdict, reasons, catchphrase, costEntryId };
}
