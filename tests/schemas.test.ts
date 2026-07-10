import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadJson(pathFromRoot: string) {
  return JSON.parse(readFileSync(join(root, pathFromRoot), 'utf8'));
}

function makeAjv() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv;
}

describe('shipped content schemas', () => {
  it('validates gus nugget as typical', () => {
    const validate = makeAjv().compile(
      loadJson('data/schemas/nugget-card.schema.json')
    );
    const nugget = loadJson('data/knowledge/gus-ceiling-fan.json');
    expect(validate(nugget)).toBe(true);
    expect(nugget.confidence).toBe('typical');
  });

  it('validates cost entry as typical', () => {
    const validate = makeAjv().compile(
      loadJson('data/schemas/cost-entry.schema.json')
    );
    const cost = loadJson('data/costs/furnace-filter.json');
    expect(validate(cost)).toBe(true);
    expect(cost.confidence).toBe('typical');
  });

  it('rejects nugget missing asOfDate', () => {
    const validate = makeAjv().compile(
      loadJson('data/schemas/nugget-card.schema.json')
    );
    const bad = {
      id: 'x',
      character: 'grandpa-gus',
      category: 'test',
      title: 't',
      body: 'b',
      sources: [{ url: 'https://energy.gov', date: '2024-01-01' }],
      confidence: 'typical',
    };
    expect(validate(bad)).toBe(false);
  });

  it('validates iso spike fixture against house-view-model schema', () => {
    const validate = makeAjv().compile(
      loadJson('data/schemas/house-view-model.schema.json')
    );
    const fixture = loadJson('spikes/iso-canvas/fixture.json');
    expect(validate(fixture)).toBe(true);
    expect(fixture.houseName).toBe('The Serenity');
    expect(fixture.rooms).toHaveLength(2);
    expect(fixture.placements).toHaveLength(1);
  });
});

