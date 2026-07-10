import official from '../../data/area/official-links.json';

export interface AreaLinkDef {
  id: string;
  label: string;
  url: string;
  category: string;
  note?: string;
}

export function getOfficialAreaLinks(): AreaLinkDef[] {
  return official.links as AreaLinkDef[];
}

export function getAreaLegalNotice(): string {
  return official.legalNotice;
}
