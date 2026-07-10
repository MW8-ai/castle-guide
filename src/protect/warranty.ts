import type { Item, Task } from '../storage/types';
import { todayUtc } from '../maintain/cadence';

export interface WarrantyFlag {
  itemId: string;
  label: string;
  warrantyEnd: string;
  daysRemaining: number;
  message: string;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z').getTime();
  const db = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((db - da) / (24 * 60 * 60 * 1000));
}

/** Items still under warranty (warrantyEnd >= today). */
export function activeWarranties(
  items: Item[],
  asOf = todayUtc()
): WarrantyFlag[] {
  const out: WarrantyFlag[] = [];
  for (const item of items) {
    if (!item.active || item.softDeleted || !item.warrantyEnd) continue;
    const days = daysBetween(asOf, item.warrantyEnd);
    if (days < 0) continue;
    out.push({
      itemId: item.id,
      label: `${item.brand ?? ''} ${item.model ?? item.category}`.trim(),
      warrantyEnd: item.warrantyEnd,
      daysRemaining: days,
      message: `Still under warranty until ${item.warrantyEnd} — do NOT pay out of pocket before checking coverage.`,
    });
  }
  return out;
}

/** Annotate tasks that touch warrantied items. */
export function warrantyWarningsForTasks(
  tasks: Task[],
  items: Item[],
  asOf = todayUtc()
): { taskId: string; message: string }[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const out: { taskId: string; message: string }[] = [];
  for (const t of tasks) {
    if (!t.itemId || t.status === 'done') continue;
    const item = byId.get(t.itemId);
    if (!item?.warrantyEnd) continue;
    if (daysBetween(asOf, item.warrantyEnd) < 0) continue;
    out.push({
      taskId: t.id,
      message: `Item may still be under warranty until ${item.warrantyEnd} — confirm before paying for this job.`,
    });
  }
  return out;
}
