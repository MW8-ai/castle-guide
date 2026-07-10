import type { Property } from '../storage/types';
import { todayUtc } from '../maintain/cadence';
import { healthFromTasks } from './buildModel';

/**
 * Serenity score 0–100 from overdue tasks, warranties, shutoffs, catalog presence.
 */
export function computeSerenity(property: Property, asOf = todayUtc()): number {
  let score = 100;
  const pending = property.tasks.filter((t) => t.status === 'pending');
  const overdue = pending.filter((t) => t.nextDue && t.nextDue < asOf);
  const dueSoon = pending.filter(
    (t) => t.nextDue && t.nextDue >= asOf && t.nextDue <= addDays(asOf, 14)
  );

  score -= overdue.length * 12;
  score -= dueSoon.length * 4;

  if (property.shutoffs.length === 0) score -= 8;
  if (property.items.filter((i) => i.active).length === 0) score -= 15;

  const expiredWarranty = property.items.filter(
    (i) =>
      i.active &&
      i.warrantyEnd &&
      i.warrantyEnd < asOf &&
      // only nudge if recently expired-ish — mild
      i.warrantyEnd > addDays(asOf, -365)
  );
  score -= Math.min(10, expiredWarranty.length * 2);

  // Health overlay pressure
  for (const item of property.items.filter((i) => i.active)) {
    const h = healthFromTasks(item.id, property.tasks, asOf);
    if (h === 'overdue') score -= 3;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function serenityLabel(score: number): string {
  if (score >= 85) return 'Home looks solid';
  if (score >= 60) return 'A few things need attention';
  if (score >= 35) return 'Several to-dos are stacking up';
  return 'Home needs care soon';
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
