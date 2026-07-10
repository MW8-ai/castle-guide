import type { Consumable, Item, Property, Task } from '../storage/types';
import { newId, nowIso } from '../storage/ids';
import { climateZoneFromZip, zoneMatches } from './climate';
import { computeNextDue } from './cadence';
import { getTaskTemplates, type TaskTemplate } from './templates';

function normalizeCategory(cat: string): string {
  return cat.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function itemMatchesTemplate(item: Item, tpl: TaskTemplate): boolean {
  const cat = normalizeCategory(item.category);
  return tpl.matchCategories.some((m) => {
    const nm = normalizeCategory(m);
    return cat === nm || cat.includes(nm) || nm.includes(cat);
  });
}

export function resolveFilterSize(
  item: Item,
  consumables: Consumable[]
): string | null {
  const fromItem = item.filterSpecs?.find(
    (f) =>
      /filter/i.test(f.name) ||
      /filter/i.test(f.sizeOrModel) ||
      f.name.toLowerCase().includes('furnace')
  );
  if (fromItem?.sizeOrModel) return fromItem.sizeOrModel;

  const linked = consumables.find(
    (c) =>
      c.itemId === item.id ||
      (/filter/i.test(c.kind) &&
        (c.itemId === item.id || !c.itemId))
  );
  if (linked?.sizeOrModel) return linked.sizeOrModel;

  // Any furnace filter on the property
  const any = consumables.find(
    (c) => /filter/i.test(c.kind) || /filter/i.test(c.label)
  );
  return any?.sizeOrModel ?? null;
}

export function buildTaskFromTemplate(
  tpl: TaskTemplate,
  item: Item,
  property: Property,
  fromDate?: string
): Task {
  const filterSize = tpl.useFilterSize
    ? resolveFilterSize(item, property.consumables)
    : null;
  const title =
    tpl.useFilterSize && filterSize
      ? `${tpl.title} (${filterSize})`
      : tpl.title;

  const nextDue = computeNextDue({
    anchorDate: item.purchaseDate,
    cadenceDays: tpl.cadenceDays,
    cadenceYears: tpl.cadenceYears,
    fromDate,
  });

  const ts = nowIso();
  return {
    id: newId(),
    templateId: tpl.id,
    itemId: item.id,
    title,
    cadence: tpl.cadenceLabel,
    nextDue,
    difficulty: tpl.difficulty,
    diyCost: tpl.diyCost ?? null,
    proCost: tpl.proCost ?? null,
    tools: [...tpl.tools],
    warnings: [...tpl.warnings],
    whenNotToDiy: tpl.whenNotToDiy,
    videoLinks: [...tpl.videoLinks],
    status: 'pending',
    history: [],
    detail: filterSize,
    createdAt: ts,
    updatedAt: ts,
  };
}

export interface ScheduleResult {
  created: Task[];
  skippedExisting: number;
  zone: string;
}

/**
 * Auto-schedule tasks from catalog + templates. Idempotent per (templateId, itemId).
 */
export function scheduleTasksFromCatalog(
  property: Property,
  templates: TaskTemplate[] = getTaskTemplates(),
  fromDate?: string
): ScheduleResult {
  const zone = climateZoneFromZip(property.zip);
  const existingKeys = new Set(
    property.tasks
      .filter((t) => t.templateId && t.itemId)
      .map((t) => `${t.templateId}::${t.itemId}`)
  );

  const created: Task[] = [];
  let skippedExisting = 0;

  for (const item of property.items) {
    if (!item.active || item.softDeleted) continue;
    for (const tpl of templates) {
      if (!zoneMatches(tpl.climateZones, zone)) continue;
      if (!itemMatchesTemplate(item, tpl)) continue;
      const key = `${tpl.id}::${item.id}`;
      if (existingKeys.has(key)) {
        skippedExisting++;
        continue;
      }
      const task = buildTaskFromTemplate(tpl, item, property, fromDate);
      created.push(task);
      existingKeys.add(key);
    }
  }

  return { created, skippedExisting, zone };
}

export function completeTask(task: Task, note?: string): Task {
  const ts = nowIso();
  const today = ts.slice(0, 10);
  // Roll next due if cadence days can be inferred from label — keep simple: leave nextDue, mark done
  return {
    ...task,
    status: 'done',
    updatedAt: ts,
    history: [
      ...task.history,
      { id: newId(), completedAt: today, note },
    ],
  };
}
