import { describe, it, expect, beforeEach } from 'vitest';
import { CastleStorage } from '../src/storage/CastleStorage';
import { deleteDatabase } from '../src/storage/db';
import {
  getCostLibrary,
  getRebateByCode,
  reviewQuote,
  amortize,
  sumBasisEligible,
} from '../src/money';
import JSZip from 'jszip';

const DB = 'castle-test-money';

describe('Phase 3 money + protection', () => {
  beforeEach(async () => {
    await deleteDatabase(DB);
  });

  it('cost library entries all have asOfDate and confidence (no undated costs)', () => {
    const costs = getCostLibrary();
    expect(costs.length).toBeGreaterThanOrEqual(4);
    for (const c of costs) {
      expect(c.asOfDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(['verified', 'typical', 'regional']).toContain(c.confidence);
      expect(c.source.length).toBeGreaterThan(5);
    }
  });

  it('25C credit is explained with source URL and as-of date', () => {
    const c = getRebateByCode('25C');
    expect(c).toBeTruthy();
    expect(c!.title.toLowerCase()).toMatch(/25c|energy efficient/i);
    expect(c!.sourceUrl).toMatch(/^https:\/\/www\.irs\.gov\//);
    expect(c!.asOfDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(c!.confidence).toBe('verified');
    expect(c!.eligibilityPattern.length).toBeGreaterThan(40);
  });

  it("Dale calls a padded vague roofing quote dreamin' with catchphrase", () => {
    const result = reviewQuote({
      job: 'Asphalt shingle roof replacement',
      amount: 45000,
      scopeNotes: 'Misc repairs as needed, allowance for various items',
      lineItems: [
        {
          id: '1',
          description: 'Roof work as needed etc',
          amount: 45000,
        },
      ],
    });
    expect(result.verdict).toBe('dreamin');
    expect(result.catchphrase).toBe("Tell him he's dreamin'.");
    expect(result.reasons.some((r) => /above typical|vague/i.test(r))).toBe(
      true
    );
  });

  it('Dale is fair-dinkum for in-range clear scope', () => {
    const result = reviewQuote({
      job: 'Asphalt shingle roof replacement',
      amount: 12000,
      lineItems: [
        {
          id: '1',
          description: 'Tear-off and install 30-year architectural shingles, 22 squares',
          amount: 12000,
        },
      ],
    });
    expect(result.verdict).toBe('fair-dinkum');
  });

  it('persists quote with Dale verdict via storage', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('Quote House');
    const q = await storage.addQuote(property.id, {
      job: 'Asphalt shingle roof replacement',
      vendor: 'Mate',
      amount: 50000,
      date: '2026-07-01',
      scopeNotes: 'misc as needed',
      lineItems: [
        { id: 'a', description: 'misc as needed', amount: 50000 },
      ],
      costEntryId: 'cost-roof-asphalt-replace',
    });
    expect(q.daleVerdict).toBe('dreamin');
    const loaded = await storage.getProperty(property.id);
    expect(loaded!.quotes[0].daleVerdict).toBe('dreamin');
  });

  it('insurance packet ZIP includes inventory and media hashes path', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('Insure Me', '46240');
    const photo = new Blob([new Uint8Array([1, 2, 3, 4, 5])], {
      type: 'image/png',
    });
    const { blobId } = await storage.putBlob(photo, 'image/png');
    await storage.addItem(property.id, {
      category: 'appliance',
      brand: 'Samsung',
      model: 'RF28',
      serial: 'SN-99',
      price: 1800,
      photos: [
        {
          blobId,
          kind: 'photo',
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const zipBlob = await storage.exportInsurancePacket(property.id);
    const zip = await JSZip.loadAsync(zipBlob);
    expect(zip.file('inventory.json')).toBeTruthy();
    expect(zip.file('INVENTORY.txt')).toBeTruthy();
    const inv = JSON.parse(
      await zip.file('inventory.json')!.async('string')
    ) as { items: { serial: string }[] };
    expect(inv.items[0].serial).toBe('SN-99');
    expect(zip.file(`media/${blobId}`)).toBeTruthy();
  });

  it('warranty tracker flags items still under warranty', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('Warranty');
    const future = '2099-12-31';
    await storage.addItem(property.id, {
      category: 'refrigerator',
      brand: 'LG',
      warrantyEnd: future,
    });
    const p = await storage.getProperty(property.id);
    const { activeWarranties } = await import('../src/protect/warranty');
    const flags = activeWarranties(p!.items, '2026-07-01');
    expect(flags.length).toBe(1);
    expect(flags[0].message).toMatch(/do NOT pay/i);
  });

  it('payoff math reduces months with extra principal', () => {
    const base = amortize({
      principal: 300000,
      annualRatePercent: 6,
      termMonths: 360,
      extraMonthly: 0,
    });
    const extra = amortize({
      principal: 300000,
      annualRatePercent: 6,
      termMonths: 360,
      extraMonthly: 250,
    });
    expect(extra.payoffMonthsWithExtra).toBeLessThan(base.payoffMonthsWithExtra);
    expect(extra.monthsSaved).toBeGreaterThan(0);
  });

  it('ledger sums basis-eligible improvements', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const property = await storage.createProperty('Basis');
    await storage.addImprovement(property.id, {
      date: '2024-01-01',
      desc: 'Roof',
      cost: 10000,
      basisEligible: true,
    });
    await storage.addImprovement(property.id, {
      date: '2024-02-01',
      desc: 'Paint touch-up',
      cost: 200,
      basisEligible: false,
    });
    const p = await storage.getProperty(property.id);
    expect(sumBasisEligible(p!.improvements)).toBe(10000);
  });
});
