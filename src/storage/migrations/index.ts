/**
 * Export/import schema migrations.
 * Current schemaVersion is 1 — scaffold ready; no transforms yet.
 */
import { SCHEMA_VERSION } from '../types';

export interface Migration {
  from: number;
  to: number;
  description: string;
  /** Transform a parsed property.json payload from `from` toward `to`. */
  migrateProperty: (data: unknown) => unknown;
}

/** Ordered migrations. Empty for v1; add { from: 1, to: 2, ... } later. */
export const MIGRATIONS: Migration[] = [];

export function currentSchemaVersion(): number {
  return SCHEMA_VERSION;
}

/**
 * Returns true if we can import this version (equal or older with migrations).
 * Future versions are refused by the importer before this runs.
 */
export function canMigrateToCurrent(fromVersion: number): boolean {
  if (fromVersion === SCHEMA_VERSION) return true;
  if (fromVersion > SCHEMA_VERSION) return false;
  let v = fromVersion;
  while (v < SCHEMA_VERSION) {
    const step = MIGRATIONS.find((m) => m.from === v);
    if (!step) return false;
    v = step.to;
  }
  return true;
}

export function migratePropertyData(
  data: unknown,
  fromVersion: number
): unknown {
  let v = fromVersion;
  let current = data;
  while (v < SCHEMA_VERSION) {
    const step = MIGRATIONS.find((m) => m.from === v);
    if (!step) {
      throw new Error(`No migration path from schemaVersion ${fromVersion}`);
    }
    current = step.migrateProperty(current);
    v = step.to;
  }
  return current;
}
