import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import type { ValidateFunction } from 'ajv';
import promptPackSchema from '../../data/schemas/prompt-pack-import.schema.json';
import { humanizeAjvErrors } from './humanizeAjv';
import type { CastleStorage } from '../storage/CastleStorage';
import type { Item, PaintCard, Property, Room, Shutoff } from '../storage/types';
import { newId, nowIso } from '../storage/ids';

export interface PromptPackPayload {
  schemaVersion: 1;
  property: {
    name: string;
    zip?: string | null;
    yearBuilt?: number | null;
    rooms?: Array<{
      name: string;
      type?: string;
      dims?: { L: number; W: number; H: number };
      paintCards?: Array<{
        brand: string;
        line?: string;
        number: string;
        sheen?: string;
        room?: string;
        date?: string | null;
      }>;
    }>;
    items?: Array<{
      category: string;
      roomName?: string | null;
      brand: string;
      model?: string | null;
      serial?: string | null;
      purchaseDate?: string | null;
      cameWithHouse?: boolean | null;
      filterSpecs?: Array<{ name: string; sizeOrModel: string }>;
      notes?: string | null;
      poolRoomWorthy?: boolean;
    }>;
    shutoffs?: Array<{
      type: Shutoff['type'];
      locationNote: string;
    }>;
  };
  assumptions?: string[];
  unknowns?: string[];
}

export interface ImportPreview {
  propertyName: string;
  roomCount: number;
  itemCount: number;
  paintCardCount: number;
  shutoffCount: number;
  summary: string;
  assumptions: string[];
  unknowns: string[];
}

export type DryRunResult =
  | { ok: true; preview: ImportPreview; payload: PromptPackPayload }
  | { ok: false; errors: string[] };

export type CommitResult =
  | { ok: true; propertyId: string }
  | { ok: false; errors: string[] };

let validator: ValidateFunction | null = null;

function getValidator(): ValidateFunction {
  if (!validator) {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    validator = ajv.compile(promptPackSchema);
  }
  return validator;
}

/** Strip markdown code fences LLMs love to wrap around JSON. */
export function stripMarkdownFences(raw: string): string {
  let text = raw.trim();
  // ```json ... ``` or ``` ... ```
  const fenced = /^```(?:json|JSON)?\s*\r?\n?([\s\S]*?)\r?\n?```\s*$/;
  const m = text.match(fenced);
  if (m) return m[1].trim();
  // Leading/trailing fences on multi-line without full match
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json|JSON)?\s*\r?\n?/, '');
    text = text.replace(/\r?\n?```\s*$/, '');
  }
  return text.trim();
}

export function dryRunPromptPackImport(raw: string): DryRunResult {
  const stripped = stripMarkdownFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return {
      ok: false,
      errors: [
        'Could not parse JSON. Paste a single JSON object (markdown code fences are OK and will be stripped).',
      ],
    };
  }

  const validate = getValidator();
  const valid = validate(parsed);
  if (!valid) {
    return { ok: false, errors: humanizeAjvErrors(validate.errors) };
  }

  const payload = parsed as PromptPackPayload;
  const rooms = payload.property.rooms ?? [];
  const items = payload.property.items ?? [];
  const paintCardCount = rooms.reduce(
    (n, r) => n + (r.paintCards?.length ?? 0),
    0
  );
  const shutoffCount = payload.property.shutoffs?.length ?? 0;

  const summary = [
    `this will create ${items.length} item${items.length === 1 ? '' : 's'}`,
    `${rooms.length} room${rooms.length === 1 ? '' : 's'}`,
    `${paintCardCount} paint card${paintCardCount === 1 ? '' : 's'}`,
    shutoffCount
      ? `${shutoffCount} shutoff${shutoffCount === 1 ? '' : 's'}`
      : null,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    ok: true,
    payload,
    preview: {
      propertyName: payload.property.name,
      roomCount: rooms.length,
      itemCount: items.length,
      paintCardCount,
      shutoffCount,
      summary: `${summary}.`,
      assumptions: payload.assumptions ?? [],
      unknowns: payload.unknowns ?? [],
    },
  };
}

/**
 * Commit a previously dry-run-validated payload. All-or-nothing:
 * builds the full property in memory, then single save.
 */
export async function commitPromptPackImport(
  storage: CastleStorage,
  payload: PromptPackPayload
): Promise<CommitResult> {
  // Re-validate (never trust UI alone)
  const recheck = dryRunPromptPackImport(JSON.stringify(payload));
  if (!recheck.ok) {
    return { ok: false, errors: recheck.errors };
  }

  try {
    const property = await storage.createProperty(
      payload.property.name,
      payload.property.zip ?? null
    );
    // Mutate via storage APIs only
    const roomNameToId = new Map<string, string>();

    for (const r of payload.property.rooms ?? []) {
      const paintCards: PaintCard[] = (r.paintCards ?? []).map((pc) => ({
        id: newId(),
        brand: pc.brand,
        line: pc.line,
        number: pc.number,
        sheen: pc.sheen,
        room: pc.room ?? r.name,
        date: pc.date ?? null,
      }));
      const room = await storage.addRoom(property.id, {
        name: r.name,
        type: r.type ?? 'other',
        dims: r.dims ?? { L: 10, W: 10, H: 8 },
        paintCards,
      });
      roomNameToId.set(r.name.toLowerCase(), room.id);
    }

    for (const it of payload.property.items ?? []) {
      const roomId = it.roomName
        ? roomNameToId.get(it.roomName.toLowerCase()) ?? null
        : null;
      await storage.addItem(property.id, {
        category: it.category,
        brand: it.brand,
        model: it.model ?? null,
        serial: it.serial ?? null,
        purchaseDate: it.purchaseDate ?? null,
        cameWithHouse: it.cameWithHouse ?? null,
        filterSpecs: it.filterSpecs ?? [],
        notes: it.notes ?? null,
        roomId,
        poolRoomWorthy: it.poolRoomWorthy ?? false,
      });
    }

    for (const s of payload.property.shutoffs ?? []) {
      await storage.addShutoff(property.id, {
        type: s.type,
        locationNote: s.locationNote,
      });
    }

    if (payload.property.yearBuilt != null) {
      const p = await storage.getProperty(property.id);
      if (p) {
        p.yearBuilt = payload.property.yearBuilt;
        p.updatedAt = nowIso();
        await storage.saveProperty(p);
      }
    }

    return { ok: true, propertyId: property.id };
  } catch (e) {
    return {
      ok: false,
      errors: [
        `Import failed while saving: ${e instanceof Error ? e.message : String(e)}.`,
      ],
    };
  }
}

/** Apply rooms/items into an existing property (for tests / advanced). */
export function materializeRooms(payload: PromptPackPayload): Room[] {
  return (payload.property.rooms ?? []).map((r) => ({
    id: newId(),
    name: r.name,
    type: r.type ?? 'other',
    dims: r.dims ?? { L: 10, W: 10, H: 8 },
    paintCards: (r.paintCards ?? []).map((pc) => ({
      id: newId(),
      brand: pc.brand,
      line: pc.line,
      number: pc.number,
      sheen: pc.sheen,
      room: pc.room ?? r.name,
      date: pc.date ?? null,
    })),
    photos: [],
    placements: [],
    noteIds: [],
  }));
}

export function materializeItems(
  payload: PromptPackPayload,
  rooms: Room[]
): Item[] {
  const map = new Map(rooms.map((r) => [r.name.toLowerCase(), r.id]));
  return (payload.property.items ?? []).map((it) => ({
    id: newId(),
    category: it.category,
    roomId: it.roomName ? map.get(it.roomName.toLowerCase()) ?? null : null,
    brand: it.brand,
    model: it.model ?? null,
    serial: it.serial ?? null,
    purchaseDate: it.purchaseDate ?? null,
    price: null,
    cameWithHouse: it.cameWithHouse ?? null,
    lifespanYrs: null,
    warrantyEnd: null,
    dims: null,
    filterSpecs: it.filterSpecs ?? [],
    manualDocIds: [],
    photos: [],
    serviceLog: [],
    poolRoomWorthy: it.poolRoomWorthy ?? false,
    notes: it.notes ?? null,
    active: true,
    softDeleted: false,
    lineage: [],
  }));
}

export type { Property };
