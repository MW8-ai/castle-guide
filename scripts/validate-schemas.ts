/**
 * Validate shipped /data JSON against JSON Schemas.
 * Also validates the iso spike fixture against house-view-model schema.
 * Cross-platform (Node). Used by CI: npm run validate:schemas
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { ErrorObject, ValidateFunction } from 'ajv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataDir = join(root, 'data');
const schemaDir = join(dataDir, 'schemas');

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === 'schemas') continue;
      walk(p, acc);
    } else if (extname(p) === '.json') {
      acc.push(p);
    }
  }
  return acc;
}

function loadSchema(name: string) {
  const raw = readFileSync(join(schemaDir, name), 'utf8');
  return JSON.parse(raw) as object;
}

function loadJson(absPath: string) {
  return JSON.parse(readFileSync(absPath, 'utf8')) as Record<string, unknown>;
}

const nuggetValidate = ajv.compile(loadSchema('nugget-card.schema.json'));
const costValidate = ajv.compile(loadSchema('cost-entry.schema.json'));
const houseViewValidate = ajv.compile(loadSchema('house-view-model.schema.json'));

const PLACEHOLDER_HOSTS = ['example.com', 'localhost', '127.0.0.1'];

function assertNoFakeVerified(data: {
  confidence?: string;
  sources?: { url: string }[];
  sourceUrl?: string;
  id?: string;
}): string[] {
  const errors: string[] = [];
  if (data.confidence !== 'verified') return errors;

  const urls = [
    ...(data.sources?.map((s) => s.url) ?? []),
    ...(data.sourceUrl ? [data.sourceUrl] : []),
  ];
  if (urls.length === 0) {
    errors.push(`${data.id ?? '?'}: verified requires source URL(s)`);
    return errors;
  }
  for (const url of urls) {
    const lower = url.toLowerCase();
    if (
      PLACEHOLDER_HOSTS.some((h) => lower.includes(h)) ||
      lower.includes('tbd') ||
      lower.includes('todo')
    ) {
      errors.push(
        `${data.id ?? '?'}: verified source looks like a placeholder: ${url}`
      );
    }
  }
  return errors;
}

let failures = 0;

function runBatch(
  label: string,
  files: string[],
  validate: ValidateFunction,
  withVerifiedLint = false
) {
  for (const file of files) {
    const data = loadJson(file);
    const rel = relative(root, file);
    const ok = validate(data);
    if (!ok) {
      failures++;
      console.error(`FAIL ${rel}`, validate.errors as ErrorObject[] | null);
      continue;
    }
    if (withVerifiedLint) {
      for (const e of assertNoFakeVerified(
        data as {
          confidence?: string;
          sources?: { url: string }[];
          sourceUrl?: string;
          id?: string;
        }
      )) {
        failures++;
        console.error(`FAIL ${rel}: ${e}`);
      }
    }
    console.log(`OK   ${rel}`);
  }
  if (files.length === 0) {
    console.warn(`WARN no ${label} JSON files found`);
  }
}

runBatch('knowledge', walk(join(dataDir, 'knowledge')), nuggetValidate, true);
runBatch('cost', walk(join(dataDir, 'costs')), costValidate, true);

// Spike fixture must stay aligned with the production HouseViewModel schema
const spikeFixture = join(root, 'spikes', 'iso-canvas', 'fixture.json');
if (existsSync(spikeFixture)) {
  runBatch('house-view fixture', [spikeFixture], houseViewValidate, false);
} else {
  failures++;
  console.error('FAIL spikes/iso-canvas/fixture.json missing');
}

if (failures > 0) {
  console.error(`\n${failures} validation failure(s)`);
  process.exit(1);
}

console.log('\nAll schema validations passed.');
