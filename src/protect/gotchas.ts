import gotchasData from '../../data/protect/insurance-gotchas.json';

export interface InsuranceGotcha {
  id: string;
  title: string;
  body: string;
  source: string;
  asOfDate: string;
  confidence: string;
  regionNote: string;
}

export function getInsuranceGotchas(): InsuranceGotcha[] {
  return gotchasData.gotchas as InsuranceGotcha[];
}
