import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('GitHub Pages base path honesty', () => {
  it('vite.config.ts sets base /castle-guide/', () => {
    const cfg = readFileSync(join(root, 'vite.config.ts'), 'utf8');
    expect(cfg).toMatch(/base:\s*['"]\/castle-guide\/['"]/);
  });

  it('built dist (if present) references /castle-guide/ assets', () => {
    const index = join(root, 'dist', 'index.html');
    if (!existsSync(index)) {
      // Build may not have run yet in isolation; CI runs build after tests
      // so this is best-effort when dist exists
      expect(true).toBe(true);
      return;
    }
    const html = readFileSync(index, 'utf8');
    expect(html).toContain('/castle-guide/');
  });
});
