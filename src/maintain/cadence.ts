/** Date math for maintenance cadences (UTC date parts, no time zones games). */

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatIsoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return formatIsoDate(d);
}

export function addYears(iso: string, years: number): string {
  const d = parseIsoDate(iso);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return formatIsoDate(d);
}

export function todayUtc(): string {
  return formatIsoDate(new Date());
}

/**
 * Compute next due date from anchor (purchase date or today) and cadence.
 * If anchor + cadence is still in the future, use it; else roll forward from today.
 */
export function computeNextDue(opts: {
  anchorDate?: string | null;
  cadenceDays?: number;
  cadenceYears?: number;
  fromDate?: string;
}): string {
  const from = opts.fromDate ?? todayUtc();
  if (opts.cadenceYears && opts.cadenceYears > 0) {
    const anchor = opts.anchorDate && opts.anchorDate.length >= 8 ? opts.anchorDate : from;
    let due = addYears(anchor, opts.cadenceYears);
    // Roll forward until due >= from
    let guard = 0;
    while (due < from && guard < 50) {
      due = addYears(due, opts.cadenceYears);
      guard++;
    }
    return due;
  }
  const days = opts.cadenceDays ?? 90;
  // First due: from + days (for recurring maintenance starting now)
  // If purchase known and old, still schedule from `from` + days for filter-like tasks
  // For filters: next due is today + cadence (or last service — we use today + days for new tasks)
  if (opts.anchorDate && opts.anchorDate.length >= 8 && opts.cadenceYears) {
    // handled above
  }
  // Prefer: if we have purchase and cadenceDays, first occurrence after purchase then roll
  if (opts.anchorDate && opts.anchorDate.length >= 8) {
    let due = addDays(opts.anchorDate, days);
    let guard = 0;
    while (due < from && guard < 500) {
      due = addDays(due, days);
      guard++;
    }
    return due;
  }
  return addDays(from, days);
}
