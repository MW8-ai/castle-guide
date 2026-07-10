import type { CalendarOccurrence } from './opsSchedule';

/** Escape text for iCalendar. */
function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length) {
    parts.push(' ' + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  return parts.join('\r\n');
}

/**
 * Build a VCALENDAR string (ICS) from calendar occurrences.
 * DATE values (all-day) for portability with Google/Apple/Outlook.
 */
export function buildIcs(
  occurrences: CalendarOccurrence[],
  calendarName = 'Castle Guide'
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Castle Guide//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
  ];

  for (const occ of occurrences) {
    const uid = `${occ.kind}-${occ.sourceId}-${occ.date}@castle-guide.local`;
    const stamp = occ.date.replace(/-/g, '') + 'T120000Z';
    const day = occ.date.replace(/-/g, '');
    // DTEND exclusive next day for all-day events
    const endDate = nextDayCompact(day);
    const desc = [
      occ.type,
      occ.detail ? `Detail: ${occ.detail}` : null,
      occ.whenNotToDiy ? 'WARNING: when-NOT-to-DIY — hire a licensed pro.' : null,
    ]
      .filter(Boolean)
      .join('\\n');

    lines.push('BEGIN:VEVENT');
    lines.push(foldLine(`UID:${uid}`));
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;VALUE=DATE:${day}`);
    lines.push(`DTEND;VALUE=DATE:${endDate}`);
    lines.push(foldLine(`SUMMARY:${escapeIcs(occ.title)}`));
    if (desc) lines.push(foldLine(`DESCRIPTION:${escapeIcs(desc.replace(/\\n/g, '\n'))}`));
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

function nextDayCompact(yyyymmdd: string): string {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}
