import { describe, it, expect } from 'vitest';
import { seasonalGusNugget, surfaceNuggets, getCouncil } from '../src/council';
import { getOfficialAreaLinks, getAreaLegalNotice } from '../src/area';
import { getBuilder, tierEstimate } from '../src/builders';
import { getLawModules } from '../src/knowledge/law';
import { buildLabelOcrPrompt, buildPhotoTriagePrompt } from '../src/ai';
import { createEmptyProperty, createItem } from '../src/storage/factories';

describe('Phase 4 council + AI prompts', () => {
  it('surfaces seasonal Gus nugget', () => {
    const gus = seasonalGusNugget();
    expect(gus).toBeTruthy();
    expect(gus!.character).toBe('grandpa-gus');
  });

  it('has full council roster of 12', () => {
    expect(getCouncil().length).toBe(12);
    expect(getCouncil().some((c) => c.id === 'dale')).toBe(true);
  });

  it('surfaces nuggets for catalog with water heater', () => {
    const p = createEmptyProperty('X');
    p.items.push(createItem({ category: 'water-heater', brand: 'Rheem' }));
    const surfaced = surfaceNuggets(p);
    expect(surfaced.length).toBeGreaterThan(0);
  });

  it('ships OCR and triage prompts (manual mode)', () => {
    expect(buildLabelOcrPrompt()).toMatch(/JSON/);
    expect(buildPhotoTriagePrompt()).toMatch(/Not an inspection/i);
  });
});

describe('Phase 5 area + builders + law', () => {
  it('official area links include NSOPW and legal notice', () => {
    const links = getOfficialAreaLinks();
    expect(links.some((l) => /nsopw/i.test(l.url))).toBe(true);
    expect(getAreaLegalNotice()).toMatch(/harass/i);
  });

  it('Karen fence module has statute-style source link', () => {
    const law = getLawModules();
    expect(law[0].title).toMatch(/fence/i);
    expect(law[0].sources[0].url).toMatch(/^https?:\/\//);
    expect(law[0].confidence).toBe('regional');
  });

  it('Colonel Glory mancave has itemized estimate', () => {
    const b = getBuilder('builder-mancave');
    expect(b).toBeTruthy();
    const glory = b!.tiers.find((t) => t.name === 'Glory');
    expect(glory).toBeTruthy();
    const est = tierEstimate(glory!);
    expect(est.high).toBeGreaterThan(est.low);
    expect(est.low).toBeGreaterThan(1000);
    expect(glory!.considerations.some((c) => /spouse|permit/i.test(c))).toBe(
      true
    );
  });
});
