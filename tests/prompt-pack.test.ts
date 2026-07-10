import { describe, it, expect, beforeEach } from 'vitest';
import {
  dryRunPromptPackImport,
  commitPromptPackImport,
  stripMarkdownFences,
} from '../src/ai/promptPackImport';
import { CastleStorage } from '../src/storage/CastleStorage';
import { deleteDatabase } from '../src/storage/db';
import validFixture from './fixtures/prompt-pack-valid.json';
import missingBrand from './fixtures/prompt-pack-missing-brand.json';
import extraField from './fixtures/prompt-pack-extra-field.json';

const DB = 'castle-test-prompt';

describe('Prompt Pack import', () => {
  beforeEach(async () => {
    await deleteDatabase(DB);
  });

  it('strips markdown code fences', () => {
    const raw = '```json\n{"a":1}\n```';
    expect(stripMarkdownFences(raw)).toBe('{"a":1}');
  });

  it('dry-run accepts valid paste and previews counts', () => {
    const result = dryRunPromptPackImport(JSON.stringify(validFixture));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.itemCount).toBe(2);
    expect(result.preview.roomCount).toBe(1);
    expect(result.preview.paintCardCount).toBe(1);
    expect(result.preview.summary).toMatch(/2 items/);
    expect(result.preview.summary).toMatch(/1 room/);
    expect(result.preview.summary).toMatch(/1 paint card/);
  });

  it('accepts valid paste wrapped in markdown fences', () => {
    const fenced = '```json\n' + JSON.stringify(validFixture, null, 2) + '\n```';
    const result = dryRunPromptPackImport(fenced);
    expect(result.ok).toBe(true);
  });

  it('rejects missing required brand with human-readable error', () => {
    const result = dryRunPromptPackImport(JSON.stringify(missingBrand));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const joined = result.errors.join(' | ');
    expect(joined).toMatch(/brand/i);
    expect(joined).not.toMatch(/instancePath/);
    expect(joined).not.toMatch(/keyword/);
  });

  it('rejects unknown extra field', () => {
    const result = dryRunPromptPackImport(JSON.stringify(extraField));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(' ')).toMatch(/unknown field/i);
  });

  it('commit creates property only after validation (all-or-nothing path)', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const dry = dryRunPromptPackImport(JSON.stringify(validFixture));
    expect(dry.ok).toBe(true);
    if (!dry.ok) return;

    const committed = await commitPromptPackImport(storage, dry.payload);
    expect(committed.ok).toBe(true);
    if (!committed.ok) return;

    const property = await storage.getProperty(committed.propertyId);
    expect(property?.name).toBe('The Serenity');
    expect(property?.items.length).toBe(2);
    expect(property?.rooms.length).toBe(1);
    expect(property?.rooms[0].paintCards.length).toBe(1);
    expect(property?.items.some((i) => i.brand === 'Rheem')).toBe(true);
  });

  it('does not import on invalid dry-run', async () => {
    const storage = new CastleStorage({ dbName: DB, blobMode: 'idb' });
    await storage.init();
    const before = (await storage.listProperties()).length;
    const dry = dryRunPromptPackImport(JSON.stringify(missingBrand));
    expect(dry.ok).toBe(false);
    expect((await storage.listProperties()).length).toBe(before);
  });
});
