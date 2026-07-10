import type { OpsEvent } from '../storage/types';
import { addDays, formatIsoDate, parseIsoDate, todayUtc } from './cadence';

export interface CalendarOccurrence {
  date: string;
  title: string;
  type: string;
  sourceId: string;
  kind: 'ops' | 'task';
  whenNotToDiy?: boolean;
  detail?: string | null;
}

/** Expand ops events into dated occurrences for the next `weeks` weeks. */
export function expandOpsOccurrences(
  events: OpsEvent[],
  weeks = 12,
  fromDate = todayUtc()
): CalendarOccurrence[] {
  const out: CalendarOccurrence[] = [];
  const start = parseIsoDate(fromDate);
  const end = parseIsoDate(addDays(fromDate, weeks * 7));

  for (const ev of events) {
    const parts = ev.schedule.split(':');
    const mode = parts[0];

    if (mode === 'once' && parts[1]) {
      const d = parts[1];
      if (d >= fromDate && d <= formatIsoDate(end)) {
        out.push({
          date: d,
          title: ev.title,
          type: ev.type,
          sourceId: ev.id,
          kind: 'ops',
        });
      }
      continue;
    }

    if (mode === 'weekly' && parts[1] === 'weekday') {
      const weekday = Number(parts[2]); // 0=Sun
      const cursor = new Date(start.getTime());
      // move to first matching weekday
      while (cursor.getUTCDay() !== weekday) {
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      while (cursor <= end) {
        out.push({
          date: formatIsoDate(cursor),
          title: ev.title,
          type: ev.type,
          sourceId: ev.id,
          kind: 'ops',
        });
        cursor.setUTCDate(cursor.getUTCDate() + 7);
      }
      continue;
    }

    if (mode === 'monthly' && parts[1] === 'day') {
      const day = Number(parts[2]);
      const cursor = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), day)
      );
      if (cursor < start) {
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
      while (cursor <= end) {
        out.push({
          date: formatIsoDate(cursor),
          title: ev.title,
          type: ev.type,
          sourceId: ev.id,
          kind: 'ops',
        });
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
      continue;
    }

    if (mode === 'yearly' && parts[1]) {
      const [mm, dd] = parts[1].split('-').map(Number);
      for (
        let y = start.getUTCFullYear();
        y <= end.getUTCFullYear() + 1;
        y++
      ) {
        const d = formatIsoDate(new Date(Date.UTC(y, mm - 1, dd)));
        if (d >= fromDate && d <= formatIsoDate(end)) {
          out.push({
            date: d,
            title: ev.title,
            type: ev.type,
            sourceId: ev.id,
            kind: 'ops',
          });
        }
      }
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function taskOccurrences(
  tasks: { id: string; title: string; nextDue: string | null; whenNotToDiy?: boolean; detail?: string | null; status?: string }[]
): CalendarOccurrence[] {
  return tasks
    .filter((t) => t.nextDue && t.status !== 'skipped')
    .map((t) => ({
      date: t.nextDue!,
      title: t.title,
      type: 'maintenance',
      sourceId: t.id,
      kind: 'task' as const,
      whenNotToDiy: t.whenNotToDiy,
      detail: t.detail,
    }));
}

export function mergeCalendar(
  ops: CalendarOccurrence[],
  tasks: CalendarOccurrence[]
): CalendarOccurrence[] {
  return [...ops, ...tasks].sort((a, b) => a.date.localeCompare(b.date));
}
