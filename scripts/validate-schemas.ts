/**
 * Validate shipped /data JSON against JSON Schemas.
 * Cross-platform (Node). Used by CI: npm run validate:schemas
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dataDir = join(root, 'data');
const schemaDir = join(dataDir, 'schemas');

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

function walk(dir: string, acc: string[] = []): string[] {
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

const nuggetValidate = ajv.compile(loadSchema('nugget-card.schema.json'));
const costValidate = ajv.compile(loadSchema('cost-entry.schema.json'));

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

const knowledgeFiles = walk(join(dataDir, 'knowledge'));
for (const file of knowledgeFiles) {
  const data = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  const ok = nuggetValidate(data);
  const rel = relative(root, file);
  if (!ok) {
    failures++;
    console.error(`FAIL ${rel}`, nuggetValidate.errors);
  } else {
    for (const e of assertNoFakeVerified(data as { confidence?: string; sources?: { url: string }[]; id?: string })) {
      failures++;
      console.error(`FAIL ${rel}: ${e}`);
    }
    if (failures === 0 || ok) {
      // keep going
    }
    console.log(`OK   ${rel}`);
  }
}

const costFiles = walk(join(dataDir, 'costs'));
for (const file of costFiles) {
  const data = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  const ok = costValidate(data);
  const rel = relative(root, file);
  if (!ok) {
    failures++;
    console.error(`FAIL ${rel}`, costValidate.errors);
  } else {
    for (const e of assertNoFakeVerified(
      data as { confidence?: string; sourceUrl?: string; id?: string }
    )) {
      failures++;
      console.error(`FAIL ${rel}: ${e}`);
    }
    console.log(`OK   ${rel}`);
  }
}

if (knowledgeFiles.length === 0) {
  console.warn('WARN no knowledge JSON files found');
}
if (costFiles.length === 0) {
  console.warn('WARN no cost JSON files found');
}

if (failures > 0) {
  console.error(`\n${failures} validation failure(s)`);
  process.exit(1);
}

console.log(`\nValidated ${knowledgeFiles.length} nuggets + ${costFiles.length} costs.`);
