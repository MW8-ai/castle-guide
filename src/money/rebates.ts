import rebatesData from '../../data/money/rebates.json';

export interface RebateCard {
  id: string;
  code: string;
  title: string;
  summary: string;
  eligibilityPattern: string;
  howToClaim: string;
  source: string;
  sourceUrl: string;
  asOfDate: string;
  confidence: 'verified' | 'typical' | 'regional';
  regionNote: string;
  relatedJobHints: string[];
}

export function getRebates(): RebateCard[] {
  return rebatesData.rebates as RebateCard[];
}

export function getRebateByCode(code: string): RebateCard | undefined {
  return getRebates().find(
    (r) => r.code.toLowerCase() === code.toLowerCase()
  );
}
