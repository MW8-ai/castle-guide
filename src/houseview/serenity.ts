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

/** Letter grade for the house — homeowner signal, not a game score. */
export function healthGrade(score: number): string {
  if (score >= 92) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 78) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Visual tone for health chip / glow.
 * 100 → glowing green · mid warm · <60 red · <40 toxic
 */
export function healthTone(
  score: number
): 'glow' | 'good' | 'warm' | 'alert' | 'toxic' {
  if (score >= 92) return 'glow';
  if (score >= 75) return 'good';
  if (score >= 60) return 'warm';
  if (score >= 40) return 'alert';
  return 'toxic';
}

/** Open maintenance $ (prefer pro when whenNotToDiy, else DIY). */
export function repairCostEstimate(property: Property): number {
  return property.tasks
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => {
      if (t.whenNotToDiy && t.proCost != null) return sum + t.proCost;
      if (t.diyCost != null) return sum + t.diyCost;
      if (t.proCost != null) return sum + t.proCost;
      return sum;
    }, 0);
}

/** Build list / add-ons: someday notes with budget + improvements planned. */
export function buildListCost(property: Property): number {
  const fromNotes = property.notes
    .filter((n) => n.someday && n.roughBudget != null)
    .reduce((s, n) => s + (n.roughBudget ?? 0), 0);
  // improvements already done aren't "build list" — only notes
  return fromNotes;
}

export function equityFromProperty(property: Property): {
  equity: number | null;
  homeValue: number | null;
} {
  const m = property.mortgage;
  if (m?.homeValue == null) return { equity: null, homeValue: null };
  const principal = m.principal ?? 0;
  return { equity: m.homeValue - principal, homeValue: m.homeValue };
}

export function daysUntil(iso: string | null | undefined, asOf = todayUtc()): number | null {
  if (!iso) return null;
  const a = new Date(asOf + 'T00:00:00Z').getTime();
  const b = new Date(iso + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86400000);
}

export function ageFromInstall(
  iso: string | null | undefined,
  asOf = todayUtc()
): string | null {
  if (!iso) return null;
  const a = new Date(iso + 'T00:00:00Z').getTime();
  const b = new Date(asOf + 'T00:00:00Z').getTime();
  const days = Math.max(0, Math.round((b - a) / 86400000));
  if (days < 60) return `${days} days`;
  const y = Math.floor(days / 365);
  const m = Math.floor((days % 365) / 30);
  if (y <= 0) return `${m || 1} mo`;
  if (m === 0) return `${y} yr`;
  return `${y} yr ${m} mo`;
}

export function upcomingTasks(property: Property, limit = 6, asOf = todayUtc()) {
  return property.tasks
    .filter((t) => t.status === 'pending' && t.nextDue)
    .sort((a, b) => (a.nextDue! < b.nextDue! ? -1 : 1))
    .slice(0, limit)
    .map((t) => ({
      ...t,
      dueInDays: daysUntil(t.nextDue, asOf),
    }));
}

export function catalogStats(property: Property) {
  const items = property.items.filter((i) => i.active && !i.softDeleted);
  const withSerial = items.filter((i) => i.serial).length;
  const withWarranty = items.filter((i) => i.warrantyEnd).length;
  const pending = property.tasks.filter((t) => t.status === 'pending');
  const overdue = pending.filter(
    (t) => t.nextDue && t.nextDue < todayUtc()
  ).length;
  return {
    rooms: property.rooms.length,
    items: items.length,
    withSerial,
    withWarranty,
    pending: pending.length,
    overdue,
    docs: property.docs.length,
    yearBuilt: property.yearBuilt ?? null,
  };
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
